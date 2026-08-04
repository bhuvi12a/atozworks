"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reviewController_1 = require("../controllers/reviewController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Only registered customers can rate/review completed tasks
router.post("/", auth_1.authenticate, (0, auth_1.restrictTo)("CUSTOMER"), reviewController_1.ReviewController.submitReview);
exports.default = router;
