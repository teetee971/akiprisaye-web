# Verified Pricing System - API Documentation

## Overview

The Verified Pricing System provides a comprehensive API for managing product prices with confidence scores, verification workflows, anomaly detection, and historical tracking.

## Base URL

All API endpoints are available at: `/api/prices`

## Authentication

Currently, these endpoints are public with rate limiting. Future versions may require authentication for certain operations.

---

## Endpoints

### 1. Submit a New Price

Submit a new price observation for a product at a specific store.

**Endpoint:** `POST /api/prices`

**Request Body:**
```json
{
  "productId": "string (required)",
  "storeId": "string (required)",
  "price": "number (required, > 0)",
  "observedAt": "string (required, ISO 8601 datetime)",
  "source": "enum (required)",
  "reportedBy": "string (optional)",
  "proof": {
    "type": "enum (optional)",
    "url": "string (optional)"
  }
}
```

**Price Source Values:**
- `OCR_TICKET` - Scanned from receipt
- `OFFICIAL_API` - From official retailer API
- `OPEN_PRICES` - From Open Prices database
- `MANUAL_ENTRY` - Manually entered
- `CROWDSOURCED` - Community contribution
- `SCRAPING_AUTHORIZED` - Authorized web scraping

**Response:** `201 Created` or `202 Accepted`
```json
{
  "id": "string",
  "status": "accepted | pending_review | rejected",
  "confidenceScore": "number (0-100)",
  "message": "string",
  "duplicateOf": "string (optional)"
}
```

**Example:**
```bash
curl -X POST https://api.akiprisaye.app/api/prices \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod_123",
    "storeId": "store_456",
    "price": 4.99,
    "observedAt": "2026-02-07T10:30:00Z",
    "source": "MANUAL_ENTRY"
  }'
```

---

### 2. Get Prices for a Product

Retrieve all verified prices for a specific product.

**Endpoint:** `GET /api/prices/product/:productId`

**Query Parameters:**
- `storeId` (optional) - Filter by store
- `minConfidence` (optional) - Minimum confidence score (0-100)
- `limit` (optional) - Maximum results to return

**Response:** `200 OK`
```json
{
  "count": "number",
  "prices": [
    {
      "id": "string",
      "productId": "string",
      "storeId": "string",
      "price": "number",
      "currency": "string",
      "source": "enum",
      "observedAt": "string (ISO 8601)",
      "verificationStatus": "enum",
      "verificationCount": "number",
      "confidenceScore": "number",
      "confidenceLabel": "string",
      "createdAt": "string"
    }
  ]
}
```

**Example:**
```bash
curl https://api.akiprisaye.app/api/prices/product/prod_123?minConfidence=60&limit=20
```

---

### 3. Get Prices for a Store

Retrieve all prices at a specific store.

**Endpoint:** `GET /api/prices/store/:storeId`

**Query Parameters:**
- `minConfidence` (optional) - Minimum confidence score
- `limit` (optional) - Maximum results

**Response:** Same as product prices endpoint

---

### 4. Get Best Verified Price

Get the highest confidence price for a product.

**Endpoint:** `GET /api/prices/best/:productId`

**Query Parameters:**
- `storeId` (optional) - Specific store

**Response:** `200 OK` - Single price object or `404 Not Found`

---

### 5. Verify a Price

Confirm or dispute an existing price.

**Endpoint:** `POST /api/prices/:id/verify`

**Request Body:**
```json
{
  "userId": "string (required)",
  "action": "CONFIRM | DISPUTE | UPDATE",
  "comment": "string (optional)"
}
```

**Response:** `200 OK`
```json
{
  "success": "boolean",
  "message": "string",
  "newConfidenceScore": "number",
  "verificationStatus": "enum"
}
```

---

### 6. Get Verification Statistics

Get statistics about verifications for a price.

**Endpoint:** `GET /api/prices/:id/verifications`

**Response:** `200 OK`
```json
{
  "total": "number",
  "confirms": "number",
  "disputes": "number",
  "updates": "number",
  "verifications": [
    {
      "action": "enum",
      "date": "string"
    }
  ]
}
```

---

### 7. Get Price History

Get historical prices for a product at a specific store.

**Endpoint:** `GET /api/prices/history/:productId`

**Query Parameters:**
- `storeId` (required) - Store to query
- `limit` (optional, default: 50) - Maximum entries

**Response:** `200 OK`
```json
{
  "productId": "string",
  "storeId": "string",
  "history": [
    {
      "price": "number",
      "observedAt": "string",
      "source": "enum",
      "change": "number (percentage)",
      "changeType": "increase | decrease | stable",
      "confidenceScore": "number"
    }
  ],
  "statistics": {
    "minPrice": "number",
    "maxPrice": "number",
    "avgPrice": "number",
    "currentPrice": "number",
    "priceRange": "number",
    "volatility": "number"
  }
}
```

