import { Router } from "express";
import { BookingController } from "../controllers/bookingController";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Require authorization for all booking interactions
router.use(authenticate);

router.post("/", BookingController.createBooking);
router.get("/", BookingController.getBookings);
router.get("/:bookingId", BookingController.getBookingDetails);
router.patch("/:bookingId/status", BookingController.updateBookingStatus);

export default router;
