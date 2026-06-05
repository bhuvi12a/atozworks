import { Router } from "express";
import { ReviewController } from "../controllers/reviewController";
import { authenticate, restrictTo } from "../middlewares/auth";

const router = Router();

// Only registered customers can rate/review completed tasks
router.post("/", authenticate, restrictTo("CUSTOMER"), ReviewController.submitReview);

export default router;
