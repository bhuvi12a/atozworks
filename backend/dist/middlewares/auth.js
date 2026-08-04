"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const AppError_1 = require("../utils/AppError");
/**
 * Authenticates requests checking authorization bearer header.
 */
const authenticate = async (req, _res, next) => {
    try {
        let token = null;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) {
            if (process.env.NODE_ENV === "development") {
                const isFromAdmin = req.headers.referer?.includes("admin");
                const targetRole = isFromAdmin ? "ADMIN" : "CUSTOMER";
                let mockUser = await User_1.UserModel.findOne({ role: targetRole });
                if (!mockUser) {
                    // If no user exists yet, grab the first user or create a temporary one
                    mockUser = await User_1.UserModel.findOne();
                }
                if (mockUser) {
                    req.user = {
                        id: mockUser._id.toString(),
                        email: mockUser.email,
                        role: mockUser.role,
                    };
                    return next();
                }
            }
            return next(new AppError_1.AppError("You are not logged in. Please login to get access.", 401));
        }
        // Verify token validity
        const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "jwt_access_secret_token";
        const decoded = jsonwebtoken_1.default.verify(token, JWT_ACCESS_SECRET);
        // Verify user is active and exists in database
        const user = await User_1.UserModel.findById(decoded.id);
        if (!user) {
            return next(new AppError_1.AppError("The user belonging to this token no longer exists.", 401));
        }
        if (user.status !== "ACTIVE") {
            return next(new AppError_1.AppError("Your account has been suspended or deactivated.", 403));
        }
        // Attach user payload to request
        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        };
        next();
    }
    catch (error) {
        return next(new AppError_1.AppError("Invalid or expired access token. Please authenticate again.", 401));
    }
};
exports.authenticate = authenticate;
/**
 * Enforces role access restrictions.
 */
const restrictTo = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new AppError_1.AppError("User context not established.", 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new AppError_1.AppError("You do not have permission to perform this action.", 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
