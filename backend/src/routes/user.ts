import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Apply auth middleware to protect all user endpoints
router.use(authenticate);

// Profile routes
router.get("/profile", UserController.getProfile);
router.patch("/profile", UserController.updateProfile);

// Addresses routes
router.post("/addresses", UserController.addAddress);
router.get("/addresses", UserController.getAddresses);
router.delete("/addresses/:addressId", UserController.deleteAddress);

// Notifications routes
router.get("/notifications", UserController.getNotifications);
router.patch("/notifications/:notificationId/read", UserController.markNotificationRead);

export default router;
