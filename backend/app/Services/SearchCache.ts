// SearchCache.ts - Redis-based caching for product searches
// Provides fast caching with TTL for search results

import Redis from 'ioredis';

// Initialize Redis client
// In production, use environment variables for configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

interface SearchCacheData {
  items: any[];
  timestamp: number;
}

/**
 * Generate a cache key from territory and query
 */
function generateCacheKey(territory: string, query: string): string {
  const normalizedQuery = query.trim().toLowerCase();
  return `search:${territory}:${normalizedQuery}`;
}

/**
 * Get cached search results
 * @returns null if not found or expired
 */
export async function getCachedSearch(
  territory: string,
  query: string
): Promise<any[] | null> {
  try {
    const key = generateCacheKey(territory, query);
    const cached = await redis.get(key);

    if (!cached) {
      return null;
    }

    const data: SearchCacheData = JSON.parse(cached);
    return data.items;
  } catch (error) {
    console.error('Cache read error:', error);
    return null; // Fail gracefully
  }
}

/**
 * Store search results in cache with TTL
 */
export async function setCachedSearch(
  territory: string,
  query: string,
  items: any[]
): Promise<void> {
  try {
    const key = generateCacheKey(territory, query);
    const data: SearchCacheData = {
      items,
      timestamp: Date.now(),
    };

    // Set with 60 second TTL
    await redis.setex(key, 60, JSON.stringify(data));
  } catch (error) {
    console.error('Cache write error:', error);
    // Fail gracefully - caching is not critical
  }
}

/**
 * Clear all search cache (for testing/maintenance)
 */
export async function clearSearchCache(): Promise<void> {
  try {
    const keys = await redis.keys('search:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

export { redis };
