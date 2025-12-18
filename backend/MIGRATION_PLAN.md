# Backend API - A KI PRI SA YÉ

## 🎯 Architecture

Node.js 20 + TypeScript backend for A KI PRI SA YÉ civic platform.

### Stack
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js (planned)
- **Database**: PostgreSQL (production) / In-memory (dev)
- **Authentication**: JWT (planned)
- **Payment**: Stripe (abstracted)

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── User.ts              ✅ User model (minimal data collection)
│   │   ├── Subscription.ts      ✅ Subscription management
│   │   └── PriceRecord.ts       ✅ Price data with source tracking
│   ├── services/
│   │   ├── PlanService.ts       ✅ Feature access control
│   │   ├── PriceAggregator.ts   ✅ Price comparison & optimization
│   │   ├── DistanceCalculator.ts ✅ Multi-trip route optimization
│   │   └── PredictionEngine.ts   ✅ Statistical price predictions
│   ├── controllers/
│   │   └── SubscriptionController.ts ✅ Subscription CRUD
│   └── routes/ (to be created)
├── package.json
└── README.md
```

---

## 🗄️ Data Models

### User Model
Minimal data collection (RGPD compliant):
```typescript
interface User {
  id: string;
  email: string;           // Required for billing
  territory: string;       // For personalization (GP, MQ, etc.)
  role: 'citizen' | 'pro' | 'org';
  createdAt: Date;
  lastLogin?: Date;
}
```

### Subscription Model
```typescript
interface Subscription {
  id: string;
  userId: string;
  plan: 'FREE' | 'CITIZEN_PREMIUM' | 'PRO' | 'BUSINESS' | 'ENTERPRISE' | 'INSTITUTION';
  status: 'active' | 'canceled' | 'expired' | 'past_due';
  billingCycle: 'monthly' | 'yearly';
  price: number;
  currency: 'EUR';
  startedAt: Date;
  endsAt?: Date;
  canceledAt?: Date;
  stripeSubscriptionId?: string;
}
```

### PriceRecord Model
All prices MUST have source tracking:
```typescript
interface PriceRecord {
  id: string;
  ean: string;
  productName: string;
  price: number;
  unit: string;
  
  // MANDATORY source tracking
  source: 'INSEE' | 'OPMR' | 'DGCCRF' | 'DATA_GOUV' | 'OPEN_FOOD_FACTS';
  sourceUrl?: string;
  sourceDate: Date;
  
  // Location
  territory: string;
  storeId?: string;
  storeName?: string;
  storeChain?: string;
  
  // Metadata
  collectedAt: Date;
  validUntil?: Date;
  isVerified: boolean;
  confidence: number; // 0-100
}
```

---

## 🔌 Services

### PriceAggregator
Aggregates and compares prices from official sources.

**Key Methods**:
- `comparePrices(ean, territory)` - Compare prices across stores
- `getPriceHistory(ean, territory, months)` - Get historical data
- `detectTrends(ean, territory)` - Detect price trends
- `optimizeMultiStore(shoppingList, territory)` - Find best store combination

### DistanceCalculator
Calculates distances and optimizes shopping routes.

**Key Methods**:
- `calculateDistance(point1, point2)` - Haversine distance
- `findNearestStores(userLocation, stores)` - Find nearby stores
- `calculateFuelCost(distance, fuelPrice)` - Estimate fuel cost
- `optimizeRoute(start, stores)` - Nearest neighbor algorithm
- `compareShoppingScenarios()` - Single vs multi-store comparison

### PredictionEngine
Simple statistical predictions (NO opaque AI).

**Key Methods**:
- `predictPrices(historicalPrices, ean, productName, territory, months)` - Generate predictions
- `calculateLinearTrend(prices)` - Linear regression analysis
- `getInflationImpact(territory)` - Get local inflation rate

**Methodology**:
- Moving average (3-month window)
- Linear trend analysis
- Seasonal adjustment (basic)
- ±15% margin of error
- **TRANSPARENT**: No black-box ML models

---

## 📊 PostgreSQL Migration Plan

### Current State
- In-memory stores for development
- Data lost on restart
- Not production-ready

### Target State
- PostgreSQL 14+ database
- Persistent data storage
- Scalable and reliable

### Migration Steps

#### 1. Database Setup

**Install PostgreSQL**:
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Docker
docker run --name akiprisaye-db -e POSTGRES_PASSWORD=yourpassword -d postgres:14
```

**Create Database**:
```sql
CREATE DATABASE akiprisaye_prod;
CREATE USER akiprisaye_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE akiprisaye_prod TO akiprisaye_user;
```

#### 2. Schema Creation

