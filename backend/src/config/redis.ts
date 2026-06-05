import Redis from "ioredis";
import { logger } from "../utils/logger";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

redis.on("connect", () => {
  logger.info("Connected to Redis successfully.");
});

redis.on("error", (err) => {
  logger.warn(`Redis connection failed: ${err.message}. Retrying...`);
});
