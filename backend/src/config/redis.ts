import Redis from "ioredis";
import { logger } from "../utils/logger";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

// In-memory fallback store for when Redis is unavailable (dev/no-redis environments)
const memoryStore = new Map<string, { value: string; expiresAt: number | null }>();

let redisReady = false;

export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 3) return null; // Stop retrying after 3 attempts
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});

redis.on("ready", () => {
  redisReady = true;
  logger.info("Connected to Redis successfully.");
});

redis.on("error", (err) => {
  if (redisReady) {
    logger.warn(`Redis error: ${err.message}. Falling back to in-memory store.`);
  }
  redisReady = false;
});

// ─── Graceful Safe Helpers ─────────────────────────────────────────────────────
// These helpers use Redis when available, otherwise fall back to an in-memory
// Map so the application continues to work without Redis installed.

/** Safe SET with optional expiry in seconds. */
export async function safeRedisSet(
  key: string,
  value: string,
  expirySeconds?: number
): Promise<void> {
  // Clean expired memory entries periodically
  const now = Date.now();
  for (const [k, v] of memoryStore.entries()) {
    if (v.expiresAt !== null && v.expiresAt < now) {
      memoryStore.delete(k);
    }
  }

  if (redisReady) {
    try {
      if (expirySeconds) {
        await redis.set(key, value, "EX", expirySeconds);
      } else {
        await redis.set(key, value);
      }
      return;
    } catch (err) {
      logger.warn(`Redis SET failed for key "${key}", using memory fallback.`);
    }
  }

  memoryStore.set(key, {
    value,
    expiresAt: expirySeconds ? now + expirySeconds * 1000 : null,
  });
}

/** Safe GET. Returns null if key is missing or expired. */
export async function safeRedisGet(key: string): Promise<string | null> {
  if (redisReady) {
    try {
      return await redis.get(key);
    } catch (err) {
      logger.warn(`Redis GET failed for key "${key}", using memory fallback.`);
    }
  }

  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

/** Safe DEL. */
export async function safeRedisDel(key: string): Promise<void> {
  if (redisReady) {
    try {
      await redis.del(key);
      return;
    } catch (err) {
      logger.warn(`Redis DEL failed for key "${key}", using memory fallback.`);
    }
  }
  memoryStore.delete(key);
}

// Attempt to connect (non-blocking)
redis.connect().catch(() => {
  logger.warn("Redis unavailable on startup. Using in-memory fallback for session storage.");
});
