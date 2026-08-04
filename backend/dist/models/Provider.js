"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderModel = void 0;
const mongoose_1 = require("mongoose");
const ProviderAvailabilitySchema = new mongoose_1.Schema({
    day: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    available: { type: Boolean, default: true },
}, { _id: false });
const ProviderServiceAreaSchema = new mongoose_1.Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    serviceRadiusKm: { type: Number, required: true },
}, { _id: false });
const ProviderSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    kycStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    experience: { type: Number, default: 0 },
    rating: { type: Number, default: 0.0 },
    verificationStatus: { type: String, enum: ["VERIFIED", "UNVERIFIED"], default: "UNVERIFIED" },
    totalJobs: { type: Number, default: 0 },
    categories: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Category", index: true }],
    serviceAreas: [ProviderServiceAreaSchema],
    availabilities: [ProviderAvailabilitySchema],
    selfie: { type: String, default: "" },
    idCard: { type: String, default: "" },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
exports.ProviderModel = (0, mongoose_1.model)("Provider", ProviderSchema);
exports.default = exports.ProviderModel;
