"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const connectDB = async () => {
    try {
        const mongoURI = process.env.DATABASE_URL;
        if (!mongoURI) {
            throw new Error("DATABASE_URL is not defined in the environment variables");
        }
        if (process.env.NODE_ENV === "development") {
            mongoose_1.default.set("debug", (collectionName, method, query, doc) => {
                logger_1.logger.debug(`Mongoose: ${collectionName}.${method}(${JSON.stringify(query)}, ${JSON.stringify(doc)})`);
            });
        }
        await mongoose_1.default.connect(mongoURI);
        logger_1.logger.info("MongoDB database connected successfully via Mongoose.");
    }
    catch (error) {
        logger_1.logger.error("Failed to connect to MongoDB database:", error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
