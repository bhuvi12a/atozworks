import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User";
import { ProviderModel } from "../models/Provider";
import { CategoryModel } from "../models/Category";
import { redis } from "../config/redis";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

type Role = "CUSTOMER" | "PROVIDER" | "ADMIN";

// Token Helpers
const generateTokenPair = (userId: string, email: string, role: Role) => {
  const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "jwt_access_secret_token";
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "jwt_refresh_secret_token";

  const accessToken = jwt.sign({ id: userId, email, role }, JWT_ACCESS_SECRET, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

export class AuthController {
  /**
   * Registers a customer or provider user.
   */
  public static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, email, phone, password, role } = req.body;

      if (!name || !email || !phone || !password) {
        return next(new AppError("Please fill out all fields.", 400));
      }

      // Check user existence
      const existingUser = await UserModel.findOne({
        $or: [{ email: email.toLowerCase() }, { phone }],
      });

      if (existingUser) {
        return next(new AppError("User with this email or phone number already exists.", 400));
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const userRole: Role = role === "PROVIDER" ? "PROVIDER" : "CUSTOMER";

      const newUser = await UserModel.create({
        name,
        email: email.toLowerCase(),
        phone,
        passwordHash,
        role: userRole,
      });

      // Initialize provider profile entry if provider role
      if (userRole === "PROVIDER") {
        try {
          let categoryIds = [];
          if (req.body.category) {
            const cat = await CategoryModel.findOne({ slug: req.body.category });
            if (cat) {
              categoryIds.push(cat._id);
            }
          }

          await ProviderModel.create({
            userId: newUser._id,
            experience: parseInt(req.body.experience || "0"),
            selfie: req.body.selfie || "",
            idCard: req.body.idCard || "",
            categories: categoryIds,
          });
        } catch (err) {
          // Rollback user creation
          await UserModel.findByIdAndDelete(newUser._id);
          throw err;
        }
      }

      logger.info(`User registered successfully: ${newUser.email} (Role: ${newUser.role})`);

      res.status(201).json({
        success: true,
        message: "User registered successfully.",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logs in customer, provider, or admin. Returns JWT pair.
   */
  public static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new AppError("Please provide email and password.", 400));
      }

      const user = await UserModel.findOne({ email: email.toLowerCase() });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return next(new AppError("Invalid email or password.", 401));
      }

      if (user.status !== "ACTIVE") {
        return next(new AppError("Your account has been deactivated.", 403));
      }

      const userIdStr = user._id.toString();
      const tokens = generateTokenPair(userIdStr, user.email, user.role);

      // Save refresh token to Redis (for revocation and rotation check)
      await redis.set(
        `refresh_token:${userIdStr}`,
        tokens.refreshToken,
        "EX",
        7 * 24 * 60 * 60 // 7 days in seconds
      );

      res.status(200).json({
        success: true,
        message: "Logged in successfully.",
        tokens,
        user: {
          id: userIdStr,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refreshes JWT tokens. Handles rotation checks.
   */
  public static async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return next(new AppError("Refresh token is required.", 400));
      }

      const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "jwt_refresh_secret_token";
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };

      const user = await UserModel.findById(decoded.id);

      if (!user) {
        return next(new AppError("User not found.", 401));
      }

      const userIdStr = user._id.toString();

      // Check if refresh token is valid in Redis (rotation logic)
      const storedToken = await redis.get(`refresh_token:${userIdStr}`);
      if (storedToken !== refreshToken) {
        // Token might have been reused/stolen. Force logout for security.
        await redis.del(`refresh_token:${userIdStr}`);
        return next(new AppError("Compromised session. Please re-authenticate.", 401));
      }

      // Generate new token pair
      const tokens = generateTokenPair(userIdStr, user.email, user.role);

      // Save new refresh token in Redis
      await redis.set(
        `refresh_token:${userIdStr}`,
        tokens.refreshToken,
        "EX",
        7 * 24 * 60 * 60
      );

      res.status(200).json({
        success: true,
        tokens,
      });
    } catch (error) {
      next(new AppError("Invalid or expired refresh token.", 401));
    }
  }

  /**
   * Logs out user by deleting refresh token from Redis.
   */
  public static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.body;

      if (userId) {
        await redis.del(`refresh_token:${userId}`);
      }

      res.status(200).json({
        success: true,
        message: "Logged out successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
}
