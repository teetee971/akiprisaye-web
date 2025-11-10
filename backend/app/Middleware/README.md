# Middleware

Express/AdonisJS middleware for the application.

## Available Middleware

### RateLimit.ts
IP-based rate limiting middleware using Redis.

**Exports:**
- `ratelimit` - Pre-configured rate limiter (60 requests / 60 seconds)
- `createRateLimitMiddleware(options)` - Create custom rate limiter

**Default Configuration:**
- Max Requests: 60
- Window: 60 seconds
- Scope: Per IP address

**Response Headers:**
- `X-RateLimit-Limit` - Maximum allowed requests
- `X-RateLimit-Remaining` - Remaining requests in window

**Error Response (429):**
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 60 requests per 60 seconds",
  "retryAfter": 60
}
```

## Usage

### In Express Routes
```typescript
import { ratelimit } from '../app/Middleware/RateLimit';

app.get('/api/products/search', ratelimit, handler);
```

### In AdonisJS Routes
```typescript
Route.get('/api/products/search', 'ProductsController.search')
  .middleware('ratelimit');
```
