# Inflation Dashboard Services - Implementation Complete

## Overview

This document describes the backend services implemented for the DOM-TOM inflation dashboard. All services are located in `/backend/src/services/inflation/`.

## Services Implemented

### 1. metroComparisonService.ts

Compare DOM-TOM prices with metropolitan France to track price gaps.

**Interfaces:**
- `CategoryGap` - Price comparison for a category
- `MetroComparison` - Full metro comparison data

**Functions:**
- `getMetroComparison(territory, period)` - Get metro comparison for a territory
- `getAllMetroComparisons(period)` - Get comparisons for all territories
- `getMetroGapTrend(territory, startPeriod, endPeriod)` - Get historical gap trends

**Example:**
```typescript
import { getMetroComparison } from './services/inflation';

const comparison = await getMetroComparison('GP', '2026-02');
console.log(`Gap with metro: ${comparison.overallGap}%`);
```

### 2. categoryAnalysisService.ts

Analyze inflation trends by product category.

**Interfaces:**
- `CategoryInflation` - Full category inflation data with trends
- `CategoryTrend` - Historical trend data point
- `TopProduct` - Product price change data

**Functions:**
- `getCategoryInflation(territory, period, category)` - Get inflation for specific category
- `getAllCategoriesInflation(territory, period)` - Get all categories
- `compareCategoriesAcrossTerritories(period, category)` - Compare across territories
- `getCategoryExtremes(territory, period)` - Get highest/lowest inflation categories

**Example:**
```typescript
import { getAllCategoriesInflation } from './services/inflation';

const categories = await getAllCategoriesInflation('MQ', '2026-02');
categories.forEach(cat => {
  console.log(`${cat.categoryName}: ${cat.yearlyChange}%`);
});
```

### 3. topMoversService.ts

Track products with the biggest price changes.

**Interfaces:**
- `TopMover` - Product with significant price change
- `TopMoversResult` - Collection of top movers

**Functions:**
- `getTopMovers(territory, period, limit)` - Get top price movers
- `getTopMoversByCategory(territory, period, category, limit)` - Filter by category
- `getPriceAlerts(territory, period, threshold)` - Get products exceeding threshold
- `compareTopMoversAcrossTerritories(period, limit)` - Compare across territories

**Example:**
```typescript
import { getTopMovers } from './services/inflation';

const movers = await getTopMovers('RE', '2026-02', 10);
console.log('Biggest increase:', movers.biggestIncrease?.productName);
```

### 4. historyService.ts

Provide historical inflation data and forecasts.

**Interfaces:**
- `InflationHistory` - Historical data with statistics
- `InflationForecast` - Future predictions
- `InflationDataPoint` - Single data point

**Functions:**
- `getInflationHistory(territory, startPeriod, endPeriod)` - Get historical data
- `getInflationForecast(territory, basePeriod, months)` - Generate forecast
- `getHistoricalComparison(startPeriod, endPeriod)` - Compare all territories
- `getYearOverYearComparison(territory, year1, year2)` - Compare years

**Example:**
```typescript
import { getInflationHistory, getInflationForecast } from './services/inflation';

const history = await getInflationHistory('GF', '2025-01', '2026-02');
console.log(`Average inflation: ${history.averageInflation}%`);
console.log(`Trend: ${history.trend}`);

const forecast = await getInflationForecast('GF', '2026-02', 6);
console.log('6-month forecast:', forecast.forecasts);
```

### 5. exportService.ts

Export inflation data in various formats (CSV, JSON, XLSX).

**Interfaces:**
- `ExportOptions` - Export configuration
- `ExportResult` - Export output with metadata

**Types:**
- `ExportFormat` - 'csv' | 'json' | 'xlsx'
- `ExportType` - 'indices' | 'categories' | 'metro-comparison' | 'top-movers' | 'full-report'

**Functions:**
- `exportInflationData(options)` - Main export function
- `generateExportForAPI(options)` - API-ready export

**Example:**
```typescript
import { exportInflationData } from './services/inflation';

const result = await exportInflationData({
  format: 'xlsx',
  type: 'full-report',
  territory: 'YT',
  period: '2026-02',
});

// result.data is a Buffer ready to download
// result.filename is "inflation-report-YT-2026-02.xlsx"
// result.mimeType is the MIME type
```

### 6. pressKitService.ts

Generate comprehensive press kits for media.

**Interfaces:**
- `PressKit` - Complete press kit data
- `PressKitSection` - Individual section
- `PressKitHighlight` - Key metric highlight

**Functions:**
- `generatePressKit(period)` - Generate full press kit
- `savePressKit(pressKit)` - Save to database
- `getPressKits(startPeriod, endPeriod)` - Retrieve press kits

**Example:**
```typescript
import { generatePressKit, savePressKit } from './services/inflation';

const pressKit = await generatePressKit('2026-02');
await savePressKit(pressKit);

console.log(`Title: ${pressKit.title}`);
console.log(`Highlights: ${pressKit.highlights.length}`);
console.log(`Sections: ${pressKit.sections.length}`);
```

### 7. index.ts

Central export point for all inflation services. Simply import from this file:

```typescript
import {
  // Price Index
  calculatePriceIndex,
  savePriceIndex,
  
  // Metro Comparison
  getMetroComparison,
  getAllMetroComparisons,
  
  // Category Analysis
  getCategoryInflation,
  getAllCategoriesInflation,
  
  // Top Movers
  getTopMovers,
  getPriceAlerts,
  
  // History
  getInflationHistory,
  getInflationForecast,
  
  // Export
  exportInflationData,
  
  // Press Kit
  generatePressKit,
} from './services/inflation';
```

## Data Flow

1. **Data Collection** → Product prices collected via app
2. **Index Calculation** → `priceIndexCalculator.ts` computes indices
3. **Analysis Services** → Various services analyze the data
4. **Exports & Reports** → Data exported or compiled into press kits

## Database Models

The services use these Prisma models:

- `PriceIndex` - Overall price index per territory/period
- `CategoryIndex` - Category-level indices
- `InflationReport` - Generated reports and press kits
- `MetroReferencePrice` - Metropolitan reference prices

## Mock Data

Some services use mock data for:
- Product-level price changes (until product database is populated)
- Metropolitan France prices (until metro data integration)
- Category average prices (calculated from index values)

These will be replaced with actual data as the system evolves.

## TypeScript Support

All services are fully typed with:
- Exported interfaces for all data structures
- Proper Prisma types
- JSDoc comments for functions

## Dependencies

- `@prisma/client` - Database ORM
- `papaparse` - CSV parsing/generation
- `xlsx` - Excel file generation

## Testing

To test the services:

```typescript
import { calculateAllIndices } from './services/inflation';

// Calculate indices for current month
const period = '2026-02';
const indices = await calculateAllIndices(period);
console.log(`Calculated ${indices.length} indices`);
```

## Next Steps

1. Integrate with actual product price data
2. Add API endpoints to expose these services
3. Create frontend dashboard components
4. Set up scheduled jobs for monthly calculations
5. Add data validation and error handling
6. Implement caching for frequently accessed data

## Notes

- All monetary values are in euros (€)
- Periods use YYYY-MM format
- Base index is 100 = January 2024
- Confidence scores range from 0-100
- Territories: GP, MQ, GF, RE, YT, METRO
