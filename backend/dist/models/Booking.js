"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingModel = void 0;
const mongoose_1 = require("mongoose");
const BookingSchema = new mongoose_1.Schema({
    bookingNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    providerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Provider", index: true },
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Service", required: true },
    addressId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Address", required: true },
    bookingDate: { type: String, required: true },
    bookingTime: { type: String, required: true },
    status: {
        type: String,
        enum: [
            "PENDING",
            "SEARCHING_PROVIDER",
            "PROVIDER_ASSIGNED",
            "ACCEPTED",
            "ON_THE_WAY",
            "ARRIVED",
            "IN_PROGRESS",
            "COMPLETED",
            "CANCELLED",
            "REFUNDED",
        ],
        default: "PENDING",
        index: true,
    },
    estimatedPrice: { type: Number, required: true },
    finalPrice: { type: Number },
    paymentStatus: {
        type: String,
        enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
        default: "PENDING",
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
exports.BookingModel = (0, mongoose_1.model)("Booking", BookingSchema);
exports.default = exports.BookingModel;
