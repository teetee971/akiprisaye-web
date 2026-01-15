# 🚀 Advanced Features Implementation Roadmap (v7.0.0)

## Overview

This document outlines the implementation plan for 5 major advanced features requested to enhance the Akiprisaye price comparison platform for citizen empowerment in French overseas territories.

**Status**: Planning Complete | Implementation Required
**Target Version**: 7.0.0
**Estimated Effort**: 3-4 weeks full-time development
**Lines of Code**: ~8,000-10,000 LOC
**New Files**: ~35-40 files

---

## 🔔 Feature 1: Price Alerts System

### Objective
Allow users to create personalized price alerts and receive notifications when conditions are met.

### Components to Create

#### Types (`src/types/alerts.ts`)
```typescript
export type AlertType = 'target_price' | 'price_drop' | 'percentage_drop' | 'price_increase';
export type AlertStatus = 'active' | 'triggered' | 'expired' | 'paused';
export type NotificationMethod = 'email' | 'push' | 'sms';

export interface PriceAlert {
  id: string;
  userId?: string;
  productEAN: string;
  productName: string;
  alertType: AlertType;
  targetPrice?: number;
  percentageThreshold?: number;
  territory: TerritoryCode;
  storeIds?: string[];
  status: AlertStatus;
  notificationMethods: NotificationMethod[];
  createdAt: string;
  lastChecked?: string;
  triggeredAt?: string;
  expiresAt?: string;
}

export interface AlertSettings {
  enabled: boolean;
  checkFrequency: 'hourly' | 'daily' | 'weekly';
  maxActiveAlerts: number;
  defaultExpiryDays: number;
}
```

#### Service (`src/services/alertService.ts`)
- `createAlert(alert: PriceAlert): Promise<PriceAlert>`
- `updateAlert(id: string, updates: Partial<PriceAlert>): Promise<void>`
- `deleteAlert(id: string): Promise<void>`
- `getAlerts(userId?: string): Promise<PriceAlert[]>`
- `checkAlerts(): Promise<PriceAlert[]>` // Check all active alerts
- `triggerAlert(alert: PriceAlert, currentPrice: number): Promise<void>`
- Storage: LocalStorage for MVP, backend integration ready

#### Components
1. **`AlertForm.tsx`** - Create/edit alert form with validation
2. **`AlertList.tsx`** - Display all alerts with filters
3. **`AlertCard.tsx`** - Individual alert display card
4. **`AlertBadge.tsx`** - Status badge (active/triggered/expired)
5. **`AlertNotification.tsx`** - Toast/banner when alert triggers

#### Page (`src/pages/PriceAlerts.tsx`)
- Full alert management dashboard
- Create new alert button
- List of active alerts with quick actions
- Alert history section
- Settings panel

### User Flow
1. User searches for product
2. Clicks "Create Alert" button
3. Selects alert type and threshold
4. System monitors prices
5. Notification sent when condition met
6. User can view/manage alerts dashboard

### Technical Considerations
- Use LocalStorage for alert persistence (MVP)
- Background check every page load (future: service worker)
- Email integration ready (SendGrid/AWS SES)
- Push notifications via service worker (PWA)

---

## 📊 Feature 2: Detailed Price History with Charts

### Objective
Visualize price evolution over time with interactive charts for informed decision-making.

### Components to Create

#### Types (`src/types/priceHistory.ts`)
```typescript
export interface PriceHistoryPoint {
  date: string;
  price: number;
  storeId: string;
  storeName: string;
  reliability: number;
  source: string;
}

export interface PriceTimeSeries {
  productEAN: string;
  productName: string;
  territory: TerritoryCode;
  dataPoints: PriceHistoryPoint[];
  statistics: {
    min: number;
    max: number;
    average: number;
    median: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

export type Timeframe = '7d' | '30d' | '90d' | '365d' | 'all';

export interface ChartConfig {
  timeframe: Timeframe;
  showAllStores: boolean;
  selectedStoreIds: string[];
  showTrendLine: boolean;
  showAverageLine: boolean;
}
```

