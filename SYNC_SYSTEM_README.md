# Automatic Product Addition System

## Overview

The automatic product addition system synchronizes products from open data sources and enables citizen contributions via OCR. This system enriches the product catalog automatically while maintaining quality through a validation queue.

## Architecture

### Data Sources

1. **Open Food Facts** - Global product database with nutritional information
2. **Open Prices** - Crowdsourced price data from Open Food Facts
3. **OCR Receipts** - Citizen-scanned receipts (future integration)
4. **Citizen Contributions** - Manual product additions by users

### Components

```
backend/src/
├── config/
│   └── syncConfig.ts           # Centralized configuration
├── database/
│   └── prisma.ts               # Shared Prisma client singleton
├── services/
│   ├── products/
│   │   ├── normalization.ts    # Product name normalization
│   │   ├── deduplication.ts    # Duplicate detection
│   │   ├── autoProductCreation.ts  # Product creation logic
│   │   └── validationQueue.ts  # Validation workflow
│   ├── sync/
│   │   ├── openFoodFactsSync.ts    # OFF synchronization
│   │   ├── openPricesSync.ts       # Open Prices sync
│   │   └── syncOrchestrator.ts     # Coordination
│   └── scheduler/
│       ├── syncScheduler.ts    # Job scheduling
│       └── jobs/               # Individual job handlers
└── api/routes/
    ├── sync.routes.ts          # Sync API endpoints
    └── validation.routes.ts    # Validation API endpoints
```

## Database Schema

### Product Model

```prisma
model Product {
  id              String        @id @default(cuid())
  ean             String?       @unique
  name            String
  normalizedName  String
  brand           String?
  category        String?
  quantity        String?
  imageUrl        String?
  nutriscoreGrade String?
  ecoscoreGrade   String?
  source          ProductSource
  status          ProductStatus @default(PENDING_REVIEW)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  validatedAt     DateTime?
  validatedBy     String?
  
  prices          ProductPrice[]
  
  @@index([normalizedName])
  @@index([status])
  @@index([ean])
}
```

### Enums

```prisma
enum ProductSource {
  MANUAL
  OCR
  OPENFOODFACTS
  OPENPRICES
  CITIZEN
}

enum ProductStatus {
  PENDING_REVIEW
  VALIDATED
  REJECTED
  MERGED
}
```

## Synchronization

### Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `sync:openfoodfacts` | Daily at 3:00 AM | Sync products from Open Food Facts |
| `sync:openprices` | Every 6 hours | Sync prices from Open Prices |
| `process:ocr-queue` | Every 5 minutes | Process pending OCR products |
| `cleanup:duplicates` | Sunday at 4:00 AM | Find and merge duplicates |

### Rate Limiting

- **Open Food Facts**: 100 requests/minute (600ms delay)
- **Open Prices**: 60 requests/minute (1000ms delay)

### Configuration

Edit `backend/src/config/syncConfig.ts`:

```typescript
export const SYNC_CONFIG = {
  openFoodFacts: {
    apiUrl: 'https://world.openfoodfacts.org/api/v2',
    userAgent: 'AKiPriSaYe/1.0 (contact@akiprisaye.com)',
    batchSize: 100,
    rateLimit: 100,
    territories: ['gp', 'mq', 'gf', 're', 'yt'],
  },
  // ... more config
};
```

## API Endpoints

### Sync Endpoints

#### Trigger Synchronization

```bash
# Trigger Open Food Facts sync
POST /api/sync/openfoodfacts/trigger

# Trigger Open Prices sync
POST /api/sync/openprices/trigger

# Trigger all syncs
POST /api/sync/all/trigger
```

#### Monitor Synchronization

```bash
# Get current status
GET /api/sync/status

# Get sync history with pagination
GET /api/sync/history?page=1&limit=20&source=OPENFOODFACTS

# Get scheduled jobs status
GET /api/sync/jobs

# Manually trigger a job
POST /api/sync/jobs/:jobId/trigger
```

### Validation Endpoints

#### Product Review Queue

```bash
# Get validation queue
GET /api/validation/queue?status=PENDING_REVIEW&limit=50

# Get validation statistics
GET /api/validation/stats

# Get product details
GET /api/validation/:id
```

#### Product Actions

```bash
# Approve a product
POST /api/validation/:id/approve
Body: { "reviewedBy": "user_id" }

# Reject a product
POST /api/validation/:id/reject
Body: { "reviewedBy": "user_id" }

# Merge duplicate products
POST /api/validation/:id/merge/:targetId
Body: { "reviewedBy": "user_id" }
```

## Deduplication Strategy

The system uses a three-tier approach to detect duplicates:

### 1. EAN Exact Match (Highest Priority)
- Matches products by barcode/EAN
- 100% accuracy for packaged products

### 2. Normalized Name Exact Match
- Normalizes product names (lowercase, remove accents, standardize units)
- Matches identical products with different formatting

### 3. Fuzzy Matching (Levenshtein Distance)
- Uses similarity threshold (default: 0.85)
- Catches variations in spelling or format
- Returns top 3 candidates for review

Example normalization:
```
"Lait entier UHT 1L" → "lait entier uht 1l"
"LAIT ENTIER U.H.T. 1 litre" → "lait entier uht 1l"
```

