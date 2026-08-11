"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const Provider_1 = require("../models/Provider");
const Booking_1 = require("../models/Booking");
const User_1 = require("../models/User");
const Service_1 = require("../models/Service");
const Coupon_1 = require("../models/Coupon");
const Category_1 = require("../models/Category");
const AppError_1 = require("../utils/AppError");
const logger_1 = require("../utils/logger");
class AdminController {
    /**
     * Approves or rejects provider KYC verification.
     */
    static async verifyKyc(req, res, next) {
        try {
            const { providerId } = req.params;
            const { status } = req.body; // "APPROVED" or "REJECTED"
            if (status !== "APPROVED" && status !== "REJECTED") {
                return next(new AppError_1.AppError("Invalid KYC status choice.", 400));
            }
            const provider = await Provider_1.ProviderModel.findById(providerId);
            if (!provider)
                return next(new AppError_1.AppError("Provider record not found.", 404));
            const updated = await Provider_1.ProviderModel.findByIdAndUpdate(providerId, {
                kycStatus: status,
                verificationStatus: status === "APPROVED" ? "VERIFIED" : "UNVERIFIED",
            }, { new: true });
            logger_1.logger.info(`Provider KYC status updated: Provider ID ${providerId} set to ${status}`);
            res.status(200).json({
                success: true,
                message: `Provider KYC status updated to ${status}.`,
                provider: updated,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Admin Analytics dashboard aggregator.
     */
    static async getAnalytics(_req, res, next) {
        try {
            // 1. Total bookings count
            const totalBookings = await Booking_1.BookingModel.countDocuments();
            // 2. Aggregate revenue
            const bookingsCompleted = await Booking_1.BookingModel.find({ status: "COMPLETED" }).select("finalPrice");
            const revenue = bookingsCompleted.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
            // 3. User lists counts
            const customersCount = await User_1.UserModel.countDocuments({ role: "CUSTOMER" });
            const providersCount = await Provider_1.ProviderModel.countDocuments();
            // 4. Booking cancellation rate calculation
            const cancellations = await Booking_1.BookingModel.countDocuments({ status: "CANCELLED" });
            const cancellationRate = totalBookings > 0 ? parseFloat(((cancellations / totalBookings) * 100).toFixed(2)) : 0;
            // 5. Aggregate top services using MongoDB aggregate
            const services = await Booking_1.BookingModel.aggregate([
                { $group: { _id: "$serviceId", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);
            const topServices = [];
            for (const item of services) {
                if (item._id) {
                    const s = await Service_1.ServiceModel.findById(item._id);
                    if (s) {
                        topServices.push({
                            title: s.title,
                            bookingsCount: item.count,
                        });
                    }
                }
            }
            res.status(200).json({
                success: true,
                analytics: {
                    totalBookings,
                    revenue,
                    users: {
                        customers: customersCount,
                        providers: providersCount,
                    },
                    cancellationRate,
                    topServices,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Action trigger to process refunds.
     */
    static async issueRefund(req, res, next) {
        try {
            const { bookingId } = req.body;
            if (!bookingId) {
                return next(new AppError_1.AppError("Booking ID is required.", 400));
            }
            // Pay After Service model: Just mark the booking as refunded/cancelled
            const booking = await Booking_1.BookingModel.findByIdAndUpdate(bookingId, { paymentStatus: "REFUNDED", status: "REFUNDED" }, { new: true });
            if (!booking) {
                return next(new AppError_1.AppError("Booking not found.", 404));
            }
            res.status(200).json({
                success: true,
                message: "Refund processed successfully.",
                booking,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Coupons Management: Create new discount codes.
     */
    static async createCoupon(req, res, next) {
        try {
            const { code, discountType, discountValue, expiryDate } = req.body;
            if (!code || !discountType || !discountValue || !expiryDate) {
                return next(new AppError_1.AppError("Please provide all required coupon fields.", 400));
            }
            const existing = await Coupon_1.CouponModel.findOne({ code });
            if (existing)
                return next(new AppError_1.AppError("Coupon code already exists.", 400));
            const coupon = await Coupon_1.CouponModel.create({
                code,
                discountType: discountType === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
                discountValue: parseFloat(discountValue),
                expiryDate: new Date(expiryDate),
            });
            res.status(201).json({
                success: true,
                message: "Coupon created successfully.",
                coupon: {
                    id: coupon._id.toString(),
                    code: coupon.code,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                    expiryDate: coupon.expiryDate,
                    active: coupon.active,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Categories Management: Create new category folder tags.
     */
    static async createCategory(req, res, next) {
        try {
            const { name, icon } = req.body;
            if (!name)
                return next(new AppError_1.AppError("Category name is required.", 400));
            const slug = name.toLowerCase().replace(/ /g, "-");
            const category = await Category_1.CategoryModel.create({ name, slug, icon });
            res.status(201).json({
                success: true,
                category: {
                    id: category._id.toString(),
                    name: category.name,
                    slug: category.slug,
                    icon: category.icon,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Services Management: Create new service menu packages.
     */
    static async createService(req, res, next) {
        try {
            const { categoryId, title, description, duration, basePrice } = req.body;
            if (!categoryId || !title || !description || !duration || !basePrice) {
                return next(new AppError_1.AppError("Please provide all service specifications.", 400));
            }
            const service = await Service_1.ServiceModel.create({
                categoryId,
                title,
                description,
                duration: parseInt(duration),
                basePrice: parseFloat(basePrice),
            });
            res.status(201).json({
                success: true,
                service: {
                    id: service._id.toString(),
                    categoryId: service.categoryId.toString(),
                    title: service.title,
                    description: service.description,
                    duration: service.duration,
                    basePrice: service.basePrice,
                    active: service.active,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves all service providers with populated User and Category info.
     */
    static async getProviders(_req, res, next) {
        try {
            const providers = await Provider_1.ProviderModel.find()
                .populate("userId", "name email phone role status")
                .populate("categories", "name slug");
            res.status(200).json({
                success: true,
                providers,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves all users (customers and admins).
     */
    static async getUsers(_req, res, next) {
        try {
            const users = await User_1.UserModel.find().select("-passwordHash");
            res.status(200).json({
                success: true,
                users,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Toggles or updates user status (ACTIVE / SUSPENDED).
     */
    static async updateUserStatus(req, res, next) {
        try {
            const { userId } = req.params;
            const { status } = req.body; // "ACTIVE" or "SUSPENDED"
            if (status !== "ACTIVE" && status !== "SUSPENDED") {
                return next(new AppError_1.AppError("Invalid user status choice.", 400));
            }
            const user = await User_1.UserModel.findByIdAndUpdate(userId, { status }, { new: true }).select("-passwordHash");
            if (!user)
                return next(new AppError_1.AppError("User not found.", 404));
            logger_1.logger.info(`User status updated: User ID ${userId} set to ${status}`);
            res.status(200).json({
                success: true,
                message: `User status updated to ${status}.`,
                user,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminController = AdminController;
