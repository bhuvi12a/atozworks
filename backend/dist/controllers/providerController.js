"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderController = void 0;
const Provider_1 = require("../models/Provider");
const Booking_1 = require("../models/Booking");
const User_1 = require("../models/User");
const Category_1 = require("../models/Category");
const redis_1 = require("../config/redis");
const AppError_1 = require("../utils/AppError");
const socketService_1 = require("../services/socketService");
const notification_1 = require("../services/notification");
const logger_1 = require("../utils/logger");
class ProviderController {
    /**
     * Upsert service area (radius/bounds of operations).
     */
    static async updateServiceArea(req, res, next) {
        try {
            const userId = req.user?.id;
            const { latitude, longitude, serviceRadiusKm } = req.body;
            if (latitude === undefined || longitude === undefined || !serviceRadiusKm) {
                return next(new AppError_1.AppError("Please provide coordinates and service radius.", 400));
            }
            const provider = await Provider_1.ProviderModel.findOne({ userId });
            if (!provider)
                return next(new AppError_1.AppError("Provider profile not found.", 404));
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Bulk updates weekly availability calendar.
     */
    static async updateAvailability(req, res, next) {
        try {
            const userId = req.user?.id;
            const { schedule } = req.body; // Array of { day: 1, startTime: "09:00", endTime: "18:00", available: true }
            if (!Array.isArray(schedule)) {
                return next(new AppError_1.AppError("Schedule must be a list of slot parameters.", 400));
            }
            const provider = await Provider_1.ProviderModel.findOne({ userId });
            if (!provider)
                return next(new AppError_1.AppError("Provider profile not found.", 404));
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Responds to an assigned booking request (Accept / Reject).
     * Implements Redis locking to handle concurrency.
     */
    static async respondToBooking(req, res, next) {
        try {
            const userId = req.user?.id;
            const { bookingId } = req.params;
            const { action } = req.body; // "ACCEPT" or "REJECT"
            if (action !== "ACCEPT" && action !== "REJECT") {
                return next(new AppError_1.AppError("Invalid response action.", 400));
            }
            const provider = await Provider_1.ProviderModel.findOne({ userId });
            if (!provider)
                return next(new AppError_1.AppError("Provider not found.", 404));
            const providerIdStr = provider._id.toString();
            // Acquire Redis Lock to prevent duplicate acceptances
            const lockKey = `booking_lock:${bookingId}`;
            // Try to acquire an atomic lock (NX = only set if Not eXists)
            // With graceful fallback: if Redis unavailable, allow the request
            let lockAcquired = null;
            try {
                const { redis: redisClient } = await Promise.resolve().then(() => __importStar(require("../config/redis")));
                lockAcquired = await redisClient.set(lockKey, providerIdStr, "EX", 10, "NX");
            }
            catch {
                lockAcquired = "OK"; // Fallback: allow if Redis unavailable
            }
            if (!lockAcquired && action === "ACCEPT") {
                return next(new AppError_1.AppError("This job request has already been claimed by another provider.", 409));
            }
            const booking = await Booking_1.BookingModel.findById(bookingId);
            if (!booking) {
                await (0, redis_1.safeRedisDel)(lockKey);
                return next(new AppError_1.AppError("Booking record not found.", 404));
            }
            if (booking.status !== "PENDING" && booking.status !== "SEARCHING_PROVIDER") {
                await (0, redis_1.safeRedisDel)(lockKey);
                return next(new AppError_1.AppError("This booking is no longer open for acceptance.", 400));
            }
            if (action === "REJECT") {
                // Just release lock if any and return success
                await (0, redis_1.safeRedisDel)(lockKey);
                res.status(200).json({
                    success: true,
                    message: "Booking request rejected.",
                });
                return;
            }
            // Process ACCEPT
            const updatedBooking = await Booking_1.BookingModel.findByIdAndUpdate(bookingId, {
                providerId: provider._id,
                status: "PROVIDER_ASSIGNED",
            }, { new: true });
            if (!updatedBooking) {
                await (0, redis_1.safeRedisDel)(lockKey);
                return next(new AppError_1.AppError("Failed to update booking status.", 500));
            }
            // Set provider status active (increment jobs)
            await Provider_1.ProviderModel.findByIdAndUpdate(provider._id, {
                $inc: { totalJobs: 1 },
            });
            // Clear the dispatch queue in Redis
            await (0, redis_1.safeRedisDel)(`booking_dispatch:${bookingId}`);
            logger_1.logger.info(`Booking ${bookingId} accepted by provider ${providerIdStr}`);
            // Emit sockets alerts to Customer and Provider
            socketService_1.SocketService.emitToBooking(bookingId, "booking_confirmed", {
                bookingId,
                providerId: providerIdStr,
                status: updatedBooking.status,
            });
            // Send push notification to customer
            await notification_1.NotificationService.sendPush(booking.customerId.toString(), "Provider Assigned!", "A verified professional has accepted your booking request and is reviewing the details.", "BOOKING_ACCEPTED");
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Returns calculated total completed job revenues.
     */
    static async getEarnings(req, res, next) {
        try {
            const userId = req.user?.id;
            const provider = await Provider_1.ProviderModel.findOne({ userId });
            if (!provider)
                return next(new AppError_1.AppError("Provider profile not found.", 404));
            // Aggregate all completed bookings earnings
            const bookings = await Booking_1.BookingModel.find({
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Register or update provider profile after phone-auth onboarding.
     * Called by mobile PartnerRegisterScreen.
     * POST /api/v1/providers/register
     */
    static async registerProvider(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return next(new AppError_1.AppError("Unauthorized", 401));
            const { name, experience, categories, selfie, idCard } = req.body;
            // Update user name if provided
            if (name) {
                await User_1.UserModel.findByIdAndUpdate(userId, { name });
            }
            // Update user role to PROVIDER
            await User_1.UserModel.findByIdAndUpdate(userId, { role: "PROVIDER" });
            // Resolve category IDs from slugs or names
            let categoryIds = [];
            if (Array.isArray(categories) && categories.length > 0) {
                const cats = await Category_1.CategoryModel.find({
                    $or: [
                        { slug: { $in: categories } },
                        { name: { $in: categories } },
                    ],
                });
                categoryIds = cats.map((c) => c._id);
            }
            // Upsert provider profile
            const provider = await Provider_1.ProviderModel.findOneAndUpdate({ userId }, {
                $set: {
                    experience: parseInt(experience || "0"),
                    selfie: selfie || "",
                    idCard: idCard || "",
                    categories: categoryIds,
                    kycStatus: "PENDING",
                    verificationStatus: "UNVERIFIED",
                },
            }, { upsert: true, new: true });
            logger_1.logger.info(`Provider registered/updated: userId=${userId}`);
            res.status(201).json({
                success: true,
                message: "Provider registration submitted. Your KYC is under review.",
                provider: {
                    id: provider._id.toString(),
                    userId,
                    experience: provider.experience,
                    kycStatus: provider.kycStatus,
                    verificationStatus: provider.verificationStatus,
                    categories: categoryIds.map((id) => id.toString()),
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get the current provider's profile.
     * GET /api/v1/providers/profile
     */
    static async getProviderProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return next(new AppError_1.AppError("Unauthorized", 401));
            const provider = await Provider_1.ProviderModel.findOne({ userId })
                .populate("userId", "name email phone")
                .populate("categories", "name slug");
            if (!provider) {
                return next(new AppError_1.AppError("Provider profile not found.", 404));
            }
            res.status(200).json({
                success: true,
                provider: {
                    id: provider._id.toString(),
                    user: provider.userId,
                    experience: provider.experience,
                    rating: provider.rating,
                    totalJobs: provider.totalJobs,
                    kycStatus: provider.kycStatus,
                    verificationStatus: provider.verificationStatus,
                    categories: provider.categories,
                    serviceAreas: provider.serviceAreas,
                    availabilities: provider.availabilities,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProviderController = ProviderController;
