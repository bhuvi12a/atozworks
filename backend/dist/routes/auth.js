"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const router = (0, express_1.Router)();
// Rate limit authentication routes to prevent brute-force attacks
router.post("/register", rateLimiter_1.apiLimiter, authController_1.AuthController.register);
router.post("/login", rateLimiter_1.apiLimiter, authController_1.AuthController.login);
router.post("/refresh", authController_1.AuthController.refresh);
router.post("/logout", authController_1.AuthController.logout);
// MSG91 OTP phone authentication
router.post("/send-otp", rateLimiter_1.apiLimiter, authController_1.AuthController.sendOtp);
router.post("/verify-otp", rateLimiter_1.apiLimiter, authController_1.AuthController.verifyOtp);
exports.default = router;
