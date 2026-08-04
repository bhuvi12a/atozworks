"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.safeRedisSet = safeRedisSet;
exports.safeRedisGet = safeRedisGet;
exports.safeRedisDel = safeRedisDel;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
// In-memory fallback store for when Redis is unavailable (dev/no-redis environments)
const memoryStore = new Map();
let redisReady = false;
exports.redis = new ioredis_1.default({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
        if (times > 3)
            return null; // Stop retrying after 3 attempts
        return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
});
exports.redis.on("ready", () => {
    redisReady = true;
    logger_1.logger.info("Connected to Redis successfully.");
});
exports.redis.on("error", (err) => {
    if (redisReady) {
        logger_1.logger.warn(`Redis error: ${err.message}. Falling back to in-memory store.`);
    }
    redisReady = false;
});
// ─── Graceful Safe Helpers ─────────────────────────────────────────────────────
// These helpers use Redis when available, otherwise fall back to an in-memory
// Map so the application continues to work without Redis installed.
/** Safe SET with optional expiry in seconds. */
async function safeRedisSet(key, value, expirySeconds) {
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
                await exports.redis.set(key, value, "EX", expirySeconds);
            }
            else {
                await exports.redis.set(key, value);
            }
            return;
        }
        catch (err) {
            logger_1.logger.warn(`Redis SET failed for key "${key}", using memory fallback.`);
        }
    }
    memoryStore.set(key, {
        value,
        expiresAt: expirySeconds ? now + expirySeconds * 1000 : null,
    });
}
/** Safe GET. Returns null if key is missing or expired. */
async function safeRedisGet(key) {
    if (redisReady) {
        try {
            return await exports.redis.get(key);
        }
        catch (err) {
            logger_1.logger.warn(`Redis GET failed for key "${key}", using memory fallback.`);
        }
    }
    const entry = memoryStore.get(key);
    if (!entry)
        return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
        memoryStore.delete(key);
        return null;
    }
    return entry.value;
}
/** Safe DEL. */
async function safeRedisDel(key) {
    if (redisReady) {
        try {
            await exports.redis.del(key);
            return;
        }
        catch (err) {
            logger_1.logger.warn(`Redis DEL failed for key "${key}", using memory fallback.`);
        }
    }
    memoryStore.delete(key);
}
// Attempt to connect (non-blocking)
exports.redis.connect().catch(() => {
    logger_1.logger.warn("Redis unavailable on startup. Using in-memory fallback for session storage.");
});
