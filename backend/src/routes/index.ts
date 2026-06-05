import { Router } from "express";
import authRoutes from "./auth";
import userRoutes from "./user";
import providerRoutes from "./provider";
import bookingRoutes from "./booking";
import paymentRoutes from "./payment";
import reviewRoutes from "./review";
import adminRoutes from "./admin";

const router = Router();

// API Namespace mounts
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/providers", providerRoutes);
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin", adminRoutes);

// Health check endpoint
router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "AtoZ Works API Gateway",
  });
});

export default router;
