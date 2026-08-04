import { Router, Response, NextFunction } from "express";
import { BookingController } from "../controllers/bookingController";
import { authenticate, AuthenticatedRequest } from "../middlewares/auth";
import { adminAuth } from "../middlewares/adminAuth";
import { UserModel } from "../models/User";

const router = Router();

/**
 * Flexible auth: accepts either:
 *   1. A valid JWT Bearer token (mobile / customer / provider)
 *   2. X-Admin-Password header (admin panel — gets all bookings, can update status)
 */
const flexibleAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const hasAdminHeader = !!(req.headers["x-admin-password"] || req.query.admin_key);

  if (hasAdminHeader) {
    // Validate admin password, then inject a synthetic admin user context
    return adminAuth(req, res, async () => {
      // Find or synthesise an ADMIN user for the request context
      try {
        const adminUser = await UserModel.findOne({ role: "ADMIN" });
        if (adminUser) {
          req.user = {
            id: adminUser._id.toString(),
            email: adminUser.email,
            role: "ADMIN",
          };
        } else {
          // If no admin user exists, synthesise a context so the controller's
          // ADMIN role branch is taken (full booking visibility)
          req.user = { id: "admin", email: "admin@atozworks.in", role: "ADMIN" };
        }
      } catch {
        req.user = { id: "admin", email: "admin@atozworks.in", role: "ADMIN" };
      }
      next();
    });
  }

  // Fall back to standard JWT authentication
  return authenticate(req, res, next);
};

router.get("/", flexibleAuth, BookingController.getBookings);
router.get("/:bookingId", flexibleAuth, BookingController.getBookingDetails);
router.patch("/:bookingId/status", flexibleAuth, BookingController.updateBookingStatus);
router.post("/", authenticate, BookingController.createBooking);

export default router;
