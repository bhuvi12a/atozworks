import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { apiLimiter } from "../middlewares/rateLimiter";

const router = Router();

// Rate limit authentication routes to prevent brute-force attacks
router.post("/register", apiLimiter, AuthController.register);
router.post("/login", apiLimiter, AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);

// MSG91 OTP phone authentication
router.post("/send-otp", apiLimiter, AuthController.sendOtp);
router.post("/verify-otp", apiLimiter, AuthController.verifyOtp);

export default router;

