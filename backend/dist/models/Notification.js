"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    readStatus: { type: Boolean, default: false },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
exports.NotificationModel = (0, mongoose_1.model)("Notification", NotificationSchema);
exports.default = exports.NotificationModel;
