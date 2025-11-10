# Cloudflare Pages Functions

This directory contains Cloudflare Pages Functions that power the backend API endpoints for A KI PRI SA YÉ.

## Structure

```
functions/
├── api/                    # API endpoints
│   ├── contact.js         # Contact form submission
│   ├── health.js          # Health check endpoint
│   ├── news.js            # News API
│   ├── prices.js          # Price lookup
│   └── products/          # Product-related endpoints
│       ├── select.js      # Track product selections (POST)
│       └── trending.js    # Get trending products (GET)
├── utils/                 # Shared utilities
│   └── redis.js          # Redis client for Upstash
├── compare.js            # Product comparison
├── iaConseiller.js       # AI advisor
└── ocr.js                # OCR processing
```

## API Endpoints

### Products

#### POST /api/products/select
Track a product selection for trending analytics.

**Request:**
```bash
curl -X POST https://akiprisaye.pages.dev/api/products/select \
  -H "Content-Type: application/json" \
  -d '{
    "ean": "3017620422003",
    "territory": "Guadeloupe",
    "name": "Nutella",
    "brand": "Ferrero",
    "image": "https://example.com/image.jpg"
  }'
```

**Response:**
```json
{
  "success": true,
  "ean": "3017620422003",
  "territory": "Guadeloupe",
  "score": 42,
  "tracked": true,
  "message": "Product selection tracked successfully"
}
```

#### GET /api/products/trending
Get top trending products by territory.

**Request:**
```bash
curl "https://akiprisaye.pages.dev/api/products/trending?territory=Guadeloupe&limit=10"
```

**Response:**
```json
{
  "territory": "Guadeloupe",
  "limit": 10,
  "count": 5,
  "products": [
    {
      "ean": "3017620422003",
      "score": 42,
      "name": "Nutella",
      "brand": "Ferrero",
      "image": "https://example.com/image.jpg"
    }
  ]
}
```

## Environment Variables

### Required for Trending Feature

To enable the trending products feature, configure these environment variables in your Cloudflare Pages settings:

```env
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### Setting up Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Choose the region closest to your Cloudflare Pages deployment
4. Copy the REST URL and REST Token
5. Add them to your Cloudflare Pages environment variables:
   - Go to your project settings
   - Navigate to "Environment variables"
   - Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   - Deploy to apply changes

### Graceful Degradation

If Redis is not configured, the endpoints will still work but return empty/placeholder data:
- `POST /api/products/select` returns `tracked: false`
- `GET /api/products/trending` returns empty products array

## Redis Data Structure

### Sorted Sets (Trending Scores)
```
Key: trendingZ:{territory}
Type: Sorted Set
Members: EAN codes
Scores: Selection count

Example:
trendingZ:Guadeloupe
  "3017620422003" → 42
  "8076809513838" → 35
  "3228857000852" → 28
```

### Hashes (Product Metadata)
```
Key: product:{ean}
Type: Hash
Fields: name, brand, image

Example:
product:3017620422003
  name: "Nutella"
  brand: "Ferrero"
  image: "https://..."
```

## Local Development

Cloudflare Pages Functions run in the Cloudflare Workers environment. To test locally:

### Option 1: Wrangler CLI (Recommended)
```bash
npm install -g wrangler
wrangler pages dev dist --compatibility-date=2024-01-01
```

### Option 2: Mock Testing
Create a simple test script to validate the logic:

```javascript
// test-select.js
const select = require('./api/products/select.js');

const mockRequest = {
  json: async () => ({
    ean: '3017620422003',
    territory: 'Guadeloupe',
    name: 'Test Product',
    brand: 'Test Brand',
    image: null
  })
};

const mockEnv = {
  UPSTASH_REDIS_REST_URL: 'https://...',
  UPSTASH_REDIS_REST_TOKEN: '...'
};

select.onRequestPost({ request: mockRequest, env: mockEnv })
  .then(response => response.json())
  .then(console.log);
```

## Testing in Production

After deployment to Cloudflare Pages, test the endpoints:

```bash
# Track a selection
curl -X POST https://akiprisaye.pages.dev/api/products/select \
  -H "Content-Type: application/json" \
  -d '{"ean":"3017620422003","territory":"Guadeloupe"}'

# Get trending products
curl "https://akiprisaye.pages.dev/api/products/trending?territory=Guadeloupe&limit=5"
```

## Deployment

These functions are automatically deployed when you push to the repository. Cloudflare Pages will:

1. Build the project using Vite
2. Deploy the static assets from `dist/`
3. Deploy the functions from `functions/`
4. Make them available at your domain

No additional configuration needed!

## Monitoring

- **Logs:** Available in Cloudflare Pages dashboard → Functions tab
- **Analytics:** Cloudflare Analytics shows request counts and errors
- **Redis Metrics:** Check Upstash dashboard for Redis usage

## Security Considerations

- All endpoints validate input (EAN format, territory, etc.)
- Redis credentials are stored as environment variables (not in code)
- CORS headers should be configured in Cloudflare Pages settings if needed
- Rate limiting is handled by Cloudflare's built-in protection

## Troubleshooting

### "Redis not configured" message
- Check that environment variables are set in Cloudflare Pages
- Verify the Redis URL and token are correct
- Redeploy after adding environment variables

### Functions not working after deployment
- Check Cloudflare Pages build logs
- Verify functions are in the `functions/` directory
- Check function syntax matches Cloudflare Pages format

### High Redis usage
- Consider adding TTL to trending data
- Implement cleanup jobs for old data
- Monitor with Upstash dashboard

## Further Reading

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
- [Upstash Redis for Cloudflare](https://docs.upstash.com/redis/features/cloudflare)
- [Redis Sorted Sets](https://redis.io/docs/data-types/sorted-sets/)
