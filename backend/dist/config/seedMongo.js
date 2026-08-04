"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const User_1 = require("../models/User");
const Address_1 = require("../models/Address");
const Category_1 = require("../models/Category");
const Service_1 = require("../models/Service");
const Provider_1 = require("../models/Provider");
const Coupon_1 = require("../models/Coupon");
const Booking_1 = require("../models/Booking");
const Payment_1 = require("../models/Payment");
const Review_1 = require("../models/Review");
const Notification_1 = require("../models/Notification");
const logger_1 = require("../utils/logger");
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, "../../.env") });
const mongoURI = process.env.DATABASE_URL;
if (!mongoURI) {
    logger_1.logger.error("DATABASE_URL is not defined in the environment variables.");
    process.exit(1);
}
const seedDatabase = async () => {
    try {
        logger_1.logger.info("Connecting to MongoDB for seeding...");
        await mongoose_1.default.connect(mongoURI);
        logger_1.logger.info("Connected to MongoDB. Clearing existing collections...");
        // Clear all existing data
        await User_1.UserModel.deleteMany({});
        await Address_1.AddressModel.deleteMany({});
        await Category_1.CategoryModel.deleteMany({});
        await Service_1.ServiceModel.deleteMany({});
        await Provider_1.ProviderModel.deleteMany({});
        await Coupon_1.CouponModel.deleteMany({});
        await Booking_1.BookingModel.deleteMany({});
        await Payment_1.PaymentModel.deleteMany({});
        await Review_1.ReviewModel.deleteMany({});
        await Notification_1.NotificationModel.deleteMany({});
        logger_1.logger.info("Existing collections cleared. Seeding initial data...");
        // 1. Create Users
        const passwordHash = await bcrypt_1.default.hash("Password123", 12);
        await User_1.UserModel.create({
            name: "System Admin",
            email: "admin@atozworks.in",
            phone: "9360651833",
            passwordHash,
            role: "ADMIN",
            status: "ACTIVE",
        });
        const customer = await User_1.UserModel.create({
            name: "John Doe",
            email: "john@example.com",
            phone: "9876543210",
            passwordHash,
            role: "CUSTOMER",
            status: "ACTIVE",
        });
        const providerUser = await User_1.UserModel.create({
            name: "Robert Electrician",
            email: "robert@example.com",
            phone: "7777777777",
            passwordHash,
            role: "PROVIDER",
            status: "ACTIVE",
        });
        logger_1.logger.info("Users seeded successfully.");
        // 2. Create Saved Address for Customer (Hosur coordinates: 12.7420 N, 77.8280 E)
        const address = await Address_1.AddressModel.create({
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
        logger_1.logger.info("Address seeded successfully.");
        // 3. Create Categories
        const catAc = await Category_1.CategoryModel.create({
            name: "AC Repair",
            slug: "ac-repair",
            icon: "Airplay",
        });
        const catCleaning = await Category_1.CategoryModel.create({
            name: "Home Cleaning",
            slug: "home-cleaning",
            icon: "Trash2",
        });
        const catElectric = await Category_1.CategoryModel.create({
            name: "Electrical",
            slug: "electrical",
            icon: "Zap",
        });
        const catPlumbing = await Category_1.CategoryModel.create({
            name: "Plumbing",
            slug: "plumbing",
            icon: "Droplet",
        });
        logger_1.logger.info("Categories seeded successfully.");
        // 4. Create Services
        await Service_1.ServiceModel.create({
            categoryId: catAc._id,
            title: "AC General Service",
            description: "Complete filter cleaning, pressure washing, and gas level check.",
            duration: 60,
            basePrice: 299.0,
            active: true,
        });
        await Service_1.ServiceModel.create({
            categoryId: catCleaning._id,
            title: "Deep Home Cleaning",
            description: "Thorough kitchen, bathroom, and bedroom floor sanitization and cleaning.",
            duration: 180,
            basePrice: 499.0,
            active: true,
        });
        const serviceElectric = await Service_1.ServiceModel.create({
            categoryId: catElectric._id,
            title: "Switchboard Replacement",
            description: "Replacement or wiring fixing for a standard home switchboard panel.",
            duration: 45,
            basePrice: 149.0,
            active: true,
        });
        const servicePlumbing = await Service_1.ServiceModel.create({
            categoryId: catPlumbing._id,
            title: "Leaking Pipe Fixing",
            description: "Leak repair and pipe replacement for bathroom washbasins or kitchen sinks.",
            duration: 30,
            basePrice: 199.0,
            active: true,
        });
        logger_1.logger.info("Services seeded successfully.");
        // 5. Create Provider Profile with embedded schedule & service areas
        const provider = await Provider_1.ProviderModel.create({
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
        logger_1.logger.info("Provider profile seeded successfully.");
        // 6. Create Coupons
        await Coupon_1.CouponModel.create({
            code: "WELCOME50",
            discountType: "FIXED",
            discountValue: 50.0,
            expiryDate: new Date("2028-12-31"),
            active: true,
        });
        await Coupon_1.CouponModel.create({
            code: "SUPER10",
            discountType: "PERCENTAGE",
            discountValue: 10.0,
            expiryDate: new Date("2028-12-31"),
            active: true,
        });
        logger_1.logger.info("Coupons seeded successfully.");
        // 7. Seed sample bookings (AW-20260604-8742 type booking numbers)
        await Booking_1.BookingModel.create({
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
        const booking2 = await Booking_1.BookingModel.create({
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
        await Payment_1.PaymentModel.create({
            bookingId: booking2._id,
            amount: 199.0,
            transactionId: "pay_mocktransaction123",
            paymentGateway: "RAZORPAY",
            status: "COMPLETED",
        });
        // Seed review for completed booking
        await Review_1.ReviewModel.create({
            bookingId: booking2._id,
            customerId: customer._id,
            providerId: provider._id,
            rating: 5,
            review: "Excellent response and very quick to fix the water pipe leakage. Highly recommended!",
        });
        logger_1.logger.info("Sample bookings, payments, and reviews seeded successfully.");
        logger_1.logger.info("Database seeding completed successfully!");
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error("Seeding failed:", error);
        process.exit(1);
    }
};
seedDatabase();
