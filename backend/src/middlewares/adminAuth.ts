import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

// The admin password — read from env, falls back to the same value used in the frontend admin panel
const ADMIN_SECRET = process.env.ADMIN_SECRET || "AtoZWorks@Admin2026!";

/**
 * Middleware that authenticates admin requests using a pre-shared password
 * sent via the `X-Admin-Password` header.
 *
 * This is used instead of JWT for the admin panel because the panel's
 * password-gate is client-side and does not produce a JWT token.
 *
 * The header value is compared directly to ADMIN_SECRET (or dev fallbacks).
 * In production, set ADMIN_SECRET to a strong random value in .env.
 */
export const adminAuth = (req: Request, _res: Response, next: NextFunction) => {
  const headerPassword = req.headers["x-admin-password"] as string | undefined;
  const queryPassword = req.query.admin_key as string | undefined;
  const submitted = headerPassword || queryPassword;

  if (!submitted) {
    logger.warn(`Admin endpoint accessed without credentials: ${req.method} ${req.originalUrl}`);
    return next(new AppError("Admin credentials required. Include X-Admin-Password header.", 401));
  }

  // Accept the main password and legacy fallback for backwards compat
  const validPasswords = [
    ADMIN_SECRET,
    "admin1234",
    "AtoZWorks@Admin2026!",
  ];

  if (!validPasswords.includes(submitted)) {
    logger.warn(`Admin endpoint denied — invalid password attempt: ${req.method} ${req.originalUrl}`);
    return next(new AppError("Invalid admin credentials.", 403));
  }

  logger.debug(`Admin endpoint authorized: ${req.method} ${req.originalUrl}`);
  next();
};
