"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Apply auth middleware to protect all user endpoints
router.use(auth_1.authenticate);
// Profile routes
router.get("/profile", userController_1.UserController.getProfile);
router.patch("/profile", userController_1.UserController.updateProfile);
// Addresses routes
router.post("/addresses", userController_1.UserController.addAddress);
router.get("/addresses", userController_1.UserController.getAddresses);
router.delete("/addresses/:addressId", userController_1.UserController.deleteAddress);
// Notifications routes
router.get("/notifications", userController_1.UserController.getNotifications);
router.patch("/notifications/:notificationId/read", userController_1.UserController.markNotificationRead);
exports.default = router;
