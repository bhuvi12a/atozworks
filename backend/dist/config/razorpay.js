"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpay = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const logger_1 = require("../utils/logger");
const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_mockkeyid";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "mockkeysecret";
exports.razorpay = new razorpay_1.default({
    key_id,
    key_secret,
});
logger_1.logger.info(`Razorpay client loaded (Key ID: ${key_id})`);
