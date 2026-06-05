import mongoose from "mongoose";
import { logger } from "../utils/logger";

export const connectDB = async () => {
  try {
    const mongoURI = process.env.DATABASE_URL;
    if (!mongoURI) {
      throw new Error("DATABASE_URL is not defined in the environment variables");
    }

    if (process.env.NODE_ENV === "development") {
      mongoose.set("debug", (collectionName, method, query, doc) => {
        logger.debug(`Mongoose: ${collectionName}.${method}(${JSON.stringify(query)}, ${JSON.stringify(doc)})`);
      });
    }

    await mongoose.connect(mongoURI);
    logger.info("MongoDB database connected successfully via Mongoose.");
  } catch (error) {
    logger.error("Failed to connect to MongoDB database:", error);
    process.exit(1);
  }
};
