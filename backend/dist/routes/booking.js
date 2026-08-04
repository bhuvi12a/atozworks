"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookingController_1 = require("../controllers/bookingController");
const auth_1 = require("../middlewares/auth");
const adminAuth_1 = require("../middlewares/adminAuth");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
/**
 * Flexible auth: accepts either:
 *   1. A valid JWT Bearer token (mobile / customer / provider)
 *   2. X-Admin-Password header (admin panel — gets all bookings, can update status)
 */
const flexibleAuth = async (req, res, next) => {
    const hasAdminHeader = !!(req.headers["x-admin-password"] || req.query.admin_key);
    if (hasAdminHeader) {
        // Validate admin password, then inject a synthetic admin user context
        return (0, adminAuth_1.adminAuth)(req, res, async () => {
            // Find or synthesise an ADMIN user for the request context
            try {
                const adminUser = await User_1.UserModel.findOne({ role: "ADMIN" });
                if (adminUser) {
                    req.user = {
                        id: adminUser._id.toString(),
                        email: adminUser.email,
                        role: "ADMIN",
                    };
                }
                else {
                    // If no admin user exists, synthesise a context so the controller's
                    // ADMIN role branch is taken (full booking visibility)
                    req.user = { id: "admin", email: "admin@atozworks.in", role: "ADMIN" };
                }
            }
            catch {
                req.user = { id: "admin", email: "admin@atozworks.in", role: "ADMIN" };
            }
            next();
        });
    }
    // Fall back to standard JWT authentication
    return (0, auth_1.authenticate)(req, res, next);
};
router.get("/", flexibleAuth, bookingController_1.BookingController.getBookings);
router.get("/:bookingId", flexibleAuth, bookingController_1.BookingController.getBookingDetails);
router.patch("/:bookingId/status", flexibleAuth, bookingController_1.BookingController.updateBookingStatus);
router.post("/", auth_1.authenticate, bookingController_1.BookingController.createBooking);
exports.default = router;
