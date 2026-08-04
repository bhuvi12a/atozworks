"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const https_1 = __importDefault(require("https"));
const User_1 = require("../models/User");
const Provider_1 = require("../models/Provider");
const Category_1 = require("../models/Category");
const redis_1 = require("../config/redis");
const AppError_1 = require("../utils/AppError");
const logger_1 = require("../utils/logger");
// ─── APITxT Helpers ────────────────────────────────────────────────────────────
const APITXT_AUTH_KEY = process.env.APITXT_AUTH_KEY || "";
// Dev bypass: if APITxT key is missing/placeholder, use mock OTP mode
const isApitxtConfigured = APITXT_AUTH_KEY.length > 0 &&
    APITXT_AUTH_KEY !== "your_apitxt_auth_key_here";
const DEV_OTP = "123456";
/** Call the APITxT REST API for OTP. */
function apitxtRequest(mobile, otp) {
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
        const req = https_1.default.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch {
                    resolve({ status: "error", message: data });
                }
            });
        });
        req.on("error", reject);
        req.write(postData);
        req.end();
    });
}
// Token Helpers
const generateTokenPair = (userId, email, role) => {
    const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "jwt_access_secret_token";
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "jwt_refresh_secret_token";
    const accessToken = jsonwebtoken_1.default.sign({ id: userId, email, role }, JWT_ACCESS_SECRET, {
        expiresIn: "1h",
    });
    const refreshToken = jsonwebtoken_1.default.sign({ id: userId }, JWT_REFRESH_SECRET, {
        expiresIn: "7d",
    });
    return { accessToken, refreshToken };
};
class AuthController {
    /**
     * Registers a customer or provider user.
     */
    static async register(req, res, next) {
        try {
            const { name, email, phone, password, role } = req.body;
            if (!name || !email || !phone || !password) {
                return next(new AppError_1.AppError("Please fill out all fields.", 400));
            }
            // Check user existence
            const existingUser = await User_1.UserModel.findOne({
                $or: [{ email: email.toLowerCase() }, { phone }],
            });
            if (existingUser) {
                return next(new AppError_1.AppError("User with this email or phone number already exists.", 400));
            }
            const passwordHash = await bcrypt_1.default.hash(password, 12);
            const userRole = role === "PROVIDER" ? "PROVIDER" : "CUSTOMER";
            const newUser = await User_1.UserModel.create({
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
                        const cat = await Category_1.CategoryModel.findOne({ slug: req.body.category });
                        if (cat) {
                            categoryIds.push(cat._id);
                        }
                    }
                    await Provider_1.ProviderModel.create({
                        userId: newUser._id,
                        experience: parseInt(req.body.experience || "0"),
                        selfie: req.body.selfie || "",
                        idCard: req.body.idCard || "",
                        categories: categoryIds,
                    });
                }
                catch (err) {
                    // Rollback user creation
                    await User_1.UserModel.findByIdAndDelete(newUser._id);
                    throw err;
                }
            }
            logger_1.logger.info(`User registered successfully: ${newUser.email} (Role: ${newUser.role})`);
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Logs in customer, provider, or admin. Returns JWT pair.
     */
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return next(new AppError_1.AppError("Please provide email and password.", 400));
            }
            const user = await User_1.UserModel.findOne({ email: email.toLowerCase() });
            if (!user || !(await bcrypt_1.default.compare(password, user.passwordHash))) {
                return next(new AppError_1.AppError("Invalid email or password.", 401));
            }
            if (user.status !== "ACTIVE") {
                return next(new AppError_1.AppError("Your account has been deactivated.", 403));
            }
            const userIdStr = user._id.toString();
            const tokens = generateTokenPair(userIdStr, user.email, user.role);
            // Save refresh token (Redis with in-memory fallback)
            await (0, redis_1.safeRedisSet)(`refresh_token:${userIdStr}`, tokens.refreshToken, 7 * 24 * 60 * 60);
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Refreshes JWT tokens. Handles rotation checks.
     */
    static async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return next(new AppError_1.AppError("Refresh token is required.", 400));
            }
            const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "jwt_refresh_secret_token";
            const decoded = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
            const user = await User_1.UserModel.findById(decoded.id);
            if (!user) {
                return next(new AppError_1.AppError("User not found.", 401));
            }
            const userIdStr = user._id.toString();
            // Check if refresh token is valid (rotation logic — best-effort when Redis is down)
            const storedToken = await (0, redis_1.safeRedisGet)(`refresh_token:${userIdStr}`);
            if (storedToken && storedToken !== refreshToken) {
                // Token might have been reused/stolen. Force logout for security.
                await (0, redis_1.safeRedisDel)(`refresh_token:${userIdStr}`);
                return next(new AppError_1.AppError("Compromised session. Please re-authenticate.", 401));
            }
            // Generate new token pair
            const tokens = generateTokenPair(userIdStr, user.email, user.role);
            // Save new refresh token
            await (0, redis_1.safeRedisSet)(`refresh_token:${userIdStr}`, tokens.refreshToken, 7 * 24 * 60 * 60);
            res.status(200).json({
                success: true,
                tokens,
            });
        }
        catch (error) {
            next(new AppError_1.AppError("Invalid or expired refresh token.", 401));
        }
    }
    /**
     * Logs out user by deleting refresh token.
     */
    static async logout(req, res, next) {
        try {
            const { userId } = req.body;
            if (userId) {
                await (0, redis_1.safeRedisDel)(`refresh_token:${userId}`);
            }
            res.status(200).json({
                success: true,
                message: "Logged out successfully.",
            });
        }
        catch (error) {
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
    static async sendOtp(req, res, next) {
        try {
            const { phone } = req.body;
            const clean = (phone || "").replace(/[^0-9]/g, "");
            if (clean.length !== 10) {
                return next(new AppError_1.AppError("Please provide a valid 10-digit phone number.", 400));
            }
            // ── Generate Random OTP (or use DEV_OTP if not configured) ─────────────
            const generatedOtp = isApitxtConfigured
                ? Math.floor(100000 + Math.random() * 900000).toString()
                : DEV_OTP;
            // Store in Redis (valid for 10 mins)
            await (0, redis_1.safeRedisSet)(`otp:${clean}`, generatedOtp, 10 * 60);
            // ── DEV BYPASS: No APITxT credentials configured ────────────────────────
            if (!isApitxtConfigured) {
                logger_1.logger.warn(`[DEV MODE] APITxT not configured. OTP for ${clean} is "${DEV_OTP}" (stored in memory).`);
                res.status(200).json({
                    success: true,
                    message: "OTP sent successfully. Please check your SMS.",
                    _devNote: process.env.NODE_ENV !== "production"
                        ? `APITxT not configured. Use OTP: ${DEV_OTP} for testing.`
                        : undefined,
                });
                return;
            }
            // ── Production APITxT Flow ───────────────────────────────────────────────
            const mobile = `91${clean}`; // E.164 without +
            const result = await apitxtRequest(mobile, generatedOtp);
            logger_1.logger.info(`APITxT send-otp for ${mobile}: ${JSON.stringify(result)}`);
            if (result.status === "error") {
                // Fallback to dev mode if API fails (e.g., insufficient funds)
                logger_1.logger.warn(`APITxT failed: ${result.message}. Falling back to DEV_OTP.`);
                await (0, redis_1.safeRedisSet)(`otp:${clean}`, DEV_OTP, 10 * 60);
                return next(new AppError_1.AppError(`OTP send failed: ${result.message} (Use OTP 123456 instead)`, 502));
            }
            res.status(200).json({
                success: true,
                message: "OTP sent successfully. Please check your SMS.",
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Verifies the OTP stored in Redis. If valid, auto-creates or
     * looks up the user and returns a JWT pair.
     * POST /auth/verify-otp  { phone: "9876543210", otp: "123456" }
     */
    static async verifyOtp(req, res, next) {
        try {
            const { phone, otp } = req.body;
            const clean = (phone || "").replace(/[^0-9]/g, "");
            if (clean.length !== 10) {
                return next(new AppError_1.AppError("Invalid phone number.", 400));
            }
            if (!otp || String(otp).length !== 6) {
                return next(new AppError_1.AppError("Please provide a 6-digit OTP.", 400));
            }
            // ── Verification: Check stored OTP ────────────────────────────────────
            const storedOtp = await (0, redis_1.safeRedisGet)(`otp:${clean}`);
            // Accept DEV_OTP if explicitly allowed (no APITxT key) or if fallback triggered
            const expectedOtp = storedOtp || (!isApitxtConfigured ? DEV_OTP : null);
            if (!expectedOtp || String(otp) !== expectedOtp) {
                return next(new AppError_1.AppError("Incorrect OTP. Please check and try again.", 401));
            }
            // Clear used OTP
            await (0, redis_1.safeRedisDel)(`otp:${clean}`);
            logger_1.logger.info(`OTP verified successfully for ${clean}.`);
            // ── Find or create user ─────────────────────────────────────────────────
            let user = await User_1.UserModel.findOne({ phone: clean });
            if (!user) {
                // New user: create a minimal record (no password needed for phone auth)
                user = await User_1.UserModel.create({
                    name: `User_${clean.slice(-4)}`,
                    email: `${clean}@phone.atozworks.in`, // placeholder, can be updated later
                    phone: clean,
                    passwordHash: "", // not used for phone-auth users
                    role: "CUSTOMER",
                });
                logger_1.logger.info(`New phone-auth user created: ${clean}`);
            }
            if (user.status !== "ACTIVE") {
                return next(new AppError_1.AppError("Your account has been deactivated.", 403));
            }
            const userIdStr = user._id.toString();
            const tokens = generateTokenPair(userIdStr, user.email, user.role);
            // Persist refresh token (Redis with in-memory fallback)
            await (0, redis_1.safeRedisSet)(`refresh_token:${userIdStr}`, tokens.refreshToken, 7 * 24 * 60 * 60);
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
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