**Users Table**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  territory VARCHAR(2) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_territory (territory)
);
```

**Subscriptions Table**:
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  billing_cycle VARCHAR(10) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMP,
  canceled_at TIMESTAMP,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_stripe_id (stripe_subscription_id)
);
```

**Price Records Table**:
```sql
CREATE TABLE price_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ean VARCHAR(13) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  
  source VARCHAR(50) NOT NULL,
  source_url TEXT,
  source_date DATE NOT NULL,
  
  territory VARCHAR(2) NOT NULL,
  store_id VARCHAR(100),
  store_name VARCHAR(255),
  store_chain VARCHAR(100),
  
  collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  confidence INTEGER DEFAULT 50,
  
  INDEX idx_ean (ean),
  INDEX idx_territory (territory),
  INDEX idx_source (source),
  INDEX idx_collected_at (collected_at),
  INDEX idx_ean_territory (ean, territory)
);
```

#### 3. ORM/Query Builder

**Option A: Prisma (Recommended)**
```bash
npm install prisma @prisma/client
npx prisma init
```

**Option B: TypeORM**
```bash
npm install typeorm pg
```

**Option C: Native pg + SQL**
```bash
npm install pg
```

#### 4. Code Migration

**Update Models**:
- Replace in-memory Maps with database queries
- Add connection pooling
- Implement proper error handling

**Example (Prisma)**:
```typescript
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  territory String
  role      String   @default("citizen")
  createdAt DateTime @default(now())
  lastLogin DateTime?
  subscriptions Subscription[]
}

// src/models/User.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class UserStore {
  async create(data: Omit<User, 'id' | 'createdAt'>) {
    return await prisma.user.create({ data });
  }
  
  async findByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }
}
```

#### 5. Environment Variables

**.env**:
```env
DATABASE_URL="postgresql://akiprisaye_user:password@localhost:5432/akiprisaye_prod"
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 6. Migrations

**Using Prisma**:
```bash
# Create migration
npx prisma migrate dev --name init

# Apply to production
npx prisma migrate deploy

# Generate client
npx prisma generate
```

#### 7. Data Seeding

**seed.ts**:
```typescript
// Seed initial data from official sources
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Seed from INSEE data
  // Seed from OPMR bulletins
  // etc.
}
```

#### 8. Connection Pooling

**config/database.ts**:
```typescript
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### 9. Backup Strategy

**Daily Backups**:
```bash
# Automated backup script
pg_dump akiprisaye_prod > backup_$(date +%Y%m%d).sql

# Restore
psql akiprisaye_prod < backup_20241218.sql
```

**Retention Policy**:
- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months

#### 10. Testing

**Integration Tests**:
```typescript
import { PrismaClient } from '@prisma/client';

describe('User Model', () => {
  let prisma: PrismaClient;
  
  beforeAll(async () => {
    prisma = new PrismaClient();
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  it('should create user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        territory: 'GP',
        role: 'citizen',
      },
    });
    
    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
});
```

---

## 🚀 Development

### Current (In-Memory)

```bash
cd backend
npm install
npm run dev
```

### After PostgreSQL Migration

```bash
# Setup database
createdb akiprisaye_dev
npx prisma migrate dev

# Start server
npm run dev

# Run tests
npm test
```

---

## 🔐 Security

### Data Protection
- Passwords hashed with bcrypt
- JWT tokens for authentication
- Stripe handles payment data (PCI-DSS compliant)
- HTTPS only in production
- Rate limiting on API endpoints

### RGPD Compliance
- Minimal data collection
- Data deletion on request
- Export user data on request
- Audit logs for data access

---

## 📈 Performance Optimization

### Database Indexes
- EAN + Territory composite index
- Email unique index
- Date range indexes for historical queries

### Caching Strategy
- Redis for frequently accessed data
- CDN for static assets
- Service worker for offline mode

### Query Optimization
- Connection pooling
- Prepared statements
- Pagination for large result sets
- Avoid N+1 queries

---

## 📞 Production Deployment

### Environment
- **Hosting**: Cloudflare Workers / Railway / Render
- **Database**: Managed PostgreSQL (Supabase / Neon / Railway)
- **Monitoring**: Sentry for errors
- **Logs**: Winston + CloudWatch

### Checklist
- [ ] PostgreSQL migration complete
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Backup automation configured
- [ ] Error monitoring enabled
- [ ] Load testing completed
- [ ] Security audit passed

---

## 📚 API Documentation

See `API.md` for complete endpoint documentation (to be created).

**Example Endpoints**:
- `GET /api/prices?ean={ean}&territory={territory}` - Get prices
- `POST /api/subscriptions` - Create subscription
- `GET /api/predictions/{ean}` - Get price predictions

---

**Last Updated**: December 2024  
**Status**: PostgreSQL migration pending  
**Contact**: dev@akiprisaye.fr
