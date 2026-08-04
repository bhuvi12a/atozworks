import { Router } from "express";
import { AdminController } from "../controllers/adminController";
import { adminAuth } from "../middlewares/adminAuth";

const router = Router();

// All admin routes are protected by password-based auth
// (Frontend sends X-Admin-Password header; no JWT required)
router.use(adminAuth);

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
