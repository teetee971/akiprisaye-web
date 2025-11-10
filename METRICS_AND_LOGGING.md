# Prometheus Metrics and Structured Logging

This implementation adds Prometheus metrics and structured JSON logging to the product search API.

## Overview

### Metrics Endpoint
- **URL**: `GET /metrics`
- **Format**: Prometheus text exposition format
- **Authentication**: Unauthenticated (protect in production)
- **Content-Type**: `text/plain; version=0.0.4; charset=utf-8`

### Metrics Collected

1. **search_requests_total** (Counter)
   - Total number of product search requests
   - Labels: `territory` (e.g., "Guadeloupe", "Martinique")

2. **search_errors_total** (Counter)
   - Total number of search errors
   - Labels: `type` (e.g., "exception")

3. **search_zero_results_total** (Counter)
   - Total searches that returned zero results
   - Labels: `territory`

4. **search_duration_ms** (Histogram)
   - Search request duration in milliseconds
   - Labels: `territory`
   - Buckets: [50, 100, 200, 300, 500, 1000, 2000, 5000]

### Structured Logging

All search events are logged in JSON format with the following structure:

```json
{
  "level": "info",
  "event": "search",
  "timestamp": "2025-11-10T00:33:01.996Z",
  "q_hash": "a1b2c3d4e5f6...",
  "territory": "Guadeloupe",
  "results": 15
}
```

**Privacy**: Query strings are hashed using SHA256 before logging to protect user privacy.

## Implementation Details

### Files Created/Modified

#### Backend TypeScript (Reference Implementation)
- `backend/start/metrics.ts` - Prometheus registry and metric definitions using prom-client
- `backend/start/logger.ts` - Structured logging helper with query hashing
- `backend/app/Controllers/MetricsController.ts` - Controller for /metrics endpoint
- `backend/app/Controllers/ProductsController.ts` - Updated with metrics instrumentation
- `backend/routes/api.ts` - Added /metrics route

#### Cloudflare Pages Functions (Deployed)
- `functions/api/products/search.js` - Product search with built-in metrics and logging
- `functions/metrics.js` - Prometheus metrics endpoint

### Dependencies

```json
{
  "prom-client": "^15.0.0"
}
```

## Usage

### Making Search Requests

```bash
# Search for products
curl "https://your-domain.com/api/products/search?q=lait&territory=Guadeloupe"
```

### Viewing Metrics

```bash
# Get Prometheus metrics
curl "https://your-domain.com/metrics"
```

Expected output:
```
# HELP search_requests_total Total number of product search requests
# TYPE search_requests_total counter
search_requests_total{territory="Guadeloupe"} 150

# HELP search_errors_total Total number of product search errors
# TYPE search_errors_total counter
search_errors_total{type="exception"} 3

# HELP search_zero_results_total Total number of product searches that returned zero results
# TYPE search_zero_results_total counter
search_zero_results_total{territory="Guadeloupe"} 12

# HELP search_duration_ms Product search request duration in milliseconds
# TYPE search_duration_ms histogram
search_duration_ms_bucket{territory="Guadeloupe",le="50"} 10
search_duration_ms_bucket{territory="Guadeloupe",le="100"} 45
search_duration_ms_bucket{territory="Guadeloupe",le="200"} 120
search_duration_ms_bucket{territory="Guadeloupe",le="300"} 140
search_duration_ms_bucket{territory="Guadeloupe",le="500"} 148
search_duration_ms_bucket{territory="Guadeloupe",le="1000"} 150
search_duration_ms_bucket{territory="Guadeloupe",le="2000"} 150
search_duration_ms_bucket{territory="Guadeloupe",le="5000"} 150
search_duration_ms_bucket{territory="Guadeloupe",le="+Inf"} 150
search_duration_ms_sum{territory="Guadeloupe"} 23450
search_duration_ms_count{territory="Guadeloupe"} 150
```

## Testing

Run the demo script to see expected behavior:

```bash
node backend/test-metrics-demo.js
```

### Manual Testing Scenarios

1. **Successful Search**
   ```bash
   curl "https://your-domain.com/api/products/search?q=lait&territory=Guadeloupe"
   ```
   - ✅ Increments `search_requests_total{territory="Guadeloupe"}`
   - ✅ Records duration in `search_duration_ms{territory="Guadeloupe"}`
   - ✅ Logs JSON with results count

2. **Zero Results Search**
   ```bash
   curl "https://your-domain.com/api/products/search?q=xyz123&territory=Martinique"
   ```
   - ✅ Increments `search_requests_total{territory="Martinique"}`
   - ✅ Increments `search_zero_results_total{territory="Martinique"}`
   - ✅ Logs JSON with `results: 0`

3. **Short Query (< 3 chars)**
   ```bash
   curl "https://your-domain.com/api/products/search?q=ab&territory=Guadeloupe"
   ```
   - ✅ Returns empty results
   - ✅ Logs with `reason: "query_too_short"`

4. **Error Scenario** (simulate by network failure)
   - ✅ Increments `search_errors_total{type="exception"}`
   - ✅ Logs JSON with error details

## Security & Production Deployment

### Protecting the /metrics Endpoint

⚠️ **IMPORTANT**: The `/metrics` endpoint is unauthenticated by default. In production, protect it using:

#### Option 1: Cloudflare Access
```javascript
// Add to Cloudflare Access rules
{
  "path": "/metrics",
  "policy": "prometheus-scraper-only"
}
```

#### Option 2: IP Allowlist
```javascript
// In Cloudflare Workers/Pages
if (url.pathname === '/metrics') {
  const allowedIPs = ['10.0.0.1', '10.0.0.2']; // Your Prometheus server IPs
  const clientIP = request.headers.get('CF-Connecting-IP');
  
  if (!allowedIPs.includes(clientIP)) {
    return new Response('Forbidden', { status: 403 });
  }
}
```

#### Option 3: Reverse Proxy with Authentication
Use nginx or similar to add basic auth:
```nginx
location /metrics {
    auth_basic "Prometheus";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://backend;
}
```

### Privacy Considerations

- ✅ Query strings are hashed with SHA256 before logging
- ✅ Only hash values appear in logs, not plain text queries
- ✅ Territory labels are included for regional analysis
- ✅ No PII (Personally Identifiable Information) is logged

### Prometheus Scraping Configuration

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'akiprisaye-web'
    scrape_interval: 30s
    static_configs:
      - targets: ['your-domain.com']
    metrics_path: /metrics
    scheme: https
```

## Limitations & Notes

### Serverless Environment
- Metrics are stored in-memory per Cloudflare Worker instance
- Metrics reset when worker instance is recycled
- For persistent metrics, consider:
  - Cloudflare Workers KV
  - Cloudflare Durable Objects
  - External metrics aggregation service

### Default Node.js Metrics
- Standard Node.js process metrics (memory, CPU, etc.) are available in the TypeScript backend
- Not available in Cloudflare Workers/Pages environment
- The `/metrics` endpoint includes a placeholder for compatibility

## Future Enhancements

- [ ] Distributed tracing with OpenTelemetry
- [ ] Metrics persistence using Durable Objects
- [ ] Alerting rules for anomaly detection
- [ ] Grafana dashboard templates
- [ ] Additional metrics for price comparison API
- [ ] Log shipping to external service (e.g., Datadog, Splunk)

## Support

For questions or issues:
- Documentation: https://docs.akiprisaye.app
- Issues: https://github.com/teetee971/akiprisaye-web/issues
- Email: dev@akiprisaye.app
