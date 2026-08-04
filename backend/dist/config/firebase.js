"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseApp = void 0;
const admin = __importStar(require("firebase-admin"));
const logger_1 = require("../utils/logger");
let firebaseApp = null;
exports.firebaseApp = firebaseApp;
try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountPath) {
        exports.firebaseApp = firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(require(serviceAccountPath)),
        });
        logger_1.logger.info("Firebase Admin initialized successfully.");
    }
    else if (process.env.FIREBASE_PROJECT_ID) {
        exports.firebaseApp = firebaseApp = admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
        logger_1.logger.info("Firebase Admin initialized using Application Default Credentials.");
    }
    else {
        logger_1.logger.warn("Firebase Admin configurations not provided. FCM pushes will log to console.");
    }
}
catch (error) {
    logger_1.logger.error("Error initializing Firebase Admin SDK:", error);
}
