import crypto from "crypto";
import { razorpay } from "../config/razorpay";
import { PaymentModel } from "../models/Payment";
import { BookingModel } from "../models/Booking";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";

export class PaymentService {
  /**
   * Creates a Razorpay Order linked to a booking.
   */
  public static async createOrder(
    bookingId: string,
    amount: number
  ): Promise<{ orderId: string; currency: string; amount: number }> {
    try {
      const options = {
        amount: Math.round(amount * 100), // Razorpay accepts amounts in paise (INR * 100)
        currency: "INR",
        receipt: `receipt_booking_${bookingId.substring(0, 10)}`,
        notes: {
          bookingId,
        },
      };

      const order = await razorpay.orders.create(options);
      
      // Track the pending payment transaction in the DB
      await PaymentModel.create({
        bookingId,
        amount,
        transactionId: order.id,
        paymentGateway: "RAZORPAY",
        status: "PENDING",
      });

      return {
        orderId: order.id,
        currency: order.currency,
        amount: (order.amount as number) / 100, // standard decimal response
      };
    } catch (error) {
      logger.error(`Failed to create Razorpay order for booking ${bookingId}:`, error);
      throw new AppError("Razorpay order creation failed", 500);
    }
  }

  /**
   * Verifies the Razorpay payment signature to confirm payment completion.
   */
  public static verifySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const keySecret = process.env.RAZORPAY_KEY_SECRET || "mockkeysecret";
      const hmac = crypto.createHmac("sha256", keySecret);
      hmac.update(orderId + "|" + paymentId);
      const generatedSignature = hmac.digest("hex");
      return generatedSignature === signature;
    } catch (error) {
      logger.error("Signature verification error:", error);
      return false;
    }
  }

  /**
   * Finalizes database records on payment verification success.
   */
  public static async processPaymentSuccess(
    bookingId: string,
    transactionId: string
  ): Promise<void> {
    // 1. Update Payment Status to COMPLETED
    await PaymentModel.updateMany(
      { bookingId },
      { status: "COMPLETED", transactionId }
    );

    // 2. Retrieve the booking details
    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      throw new AppError("Booking not found during payment processing", 404);
    }

    // 3. Update Booking Payment Status
    await BookingModel.findByIdAndUpdate(bookingId, {
      paymentStatus: "COMPLETED",
      status: "ACCEPTED", // Move status to Accepted
    });

    logger.info(`Payment verified and processed successfully for Booking ID: ${bookingId}`);
  }

  /**
   * Initiates a refund for a cancelled booking.
   */
  public static async processRefund(
    bookingId: string
  ): Promise<{ refundId: string; status: string }> {
    try {
      // Find the successful transaction to refund
      const payment = await PaymentModel.findOne({
        bookingId,
        status: "COMPLETED",
      });

      if (!payment || !payment.transactionId) {
        throw new AppError("No completed payment transaction found for this booking", 404);
      }

      // Initialize Razorpay refund
      const refund = await razorpay.payments.refund(payment.transactionId, {
        amount: Math.round(payment.amount * 100), // full refund in paise
        speed: "normal",
        notes: {
          bookingId,
          reason: "Customer cancellation refund",
        },
      });

      // Update DB records
      await PaymentModel.findByIdAndUpdate(payment._id, {
        status: "REFUNDED",
      });

      await BookingModel.findByIdAndUpdate(bookingId, {
        status: "REFUNDED",
        paymentStatus: "REFUNDED",
      });

      logger.info(`Refund processed successfully for booking ${bookingId}. Refund ID: ${refund.id}`);
      return { refundId: refund.id, status: refund.status };
    } catch (error) {
      logger.error(`Refund failed for Booking ${bookingId}:`, error);
      throw new AppError(`Refund processing failed: ${(error as any).message}`, 500);
    }
  }
}
