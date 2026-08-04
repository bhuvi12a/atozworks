"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceModel = void 0;
const mongoose_1 = require("mongoose");
const ServiceSchema = new mongoose_1.Schema({
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    basePrice: { type: Number, required: true },
    active: { type: Boolean, default: true },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
exports.ServiceModel = (0, mongoose_1.model)("Service", ServiceSchema);
exports.default = exports.ServiceModel;