#### Service (`src/services/historyService.ts`)
- `getPriceHistory(ean: string, timeframe: Timeframe): Promise<PriceTimeSeries>`
- `getMultiStoreHistory(ean: string, storeIds: string[]): Promise<Map<string, PriceHistoryPoint[]>>`
- `detectSeasonalPatterns(history: PriceTimeSeries): SeasonalPattern[]`
- `calculatePriceStatistics(dataPoints: PriceHistoryPoint[]): Statistics`
- `exportHistoryData(history: PriceTimeSeries, format: 'csv' | 'json'): Blob`

#### Components
1. **`PriceHistoryChart.tsx`** - Main interactive chart (Recharts/Chart.js)
2. **`TimeframeSelector.tsx`** - 7d/30d/90d/365d buttons
3. **`StoreComparisonChart.tsx`** - Multi-line chart for store comparison
4. **`PriceStatisticsPanel.tsx`** - Min/max/avg/median display
5. **`SeasonalPatternsCard.tsx`** - Highlight recurring patterns
6. **`HistoryExportButton.tsx`** - Export CSV/JSON functionality

#### Page (`src/pages/PriceHistory.tsx`)
- Product selector (from search)
- Interactive price chart
- Timeframe selector
- Store filter checkboxes
- Statistics dashboard
- Export options

### Chart Features
- **Line chart** showing price over time
- **Multiple lines** for store comparison
- **Trend line** (linear regression)
- **Average line** (horizontal reference)
- **Hover tooltips** with details
- **Zoom/pan** for detailed analysis
- **Responsive** mobile-optimized

### Data Requirements
- Historical price data (currently have 7 days, can simulate longer)
- Store metadata
- Product information
- Reliability scores

---

## 🛒 Feature 3: Smart Shopping List with Budget Optimization

### Objective
Help users optimize their shopping by calculating best routes and minimizing total cost across multiple stores.

### Components to Create

#### Types (`src/types/shoppingList.ts`)
```typescript
export interface ShoppingListItem {
  id: string;
  productEAN: string;
  productName: string;
  quantity: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  addedAt: string;
}

export interface BudgetOptimization {
  totalBudget: number;
  currentTotal: number;
  savings: number;
  stores: StoreAllocation[];
  route: string[]; // Store IDs in optimal order
  estimatedTime: number; // minutes
  estimatedDistance: number; // km
}

export interface StoreAllocation {
  storeId: string;
  storeName: string;
  items: {
    ean: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  territory: TerritoryCode;
  createdAt: string;
  updatedAt: string;
  optimization?: BudgetOptimization;
}
```

#### Service (`src/services/shoppingListService.ts`)
- `createList(name: string): Promise<ShoppingList>`
- `addItem(listId: string, item: ShoppingListItem): Promise<void>`
- `removeItem(listId: string, itemId: string): Promise<void>`
- `optimizeBudget(list: ShoppingList): Promise<BudgetOptimization>`
- `calculateOptimalRoute(storeIds: string[], userLocation?: Coordinates): string[]`
- `getSimilarProducts(ean: string): Promise<Product[]>` // Cheaper alternatives
- `exportList(list: ShoppingList, format: 'pdf' | 'text'): Blob`

#### Optimization Algorithm
```typescript
// Knapsack-style optimization:
// 1. For each product, find all stores with prices
// 2. Sort by price (consider distance/convenience factor)
// 3. Allocate items to stores minimizing total cost
// 4. Apply constraints (max stores, distance, etc.)
// 5. Calculate optimal route using TSP approximation
```

