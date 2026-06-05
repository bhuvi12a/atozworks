import * as admin from "firebase-admin";
import { logger } from "../utils/logger";

let firebaseApp: admin.app.App | null = null;

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountPath) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
    });
    logger.info("Firebase Admin initialized successfully.");
  } else if (process.env.FIREBASE_PROJECT_ID) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    logger.info("Firebase Admin initialized using Application Default Credentials.");
  } else {
    logger.warn("Firebase Admin configurations not provided. FCM pushes will log to console.");
  }
} catch (error) {
  logger.error("Error initializing Firebase Admin SDK:", error);
}

export { firebaseApp };
