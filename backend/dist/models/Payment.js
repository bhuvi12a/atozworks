"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModel = void 0;
const mongoose_1 = require("mongoose");
const PaymentSchema = new mongoose_1.Schema({
    bookingId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    amount: { type: Number, required: true },
    transactionId: { type: String },
    paymentGateway: { type: String, default: "RAZORPAY" },
    status: {
        type: String,
        enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
        default: "PENDING",
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
exports.PaymentModel = (0, mongoose_1.model)("Payment", PaymentSchema);
exports.default = exports.PaymentModel;
