# Real Price Pipeline Documentation

This document describes the end-to-end price retrieval, verification, and display system for A KI PRI SA YÉ.

## Overview

The system automatically collects, verifies, and displays real prices from multiple sources to help users find the best deals in their area.

## Data Model

### Collections

#### `stores/{storeId}`
Store locations and metadata.

**Fields:**
- `name` (string): Store name
- `territory` (string): Territory/region code
- `geohash` (string, optional): Geohash for location-based queries
- `lat` (number): Latitude
- `lng` (number): Longitude
- `updatedAt` (timestamp): Last update timestamp

#### `products/{ean}`
Product catalog with EAN as document ID.

**Fields:**
- `name` (string): Product name
- `brand` (string, optional): Brand name
- `category` (string, optional): Product category
- `unit` (string, optional): Unit of measurement (kg, L, etc.)
- `createdAt` (timestamp): Creation timestamp
- `updatedAt` (timestamp): Last update timestamp

#### `prices/{docId}`
Price records with automatic expiration.

**Fields:**
- `ean` (string): Product EAN code
- `storeId` (string): Store identifier
- `price` (number): Price in euros
- `unit_price` (number, optional): Price per unit (€/kg, €/L)
- `unit` (string, optional): Unit for unit_price
- `source` (string): Data source - 'partner', 'ocr', or 'user'
- `capturedAt` (timestamp): When price was captured
- `expiresAt` (timestamp): Expiration date (auto-calculated based on source)
- `createdAt` (timestamp): Record creation timestamp

#### `receipts/{docId}`
OCR-processed receipts awaiting verification.

**Fields:**
- `imageUrl` (string): URL to receipt image in Storage
- `parsedLines` (array): Array of parsed line objects:
  - `raw` (string): Raw OCR text
  - `ean` (string, optional): Detected EAN code
  - `name` (string, optional): Detected product name
  - `price` (number, optional): Detected price
  - `qty` (number, optional): Detected quantity
- `status` (string): 'pending', 'accepted', or 'rejected'
- `uploadedAt` (timestamp): Upload timestamp

## Price Source Hierarchy

Prices are prioritized based on reliability and freshness:

1. **Partner** (highest priority)
   - Direct feeds from retail partners
   - Most reliable
   - TTL: 72 hours

2. **OCR** (medium priority)
   - Extracted from user-uploaded receipts
   - Verified through moderation queue
   - TTL: 14 days

3. **User** (lowest priority)
   - Manually entered by users
   - Requires community validation
   - TTL: 7 days

## TTL (Time To Live) Defaults

| Source | TTL | Rationale |
|--------|-----|-----------|
| Partner | 72 hours | Partner data is reliable but changes frequently |
| OCR | 14 days | Receipt-based prices are accurate but may become outdated |
| User | 7 days | User-entered data needs faster refresh cycle |

## API Endpoint: /api/prices

**Endpoint:** `GET /api/prices`

**Query Parameters:**
- `ean` (required): Product EAN code (8-14 digits)
- `lat` (optional): Latitude for location-based filtering
- `lng` (optional): Longitude for location-based filtering
- `radius` (optional): Search radius in km (max 200km, default 50km)

**Response Format:**
```json
{
  "ean": "3017620422003",
  "product": {
    "name": "Product Name",
    "brand": "Brand Name",
    "category": "Category",
    "unit": "kg"
  },
  "prices": [
    {
      "storeId": "store123",
      "storeName": "Store Name",
      "territory": "GUADELOUPE",
      "price": 2.99,
      "unit_price": 5.98,
      "unit": "kg",
      "source": "partner",
      "capturedAt": 1699363200000,
      "ageHours": 24
    }
  ],
  "best": {
    "price": 2.99,
    "storeId": "store123",
    "storeName": "Store Name"
  }
}
```

**Age Calculation:**
- Age is calculated as: `(Date.now() - capturedAt) / (1000 * 60 * 60)`
- Prices where `Date.now() > expiresAt` are automatically filtered out

**Empty Results:**
```json
{
  "ean": "3017620422003",
  "product": null,
  "prices": [],
  "best": null
}
```