#### Components
1. **`ShoppingListManager.tsx`** - Main list interface
2. **`AddItemForm.tsx`** - Search and add products
3. **`ItemCard.tsx`** - Individual item in list
4. **`BudgetOptimizer.tsx`** - Show optimization results
5. **`StoreAllocationCard.tsx`** - Items per store
6. **`RouteMap.tsx`** - Visual store route (optional map integration)
7. **`SuggestedAlternatives.tsx`** - Cheaper product suggestions

#### Page (`src/pages/SmartShoppingList.tsx`)
- Create/manage multiple lists
- Add items via search
- Optimize button
- View results (store allocation + route)
- Budget tracking
- Save/load lists

### Algorithm Details
**Objective**: Minimize total cost while considering constraints
- **Inputs**: List of products, available stores, prices
- **Constraints**: Max stores to visit, max distance, time limit
- **Outputs**: Store allocation, optimal route, total cost

**Approach**:
1. Build price matrix (products × stores)
2. Apply greedy algorithm with local optimization
3. Consider user preferences (favorite stores, max stores)
4. Calculate route using nearest neighbor TSP approximation
5. Return optimized plan

---

## 👥 Feature 4: Citizen Contribution System

### Objective
Empower citizens to contribute price observations and build community-validated data.

### Components to Create

#### Types (`src/types/contribution.ts`)
```typescript
export type ContributionStatus = 'pending' | 'validated' | 'rejected' | 'flagged';
export type ContributionSource = 'manual' | 'receipt_scan' | 'barcode_scan';

export interface PriceContribution {
  id: string;
  userId?: string;
  username?: string;
  productEAN: string;
  productName: string;
  price: number;
  storeId: string;
  storeName: string;
  territory: TerritoryCode;
  observationDate: string;
  submittedAt: string;
  status: ContributionStatus;
  source: ContributionSource;
  receiptPhoto?: string; // Base64 or URL
  validations: ContributionValidation[];
  points: number;
}

export interface ContributionValidation {
  userId: string;
  vote: 'confirm' | 'reject' | 'unsure';
  comment?: string;
  timestamp: string;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number; // Contributions needed
}

export interface UserStats {
  userId: string;
  totalContributions: number;
  validatedContributions: number;
  points: number;
  level: number;
  badges: UserBadge[];
  rank?: number; // Global or territory rank
}
```

#### Service (`src/services/contributionService.ts`)
- `submitContribution(contribution: PriceContribution): Promise<string>`
- `validateContribution(contributionId: string, validation: ContributionValidation): Promise<void>`
- `getPendingContributions(): Promise<PriceContribution[]>`
- `getUserContributions(userId: string): Promise<PriceContribution[]>`
- `getUserStats(userId: string): Promise<UserStats>`
- `awardBadge(userId: string, badgeId: string): Promise<void>`
- `checkBadgeEligibility(userId: string): Promise<UserBadge[]>`

#### Components
1. **`ContributionForm.tsx`** - Submit new price observation
2. **`ProductSearch.tsx`** - Search product by name/EAN/barcode
3. **`StoreSelector.tsx`** - Select store from list
4. **`PhotoUpload.tsx`** - Upload receipt photo (future OCR)
5. **`ValidationQueue.tsx`** - Community validation interface
6. **`ContributionCard.tsx`** - Display single contribution
7. **`UserProfile.tsx`** - Stats, badges, history
8. **`BadgeDisplay.tsx`** - Visual badge showcase
9. **`Leaderboard.tsx`** - Top contributors

#### Page (`src/pages/CitizenContribution.tsx`)
- Tabs: Submit | Validate | My Contributions | Profile
- Submit form with validation
- Pending contributions for validation
- User statistics dashboard
- Leaderboard

### Gamification System
**Points**:
- Submit contribution: +10 points
- Validated contribution: +20 points bonus
- Validate others: +5 points
- Correct validation: +10 points bonus

**Levels**:
- Level 1-5: Novice
- Level 6-10: Contributor
- Level 11-15: Expert
- Level 16-20: Master
- Level 21+: Legend

