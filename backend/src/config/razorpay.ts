import Razorpay from "razorpay";
import { logger } from "../utils/logger";

const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_mockkeyid";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "mockkeysecret";

export const razorpay = new Razorpay({
  key_id,
  key_secret,
});

logger.info(`Razorpay client loaded (Key ID: ${key_id})`);
