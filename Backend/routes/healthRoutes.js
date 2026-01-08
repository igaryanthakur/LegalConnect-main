import express from "express";
import { logger } from "../utils/logger.js";

const router = express.Router();

// Health check endpoint
router.get("/", (req, res) => {
  try {
    logger.info("Health check requested");

    // Test MongoDB connection
    const dbStatus = req.dbConnected ? "connected" : "not connected";

    res.json({
      status: "ok",
      message: "LawSphere API is running",
      database: dbStatus,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Health check error", error);
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

// Detailed diagnostic endpoint
router.get("/diagnostic", (req, res) => {
  try {
    // Get memory usage
    const memoryUsage = process.memoryUsage();

    res.json({
      status: "ok",
      env: process.env.NODE_ENV,
      memory: {
        rss: `${Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100} MB`,
        heapTotal: `${
          Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100
        } MB`,
        heapUsed: `${
          Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100
        } MB`,
        external: `${
          Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100
        } MB`,
      },
      uptime: `${Math.round(process.uptime() * 100) / 100} seconds`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Diagnostic check error", error);
    res.status(500).json({
      status: "error",
      message: "Diagnostic check failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
