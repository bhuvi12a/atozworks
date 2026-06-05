import { Router } from "express";
import { AdminController } from "../controllers/adminController";
import { authenticate, restrictTo } from "../middlewares/auth";

const router = Router();

// Restrict this entire route directory to Administrators
router.use(authenticate);
router.use(restrictTo("ADMIN"));

router.patch("/kyc/:providerId", AdminController.verifyKyc);
router.get("/analytics", AdminController.getAnalytics);
router.post("/refunds", AdminController.issueRefund);
router.post("/coupons", AdminController.createCoupon);
router.post("/categories", AdminController.createCategory);
router.post("/services", AdminController.createService);
router.get("/providers", AdminController.getProviders);
router.get("/users", AdminController.getUsers);
router.patch("/users/:userId/status", AdminController.updateUserStatus);

export default router;
