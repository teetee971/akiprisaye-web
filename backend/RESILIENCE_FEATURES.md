# Resilience Features Implementation

This document describes the resilience features added to the product search backend.

## Overview

Three key resilience features have been implemented:
1. **Circuit Breaker** - Protects against cascading failures from Open Food Facts API
2. **Redis Caching** - Reduces load and improves response times for repeated queries
3. **Rate Limiting** - Prevents abuse and protects service availability

## Components

### 1. Circuit Breaker (`app/Services/Breaker.ts`)

A simple but effective circuit breaker implementation that protects against cascading failures when the Open Food Facts API is unavailable.

**Configuration:**
- Fail Threshold: 5 consecutive failures
- Success Threshold: 2 consecutive successes (in half-open state)
- Timeout: 60 seconds

**States:**
- `CLOSED`: Normal operation, requests pass through
- `OPEN`: Circuit is tripped, requests are immediately rejected with 503
- `HALF_OPEN`: Testing if service has recovered

**Usage:**
```typescript
import { offBreaker } from '../Services/Breaker';

const result = await offBreaker.exec(async () => {
  // Your API call here
  return await fetch('https://api.example.com');
});
```

### 2. Search Cache (`app/Services/SearchCache.ts`)

Redis-based caching for product search results with automatic TTL management.

**Configuration:**
- TTL: 60 seconds
- Key Pattern: `search:{territory}:{normalized_query}`
- Storage: Redis with configurable host/port via environment variables

**Functions:**
- `getCachedSearch(territory, query)` - Retrieve cached results
- `setCachedSearch(territory, query, items)` - Store results with TTL
- `clearSearchCache()` - Clear all cache (maintenance)

**Environment Variables:**
```bash
REDIS_HOST=localhost      # Default: localhost
REDIS_PORT=6379          # Default: 6379
REDIS_PASSWORD=          # Optional
REDIS_DB=0               # Default: 0
```

### 3. Rate Limiting (`app/Middleware/RateLimit.ts`)

IP-based rate limiting using Redis INCR + EXPIRE pattern.

**Configuration:**
- Max Requests: 60 requests
- Window: 60 seconds
- Scope: Per IP address

**Response Headers:**
- `X-RateLimit-Limit`: Maximum allowed requests
- `X-RateLimit-Remaining`: Remaining requests in current window

**Rate Limit Exceeded Response (429):**
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 60 requests per 60 seconds",
  "retryAfter": 60
}
```

## Updated Endpoints

### Search Endpoint
`GET /api/products/search?q={query}&territory={territory}`

**Resilience Features:**
- ✓ Circuit breaker protection
- ✓ Redis caching (60s TTL)
- ✓ Rate limiting (60 req/60s)
- ✓ X-Cache header (HIT/MISS)

**Response Headers:**
```
X-Cache: HIT              # Served from cache
X-Cache: MISS             # Fetched from API
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
```

**Error Responses:**
- `503 Service Unavailable` - Circuit breaker is open
- `429 Too Many Requests` - Rate limit exceeded

### New Endpoints

#### Trending Products
`GET /api/products/trending?territory={territory}&limit={limit}`

**Features:**
- Rate limiting enabled
- Mock data (to be replaced with real analytics)

#### Selected Products
`GET /api/products/select?territory={territory}&category={category}&limit={limit}`

**Features:**
- Rate limiting enabled
- Mock data (to be replaced with editorial selection)

## Testing

### Circuit Breaker Test
```bash
npx tsx /tmp/test-resilience.ts
```

### Integration Test
```bash
npx tsx /tmp/test-integration.ts
```

## Monitoring

### Key Metrics to Monitor
1. Circuit breaker state transitions
2. Cache hit/miss ratio
3. Rate limit rejections
4. Redis connection health

### Logs
All components log errors and important events to console:
- `Redis connection error:` - Redis connectivity issues
- `Cache read/write error:` - Cache operation failures
- `Rate limit middleware error:` - Rate limiting failures

### Graceful Degradation
All resilience features are designed to fail open:
- Cache failures don't block requests
- Rate limit Redis failures allow requests through
- Circuit breaker only blocks after threshold is reached

## Deployment Checklist

- [ ] Redis instance running and accessible
- [ ] Environment variables configured
- [ ] Redis password set (production)
- [ ] Monitor circuit breaker state
- [ ] Monitor cache hit ratio
- [ ] Monitor rate limit rejections
- [ ] Set up alerts for Redis connection failures

## Security Notes

- Cache keys only contain territory and normalized query (no sensitive data)
- IP addresses in rate limit keys are hashed in Redis
- Redis connection uses password authentication in production
- All user inputs are validated and sanitized

## Future Enhancements

1. **Cache Key Hashing** - Hash query strings in cache keys for privacy
2. **Distributed Circuit Breaker** - Share circuit breaker state across instances
3. **Adaptive Rate Limiting** - Adjust limits based on load
4. **Cache Warming** - Pre-populate cache for popular queries
5. **Metrics Export** - Prometheus/Grafana integration