## Security Measures

### API Endpoint
1. **EAN Sanitization**: Remove all non-digits, validate length (8-14)
2. **Radius Clamping**: Maximum 200km to prevent abuse
3. **Rate Limiting**: TODO - Implement rate limiting per IP
4. **Input Validation**: Strict parameter validation

### Firestore Security Rules

**Recommended rules for production:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products: read-only for all
    match /products/{ean} {
      allow read: if true;
      allow write: if false; // Only via admin/cloud functions
    }
    
    // Stores: read-only for all
    match /stores/{storeId} {
      allow read: if true;
      allow write: if false; // Only via admin/cloud functions
    }
    
    // Prices: read-only for all
    match /prices/{docId} {
      allow read: if true;
      allow write: if false; // Only via cloud functions
    }
    
    // Receipts: authenticated users can create, admin can update
    match /receipts/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if false; // Only via admin/cloud functions
    }
  }
}
```

**Note:** The repository does not include a firestore.rules file. Apply these rules through the Firebase Console or deploy them separately.

## OCR Pipeline (Client-side MVP)

### Process Flow

1. **Upload**: User uploads receipt image via `upload-ticket.html`
2. **OCR**: Tesseract.js processes image client-side (French language)
3. **Detection**: Pattern matching to detect prices: `/\b(\d+[.,]\d{2})\b/`
4. **Review**: User confirms detected lines
5. **Submit**: Receipt saved to `receipts` collection with status='pending'
6. **Moderation**: (Future) Admin reviews and accepts/rejects
7. **Integration**: (Future) Accepted receipts create price records

### Limitations (MVP)
- Client-side OCR only (no server processing)
- Basic price detection (regex-based)
- No EAN detection in MVP
- No automatic product matching
- Manual moderation queue (not implemented in MVP)

## Automation & Verification

### Smoke Tests (`.github/workflows/smoke.yml`)

**Runs:**
- On push to main
- Every hour (cron schedule)
- Manual trigger

**Tests:**
1. Root page accessibility and content check
2. Comparateur page accessibility and content check
3. API endpoint health check

**Failure Actions:**
- GitHub Actions run marked as failed
- Team notified via GitHub notifications
- Prevents unnoticed outages

### Asset Integrity (`scripts/check-assets.js`)

Verifies:
- Critical files exist (HTML, JS, configs)
- File references are correct
- Scripts are properly linked

**Usage:**
```bash
node scripts/check-assets.js
```

## Future Enhancements (Non-Goals for MVP)

### Partner Connector
TODO: Implement partner API integrations
- Scheduled imports from partner APIs
- Data transformation and validation
- Conflict resolution

### Advanced Moderation UI
TODO: Build admin interface for receipt moderation
- Queue management
- Bulk actions
- Quality metrics

### Real-time Updates
TODO: Implement real-time price notifications
- WebSocket/SSE for live updates
- Push notifications
- Price alerts

### Machine Learning
TODO: Enhance OCR with ML models
- Better product name extraction
- EAN detection from images
- Receipt layout recognition

### Mobile App
TODO: Native mobile apps
- Camera integration
- Offline support
- Geolocation features

## Integration with Comparateur

The comparateur page (`comparateur.html`) integrates with the API:

1. User enters EAN code
2. JavaScript calls `/api/prices?ean=CODE`
3. Results displayed in table format
4. Shows: store, territory, price, unit_price, source, age
5. Highlights best price
6. Fallback message if no prices available

**Script:** `comparateur-fetch.js` handles the integration

## Monitoring & Maintenance

### Health Checks
- Hourly smoke tests via GitHub Actions
- Manual testing before major releases

### Data Quality
- Monitor price age distribution
- Track source breakdown
- Review expired price cleanup

### Performance
- API response times
- Firestore read/write metrics
- OCR processing times

## Contact & Support

For issues or questions:
- Open an issue on GitHub
- Check FAQ in `faq.html`
- Contact support via `contact.html`

---

**Last Updated:** November 2025  
**Version:** 1.0 (MVP)
