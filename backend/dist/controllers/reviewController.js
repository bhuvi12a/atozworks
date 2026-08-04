"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const Review_1 = require("../models/Review");
const Booking_1 = require("../models/Booking");
const Provider_1 = require("../models/Provider");
const AppError_1 = require("../utils/AppError");
const logger_1 = require("../utils/logger");
class ReviewController {
    /**
     * Submit feedback ratings and review for a completed service.
     * Dynamically aggregates new average rating for the assigned provider.
     */
    static async submitReview(req, res, next) {
        try {
            const customerId = req.user?.id;
            const { bookingId, rating, review } = req.body;
            if (!bookingId || rating === undefined) {
                return next(new AppError_1.AppError("Booking ID and rating score are required.", 400));
            }
            const score = parseInt(rating);
            if (score < 1 || score > 5) {
                return next(new AppError_1.AppError("Rating must be a score between 1 and 5.", 400));
            }
            // Verify booking eligibility
            const booking = await Booking_1.BookingModel.findById(bookingId);
            if (!booking || booking.customerId.toString() !== customerId) {
                return next(new AppError_1.AppError("Booking not found or unauthorized.", 404));
            }
            if (booking.status !== "COMPLETED") {
                return next(new AppError_1.AppError("You can only rate completed home services.", 400));
            }
            if (!booking.providerId) {
                return next(new AppError_1.AppError("No provider was assigned to this booking to review.", 400));
            }
            // Check if review already exists
            const existingReview = await Review_1.ReviewModel.findOne({ bookingId });
            if (existingReview) {
                return next(new AppError_1.AppError("You have already submitted a review for this service.", 400));
            }
            // Create review
            const reviewObj = await Review_1.ReviewModel.create({
                bookingId,
                customerId,
                providerId: booking.providerId,
                rating: score,
                review,
            });
            // Fetch all reviews for this provider to compute average
            const reviews = await Review_1.ReviewModel.find({ providerId: booking.providerId });
            const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
            const newAverage = reviews.length > 0 ? sum / reviews.length : score;
            // Update provider rating record
            await Provider_1.ProviderModel.findByIdAndUpdate(booking.providerId, {
                rating: parseFloat(newAverage.toFixed(2)),
            });
            logger_1.logger.info(`Feedback submitted for Booking: ${bookingId} (Rating: ${score})`);
            res.status(201).json({
                success: true,
                message: "Review submitted successfully.",
                review: {
                    id: reviewObj._id.toString(),
                    bookingId: reviewObj.bookingId.toString(),
                    customerId: reviewObj.customerId.toString(),
                    providerId: reviewObj.providerId.toString(),
                    rating: reviewObj.rating,
                    review: reviewObj.review,
                    createdAt: reviewObj.createdAt,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReviewController = ReviewController;
