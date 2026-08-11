"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingEngine = void 0;
const Service_1 = require("../models/Service");
const Coupon_1 = require("../models/Coupon");
const Provider_1 = require("../models/Provider");
const redis_1 = require("../config/redis");
const locationService_1 = require("./locationService");
const notification_1 = require("./notification");
const socketService_1 = require("./socketService");
const AppError_1 = require("../utils/AppError");
const logger_1 = require("../utils/logger");
class BookingEngine {
    /**
     * Calculates the final pricing based on service price, date/time, materials, and coupons.
     */
    static async calculatePrice(serviceId, bookingDateStr, bookingTimeStr, materialCharges = 0, couponCode) {
        const service = await Service_1.ServiceModel.findById(serviceId);
        if (!service) {
            throw new AppError_1.AppError("Service not found", 404);
        }
        const basePrice = service.basePrice;
        let peakHourCharges = 0;
        let weekendCharges = 0;
        // 1. Analyze booking time (Peak hours: 7 PM - 11 PM or early 6 AM - 8 AM)
        const hour = parseInt(bookingTimeStr.split(":")[0]);
        if (hour >= 19 && hour <= 23) {
            peakHourCharges = parseFloat((basePrice * 0.15).toFixed(2)); // 15% peak charge
        }
        else if (hour >= 6 && hour <= 8) {
            peakHourCharges = parseFloat((basePrice * 0.1).toFixed(2)); // 10% peak charge
        }
        // 2. Analyze booking date (Weekend check: Saturday=6, Sunday=0)
        const bookingDate = new Date(bookingDateStr);
        const day = bookingDate.getDay();
        if (day === 0 || day === 6) {
            weekendCharges = parseFloat((basePrice * 0.1).toFixed(2)); // 10% weekend charge
        }
        // 3. Tax Calculation (e.g. GST 18%)
        const taxableAmount = basePrice + peakHourCharges + weekendCharges + materialCharges;
        const taxes = parseFloat((taxableAmount * 0.18).toFixed(2));
        // 4. Coupon Discount Check
        let couponDiscount = 0;
        if (couponCode) {
            const coupon = await Coupon_1.CouponModel.findOne({ code: couponCode, active: true });
            if (coupon && new Date(coupon.expiryDate) > new Date()) {
                if (coupon.discountType === "PERCENTAGE") {
                    couponDiscount = parseFloat((taxableAmount * (coupon.discountValue / 100)).toFixed(2));
                }
                else {
                    couponDiscount = coupon.discountValue;
                }
            }
        }
        // Calculate final price
        const finalPrice = Math.max(0, parseFloat((taxableAmount + taxes - couponDiscount).toFixed(2)));
        return {
            basePrice,
            peakHourCharges,
            weekendCharges,
            materialCharges,
            taxes,
            couponDiscount,
            finalPrice,
        };
    }
    /**
     * Finds nearby active verified providers qualified for a specific service category,
     * checks schedule availability, and scores them based on proximity and metrics.
     */
    static async findMatchProviders(categoryId, customerLat, customerLon, bookingDateStr, bookingTimeStr) {
        // 1. Get day of week for availability checks (Sunday = 0, Saturday = 6)
        const bookingDate = new Date(bookingDateStr);
        const dayOfWeek = bookingDate.getDay();
        // 2. Fetch all verified providers matching category
        let providers = await Provider_1.ProviderModel.find({
            verificationStatus: "VERIFIED",
            kycStatus: "APPROVED",
            categories: categoryId,
        }).populate("userId");
        // Fallback: If no providers have this specific category (e.g. it was auto-created),
        // find any verified provider to ensure the booking can be fulfilled.
        if (providers.length === 0) {
            logger_1.logger.warn(`No providers found for category ${categoryId}, falling back to all verified providers`);
            providers = await Provider_1.ProviderModel.find({
                verificationStatus: "VERIFIED",
                kycStatus: "APPROVED",
            }).populate("userId");
        }
        const matches = [];
        for (const provider of providers) {
            // Validate service availability schedule
            const dayAvailabilities = provider.availabilities.filter((a) => a.day === dayOfWeek && a.available === true);
            if (dayAvailabilities.length === 0)
                continue; // Not working this day
            const availability = dayAvailabilities[0];
            const startHour = parseInt(availability.startTime.split(":")[0]);
            const startMin = parseInt(availability.startTime.split(":")[1]);
            const endHour = parseInt(availability.endTime.split(":")[0]);
            const endMin = parseInt(availability.endTime.split(":")[1]);
            const bookingHour = parseInt(bookingTimeStr.split(":")[0]);
            const bookingMin = parseInt(bookingTimeStr.split(":")[1]);
            // Check slot boundaries
            const startMins = startHour * 60 + startMin;
            const endMins = endHour * 60 + endMin;
            const bookingMins = bookingHour * 60 + bookingMin;
            if (bookingMins < startMins || bookingMins > endMins)
                continue;
            // Check geo coverage coordinates
            let isCovered = false;
            let minDistance = Infinity;
            for (const area of provider.serviceAreas) {
                const distance = locationService_1.LocationService.calculateDistance(area.latitude, area.longitude, customerLat, customerLon);
                if (distance <= area.serviceRadiusKm) {
                    isCovered = true;
                    if (distance < minDistance) {
                        minDistance = distance;
                    }
                }
            }
            if (!isCovered)
                continue;
            // Calculate score = (Rating * 0.4) + ((MaxRadius - Distance)/MaxRadius * 0.3) + (TotalJobs * 0.3)
            const ratingWeight = provider.rating * 10; // score out of 50
            const distanceWeight = minDistance > 0 ? (10 / minDistance) * 3 : 30; // score closer higher
            const jobsWeight = Math.min(provider.totalJobs * 2, 20); // capped experience score
            const totalScore = parseFloat((ratingWeight + distanceWeight + jobsWeight).toFixed(2));
            matches.push({
                providerId: provider._id.toString(),
                name: provider.userId.name,
                phone: provider.userId.phone,
                distance: minDistance,
                rating: provider.rating,
                totalJobs: provider.totalJobs,
                score: totalScore,
            });
        }
        // Sort descending by highest score
        return matches.sort((a, b) => b.score - a.score);
    }
    /**
     * Broadcasts the booking request sequentially to matching providers via Redis.
     */
    static async dispatchBookingRequest(bookingId, categoryId, customerLat, customerLon, bookingDateStr, bookingTimeStr) {
        const providers = await this.findMatchProviders(categoryId, customerLat, customerLon, bookingDateStr, bookingTimeStr);
        if (providers.length === 0) {
            logger_1.logger.warn(`No matching providers found within radius bounds for booking ${bookingId}`);
            // Notify customer that searching failed
            socketService_1.SocketService.emitToBooking(bookingId, "provider_search_failed", {
                message: "No technicians available in your area for the requested slot.",
            });
            return;
        }
        // Use top 5 providers
        const targetProviders = providers.slice(0, 5);
        const providerIds = targetProviders.map((p) => p.providerId);
        // Save target queue in Redis for dispatch tracking (expires in 10 minutes)
        const redisQueueKey = `booking_dispatch:${bookingId}`;
        await redis_1.redis.set(redisQueueKey, JSON.stringify(providerIds), "EX", 600);
        logger_1.logger.info(`Dispatching booking ${bookingId} to top matching providers: ${providerIds.join(", ")}`);
        // Notify each matching provider over socket and push notifications
        for (const p of targetProviders) {
            // Emit socket notification to provider's room
            socketService_1.SocketService.emitToUser(p.providerId, "new_booking_request", {
                bookingId,
                distance: p.distance,
                rating: p.rating,
            });
            // Dispatch Push / SMS fallback
            await notification_1.NotificationService.sendPush(p.providerId, "New Booking Available", `Job location is ${p.distance} km away. Tap to accept.`, "BOOKING_REQUEST");
        }
    }
}
exports.BookingEngine = BookingEngine;
