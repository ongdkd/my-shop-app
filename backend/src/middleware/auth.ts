import { Request, Response, NextFunction } from "express";
import { getUserFromToken } from "../services/supabaseClient";
import { UnauthorizedError, ForbiddenError } from "./errorHandler";
import { AuthenticatedRequest } from "../types";

/**
 * Extract token from Authorization header
 */
const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
};

/**
 * Get user role from user metadata
 */
const getUserRole = (user: any): string => {
  return user?.user_metadata?.role || user?.app_metadata?.role || "user";
};

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedError(
        "Access token is required. Please provide a valid Bearer token."
      );
    }

    // Verify token with Supabase
    const user = await getUserFromToken(token);

    if (!user) {
      throw new UnauthorizedError(
        "Invalid or expired token. Please login again."
      );
    }

    // Check if user is active (if you have user status in metadata)
    if (user.user_metadata?.["status"] === "inactive") {
      throw new UnauthorizedError(
        "User account is inactive. Please contact administrator."
      );
    }

    // Attach user and token to request
    req.user = user;
    req.token = token;

    // Add user role for easy access
    req.userRole = getUserRole(user);

    next();
  } catch (error) {
    // Handle specific Supabase auth errors
    if (error instanceof Error) {
      if (error.message.includes("JWT expired")) {
        next(new UnauthorizedError("Token has expired. Please login again."));
      } else if (error.message.includes("Invalid JWT")) {
        next(
          new UnauthorizedError("Invalid token format. Please login again.")
        );
      } else if (error.message.includes("Supabase client not configured")) {
        next(
          new UnauthorizedError(
            "Authentication service unavailable. Please try again later."
          )
        );
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      try {
        const user = await getUserFromToken(token);
        req.user = user;
        req.token = token;
      } catch (error) {
        // Ignore authentication errors for optional auth
        console.warn("Optional auth failed:", error);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has required permissions
 */
const hasPermission = (userRole: string, requiredRoles: string[]): boolean => {
  if (requiredRoles.includes("*")) return true;
  if (requiredRoles.includes(userRole)) return true;

  // Admin has access to everything
  if (userRole === "admin") return true;

  return false;
};

/**
 * Role-based authorization middleware factory
 */
export const requireRole = (roles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(
        new UnauthorizedError(
          "Authentication required to access this resource."
        )
      );
    }

    const userRole = req.userRole || getUserRole(req.user);

    if (!hasPermission(userRole, roles)) {
      return next(
        new ForbiddenError(
          `Access denied. Required roles: ${roles.join(
            ", "
          )}. Your role: ${userRole}`
        )
      );
    }

    next();
  };
};

// Admin role check
export const requireAdmin = requireRole(["admin"]);

// POS operator or admin role check
export const requirePOSAccess = requireRole(["pos_operator", "admin"]);

/**
 * Require manager or admin role
 */
export const requireManager = requireRole(["manager", "admin"]);

/**
 * Allow any authenticated user
 */
export const requireAuth = requireRole(["*"]);

/**
 * Rate limiting per user
 */
export const userRateLimit = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000
) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();

    const userLimit = userRequests.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize user limit
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return next(
        new UnauthorizedError("Rate limit exceeded. Please try again later.")
      );
    }

    userLimit.count++;
    next();
  };
};
