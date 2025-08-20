// Load environment variables FIRST
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { requestLogger } from "./middleware/requestLogger";

// Import routes
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import posTerminalRoutes from "./routes/posTerminals";
import authRoutes from "./routes/auth";
import healthRoutes from "./routes/health";

const app = express();
const PORT = process.env["PORT"] || 5000;
const NODE_ENV = process.env["NODE_ENV"] || "development";

// =============================================
// SECURITY MIDDLEWARE
// =============================================

// Helmet for security headers
if (process.env["HELMET_ENABLED"] !== "false") {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );
}

// CORS configuration
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    const allowedOrigins = process.env["ALLOWED_ORIGINS"]?.split(",") || [
      "http://localhost:3000",
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

if (process.env["CORS_ENABLED"] !== "false") {
  app.use(cors(corsOptions));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env["RATE_LIMIT_WINDOW_MS"] || "900000"), // 15 minutes
  max: parseInt(process.env["RATE_LIMIT_MAX_REQUESTS"] || "100"), // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// =============================================
// GENERAL MIDDLEWARE
// =============================================

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Custom request logger
app.use(requestLogger);

// =============================================
// HEALTH CHECK ROUTES
// =============================================

app.use("/health", healthRoutes);

// =============================================
// API ROUTES
// =============================================

const API_PREFIX = process.env["API_PREFIX"] || "/api";
const API_VERSION = process.env["API_VERSION"] || "v1";
const BASE_PATH = `${API_PREFIX}/${API_VERSION}`;

// Authentication routes
app.use(`${BASE_PATH}/auth`, authRoutes);

// Main API routes
app.use(`${BASE_PATH}/products`, productRoutes);
app.use(`${BASE_PATH}/orders`, orderRoutes);
app.use(`${BASE_PATH}/pos-terminals`, posTerminalRoutes);

// Root API endpoint
app.get(`${API_PREFIX}`, (_req, res) => {
  res.json({
    success: true,
    message: "POS API Server",
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      products: `${BASE_PATH}/products`,
      orders: `${BASE_PATH}/orders`,
      posTerminals: `${BASE_PATH}/pos-terminals`,
      auth: `${BASE_PATH}/auth`,
    },
  });
});

// =============================================
// ERROR HANDLING MIDDLEWARE
// =============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// =============================================
// SERVER STARTUP
// =============================================

const server = app.listen(PORT, () => {
  console.log(`🚀 POS API Server running on port ${PORT}`);
  console.log(`📝 Environment: ${NODE_ENV}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}${BASE_PATH}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);

  if (NODE_ENV === "development") {
    console.log(`📚 API Documentation: http://localhost:${PORT}${API_PREFIX}`);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

export default app;
