"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const razorpay_1 = require("../config/razorpay");
const Payment_1 = require("../models/Payment");
const Booking_1 = require("../models/Booking");
const logger_1 = require("../utils/logger");
const AppError_1 = require("../utils/AppError");
class PaymentService {
    /**
     * Creates a Razorpay Order linked to a booking.
     */
    static async createOrder(bookingId, amount) {
        try {
            const options = {
                amount: Math.round(amount * 100), // Razorpay accepts amounts in paise (INR * 100)
                currency: "INR",
                receipt: `receipt_booking_${bookingId.substring(0, 10)}`,
                notes: {
                    bookingId,
                },
            };
            const order = await razorpay_1.razorpay.orders.create(options);
            // Track the pending payment transaction in the DB
            await Payment_1.PaymentModel.create({
                bookingId,
                amount,
                transactionId: order.id,
                paymentGateway: "RAZORPAY",
                status: "PENDING",
            });
            return {
                orderId: order.id,
                currency: order.currency,
                amount: order.amount / 100, // standard decimal response
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to create Razorpay order for booking ${bookingId}:`, error);
            throw new AppError_1.AppError("Razorpay order creation failed", 500);
        }
    }
    /**
     * Verifies the Razorpay payment signature to confirm payment completion.
     */
    static verifySignature(orderId, paymentId, signature) {
        try {
            const keySecret = process.env.RAZORPAY_KEY_SECRET || "mockkeysecret";
            const hmac = crypto_1.default.createHmac("sha256", keySecret);
            hmac.update(orderId + "|" + paymentId);
            const generatedSignature = hmac.digest("hex");
            return generatedSignature === signature;
        }
        catch (error) {
            logger_1.logger.error("Signature verification error:", error);
            return false;
        }
    }
    /**
     * Finalizes database records on payment verification success.
     */
    static async processPaymentSuccess(bookingId, transactionId) {
        // 1. Update Payment Status to COMPLETED
        await Payment_1.PaymentModel.updateMany({ bookingId }, { status: "COMPLETED", transactionId });
        // 2. Retrieve the booking details
        const booking = await Booking_1.BookingModel.findById(bookingId);
        if (!booking) {
            throw new AppError_1.AppError("Booking not found during payment processing", 404);
        }
        // 3. Update Booking Payment Status
        await Booking_1.BookingModel.findByIdAndUpdate(bookingId, {
            paymentStatus: "COMPLETED",
            status: "ACCEPTED", // Move status to Accepted
        });
        logger_1.logger.info(`Payment verified and processed successfully for Booking ID: ${bookingId}`);
    }
    /**
     * Initiates a refund for a cancelled booking.
     */
    static async processRefund(bookingId) {
        try {
            // Find the successful transaction to refund
            const payment = await Payment_1.PaymentModel.findOne({
                bookingId,
                status: "COMPLETED",
            });
            if (!payment || !payment.transactionId) {
                throw new AppError_1.AppError("No completed payment transaction found for this booking", 404);
            }
            // Initialize Razorpay refund
            const refund = await razorpay_1.razorpay.payments.refund(payment.transactionId, {
                amount: Math.round(payment.amount * 100), // full refund in paise
                speed: "normal",
                notes: {
                    bookingId,
                    reason: "Customer cancellation refund",
                },
            });
            // Update DB records
            await Payment_1.PaymentModel.findByIdAndUpdate(payment._id, {
                status: "REFUNDED",
            });
            await Booking_1.BookingModel.findByIdAndUpdate(bookingId, {
                status: "REFUNDED",
                paymentStatus: "REFUNDED",
            });
            logger_1.logger.info(`Refund processed successfully for booking ${bookingId}. Refund ID: ${refund.id}`);
            return { refundId: refund.id, status: refund.status };
        }
        catch (error) {
            logger_1.logger.error(`Refund failed for Booking ${bookingId}:`, error);
            throw new AppError_1.AppError(`Refund processing failed: ${error.message}`, 500);
        }
    }
}
exports.PaymentService = PaymentService;
