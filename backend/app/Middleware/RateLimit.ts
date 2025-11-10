// RateLimit.ts - IP-based rate limiting middleware
// Uses Redis INCR + EXPIRE pattern for distributed rate limiting

import { redis } from '../Services/SearchCache';

interface RateLimitOptions {
  maxRequests: number;
  windowSeconds: number;
}

/**
 * Get client IP address from request
 */
function getClientIp(req: any): string {
  // Check various headers for real IP (proxy/CDN support)
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Create rate limit middleware
 */
export function createRateLimitMiddleware(options: RateLimitOptions) {
  return async (req: any, res: any, next: any) => {
    try {
      const ip = getClientIp(req);
      const key = `ratelimit:${ip}`;

      // Get current count
      const current = await redis.incr(key);

      if (current === 1) {
        // First request in window, set expiration
        await redis.expire(key, options.windowSeconds);
      }

      // Check if limit exceeded
      if (current > options.maxRequests) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Maximum ${options.maxRequests} requests per ${options.windowSeconds} seconds`,
          retryAfter: options.windowSeconds,
        });
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - current).toString());

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // On Redis failure, allow request through (fail open)
      next();
    }
  };
}

/**
 * Default rate limiter for product search endpoints
 * 60 requests per 60 seconds
 */
export const ratelimit = createRateLimitMiddleware({
  maxRequests: 60,
  windowSeconds: 60,
});
