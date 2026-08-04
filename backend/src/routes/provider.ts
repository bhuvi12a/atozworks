import { Router } from "express";
import { ProviderController } from "../controllers/providerController";
import { authenticate, restrictTo } from "../middlewares/auth";

const router = Router();

// All provider routes require authentication
router.use(authenticate);

// ── Open to any authenticated user (allows a customer to register as provider) ──
router.post("/register", ProviderController.registerProvider);
router.get("/profile", ProviderController.getProviderProfile);

// ── Restricted to established service providers ──────────────────────────────
router.post("/service-area", restrictTo("PROVIDER"), ProviderController.updateServiceArea);
router.post("/availability", restrictTo("PROVIDER"), ProviderController.updateAvailability);
router.get("/earnings", restrictTo("PROVIDER"), ProviderController.getEarnings);
router.patch("/bookings/:bookingId/respond", restrictTo("PROVIDER"), ProviderController.respondToBooking);

export default router;
