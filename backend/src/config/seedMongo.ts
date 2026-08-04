import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import { UserModel } from "../models/User";
import { AddressModel } from "../models/Address";
import { CategoryModel } from "../models/Category";
import { ServiceModel } from "../models/Service";
import { ProviderModel } from "../models/Provider";
import { CouponModel } from "../models/Coupon";
import { BookingModel } from "../models/Booking";
import { PaymentModel } from "../models/Payment";
import { ReviewModel } from "../models/Review";
import { NotificationModel } from "../models/Notification";
import { logger } from "../utils/logger";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const mongoURI = process.env.DATABASE_URL;

if (!mongoURI) {
  logger.error("DATABASE_URL is not defined in the environment variables.");
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    logger.info("Connecting to MongoDB for seeding...");
    await mongoose.connect(mongoURI);
    logger.info("Connected to MongoDB. Clearing existing collections...");

    // Clear all existing data
    await UserModel.deleteMany({});
    await AddressModel.deleteMany({});
    await CategoryModel.deleteMany({});
    await ServiceModel.deleteMany({});
    await ProviderModel.deleteMany({});
    await CouponModel.deleteMany({});
    await BookingModel.deleteMany({});
    await PaymentModel.deleteMany({});
    await ReviewModel.deleteMany({});
    await NotificationModel.deleteMany({});

    logger.info("Existing collections cleared. Seeding initial data...");

    // 1. Create Users
    const passwordHash = await bcrypt.hash("Password123", 12);

    await UserModel.create({
      name: "System Admin",
      email: "admin@atozworks.in",
      phone: "9360651833",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    });

    const customer = await UserModel.create({
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
      passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE",
    });

    const providerUser = await UserModel.create({
      name: "Robert Electrician",
      email: "robert@example.com",
      phone: "7777777777",
      passwordHash,
      role: "PROVIDER",
      status: "ACTIVE",
    });

    logger.info("Users seeded successfully.");

    // 2. Create Saved Address for Customer (Hosur coordinates: 12.7420 N, 77.8280 E)
    const address = await AddressModel.create({
      userId: customer._id,
      houseNo: "No. 42",
      street: "Green Glen Layout",
      landmark: "Near SIPCOT Phase-1",
      city: "Hosur",
      state: "Tamil Nadu",
      pincode: "635109",
      location: {
        type: "Point",
        coordinates: [77.8280, 12.7420], // longitude, latitude
      },
      isDefault: true,
    });

    logger.info("Address seeded successfully.");

    // 3. Create Categories
    const catAc = await CategoryModel.create({
      name: "AC Repair",
      slug: "ac-repair",
      icon: "Airplay",
    });

    const catCleaning = await CategoryModel.create({
      name: "Home Cleaning",
      slug: "home-cleaning",
      icon: "Trash2",
    });

    const catElectric = await CategoryModel.create({
      name: "Electrical",
      slug: "electrical",
      icon: "Zap",
    });

    const catPlumbing = await CategoryModel.create({
      name: "Plumbing",
      slug: "plumbing",
      icon: "Droplet",
    });

    logger.info("Categories seeded successfully.");

    // 4. Create Services
    await ServiceModel.create({
      categoryId: catAc._id,
      title: "AC General Service",
      description: "Complete filter cleaning, pressure washing, and gas level check.",
      duration: 60,
      basePrice: 299.0,
      active: true,
    });

    await ServiceModel.create({
      categoryId: catCleaning._id,
      title: "Deep Home Cleaning",
      description: "Thorough kitchen, bathroom, and bedroom floor sanitization and cleaning.",
      duration: 180,
      basePrice: 499.0,
      active: true,
    });

    const serviceElectric = await ServiceModel.create({
      categoryId: catElectric._id,
      title: "Switchboard Replacement",
      description: "Replacement or wiring fixing for a standard home switchboard panel.",
      duration: 45,
      basePrice: 149.0,
      active: true,
    });

    const servicePlumbing = await ServiceModel.create({
      categoryId: catPlumbing._id,
      title: "Leaking Pipe Fixing",
      description: "Leak repair and pipe replacement for bathroom washbasins or kitchen sinks.",
      duration: 30,
      basePrice: 199.0,
      active: true,
    });

    logger.info("Services seeded successfully.");

    // 5. Create Provider Profile with embedded schedule & service areas
    const provider = await ProviderModel.create({
      userId: providerUser._id,
      kycStatus: "APPROVED",
      experience: 5,
      rating: 4.8,
      verificationStatus: "VERIFIED",
      totalJobs: 12,
      categories: [catElectric._id, catPlumbing._id],
      serviceAreas: [
        {
          latitude: 12.7420,
          longitude: 77.8280,
          serviceRadiusKm: 25.0,
        },
      ],
      availabilities: [
        { day: 0, startTime: "09:00", endTime: "18:00", available: true },
        { day: 1, startTime: "09:00", endTime: "18:00", available: true },
        { day: 2, startTime: "09:00", endTime: "18:00", available: true },
        { day: 3, startTime: "09:00", endTime: "18:00", available: true },
        { day: 4, startTime: "09:00", endTime: "18:00", available: true },
        { day: 5, startTime: "09:00", endTime: "18:00", available: true },
        { day: 6, startTime: "09:00", endTime: "18:00", available: true },
      ],
    });

    logger.info("Provider profile seeded successfully.");

    // 6. Create Coupons
    await CouponModel.create({
      code: "WELCOME50",
      discountType: "FIXED",
      discountValue: 50.0,
      expiryDate: new Date("2028-12-31"),
      active: true,
    });

    await CouponModel.create({
      code: "SUPER10",
      discountType: "PERCENTAGE",
      discountValue: 10.0,
      expiryDate: new Date("2028-12-31"),
      active: true,
    });

    logger.info("Coupons seeded successfully.");

    // 7. Seed sample bookings (AW-20260604-8742 type booking numbers)
    await BookingModel.create({
      bookingNumber: "AW-20260604-8742",
      customerId: customer._id,
      providerId: provider._id,
      serviceId: serviceElectric._id,
      addressId: address._id,
      bookingDate: "2026-06-05",
      bookingTime: "10:00",
      status: "PROVIDER_ASSIGNED",
      estimatedPrice: 149.0,
      paymentStatus: "PENDING",
    });

    const booking2 = await BookingModel.create({
      bookingNumber: "AW-20260604-3291",
      customerId: customer._id,
      providerId: provider._id,
      serviceId: servicePlumbing._id,
      addressId: address._id,
      bookingDate: "2026-06-04",
      bookingTime: "14:30",
      status: "COMPLETED",
      estimatedPrice: 199.0,
      finalPrice: 199.0,
      paymentStatus: "COMPLETED",
    });

    // Seed payment transaction for completed booking
    await PaymentModel.create({
      bookingId: booking2._id,
      amount: 199.0,
      transactionId: "pay_mocktransaction123",
      paymentGateway: "RAZORPAY",
      status: "COMPLETED",
    });

    // Seed review for completed booking
    await ReviewModel.create({
      bookingId: booking2._id,
      customerId: customer._id,
      providerId: provider._id,
      rating: 5,
      review: "Excellent response and very quick to fix the water pipe leakage. Highly recommended!",
    });

    logger.info("Sample bookings, payments, and reviews seeded successfully.");
    logger.info("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
