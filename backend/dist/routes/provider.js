"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const providerController_1 = require("../controllers/providerController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// All provider routes require authentication
router.use(auth_1.authenticate);
// ── Open to any authenticated user (allows a customer to register as provider) ──
router.post("/register", providerController_1.ProviderController.registerProvider);
router.get("/profile", providerController_1.ProviderController.getProviderProfile);
// ── Restricted to established service providers ──────────────────────────────
router.post("/service-area", (0, auth_1.restrictTo)("PROVIDER"), providerController_1.ProviderController.updateServiceArea);
router.post("/availability", (0, auth_1.restrictTo)("PROVIDER"), providerController_1.ProviderController.updateAvailability);
router.get("/earnings", (0, auth_1.restrictTo)("PROVIDER"), providerController_1.ProviderController.getEarnings);
router.patch("/bookings/:bookingId/respond", (0, auth_1.restrictTo)("PROVIDER"), providerController_1.ProviderController.respondToBooking);
exports.default = router;
