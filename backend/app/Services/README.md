# Services

Backend services for the application.

## Available Services

### Breaker.ts
Circuit breaker implementation for protecting against cascading failures.

**Export:**
- `offBreaker` - Pre-configured circuit breaker for Open Food Facts API calls

**Configuration:**
- Fail Threshold: 5
- Success Threshold: 2
- Timeout: 60000ms (60 seconds)

### SearchCache.ts
Redis-based caching service for product search results.

**Exports:**
- `getCachedSearch(territory, query)` - Retrieve cached results
- `setCachedSearch(territory, query, items)` - Store results with 60s TTL
- `clearSearchCache()` - Clear all search cache
- `redis` - Redis client instance

**Environment Variables:**
- `REDIS_HOST` - Redis server host (default: localhost)
- `REDIS_PORT` - Redis server port (default: 6379)
- `REDIS_PASSWORD` - Redis password (optional)
- `REDIS_DB` - Redis database number (default: 0)
