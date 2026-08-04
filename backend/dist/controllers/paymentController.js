"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Booking_1 = require("../models/Booking");
const Payment_1 = require("../models/Payment");
const paymentService_1 = require("../services/paymentService");
const socketService_1 = require("../services/socketService");
const notification_1 = require("../services/notification");
const AppError_1 = require("../utils/AppError");
const logger_1 = require("../utils/logger");
class PaymentController {
    /**
     * Initiates payment order creation linked to booking.
     */
    static async createOrder(req, res, next) {
        try {
            const { bookingId } = req.body;
            if (!bookingId) {
                return next(new AppError_1.AppError("Booking ID is required.", 400));
            }
            const booking = await Booking_1.BookingModel.findById(bookingId);
            if (!booking)
                return next(new AppError_1.AppError("Booking not found.", 404));
            if (booking.paymentStatus === "COMPLETED") {
                return next(new AppError_1.AppError("This booking is already paid.", 400));
            }
            const orderData = await paymentService_1.PaymentService.createOrder(bookingId, booking.estimatedPrice);
            res.status(200).json({
                success: true,
                order: orderData,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Verifies Razorpay payment signature from client app checkout.
     */
    static async verifyPayment(req, res, next) {
        try {
            const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;
            if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !bookingId) {
                return next(new AppError_1.AppError("Missing signature verification parameters.", 400));
            }
            const isVerified = paymentService_1.PaymentService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
            if (!isVerified) {
                // Log failed verification attempt
                await Payment_1.PaymentModel.updateMany({ bookingId }, { status: "FAILED" });
                return next(new AppError_1.AppError("Payment signature verification failed.", 400));
            }
            // Successful payment completion
            await paymentService_1.PaymentService.processPaymentSuccess(bookingId, razorpayPaymentId);
            // Emit live updates to Socket rooms
            socketService_1.SocketService.emitToBooking(bookingId, "payment_success", {
                bookingId,
                transactionId: razorpayPaymentId,
                status: "PAID",
            });
            // Retrieve customer details to notify
            const booking = await Booking_1.BookingModel.findById(bookingId);
            if (booking) {
                await notification_1.NotificationService.sendPush(booking.customerId.toString(), "Payment Successful", `Payment of ₹${booking.estimatedPrice} has been confirmed for service ${booking.bookingNumber}.`, "PAYMENT_SUCCESS");
            }
            res.status(200).json({
                success: true,
                message: "Payment verified and booking confirmed successfully.",
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Razorpay Webhook Handler (optional, for backend-to-gateway background syncing).
     */
    static async handleWebhook(req, res, next) {
        try {
            const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "mockwebhooksecret";
            const signature = req.headers["x-razorpay-signature"];
            if (!signature) {
                return next(new AppError_1.AppError("Signature is required", 400));
            }
            const expectedSignature = crypto_1.default
                .createHmac("sha256", webhookSecret)
                .update(JSON.stringify(req.body))
                .digest("hex");
            if (expectedSignature !== signature) {
                return next(new AppError_1.AppError("Invalid webhook signature", 400));
            }
            const event = req.body.event;
            logger_1.logger.info(`Received Razorpay Webhook event: ${event}`);
            if (event === "payment.captured") {
                const payload = req.body.payload.payment.entity;
                const bookingId = payload.notes.bookingId;
                const transactionId = payload.id;
                // Process successful payment
                await paymentService_1.PaymentService.processPaymentSuccess(bookingId, transactionId);
            }
            res.status(200).json({ status: "ok" });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PaymentController = PaymentController;