---

### 8. Get Aggregated Price History

Get price trends across all stores.

**Endpoint:** `GET /api/prices/history/:productId/aggregated`

**Query Parameters:**
- `period` (optional) - `7d`, `30d`, `90d`, or `1y` (default: `30d`)

**Response:** `200 OK`
```json
{
  "productId": "string",
  "period": "string",
  "data": [
    {
      "date": "string",
      "avgPrice": "number",
      "minPrice": "number",
      "maxPrice": "number",
      "count": "number"
    }
  ]
}
```

---

### 9. Detect Price Anomalies

Detect anomalies for a specific price.

**Endpoint:** `GET /api/prices/:id/anomalies`

**Response:** `200 OK`
```json
{
  "priceId": "string",
  "anomalyCount": "number",
  "anomalies": [
    {
      "type": "enum",
      "severity": "enum",
      "deviation": "number",
      "message": "string",
      "context": {
        "historicalAverage": "number",
        "recentPrices": ["number"]
      }
    }
  ]
}
```

**Anomaly Types:**
- `SUDDEN_INCREASE` - Price jumped significantly
- `SUDDEN_DECREASE` - Price dropped significantly
- `OUTLIER_HIGH` - Price is abnormally high
- `OUTLIER_LOW` - Price is abnormally low
- `SHRINKFLATION` - Quantity reduced, price same
- `INCONSISTENT_REPORT` - Price doesn't match patterns
- `STALE_DATA` - Data is too old

**Severity Levels:**
- `LOW` - Minor concern
- `MEDIUM` - Moderate concern
- `HIGH` - Significant concern
- `CRITICAL` - Immediate attention needed

---

## Confidence Score Calculation

The confidence score (0-100) is calculated using four factors:

### 1. Recency (0-30 points)
- **Fresh (< 7 days):** 30 points
- **Recent (7-30 days):** 25 points
- **Moderate (30-60 days):** 15 points
- **Stale (60-90 days):** 5 points
- **Outdated (> 90 days):** 0 points

### 2. Source Reliability (0-30 points)
- **Official API:** 30 points
- **Manual Entry:** 25 points
- **OCR Ticket:** 20 points
- **Open Prices:** 18 points
- **Crowdsourced:** 15 points
- **Scraping Authorized:** 12 points

### 3. Verification Count (0-25 points)
- Each community verification: +5 points
- Maximum: 25 points

### 4. Consistency (0-15 points)
- Within 5% of historical average: 15 points
- Within 15%: 10 points
- Within 30%: 5 points
- Beyond 30%: 0 points

### Confidence Labels
- **80-100:** Très fiable (Very Reliable)
- **60-79:** Fiable (Reliable)
- **40-59:** Modéré (Moderate)
- **20-39:** À vérifier (To Verify)
- **0-19:** Non vérifié (Unverified)

---

## Error Responses

All endpoints may return the following errors:

**400 Bad Request**
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

**404 Not Found**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "string"
}
```

---

## Rate Limiting

All endpoints are subject to rate limiting:
- **Limit:** 100 requests per 15 minutes per IP
- **Headers:**
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

## Best Practices

1. **Always check confidence scores** before displaying prices to users
2. **Display freshness indicators** to show data recency
3. **Encourage community verification** for higher confidence
4. **Monitor anomalies** to catch pricing errors quickly
5. **Use historical data** to provide context and trends
6. **Include proof** (receipts, screenshots) when submitting prices
7. **Respect rate limits** and implement proper error handling
8. **Cache responses** appropriately to reduce API load

---

## Examples

### Submit Price from Receipt Scan
```javascript
const submitPrice = async (productId, storeId, price) => {
  const response = await fetch('/api/prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      storeId,
      price,
      observedAt: new Date().toISOString(),
      source: 'OCR_TICKET',
      proof: {
        type: 'receipt_image',
        url: 'https://cdn.example.com/receipts/abc123.jpg'
      }
    })
  });
  
  return await response.json();
};
```

### Display Price with Confidence
```javascript
const PriceDisplay = ({ price }) => {
  const getConfidenceColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'yellow';
    return 'red';
  };
  
  return (
    <div>
      <span className="price">{price.price}€</span>
      <span className={`confidence ${getConfidenceColor(price.confidenceScore)}`}>
        Score: {price.confidenceScore}/100
      </span>
    </div>
  );
};
```

---

## Support

For questions or issues:
- **Documentation:** https://docs.akiprisaye.app
- **Email:** api@akiprisaye.app
- **GitHub:** https://github.com/teetee971/akiprisaye-web/issues

---

## Changelog

### Version 1.0.0 (2026-02-07)
- Initial release
- Price submission and verification
- Confidence score calculation
- Anomaly detection
- Historical tracking
- Aggregated statistics