**Badges**:
- First Contribution
- 10 Contributions
- 50 Contributions
- 100 Contributions
- Validation Expert (100 validations)
- Price Detective (found anomaly)
- Territory Champion (most in territory)

### Validation Rules
- Need 3+ validations to accept
- 66%+ confirm votes → Validated
- 66%+ reject votes → Rejected
- Otherwise → Pending more votes
- Flagged if suspicious (price anomaly)

---

## 📈 Feature 5: Local Inflation Dashboard

### Objective
Provide transparent insights into price evolution, inflation, and purchasing power across territories.

### Components to Create

#### Types (`src/types/inflation.ts`)
```typescript
export interface CategoryInflation {
  category: string;
  currentAverage: number;
  previousAverage: number;
  inflationRate: number; // Percentage
  priceChange: number; // Absolute
  products: {
    ean: string;
    name: string;
    change: number;
  }[];
}

export interface TerritoryInflation {
  territory: TerritoryCode;
  territoryName: string;
  overallInflationRate: number;
  categories: CategoryInflation[];
  comparedToMetropole?: number; // Price gap percentage
  lastUpdated: string;
}

export interface InflationMetrics {
  territories: TerritoryInflation[];
  timeframe: '1m' | '3m' | '6m' | '1y';
  referenceDate: string;
  comparisonDate: string;
}

export interface PurchasingPowerIndex {
  territory: TerritoryCode;
  index: number; // 100 = baseline
  change: number; // vs previous period
  categories: {
    category: string;
    affordability: number; // Products affordable with median income
  }[];
}
```

#### Service (`src/services/inflationService.ts`)
- `calculateInflation(timeframe: string): Promise<InflationMetrics>`
- `getCategoryInflation(category: string, territory: TerritoryCode): Promise<CategoryInflation>`
- `compareTerritories(): Promise<TerritoryInflation[]>`
- `calculatePurchasingPower(territory: TerritoryCode): Promise<PurchasingPowerIndex>`
- `getTopPriceIncreases(limit: number): Promise<Product[]>`
- `getTopPriceDecreases(limit: number): Promise<Product[]>`
- `exportInflationReport(format: 'pdf' | 'excel'): Promise<Blob>`

#### Components
1. **`InflationOverview.tsx`** - Overall inflation rate and trend
2. **`TerritoryComparison.tsx`** - Bar chart comparing territories
3. **`CategoryBreakdown.tsx`** - Inflation by category
4. **`PurchasingPowerIndicator.tsx`** - Affordability index
5. **`PriceChanges.tsx`** - Top increases/decreases tables
6. **`MetropoleGapChart.tsx`** - Overseas vs metropolitan France
7. **`ReportExporter.tsx`** - PDF/Excel export button
8. **`InflationTimeline.tsx`** - Historical inflation chart
9. **`ProductImpactCard.tsx`** - Individual product contribution

#### Page (`src/pages/InflationDashboard.tsx`)
- Overview section with key metrics
- Territory comparison charts
- Category breakdown
- Top movers (increases/decreases)
- Purchasing power analysis
- Export reports button
- Filters: timeframe, territory, category

### Calculations

**Inflation Rate**:
```typescript
inflationRate = ((currentAverage - previousAverage) / previousAverage) * 100
```

**Category Average**:
```typescript
categoryAverage = sum(productPrices) / count(products)
```

**Territory Inflation**:
```typescript
territoryInflation = weightedAverage(categoryInflations, weights)
// Weights based on category importance in consumer basket
```

**Purchasing Power Index**:
```typescript
// Baseline: 100 = reference period/territory
index = (referenceBasket / currentBasket) * 100
// Where basket = sum(category prices × category weights)
```

### Visualizations
- **Line charts**: Inflation over time
- **Bar charts**: Territory comparison
- **Heatmap**: Category × Territory inflation matrix
- **Treemap**: Product contribution to inflation
- **Gauge chart**: Purchasing power indicator

