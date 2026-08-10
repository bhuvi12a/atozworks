import { Router } from "express";
import { PaymentController } from "../controllers/paymentController";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Public webhook endpoint used by Razorpay gateway servers
router.post("/webhook", PaymentController.handleWebhook);

// Protected endpoints for customer client checkout flows
router.post("/order", authenticate, PaymentController.createOrder);
router.post("/create-order", authenticate, PaymentController.createOrder); // alias for mobile app
router.post("/verify", authenticate, PaymentController.verifyPayment);

export default router;
