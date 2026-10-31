import Redis from "ioredis";

let redisClient = null;
let isRedisAvailable = false;

// Fallback in-memory cache store with TTL eviction
const memoryCache = new Map();

// Initialize Redis if REDIS_URL is provided in environment
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn("[CacheService] Redis reconnect limit reached. Using memory cache fallback.");
          return null; // Stop retrying to prevent blocking
        }
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
    });

    redisClient
      .connect()
      .then(() => {
        isRedisAvailable = true;
        console.log("[CacheService] Connected to Redis cache successfully.".cyan);
      })
      .catch((err) => {
        isRedisAvailable = false;
        console.warn(`[CacheService] Redis unavailable (${err.message}). Using in-memory fallback cache.`.yellow);
      });

    redisClient.on("error", (err) => {
      isRedisAvailable = false;
    });

    redisClient.on("ready", () => {
      isRedisAvailable = true;
    });
  } catch (err) {
    console.warn(`[CacheService] Redis init failed (${err.message}). Using in-memory fallback.`.yellow);
    isRedisAvailable = false;
  }
} else {
  // Documented graceful fallback when REDIS_URL is not configured
  // console.log("[CacheService] REDIS_URL not set. Running with built-in in-memory cache.");
}

/**
 * Retrieve cached JSON value
 */
export const cacheGet = async (key) => {
  try {
    if (isRedisAvailable && redisClient) {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    }

    // Memory cache fallback
    const item = memoryCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  } catch (error) {
    console.warn(`[CacheService: Get Error for ${key}]`, error.message);
    return null; // Graceful degrade to database
  }
};

/**
 * Store JSON value with Time-To-Live (seconds)
 */
export const cacheSet = async (key, value, ttlSeconds = 600) => {
  try {
    const serialized = JSON.stringify(value);

    if (isRedisAvailable && redisClient) {
      await redisClient.set(key, serialized, "EX", ttlSeconds);
      return true;
    }

    // Memory cache fallback
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // Simple memory cleanup if map exceeds 500 keys
    if (memoryCache.size > 500) {
      const now = Date.now();
      for (const [k, v] of memoryCache.entries()) {
        if (now > v.expiresAt) memoryCache.delete(k);
      }
    }
    return true;
  } catch (error) {
    console.warn(`[CacheService: Set Error for ${key}]`, error.message);
    return false;
  }
};

/**
 * Invalidate a specific cache key or wildcard pattern
 */
export const cacheInvalidate = async (patternOrKey) => {
  try {
    if (isRedisAvailable && redisClient) {
      if (patternOrKey.includes("*")) {
        const keys = await redisClient.keys(patternOrKey);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        await redisClient.del(patternOrKey);
      }
      return true;
    }

    // Memory cache pattern eviction
    if (patternOrKey.includes("*")) {
      const regex = new RegExp("^" + patternOrKey.replace(/\*/g, ".*") + "$");
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
        }
      }
    } else {
      memoryCache.delete(patternOrKey);
    }
    return true;
  } catch (error) {
    console.warn(`[CacheService: Invalidate Error]`, error.message);
    return false;
  }
};

/**
 * Invalidate all doctor and availability related caches
 */
export const invalidateDoctorCaches = async () => {
  await cacheInvalidate("doctors:*");
  await cacheInvalidate("doctor_specialities");
};

/**
 * Health status indicator
 */
export const getCacheStatus = () => ({
  mode: isRedisAvailable ? "redis" : "memory_fallback",
  connected: isRedisAvailable,
  entries: isRedisAvailable ? "redis_managed" : memoryCache.size,
});
