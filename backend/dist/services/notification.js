"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const Notification_1 = require("../models/Notification");
const logger_1 = require("../utils/logger");
class NotificationService {
    /**
     * Sends a push notification to a user (persists the record and logs it).
     */
    static async sendPush(userId, title, message, type) {
        try {
            // 1. Persist notification in database
            await Notification_1.NotificationModel.create({
                userId,
                title,
                message,
                type,
                readStatus: false,
            });
            logger_1.logger.info(`Notification stored in DB for User ID ${userId}: [${title}] ${message}`);
            logger_1.logger.debug(`FCM / Push integration disabled. Logging mock push: [${title}] -> ${message}`);
        }
        catch (error) {
            logger_1.logger.error(`Error processing push notification for User ID ${userId}:`, error);
        }
    }
    /**
     * Stub for sending transactional emails (e.g., invoices, confirmations).
     */
    static async sendEmail(to, subject, htmlContent) {
        logger_1.logger.info(`[Email Dispatcher] Target: ${to} | Subject: ${subject}`);
        logger_1.logger.debug(`[Email Content Preview]: ${htmlContent.substring(0, 150)}...`);
    }
    /**
     * Stub for sending SMS notifications (e.g. OTP validation).
     */
    static async sendSMS(to, message) {
        logger_1.logger.info(`[SMS Gateway] Target: ${to} | Message: ${message}`);
    }
}
exports.NotificationService = NotificationService;
