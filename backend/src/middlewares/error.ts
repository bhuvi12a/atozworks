import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;

  // Development VS Production output formatting
  if (process.env.NODE_ENV === "development") {
    logger.error(`Error ${err.statusCode}: ${err.message}`, err);
    return res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // Handle MongoDB / Mongoose errors
  if (err.code === 11000) {
    logger.error("MongoDB Duplicate Key Error:", err);
    return res.status(400).json({
      success: false,
      message: "Duplicate field value entered. Please use another value.",
    });
  }

  if (err.name === "ValidationError") {
    logger.error("Mongoose Validation Error:", err);
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors).map((el: any) => el.message).join(". "),
    });
  }

  if (err.name === "CastError") {
    logger.error("Mongoose Cast Error:", err);
    return res.status(400).json({
      success: false,
      message: `Invalid ID format for path: ${err.path}`,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Unhandled operational / programming errors: don't leak details in production
  logger.error("CRITICAL UNHANDLED ERROR:", err);
  return res.status(500).json({
    success: false,
    message: "Something went wrong internally on our servers. Please try again later.",
  });
};
