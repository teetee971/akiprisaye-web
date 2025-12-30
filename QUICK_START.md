# 🚀 Quick Start Guide - New Components

## Component Import & Usage Examples

### 1. IndiceVieChere - Cost of Living Index

```jsx
import { IndiceVieChere } from './src/components/IndiceVieChere';

// Basic usage - all territories
<IndiceVieChere />

// Filtered by territory
<IndiceVieChere selectedTerritory="GP" />
```

**Props:**
- `selectedTerritory` (optional): Territory code (GP, MQ, GF, RE, YT, etc.)

---

### 2. TiPanieSolidaire - Solidarity Baskets

```jsx
import { TiPanieSolidaire } from './src/components/TiPanieSolidaire';

// Basic usage
<TiPanieSolidaire />

// Filtered by territory
<TiPanieSolidaire territoire="GP" />
```

**Props:**
- `territoire` (optional): Territory code

**Features:**
- Switch between baskets and producers
- Displays savings calculations
- Shows certifications (Bio, Local, Anti-Gaspi)

---

### 3. MapLeaflet - Interactive Map

```jsx
import { MapLeaflet } from './src/components/MapLeaflet';

const stores = [
  {
    id: '1',
    name: 'Super U Raizet',
    lat: 16.2650,
    lng: -61.5510,
    address: '123 Rue Example',
    phone: '0590 XX XX XX',
    productCount: 1250,
    avgPrice: 3.45,
  },
  // ... more stores
];

function handleStoreClick(store) {
  console.log('Store clicked:', store);
  // Navigate to store details, etc.
}

<MapLeaflet 
  territory="GP" 
  stores={stores} 
  onStoreClick={handleStoreClick} 
/>
```

**Props:**
- `territory`: Territory code (GP, MQ, GF, etc.)
- `stores`: Array of store objects with lat/lng
- `onStoreClick` (optional): Callback when store is clicked

**Store Object:**
```typescript
{
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  productCount?: number;
  avgPrice?: number;
}
```

---

### 4. PriceCharts - Data Visualization

```jsx
import { 
  PriceTrendChart,
  TerritoryComparisonChart,
  CategoryDistributionChart,
  PriceBreakdownChart,
  PriceDashboard 
} from './src/components/PriceCharts';

// Individual charts
<PriceTrendChart 
  data={[
    { date: '2025-01', price: 3.50, avgPrice: 3.75 },
    { date: '2025-02', price: 3.45, avgPrice: 3.70 },
    // ...
  ]} 
  productName="Lait 1L"
/>

<TerritoryComparisonChart 
  data={[
    { territory: 'GP', avgPrice: 3.50, minPrice: 2.80, maxPrice: 4.20 },
    { territory: 'MQ', avgPrice: 3.65, minPrice: 2.90, maxPrice: 4.35 },
    // ...
  ]} 
/>

<CategoryDistributionChart 
  data={[
    { name: 'Alimentation', value: 450 },
    { name: 'Hygiène', value: 120 },
    { name: 'Entretien', value: 80 },
  ]} 
/>

<PriceBreakdownChart 
  data={{
    basePrice: 2.50,
    margin: 0.75,
    octroi: 0.15,
    tva: 0.10,
  }}
/>

// All-in-one dashboard
<PriceDashboard
  trendData={[...]}
  territoryData={[...]}
  categoryData={[...]}
  breakdownData={{...}}
/>
```

---

### 5. PalmaresEnseignes - Store Rankings

```jsx
import { PalmaresEnseignes } from './src/components/PalmaresEnseignes';

// Basic usage - all stores
<PalmaresEnseignes />

// Filtered by territory
<PalmaresEnseignes territoire="GP" />
```

**Features:**
- Sort by: average price, product count, price changes
- Top 3 stores highlighted with medals
- Score out of 100
- Visual progress bars

---

## API Functions

### OpenFoodFacts Integration

```javascript
import { 
  fetchProductFromOpenFoodFacts,
  searchProductsOnOpenFoodFacts,
  calculateSustainabilityScore,
  formatProductForDisplay
} from './src/data/openFoodFacts';

// Fetch product by EAN
const product = await fetchProductFromOpenFoodFacts('3017620422003');
console.log(product.name, product.brand, product.nutriScore);

// Search products
const results = await searchProductsOnOpenFoodFacts('nutella', 1, 20);
console.log(`Found ${results.count} products`);

// Calculate sustainability
const score = calculateSustainabilityScore(product);
console.log(`Sustainability: ${score.grade} (${score.percentage}%)`);

// Format for display
const formatted = formatProductForDisplay(product);
console.log(formatted.displayName, formatted.sustainability);
```

---

## Backend API Endpoints

### Compare Prices
```javascript
const response = await fetch('/api/compare?ean=3017620422003&territoire=GP');
const data = await response.json();
console.log(data.prices); // Array of prices sorted by price
```

### OCR Receipt
```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/ocr', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log(data.data.products); // Extracted products
```

### IA Conseiller
```javascript
const response = await fetch('/api/ia-conseiller', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    panier: [
      { name: 'Pain', price: 1.50, category: 'Alimentation' },
      { name: 'Lait', price: 1.85, category: 'Alimentation' },
    ],
    territoire: 'GP',
  }),
});

const data = await response.json();
console.log(data.analysis.potentialSavings); // Savings in euros
console.log(data.suggestions); // Array of suggestions
console.log(data.tips); // Array of personalized tips
```

---

## Styling with Tailwind

All components use Tailwind CSS classes. The custom configuration includes:

### Territory Colors
```jsx
<div className="bg-territory-guadeloupe">Guadeloupe</div>
<div className="bg-territory-martinique">Martinique</div>
// ... GP, MQ, GF, RE, YT, PM, BL, MF, WF, PF, NC, TF
```

### Dark Mode
```jsx
<div className="bg-white dark:bg-dark-300">
  <p className="text-gray-900 dark:text-gray-100">Content</p>
</div>
```

### Touch Targets (WCAG AA)
```jsx
<button className="min-h-44 min-w-44">Accessible Button</button>
```

---

## Testing

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
npm run lint:fix
```

### Format
```bash
npm run format
```

### Dev Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## Production Checklist

Before deploying to production:

1. **Environment Variables**
   - [ ] CLOUDFLARE_API_TOKEN
   - [ ] CLOUDFLARE_ACCOUNT_ID
   - [ ] CLOUDFLARE_ZONE_ID
   - [ ] FIREBASE_SERVICE_ACCOUNT
   - [ ] FIREBASE_PROJECT_ID

2. **Firestore Setup**
   - [ ] Create collections: products, prices, stores, paniers, producteurs
   - [ ] Set up security rules
   - [ ] Index optimization

3. **Replace Mock Data**
   - [ ] Update all components with real Firestore queries
   - [ ] Remove mock data generators
   - [ ] Add error handling

4. **Testing**
   - [ ] Test on Samsung S24
   - [ ] Test on iPhone 14
   - [ ] Test PWA installation
   - [ ] Run Lighthouse CI (target ≥95)

5. **Documentation**
   - [ ] Update API documentation
   - [ ] Add usage examples
   - [ ] Document Firestore schema

---

**Last Updated:** November 9, 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready for development
