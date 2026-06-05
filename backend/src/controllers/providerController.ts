import { Response, NextFunction } from "express";
import { ProviderModel } from "../models/Provider";
import { BookingModel } from "../models/Booking";
import { redis } from "../config/redis";
import { AuthenticatedRequest } from "../middlewares/auth";
import { AppError } from "../utils/AppError";
import { SocketService } from "../services/socketService";
import { NotificationService } from "../services/notification";
import { logger } from "../utils/logger";

export class ProviderController {
  /**
   * Upsert service area (radius/bounds of operations).
   */
  public static async updateServiceArea(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { latitude, longitude, serviceRadiusKm } = req.body;

      if (latitude === undefined || longitude === undefined || !serviceRadiusKm) {
        return next(new AppError("Please provide coordinates and service radius.", 400));
      }

      const provider = await ProviderModel.findOne({ userId });

      if (!provider) return next(new AppError("Provider profile not found.", 404));

      // In Mongoose, we replace the serviceAreas embedded array (we maintain single zone coverage)
      provider.serviceAreas = [{
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        serviceRadiusKm: parseFloat(serviceRadiusKm),
      }];

      await provider.save();

      res.status(200).json({
        success: true,
        message: "Service area updated successfully.",
        serviceArea: {
          providerId: provider._id.toString(),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          serviceRadiusKm: parseFloat(serviceRadiusKm),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk updates weekly availability calendar.
   */
  public static async updateAvailability(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { schedule } = req.body; // Array of { day: 1, startTime: "09:00", endTime: "18:00", available: true }

      if (!Array.isArray(schedule)) {
        return next(new AppError("Schedule must be a list of slot parameters.", 400));
      }

      const provider = await ProviderModel.findOne({ userId });

      if (!provider) return next(new AppError("Provider profile not found.", 404));

      provider.availabilities = schedule.map((item) => ({
        day: parseInt(item.day),
        startTime: item.startTime,
        endTime: item.endTime,
        available: !!item.available,
      }));

      await provider.save();

      res.status(200).json({
        success: true,
        message: "Weekly availability calendar updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Responds to an assigned booking request (Accept / Reject).
   * Implements Redis locking to handle concurrency.
   */
  public static async respondToBooking(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { bookingId } = req.params;
      const { action } = req.body; // "ACCEPT" or "REJECT"

      if (action !== "ACCEPT" && action !== "REJECT") {
        return next(new AppError("Invalid response action.", 400));
      }

      const provider = await ProviderModel.findOne({ userId });

      if (!provider) return next(new AppError("Provider not found.", 404));

      const providerIdStr = provider._id.toString();

      // Acquire Redis Lock to prevent duplicate acceptances
      const lockKey = `booking_lock:${bookingId}`;
      const lockAcquired = await redis.set(lockKey, providerIdStr, "EX", 10, "NX");

      if (!lockAcquired && action === "ACCEPT") {
        return next(new AppError("This job request has already been claimed by another provider.", 409));
      }

      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        await redis.del(lockKey);
        return next(new AppError("Booking record not found.", 404));
      }

      if (booking.status !== "PENDING" && booking.status !== "SEARCHING_PROVIDER") {
        await redis.del(lockKey);
        return next(new AppError("This booking is no longer open for acceptance.", 400));
      }

      if (action === "REJECT") {
        // Just release lock if any and return success
        await redis.del(lockKey);
        res.status(200).json({
          success: true,
          message: "Booking request rejected.",
        });
        return;
      }

      // Process ACCEPT
      const updatedBooking = await BookingModel.findByIdAndUpdate(
        bookingId,
        {
          providerId: provider._id,
          status: "PROVIDER_ASSIGNED",
        },
        { new: true }
      );

      if (!updatedBooking) {
        await redis.del(lockKey);
        return next(new AppError("Failed to update booking status.", 500));
      }

      // Set provider status active (increment jobs)
      await ProviderModel.findByIdAndUpdate(provider._id, {
        $inc: { totalJobs: 1 },
      });

      // Clear the dispatch queue in Redis
      await redis.del(`booking_dispatch:${bookingId}`);

      logger.info(`Booking ${bookingId} accepted by provider ${providerIdStr}`);

      // Emit sockets alerts to Customer and Provider
      SocketService.emitToBooking(bookingId, "booking_confirmed", {
        bookingId,
        providerId: providerIdStr,
        status: updatedBooking.status,
      });

      // Send push notification to customer
      await NotificationService.sendPush(
        booking.customerId.toString(),
        "Provider Assigned!",
        "A verified professional has accepted your booking request and is reviewing the details.",
        "BOOKING_ACCEPTED"
      );

      res.status(200).json({
        success: true,
        message: "Booking request accepted successfully.",
        booking: {
          id: updatedBooking._id.toString(),
          bookingNumber: updatedBooking.bookingNumber,
          customerId: updatedBooking.customerId.toString(),
          providerId: updatedBooking.providerId?.toString(),
          serviceId: updatedBooking.serviceId.toString(),
          addressId: updatedBooking.addressId.toString(),
          bookingDate: updatedBooking.bookingDate,
          bookingTime: updatedBooking.bookingTime,
          status: updatedBooking.status,
          estimatedPrice: updatedBooking.estimatedPrice,
          finalPrice: updatedBooking.finalPrice,
          paymentStatus: updatedBooking.paymentStatus,
          createdAt: updatedBooking.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Returns calculated total completed job revenues.
   */
  public static async getEarnings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const provider = await ProviderModel.findOne({ userId });

      if (!provider) return next(new AppError("Provider profile not found.", 404));

      // Aggregate all completed bookings earnings
      const bookings = await BookingModel.find({
        providerId: provider._id,
        status: "COMPLETED",
        paymentStatus: "COMPLETED",
      }).select("finalPrice createdAt");

      const totalEarnings = bookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);

      const formattedHistory = bookings.map((b) => ({
        id: b._id.toString(),
        finalPrice: b.finalPrice,
        createdAt: b.createdAt,
      }));

      res.status(200).json({
        success: true,
        earnings: {
          total: totalEarnings,
          jobsCount: bookings.length,
          history: formattedHistory,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
