"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const user_1 = __importDefault(require("./user"));
const provider_1 = __importDefault(require("./provider"));
const booking_1 = __importDefault(require("./booking"));
const payment_1 = __importDefault(require("./payment"));
const review_1 = __importDefault(require("./review"));
const admin_1 = __importDefault(require("./admin"));
const router = (0, express_1.Router)();
// API Namespace mounts
router.use("/auth", auth_1.default);
router.use("/users", user_1.default);
router.use("/providers", provider_1.default);
router.use("/bookings", booking_1.default);
router.use("/payments", payment_1.default);
router.use("/reviews", review_1.default);
router.use("/admin", admin_1.default);
// Health check endpoint
router.get("/health", (_req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "AtoZ Works API Gateway",
    });
});
exports.default = router;