### Data Sources
- Historical price observations
- Current price database
- Product categories
- Territory metadata
- Consumer basket weights (typical expenditure)

---

## 📋 Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create all TypeScript types/interfaces
- [ ] Set up local storage utilities
- [ ] Install chart libraries (Recharts)
- [ ] Create base service classes
- [ ] Set up routing for new pages

### Phase 2: Core Services (Week 1-2)
- [ ] Implement alertService.ts
- [ ] Implement historyService.ts
- [ ] Implement shoppingListService.ts
- [ ] Implement contributionService.ts
- [ ] Implement inflationService.ts
- [ ] Add unit tests for services

### Phase 3: UI Components (Week 2-3)
- [ ] Build alert system components (5 components)
- [ ] Build history chart components (6 components)
- [ ] Build shopping list components (7 components)
- [ ] Build contribution components (9 components)
- [ ] Build inflation dashboard components (9 components)
- [ ] Add component tests

### Phase 4: Pages & Integration (Week 3)
- [ ] Create PriceAlerts page
- [ ] Create PriceHistory page
- [ ] Create SmartShoppingList page
- [ ] Create CitizenContribution page
- [ ] Create InflationDashboard page
- [ ] Integrate with existing navigation
- [ ] Add page-level tests

### Phase 5: Polish & Documentation (Week 4)
- [ ] Mobile responsiveness testing
- [ ] Accessibility improvements (ARIA labels, keyboard nav)
- [ ] Error handling and loading states
- [ ] Performance optimization
- [ ] User documentation
- [ ] API documentation
- [ ] Deployment preparation

---

## 🔧 Technical Requirements

### Dependencies to Add
```json
{
  "recharts": "^2.10.0", // Charts library
  "jspdf": "^2.5.1", // PDF export
  "xlsx": "^0.18.5", // Excel export
  "date-fns": "^2.30.0", // Date manipulation
  "lodash": "^4.17.21" // Utility functions
}
```

### Browser APIs Used
- LocalStorage (alert persistence, lists)
- File API (photo uploads)
- Geolocation (optional, for route optimization)
- Service Worker (optional, for push notifications)

### Performance Considerations
- Lazy load charts (code splitting)
- Virtual scrolling for long lists
- Debounce search inputs
- Cache API responses
- Optimize image uploads
- Minimize bundle size

---

## 🎯 Success Metrics

### User Engagement
- Number of alerts created
- Alert trigger rate
- Price history page views
- Shopping lists created
- Contributions submitted
- Dashboard usage time

### Data Quality
- Contribution validation rate
- Validation accuracy
- Price observation coverage
- Community participation

### Platform Value
- User retention
- Feature adoption rate
- Time saved (shopping optimization)
- Money saved (alerts + optimization)
- Community growth

---

## 🚧 Future Enhancements

### Phase 2 (Post v7.0.0)
- **OCR Integration**: Automatic receipt scanning
- **Backend API**: Move from LocalStorage to API
- **Real-time Notifications**: Email/SMS/Push
- **Mobile App**: React Native version
- **Advanced ML**: Better price predictions with ARIMA/Prophet
- **Social Features**: Share lists, follow users
- **Partnerships**: Official data sources (INSEE, DGCCRF)
- **Geolocation**: Automatic store detection
- **Voice Interface**: "Alexa, add milk to my list"
- **Blockchain**: Immutable price history

### Integration Opportunities
- Government open data APIs
- Supermarket loyalty programs
- Consumer associations
- Local media outlets
- Educational institutions

---

## 📞 Support & Feedback

This roadmap is a living document. Features may be adjusted based on:
- User feedback
- Technical constraints
- Resource availability
- Priority changes

**Questions or suggestions?** Open an issue or contact the development team.

---

**Document Version**: 1.0
**Last Updated**: 2025-01-07
**Status**: Approved for Implementation
**Target Completion**: End of Q1 2025
