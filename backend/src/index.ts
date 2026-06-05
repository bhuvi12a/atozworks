import dotenv from "dotenv";
// Load environment configurations before any package imports
dotenv.config();

import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import { connectDB } from "./config/db";
import { SocketService } from "./services/socketService";
import apiRouter from "./routes";
import { errorHandler } from "./middlewares/error";
import { logger } from "./utils/logger";

const app = express();
const server = createServer(app);

// 1. Initialise Socket.io
SocketService.init(server);

// 2. Security & Parsing Middlewares
app.use(helmet());
app.use(
  cors({
    origin: "*", // Adjust origins in production
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. API Gateway Routing
app.use("/api/v1", apiRouter);

// 4. Fallback for unhandled endpoints
app.all("*", (req, _res, next) => {
  const err = new Error(`Cannot find ${req.originalUrl} on this server.`) as any;
  err.statusCode = 404;
  next(err);
});

// 5. Centralised Exception Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// 6. Connect to PostgreSQL and bootstrap
const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    logger.info(`===================================================`);
    logger.info(` AtoZ Works Backend listening on port: ${PORT} `);
    logger.info(` Environment: ${process.env.NODE_ENV || "development"} `);
    logger.info(`===================================================`);
  });
};

startServer().catch((err) => {
  logger.error("Initialization failure on startup boot:", err);
  process.exit(1);
});

// Handle graceful system shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server...");
  server.close(() => {
    logger.info("HTTP server closed cleanly.");
    process.exit(0);
  });
});
