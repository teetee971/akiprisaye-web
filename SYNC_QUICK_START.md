# Quick Start Guide: Product Sync System

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ installed
- PostgreSQL database running
- npm or yarn package manager

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and set DATABASE_URL
   ```

4. **Generate Prisma client and run migrations**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## 🧪 Quick Test

### 1. Check Server Health

```bash
curl http://localhost:3001/api/sync/status
```

Expected response:
```json
{
  "success": true,
  "syncs": [],
  "jobs": [...]
}
```

### 2. Trigger a Manual Sync

```bash
# Trigger Open Food Facts sync
curl -X POST http://localhost:3001/api/sync/openfoodfacts/trigger

# Response:
{
  "success": true,
  "message": "Open Food Facts sync triggered"
}
```

### 3. Monitor Sync Progress

```bash
# Check sync history
curl http://localhost:3001/api/sync/history?limit=5
```

### 4. View Validation Queue

```bash
curl http://localhost:3001/api/validation/queue?limit=10
```

## 📊 Example Workflows

### Workflow 1: Manual Product Import

```bash
# 1. Trigger sync
curl -X POST http://localhost:3001/api/sync/openfoodfacts/trigger

# 2. Wait a few seconds...

# 3. Check results
curl http://localhost:3001/api/sync/history?limit=1

# 4. View new products in queue
curl http://localhost:3001/api/validation/queue
```

### Workflow 2: Product Validation

```bash
# 1. Get validation stats
curl http://localhost:3001/api/validation/stats

# 2. Get product details
curl http://localhost:3001/api/validation/{product_id}

# 3. Approve product
curl -X POST http://localhost:3001/api/validation/{product_id}/approve \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy": "admin_user"}'
```

### Workflow 3: Duplicate Management

```bash
# 1. Get duplicates (run cleanup job)
curl -X POST http://localhost:3001/api/sync/jobs/cleanup:duplicates/trigger

# 2. Manually merge if needed
curl -X POST http://localhost:3001/api/validation/{duplicate_id}/merge/{target_id} \
  -H "Content-Type: application/json" \
  -d '{"reviewedBy": "admin_user"}'
```

## 🛠️ Configuration

### Enable Scheduler in Development

By default, the scheduler is disabled in development mode. To enable:

```bash
ENABLE_SCHEDULER=true npm run dev
```

### Adjust Sync Frequency

Edit `backend/src/config/syncConfig.ts`:

```typescript
scheduler: {
  jobs: {
    syncOpenFoodFacts: '0 */6 * * *', // Change to every 6 hours
    syncOpenPrices: '0 * * * *',      // Change to every hour
    // ...
  }
}
```

### Modify Rate Limits

```typescript
openFoodFacts: {
  rateLimit: 50,        // Reduce to 50 req/min
  rateLimitDelay: 1200, // 1200ms = 50 req/min
}
```

## 🔍 Debugging

### View Prisma Queries

Set in `.env`:
```env
NODE_ENV=development
```

Prisma will log all queries to console.

### Check Sync Logs

```bash
# View last 10 syncs
curl http://localhost:3001/api/sync/history?limit=10
```

### Monitor Jobs

```bash
# Get job status
curl http://localhost:3001/api/sync/jobs
```

## 📝 Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build TypeScript
npm run start                  # Start production server

# Database
npm run prisma:generate        # Generate Prisma client
npm run prisma:migrate         # Run migrations
npm run prisma:studio          # Open Prisma Studio

# Testing
npm test                       # Run tests
npm run lint                   # Lint code
```

## 🐛 Troubleshooting

### Problem: Sync fails with 429 error
**Solution**: Increase `rateLimitDelay` in config

### Problem: Products not appearing
**Solution**: Check validation queue - products may need approval

### Problem: Duplicate products
**Solution**: Run cleanup job:
```bash
curl -X POST http://localhost:3001/api/sync/jobs/cleanup:duplicates/trigger
```

### Problem: Database connection error
**Solution**: Verify `DATABASE_URL` in `.env` is correct

## 📚 Next Steps

1. **Read Full Documentation**: See `SYNC_SYSTEM_README.md`
2. **Explore API**: Check `backend/src/api/routes/`
3. **Customize Config**: Edit `backend/src/config/syncConfig.ts`
4. **Add Tests**: Create tests for your use cases

## 🆘 Need Help?

- Documentation: `SYNC_SYSTEM_README.md`
- Issues: https://github.com/teetee971/akiprisaye-web/issues
- Email: contact@akiprisaye.com
