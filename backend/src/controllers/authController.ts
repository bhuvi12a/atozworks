import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import https from "https";
import { UserModel } from "../models/User";
import { ProviderModel } from "../models/Provider";
import { CategoryModel } from "../models/Category";
import { safeRedisSet, safeRedisGet, safeRedisDel } from "../config/redis";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

// ─── APITxT Helpers ────────────────────────────────────────────────────────────

const APITXT_AUTH_KEY = process.env.APITXT_AUTH_KEY || "";

// Dev bypass: if APITxT key is missing/placeholder, use mock OTP mode
const isApitxtConfigured =
  APITXT_AUTH_KEY.length > 0 &&
  APITXT_AUTH_KEY !== "your_apitxt_auth_key_here";

const DEV_OTP = "123456";

/** Call the APITxT REST API for OTP. */
function apitxtRequest(mobile: string, otp: string): Promise<{ status: string; message: string }> {
  return new Promise((resolve, reject) => {
    const postData = `mobile=${mobile}&otp=${otp}&authkey=${APITXT_AUTH_KEY}`;
    const options = {
      hostname: "apitxt.com",
      path: "/api/sendOTP",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData)
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ status: "error", message: data });
        }
      });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

type Role = "CUSTOMER" | "PROVIDER" | "ADMIN";

// Token Helpers
const generateTokenPair = (userId: string, email: string, role: Role) => {
  const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "jwt_access_secret_token";
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "jwt_refresh_secret_token";

  const accessToken = jwt.sign({ id: userId, email, role }, JWT_ACCESS_SECRET);

  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET);

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

      // Save refresh token (Redis with in-memory fallback)
      await safeRedisSet(
        `refresh_token:${userIdStr}`,
        tokens.refreshToken,
        7 * 24 * 60 * 60
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

      // Check if refresh token is valid (rotation logic — best-effort when Redis is down)
      const storedToken = await safeRedisGet(`refresh_token:${userIdStr}`);
      if (storedToken && storedToken !== refreshToken) {
        // Token might have been reused/stolen. Force logout for security.
        await safeRedisDel(`refresh_token:${userIdStr}`);
        return next(new AppError("Compromised session. Please re-authenticate.", 401));
      }

      // Generate new token pair
      const tokens = generateTokenPair(userIdStr, user.email, user.role);

      // Save new refresh token
      await safeRedisSet(
        `refresh_token:${userIdStr}`,
        tokens.refreshToken,
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
   * Logs out user by deleting refresh token.
   */
  public static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.body;

      if (userId) {
        await safeRedisDel(`refresh_token:${userId}`);
      }

      res.status(200).json({
        success: true,
        message: "Logged out successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── MSG91 Phone OTP Auth ──────────────────────────────────────────────────

  /**
   * Sends an OTP SMS to the given phone number via MSG91.
   * POST /auth/send-otp  { phone: "9876543210" }
   *
   * DEV BYPASS: If APITxT credentials are not configured, stores OTP "123456"
   * in memory (or Redis) so local development works without SMS integration.
   */
  public static async sendOtp(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { phone } = req.body;
      const clean = (phone || "").replace(/[^0-9]/g, "");

      if (clean.length !== 10) {
        return next(new AppError("Please provide a valid 10-digit phone number.", 400));
      }

      // ── Generate Random OTP (or use DEV_OTP if not configured) ─────────────
      const generatedOtp = isApitxtConfigured 
        ? Math.floor(100000 + Math.random() * 900000).toString() 
        : DEV_OTP;

      // Store in Redis (valid for 10 mins)
      await safeRedisSet(`otp:${clean}`, generatedOtp, 10 * 60);

      // ── DEV BYPASS: No APITxT credentials configured ────────────────────────
      if (!isApitxtConfigured) {
        logger.warn(
          `[DEV MODE] APITxT not configured. OTP for ${clean} is "${DEV_OTP}" (stored in memory).`
        );

        res.status(200).json({
          success: true,
          message: "OTP sent successfully. Please check your SMS.",
          _devNote:
            process.env.NODE_ENV !== "production"
              ? `APITxT not configured. Use OTP: ${DEV_OTP} for testing.`
              : undefined,
        });
        return;
      }

      // ── Production APITxT Flow ───────────────────────────────────────────────
      const mobile = `91${clean}`; // E.164 without +
      
      const result = await apitxtRequest(mobile, generatedOtp);
      logger.info(`APITxT send-otp for ${mobile}: ${JSON.stringify(result)}`);

      if (result.status === "error") {
        // Fallback to dev mode if API fails (e.g., insufficient funds)
        logger.warn(`APITxT failed: ${result.message}. Falling back to DEV_OTP.`);
        await safeRedisSet(`otp:${clean}`, DEV_OTP, 10 * 60);
        return next(new AppError(`OTP send failed: ${result.message} (Use OTP 123456 instead)`, 502));
      }

      res.status(200).json({
        success: true,
        message: "OTP sent successfully. Please check your SMS.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verifies the OTP stored in Redis. If valid, auto-creates or
   * looks up the user and returns a JWT pair.
   * POST /auth/verify-otp  { phone: "9876543210", otp: "123456" }
   */
  public static async verifyOtp(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { phone, otp } = req.body;
      const clean = (phone || "").replace(/[^0-9]/g, "");

      if (clean.length !== 10) {
        return next(new AppError("Invalid phone number.", 400));
      }
      if (!otp || String(otp).length !== 6) {
        return next(new AppError("Please provide a 6-digit OTP.", 400));
      }

      // ── Verification: Check stored OTP ────────────────────────────────────
      const storedOtp = await safeRedisGet(`otp:${clean}`);
      // Accept DEV_OTP if explicitly allowed (no APITxT key) or if fallback triggered
      const expectedOtp = storedOtp || (!isApitxtConfigured ? DEV_OTP : null);

      if (!expectedOtp || String(otp) !== expectedOtp) {
        return next(new AppError("Incorrect OTP. Please check and try again.", 401));
      }

      // Clear used OTP
      await safeRedisDel(`otp:${clean}`);
      logger.info(`OTP verified successfully for ${clean}.`);

      // ── Find or create user ─────────────────────────────────────────────────
      let user = await UserModel.findOne({ phone: clean });

      if (!user) {
        // New user: create a minimal record (no password needed for phone auth)
        user = await UserModel.create({
          name: `User_${clean.slice(-4)}`,
          email: `${clean}@phone.atozworks.in`, // placeholder, can be updated later
          phone: clean,
          passwordHash: "NO_PASSWORD_PHONE_AUTH", // Mongoose rejects empty strings for required fields
          role: "CUSTOMER" as const,
        });
        logger.info(`New phone-auth user created: ${clean}`);
      }

      if (user.status !== "ACTIVE") {
        return next(new AppError("Your account has been deactivated.", 403));
      }

      const userIdStr = user._id.toString();
      const tokens = generateTokenPair(userIdStr, user.email, user.role);

      // Persist refresh token (Redis with in-memory fallback)
      await safeRedisSet(
        `refresh_token:${userIdStr}`,
        tokens.refreshToken,
        7 * 24 * 60 * 60
      );

      res.status(200).json({
        success: true,
        message: "OTP verified. Logged in successfully.",
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
}
