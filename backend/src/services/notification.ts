import { firebaseApp } from "../config/firebase";
import { NotificationModel } from "../models/Notification";
import { logger } from "../utils/logger";

export class NotificationService {
  /**
   * Sends a push notification to a user using Firebase FCM (or logs it to console as fallback).
   * Persists the notification record to the database.
   */
  public static async sendPush(
    userId: string,
    title: string,
    message: string,
    type: string,
    fcmToken?: string
  ): Promise<void> {
    try {
      // 1. Persist notification in database
      await NotificationModel.create({
        userId,
        title,
        message,
        type,
        readStatus: false,
      });

      logger.info(`Notification stored in DB for User ID ${userId}: [${title}] ${message}`);

      // 2. Dispatch Push via Firebase Admin if configured and token is present
      if (firebaseApp && fcmToken) {
        const payload = {
          notification: {
            title,
            body: message,
          },
          data: {
            type,
            click_action: "FLUTTER_NOTIFICATION_CLICK", // for mobile deep linking
          },
          token: fcmToken,
        };

        const response = await firebaseApp.messaging().send(payload);
        logger.info(`Successfully sent FCM push notification response: ${response}`);
      } else {
        logger.debug(`FCM not initialized or client device FCM token missing. Logging mock push: [${title}] -> ${message}`);
      }
    } catch (error) {
      logger.error(`Error processing push notification for User ID ${userId}:`, error);
    }
  }

  /**
   * Stub for sending transactional emails (e.g., invoices, confirmations).
   */
  public static async sendEmail(
    to: string,
    subject: string,
    htmlContent: string
  ): Promise<void> {
    logger.info(`[Email Dispatcher] Target: ${to} | Subject: ${subject}`);
    logger.debug(`[Email Content Preview]: ${htmlContent.substring(0, 150)}...`);
  }

  /**
   * Stub for sending SMS notifications (e.g. OTP validation).
   */
  public static async sendSMS(to: string, message: string): Promise<void> {
    logger.info(`[SMS Gateway] Target: ${to} | Message: ${message}`);
  }
}
