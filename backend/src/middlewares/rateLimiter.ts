import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger";

// A robust rate limiter for auth / payment APIs (e.g. max 100 requests per 15 minutes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
  handler: (req, res, _next, options) => {
    logger.warn(`Rate limit exceeded by IP: ${req.ip} on route ${req.originalUrl}`);
    res.status(options.statusCode).send(options.message);
  },
});