## Product Normalization

The normalization service standardizes product names for better matching:

### Transformations

1. **Case normalization**: Convert to lowercase
2. **Accent removal**: Remove diacritics (é → e)
3. **Prefix removal**: Remove "marque", "produit", "pack", etc.
4. **Unit standardization**: "kilogramme" → "kg", "litre" → "l"
5. **Special character removal**: Keep only alphanumeric, spaces, hyphens
6. **Space normalization**: Multiple spaces → single space

## Validation Queue

Products from certain sources require manual review before being visible:

### Auto-Validation
- Open Food Facts products with Nutriscore and Ecoscore
- Products matched with high confidence (>0.95)

### Manual Review Required
- OCR products (confidence-based)
- Citizen contributions
- Products without sufficient metadata
- Fuzzy matches below auto-approval threshold

### Workflow

1. Product enters queue with `PENDING_REVIEW` status
2. Moderator reviews product details
3. Actions:
   - **Approve**: Status → `VALIDATED`
   - **Reject**: Status → `REJECTED`
   - **Merge**: Status → `MERGED`, prices moved to target

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/akiprisaye"

# Scheduler
ENABLE_SCHEDULER=true  # Enable/disable scheduler (default: production only)

# Node Environment
NODE_ENV=production
```

## Development

### Install Dependencies

```bash
cd backend
npm install
```

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Run Migrations

```bash
npm run prisma:migrate
```

### Start Development Server

```bash
npm run dev
```

The scheduler is **disabled** by default in development. To enable:

```bash
ENABLE_SCHEDULER=true npm run dev
```

### Manual Testing

```bash
# Trigger a sync manually
curl -X POST http://localhost:3001/api/sync/openfoodfacts/trigger

# Check sync status
curl http://localhost:3001/api/sync/status

# View validation queue
curl http://localhost:3001/api/validation/queue
```

## Production Deployment

1. **Set environment variables**
   ```bash
   DATABASE_URL=<production-db-url>
   NODE_ENV=production
   ```

2. **Run migrations**
   ```bash
   npm run prisma:migrate:deploy
   ```

3. **Start server**
   ```bash
   npm run start
   ```

The scheduler starts automatically in production mode.

## Monitoring

### Sync Logs

All synchronization runs are logged in the `SyncLog` table:

```typescript
{
  source: 'OPENFOODFACTS',
  startedAt: '2024-01-01T03:00:00Z',
  completedAt: '2024-01-01T03:15:00Z',
  status: 'completed',
  itemsProcessed: 1500,
  itemsCreated: 45,
  itemsUpdated: 12,
  itemsSkipped: 1443,
  errors: []
}
```

### Validation Statistics

Track validation queue metrics:

```bash
GET /api/validation/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "pending": 156,
    "validated": 2341,
    "rejected": 23,
    "merged": 45,
    "bySource": {
      "OCR": 89,
      "OPENFOODFACTS": 34,
      "OPENPRICES": 33
    }
  }
}
```

## Best Practices

### 1. Regular Monitoring
- Check sync logs daily
- Monitor validation queue size
- Review rejected products periodically

### 2. Rate Limiting
- Respect external API rate limits
- Adjust delays if receiving 429 errors
- Monitor API response times

### 3. Data Quality
- Review fuzzy matches manually
- Keep deduplication threshold high (0.85+)
- Validate OCR products thoroughly

### 4. Performance
- Use shared Prisma client (singleton)
- Batch operations where possible
- Index frequently queried fields

## Troubleshooting

### Sync Failures

**Problem**: Sync job fails repeatedly

**Solutions**:
1. Check network connectivity to external APIs
2. Verify API URLs are correct
3. Review rate limiting settings
4. Check database connection

### Duplicate Products

**Problem**: Same product appearing multiple times

**Solutions**:
1. Run cleanup duplicates job manually
2. Adjust fuzzy matching threshold
3. Review normalization rules
4. Check EAN data quality

### High Validation Queue

**Problem**: Too many products pending review

**Solutions**:
1. Increase auto-validation threshold
2. Add more moderators
3. Improve source data quality
4. Reduce sync frequency

## Security Considerations

1. **API Keys**: Store external API keys in environment variables
2. **Rate Limiting**: Prevent abuse of sync endpoints
3. **Input Validation**: Sanitize all external data
4. **Authentication**: Protect admin endpoints (validation, sync triggers)
5. **SQL Injection**: Use Prisma parameterized queries

## Future Enhancements

- [ ] OCR service integration for receipt scanning
- [ ] Machine learning for auto-validation confidence
- [ ] Bulk import/export functionality
- [ ] Admin dashboard for monitoring
- [ ] Webhook notifications for sync events
- [ ] Advanced fuzzy matching (Jaro-Winkler, etc.)
- [ ] Multi-language product name matching
- [ ] Image comparison for duplicate detection

## License

This system uses data from:
- [Open Food Facts](https://openfoodfacts.org) - ODbL license
- [Open Prices](https://prices.openfoodfacts.org) - ODbL license

## Support

For issues or questions:
- GitHub Issues: https://github.com/teetee971/akiprisaye-web/issues
- Email: contact@akiprisaye.com
