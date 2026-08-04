"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const logger_1 = require("../utils/logger");
const errorHandler = (err, _req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    // Development VS Production output formatting
    if (process.env.NODE_ENV === "development") {
        logger_1.logger.error(`Error ${err.statusCode}: ${err.message}`, err);
        return res.status(err.statusCode).json({
            success: false,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }
    // Handle MongoDB / Mongoose errors
    if (err.code === 11000) {
        logger_1.logger.error("MongoDB Duplicate Key Error:", err);
        return res.status(400).json({
            success: false,
            message: "Duplicate field value entered. Please use another value.",
        });
    }
    if (err.name === "ValidationError") {
        logger_1.logger.error("Mongoose Validation Error:", err);
        return res.status(400).json({
            success: false,
            message: Object.values(err.errors).map((el) => el.message).join(". "),
        });
    }
    if (err.name === "CastError") {
        logger_1.logger.error("Mongoose Cast Error:", err);
        return res.status(400).json({
            success: false,
            message: `Invalid ID format for path: ${err.path}`,
        });
    }
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }
    // Unhandled operational / programming errors: don't leak details in production
    logger_1.logger.error("CRITICAL UNHANDLED ERROR:", err);
    return res.status(500).json({
        success: false,
        message: "Something went wrong internally on our servers. Please try again later.",
    });
};
exports.errorHandler = errorHandler;
