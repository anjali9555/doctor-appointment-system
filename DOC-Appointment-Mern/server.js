import express from "express";
import dotenv from "dotenv";
import colors from "colors";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import { setupSwagger } from "./config/swagger.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { correlationIdMiddleware } from "./middlewares/correlationId.js";
import { sanitizeMiddleware } from "./middlewares/sanitize.js";
import { getCacheStatus } from "./services/cacheService.js";

// Route imports
import testRoutes from "./routes/testRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import webMessageRoutes from "./routes/webMessageRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB with connection pooling
connectDB();

const app = express();

// Request Correlation ID tracking
app.use(correlationIdMiddleware);

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Permissive for inline images & Swagger UI
    crossOriginEmbedderPolicy: false,
  })
);

// High-performance Response Compression
app.use(compression());

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly fallback
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Request-Id"],
  })
);

// Request body size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// NoSQL Injection Sanitizer
app.use(sanitizeMiddleware);

// HTTP Request logging with Request ID
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(":date[iso] :req[x-request-id] :method :url :status :response-time ms"));
}

// Global API rate limiter
app.use("/api/", apiLimiter);

// Setup Swagger API Documentation
setupSwagger(app);

// Health check handler
const handleHealthCheck = (req, res) => {
  const mem = process.memoryUsage();
  res.status(200).json({
    status: "ok",
    service: "MediCare Healthcare Backend",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      readyState: mongoose.connection.readyState,
    },
    cache: getCacheStatus(),
    memory: {
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    },
    environment: process.env.NODE_ENV || "development",
  });
};

const handleReadinessCheck = (req, res) => {
  if (mongoose.connection.readyState === 1) {
    return res.status(200).json({ status: "ready", database: "connected" });
  }
  return res.status(503).json({ status: "unavailable", reason: "Database not connected" });
};

// Health and Readiness endpoints (Both root /api and /api/v1 mounts)
app.get("/api/health", handleHealthCheck);
app.get("/api/v1/health", handleHealthCheck);
app.get("/api/ready", handleReadinessCheck);
app.get("/api/v1/ready", handleReadinessCheck);

// Mount API Routes
app.use("/api/v1/test", testRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/webmessage", webMessageRoutes);
app.use("/api/v1/doctor", doctorRoutes);
app.use("/api/v1/appointment", appointmentRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/notification", notificationRoutes);

// Root informational endpoint
app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
      <h1 style="color: #0284c7;">🏥 MediCare Healthcare API is Running</h1>
      <p>Version 2.0.0 | Production-Grade Healthcare Backend Active</p>
      <p><a href="/api-docs" style="color: #0369a1; font-weight: bold;">Explore Swagger API Docs</a></p>
      <p><a href="/api/health" style="color: #16a34a;">Check System Health</a></p>
    </div>
  `);
});

// Centralized error handler
app.use(errorHandler);

// Port configuration
const PORT = process.env.PORT || 8080;

let server;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, () => {
    console.log(`🏥 MediCare Backend running on port ${PORT}`.cyan.bold);
    console.log(`📑 API Documentation: http://localhost:${PORT}/api-docs`.green);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`.blue);
  });
}

// Graceful Shutdown Handler
const gracefulShutdown = () => {
  console.log("\nReceived termination signal. Closing server and database...".yellow);
  if (server) {
    server.close(() => {
      console.log("HTTP server closed.".green);
      mongoose.connection.close(false, () => {
        console.log("MongoDB connection closed.".green);
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

export default app;
