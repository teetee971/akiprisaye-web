# A KI PRI SA YÉ - Civic Glass Implementation

## Overview

This implementation provides the complete civic glass design system and data infrastructure for the A KI PRI SA YÉ platform, following the specifications for transparency and institutional design.

## Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node 20 + TypeScript (REST API)
- **CI/CD**: GitHub Actions → Cloudflare Pages
- **Design**: Civic Glass (glassmorphism with institutional aesthetics)
- **Data**: Public sources only with proper attribution

## Structure

### Frontend Components

#### Types (`src/types/civic.ts`)
```typescript
- CivicSource: Official data source with name and URL
- CivicNewsItem: News with category, territory, and source
- PriceRecord: Product price with territory and source
```

#### UI Components (`src/components/ui/`)
- **GlassContainer**: Large glassmorphic container for main sections
- **GlassCard**: Medium glassmorphic card for content display
- **CivicBadge**: Category badge with civic styling
- **SourceFooter**: Official source attribution with clickable link

#### Pages (`src/pages/`)
- **News.tsx**: News feed with civic glass styling and source attribution
- Additional pages in `frontend/src/pages/` (Home, Compare, Pricing)

#### Libraries (`src/lib/`)
- **api.ts**: API client for news and price data
- **pricing.ts**: Pricing tiers and feature access control

### Backend API

#### Controllers (`backend/src/controllers/`)
- **news.controller.ts**: Handles GET /api/news
- **prices.controller.ts**: Handles GET /api/prices and /api/prices/prediction

#### Services (`backend/src/services/`)
- **publicData.service.ts**: Fetches news from public sources (e.g., DGCCRF)
- **priceData.service.ts**: Manages price records from official sources
- **prediction.service.ts**: Price trend analysis based on historical data

#### Server (`backend/src/server.ts`)
- Express server with CORS enabled
- REST API endpoints
- Health check endpoint

## Data Sources

All data comes from official public sources:
- DGCCRF (Direction Générale de la Concurrence, de la Consommation et de la Répression des Fraudes)
- data.gouv.fr
- Other official government APIs

Every data point displayed includes:
1. Source name
2. Clickable link to official source
3. Proper attribution in footer

## Pricing Plans

```typescript
FREE: 0€
CITIZEN: 3.99€/month
PRO: 19€/month
ENTERPRISE: 2,500€ - 25,000€/year
INSTITUTION: 500€ - 50,000€/year
```

## API Endpoints

### GET /api/news
Returns civic news items with source attribution

### GET /api/prices
Query params: `product`, `territory`
Returns price records filtered by parameters

### GET /api/prices/prediction
Query params: `product`, `territory`
Returns price trend prediction with disclaimer

## Build & Deployment

### Local Development
```bash
npm ci
npm run dev
```

### Production Build
```bash
npm ci
npm run build
# Output: dist/
```

### Deployment
Automated via GitHub Actions to Cloudflare Pages:
1. Node 20 environment
2. npm ci
3. npm run build
4. Deploy dist/ to Cloudflare Pages

## Design System - Civic Glass

The Civic Glass design uses:
- Glassmorphism effects (`backdrop-blur`, semi-transparent backgrounds)
- Institutional color palette (blues, grays)
- High contrast for accessibility
- Clear data attribution
- Professional, trustworthy aesthetic

## Security

✅ CodeQL scan: 0 vulnerabilities
✅ Public data only
✅ Proper CORS configuration
✅ Source attribution on all data
✅ No sensitive data collection

## Type Safety

- Full TypeScript coverage
- Shared types between frontend and backend
- Strict type checking enabled
- No `any` types in production code

## Notes

- Mock data is clearly marked and documented
- In production, services would connect to real public APIs
- All predictions include disclaimer about data limitations
- Source links open in new tabs with proper security attributes
