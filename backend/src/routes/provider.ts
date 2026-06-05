import { Router } from "express";
import { ProviderController } from "../controllers/providerController";
import { authenticate, restrictTo } from "../middlewares/auth";

const router = Router();

// Protect and restrict all endpoints in this router to service providers
router.use(authenticate);
router.use(restrictTo("PROVIDER"));

router.post("/service-area", ProviderController.updateServiceArea);
router.post("/availability", ProviderController.updateAvailability);
router.get("/earnings", ProviderController.getEarnings);
router.patch("/bookings/:bookingId/respond", ProviderController.respondToBooking);

export default router;
