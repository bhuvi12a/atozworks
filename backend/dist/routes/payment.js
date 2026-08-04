"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Public webhook endpoint used by Razorpay gateway servers
router.post("/webhook", paymentController_1.PaymentController.handleWebhook);
// Protected endpoints for customer client checkout flows
router.post("/order", auth_1.authenticate, paymentController_1.PaymentController.createOrder);
router.post("/verify", auth_1.authenticate, paymentController_1.PaymentController.verifyPayment);
exports.default = router;
