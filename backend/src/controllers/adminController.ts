import { Request, Response, NextFunction } from "express";
import { ProviderModel } from "../models/Provider";
import { BookingModel } from "../models/Booking";
import { UserModel } from "../models/User";
import { ServiceModel } from "../models/Service";
import { CouponModel } from "../models/Coupon";
import { CategoryModel } from "../models/Category";
import { PaymentService } from "../services/paymentService";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export class AdminController {
  /**
   * Approves or rejects provider KYC verification.
   */
  public static async verifyKyc(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { providerId } = req.params;
      const { status } = req.body; // "APPROVED" or "REJECTED"

      if (status !== "APPROVED" && status !== "REJECTED") {
        return next(new AppError("Invalid KYC status choice.", 400));
      }

      const provider = await ProviderModel.findById(providerId);

      if (!provider) return next(new AppError("Provider record not found.", 404));

      const updated = await ProviderModel.findByIdAndUpdate(
        providerId,
        {
          kycStatus: status,
          verificationStatus: status === "APPROVED" ? "VERIFIED" : "UNVERIFIED",
        },
        { new: true }
      );

      logger.info(`Provider KYC status updated: Provider ID ${providerId} set to ${status}`);

      res.status(200).json({
        success: true,
        message: `Provider KYC status updated to ${status}.`,
        provider: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Analytics dashboard aggregator.
   */
  public static async getAnalytics(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. Total bookings count
      const totalBookings = await BookingModel.countDocuments();

      // 2. Aggregate revenue
      const bookingsCompleted = await BookingModel.find({ status: "COMPLETED" }).select("finalPrice");
      const revenue = bookingsCompleted.reduce((sum, b) => sum + (b.finalPrice || 0), 0);

      // 3. User lists counts
      const customersCount = await UserModel.countDocuments({ role: "CUSTOMER" });
      const providersCount = await ProviderModel.countDocuments();

      // 4. Booking cancellation rate calculation
      const cancellations = await BookingModel.countDocuments({ status: "CANCELLED" });
      const cancellationRate = totalBookings > 0 ? parseFloat(((cancellations / totalBookings) * 100).toFixed(2)) : 0;

      // 5. Aggregate top services using MongoDB aggregate
      const services = await BookingModel.aggregate([
        { $group: { _id: "$serviceId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      const topServices = [];
      for (const item of services) {
        if (item._id) {
          const s = await ServiceModel.findById(item._id);
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Action trigger to process refunds.
   */
  public static async issueRefund(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        return next(new AppError("Booking ID is required.", 400));
      }

      const refundResult = await PaymentService.processRefund(bookingId);

      res.status(200).json({
        success: true,
        message: "Refund issued successfully.",
        refund: refundResult,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Coupons Management: Create new discount codes.
   */
  public static async createCoupon(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { code, discountType, discountValue, expiryDate } = req.body;

      if (!code || !discountType || !discountValue || !expiryDate) {
        return next(new AppError("Please provide all required coupon fields.", 400));
      }

      const existing = await CouponModel.findOne({ code });
      if (existing) return next(new AppError("Coupon code already exists.", 400));

      const coupon = await CouponModel.create({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Categories Management: Create new category folder tags.
   */
  public static async createCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, icon } = req.body;

      if (!name) return next(new AppError("Category name is required.", 400));

      const slug = name.toLowerCase().replace(/ /g, "-");
      const category = await CategoryModel.create({ name, slug, icon });

      res.status(201).json({
        success: true,
        category: {
          id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          icon: category.icon,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Services Management: Create new service menu packages.
   */
  public static async createService(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { categoryId, title, description, duration, basePrice } = req.body;

      if (!categoryId || !title || !description || !duration || !basePrice) {
        return next(new AppError("Please provide all service specifications.", 400));
      }

      const service = await ServiceModel.create({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all service providers with populated User and Category info.
   */
  public static async getProviders(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const providers = await ProviderModel.find()
        .populate("userId", "name email phone role status")
        .populate("categories", "name slug");

      res.status(200).json({
        success: true,
        providers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all users (customers and admins).
   */
  public static async getUsers(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await UserModel.find().select("-passwordHash");
      res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggles or updates user status (ACTIVE / SUSPENDED).
   */
  public static async updateUserStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const { status } = req.body; // "ACTIVE" or "SUSPENDED"

      if (status !== "ACTIVE" && status !== "SUSPENDED") {
        return next(new AppError("Invalid user status choice.", 400));
      }

      const user = await UserModel.findByIdAndUpdate(
        userId,
        { status },
        { new: true }
      ).select("-passwordHash");

      if (!user) return next(new AppError("User not found.", 404));

      logger.info(`User status updated: User ID ${userId} set to ${status}`);

      res.status(200).json({
        success: true,
        message: `User status updated to ${status}.`,
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}
