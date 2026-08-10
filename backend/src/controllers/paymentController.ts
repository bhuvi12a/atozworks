import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { BookingModel } from "../models/Booking";
import { PaymentModel } from "../models/Payment";
import { PaymentService } from "../services/paymentService";
import { SocketService } from "../services/socketService";
import { NotificationService } from "../services/notification";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export class PaymentController {
  /**
   * Initiates payment order creation linked to booking.
   */
  public static async createOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        return next(new AppError("Booking ID is required.", 400));
      }

      const booking = await BookingModel.findById(bookingId);

      if (!booking) return next(new AppError("Booking not found.", 404));

      if (booking.paymentStatus === "COMPLETED") {
        return next(new AppError("This booking is already paid.", 400));
      }

      const orderData = await PaymentService.createOrder(
        bookingId,
        booking.estimatedPrice
      );

      res.status(200).json({
        success: true,
        order: orderData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verifies Razorpay payment signature from client app checkout.
   */
  public static async verifyPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !bookingId) {
        return next(new AppError("Missing signature verification parameters.", 400));
      }

      let isVerified = false;

      // Allow simulated payment success when using DEV_BYPASS (for testing/demo)
      if (razorpaySignature === "DEV_BYPASS_SIGNATURE") {
        isVerified = true;
      } else {
        isVerified = PaymentService.verifySignature(
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature
        );
      }

      if (!isVerified) {
        // Log failed verification attempt
        await PaymentModel.updateMany(
          { bookingId },
          { status: "FAILED" }
        );

        return next(new AppError("Payment signature verification failed.", 400));
      }

      // Successful payment completion
      await PaymentService.processPaymentSuccess(bookingId, razorpayPaymentId);

      // Emit live updates to Socket rooms
      SocketService.emitToBooking(bookingId, "payment_success", {
        bookingId,
        transactionId: razorpayPaymentId,
        status: "PAID",
      });

      // Retrieve customer details to notify
      const booking = await BookingModel.findById(bookingId);
      if (booking) {
        await NotificationService.sendPush(
          booking.customerId.toString(),
          "Payment Successful",
          `Payment of ₹${booking.estimatedPrice} has been confirmed for service ${booking.bookingNumber}.`,
          "PAYMENT_SUCCESS"
        );
      }

      res.status(200).json({
        success: true,
        message: "Payment verified and booking confirmed successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Razorpay Webhook Handler (optional, for backend-to-gateway background syncing).
   */
  public static async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "mockwebhooksecret";
      const signature = req.headers["x-razorpay-signature"] as string;

      if (!signature) {
        return next(new AppError("Signature is required", 400));
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (expectedSignature !== signature) {
        return next(new AppError("Invalid webhook signature", 400));
      }

      const event = req.body.event;
      logger.info(`Received Razorpay Webhook event: ${event}`);

      if (event === "payment.captured") {
        const payload = req.body.payload.payment.entity;
        const bookingId = payload.notes.bookingId;
        const transactionId = payload.id;

        // Process successful payment
        await PaymentService.processPaymentSuccess(bookingId, transactionId);
      }

      res.status(200).json({ status: "ok" });
    } catch (error) {
      next(error);
    }
  }
}
