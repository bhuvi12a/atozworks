"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressModel = void 0;
const mongoose_1 = require("mongoose");
const AddressSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    houseNo: { type: String, required: true },
    street: { type: String, default: '' },
    landmark: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    location: {
        type: { type: String, enum: ["Point"], default: "Point", required: true },
        coordinates: { type: [Number], required: true, default: [77.8270, 12.7409] }, // [longitude, latitude] — default: Hosur
    },
    isDefault: { type: Boolean, default: false },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
// Enable geospatial queries on coordinates
AddressSchema.index({ location: "2dsphere" });
exports.AddressModel = (0, mongoose_1.model)("Address", AddressSchema);
exports.default = exports.AddressModel;
