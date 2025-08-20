import { Router, Request, Response, NextFunction } from "express";
import { authenticateToken, optionalAuth } from "../middleware/auth";
import { validateLogin, sanitizeInput } from "../middleware/validation";
import { AuthenticatedRequest } from "../types";

const router = Router();

// POST /api/v1/auth/login - User login (handled by Supabase Auth)
router.post("/login", sanitizeInput, validateLogin, async (req, res, next) => {
  // TODO: Implement in Task 11
  res.json({
    success: true,
    data: {
      message: "Authentication is handled by Supabase Auth on the frontend",
      note: "This endpoint is for future server-side auth if needed",
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/v1/auth/logout - User logout
router.post("/logout", optionalAuth, async (req, res, next) => {
  // TODO: Implement in Task 11
  res.json({
    success: true,
    data: {
      message: "Logout successful",
      note: "Token invalidation is handled by Supabase Auth",
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/v1/auth/me - Get current user info
router.get(
  "/me",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // TODO: Implement in Task 11
    res.json({
      success: true,
      data: {
        user: req.user,
        message: "User info retrieved successfully",
      },
      timestamp: new Date().toISOString(),
    });
  }
);

// POST /api/v1/auth/refresh - Refresh token
router.post("/refresh", async (req, res, next) => {
  // TODO: Implement in Task 11
  res.json({
    success: true,
    data: {
      message: "Token refresh is handled by Supabase Auth on the frontend",
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
