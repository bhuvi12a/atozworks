"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = void 0;
const mongoose_1 = require("mongoose");
const ReviewSchema = new mongoose_1.Schema({
    bookingId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    providerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Provider", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
exports.ReviewModel = (0, mongoose_1.model)("Review", ReviewSchema);
exports.default = exports.ReviewModel;
