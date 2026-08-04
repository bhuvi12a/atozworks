"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const adminAuth_1 = require("../middlewares/adminAuth");
const router = (0, express_1.Router)();
// All admin routes are protected by password-based auth
// (Frontend sends X-Admin-Password header; no JWT required)
router.use(adminAuth_1.adminAuth);
router.patch("/kyc/:providerId", adminController_1.AdminController.verifyKyc);
router.get("/analytics", adminController_1.AdminController.getAnalytics);
router.post("/refunds", adminController_1.AdminController.issueRefund);
router.post("/coupons", adminController_1.AdminController.createCoupon);
router.post("/categories", adminController_1.AdminController.createCategory);
router.post("/services", adminController_1.AdminController.createService);
router.get("/providers", adminController_1.AdminController.getProviders);
router.get("/users", adminController_1.AdminController.getUsers);
router.patch("/users/:userId/status", adminController_1.AdminController.updateUserStatus);
exports.default = router;
