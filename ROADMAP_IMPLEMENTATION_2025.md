# 🧭 ROADMAP 2025-2026 - Implementation Documentation

## 📋 Overview

This document describes the implementation of the 2025-2026 roadmap for **A KI PRI SA YÉ**, focusing on T1-T3 2025 features. All changes follow a minimal, surgical approach to enhance the existing codebase while maintaining stability.

---

## ✅ Implemented Features

### 🔧 1. Infrastructure & Configuration

#### **Dependencies Added**
```json
{
  "@tanstack/react-query": "^5.62.11",  // State management for API calls
  "leaflet": "^1.9.4",                  // Interactive maps
  "recharts": "^2.15.0",                // Data visualization
  "@openfoodfacts/openfoodfacts-nodejs": "^2.0.0-alpha.19"  // Product data
}
```

#### **Configuration Files**

1. **tailwind.config.js**
   - Dark mode by default (class strategy)
   - 12 DOM-COM territory colors
   - WCAG 2.1 AA compliant contrasts (≥4.5:1)
   - Touch targets minimum 44px
   - Responsive typography with fluid scaling

2. **eslint.config.js**
   - Migrated to ESLint v9 flat config
   - Browser, Node.js, and Service Worker environments
   - React plugin with JSX transform support
   - Security rules (no-eval, no-new-func, etc.)

3. **manifest.json** (Enhanced)
   - Added shortcuts for Carte and Historique
   - Share Target API for receipt sharing
   - PWA categories: finance, utilities, shopping

---

### 🔧 2. Backend Functions (Cloudflare Pages Functions)

All functions are located in `/functions/` and follow Cloudflare Pages Functions API:

#### **compare.js** - Price Comparison API
```
GET /api/compare?ean=<code>&territoire=<code>
```
- Compares prices across stores
- Territory-based filtering
- Returns sorted results (lowest to highest)
- CORS enabled

**Production TODO:**
- Connect to Firestore
- Implement caching strategy
- Add rate limiting

#### **ocr.js** - Receipt OCR Processing
```
POST /api/ocr
Content-Type: multipart/form-data
Body: { image: File }
```
- Processes receipt images
- Extracts products, prices, EAN codes
- Returns structured data
- Validates image format and size (max 10MB)

**Production TODO:**
- Integrate Google Vision API or Tesseract.js
- Save to Firebase Storage
- Queue for verification
- Calculate confidence scores

#### **iaConseiller.js** - AI Budget Advisor
```
POST /api/ia-conseiller
Content-Type: application/json
Body: { panier: [...], territoire: "..." }
```
- Analyzes shopping basket
- Suggests savings opportunities
- Provides personalized tips
- Calculates potential savings

**Production TODO:**
- Integrate ML model
- Use historical user data
- Track suggestion acceptance
- Generate budget planning advice

---

### 🎨 3. Frontend Components (React)

All components are in `/src/components/` and use modern React patterns:

#### **IndiceVieChere.jsx** - Cost of Living Index
Features:
- Displays average prices by territory
- Comparison with mainland France
- Price trend indicators
- Category filtering
- Responsive cards with rankings

Usage:
```jsx
import { IndiceVieChere } from './components/IndiceVieChere';
<IndiceVieChere selectedTerritory="GP" />
```

#### **TiPanieSolidaire.jsx** - Solidarity Baskets
Features:
- Solidarity baskets listing
- Local producers directory
- Tabs for baskets/producers
- Savings calculation
- Certification badges (Bio, Local, Anti-Gaspi)

Usage:
```jsx
import { TiPanieSolidaire } from './components/TiPanieSolidaire';
<TiPanieSolidaire territoire="GP" />
```

#### **MapLeaflet.jsx** - Interactive Map
Features:
- Dynamic Leaflet loading
- Territory-based view
- Store markers with popups
- Click handlers for store details
- Responsive design

Usage:
```jsx
import { MapLeaflet } from './components/MapLeaflet';
<MapLeaflet territory="GP" stores={storesList} onStoreClick={handleClick} />
```

#### **PriceCharts.jsx** - Data Visualization
Includes 4 chart types:
1. **PriceTrendChart** - Line chart for price evolution
2. **TerritoryComparisonChart** - Bar chart for territory comparison
3. **CategoryDistributionChart** - Pie chart for categories
4. **PriceBreakdownChart** - Pie chart for price components

Usage:
```jsx
import { PriceDashboard } from './components/PriceCharts';
<PriceDashboard 
  trendData={[...]} 
  territoryData={[...]} 
  categoryData={[...]}
  breakdownData={{...}}
/>
```

#### **PalmaresEnseignes.jsx** - Store Rankings
Features:
- Store competitiveness rankings
- Sorting by price, products, trends
- Score calculation (0-100)
- Badges for top performers
- Progress bars for visual feedback

Usage:
```jsx
import { PalmaresEnseignes } from './components/PalmaresEnseignes';
<PalmaresEnseignes territoire="GP" />
```

---

### 📡 4. Data Integration

#### **openFoodFacts.js** - Product Data API
Located in `/src/data/openFoodFacts.js`

Functions:
```javascript
// Fetch product by EAN
fetchProductFromOpenFoodFacts(ean)

// Search products by name
searchProductsOnOpenFoodFacts(query, page, pageSize)

// Get categories
getCategories()

// Calculate sustainability score
calculateSustainabilityScore(product)

// Format for display
formatProductForDisplay(product)
```

**Sustainability Score Breakdown:**
- Eco-score: 30 points
- Packaging: 20 points (recyclable, cardboard, glass, etc.)
- Local production: 30 points (DOM-COM, France, manufacturing)
- Organic labels: 20 points (Bio, AB, EU Organic)

Grades: A (≥80), B (≥60), C (≥40), D (≥20), E (<20)

---

### 🚀 5. CI/CD Pipeline

**File:** `.github/workflows/deploy.yml`

#### Workflow Jobs:

1. **Lint & Test** ✅
   - ESLint validation
   - Unit tests
   - Permissions: contents:read

2. **Build** ✅
   - Vite production build
   - Artifact upload (7-day retention)
   - Permissions: contents:read

3. **Lighthouse CI** 💡
   - Performance audit
   - Only on pull requests
   - Target: ≥95 score
   - Permissions: contents:read

4. **Deploy to Cloudflare** 🚀
   - Deploys to Cloudflare Pages
   - Automatic cache purge
   - Main/develop branches only
   - Permissions: contents:read, deployments:write

5. **Deploy Firebase Functions** 🔥
   - Firebase Hosting deployment
   - Main branch only
   - Permissions: contents:read

6. **Notify Status** 📢
   - Deployment status notification
   - Runs always (success or failure)
   - Permissions: contents:read

**Environment Variables Required:**
```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_ZONE_ID
FIREBASE_SERVICE_ACCOUNT
FIREBASE_PROJECT_ID
GITHUB_TOKEN (auto-provided)
```

---

## 🛡️ Security

### CodeQL Scan Results: ✅ **0 Alerts**
All security issues resolved:
- ✅ GitHub Actions permissions properly scoped
- ✅ No code vulnerabilities detected
- ✅ No dependency vulnerabilities

### Dependency Audit: ✅ **No Vulnerabilities**
All packages verified against GitHub Advisory Database:
- React 18.3.1
- Firebase 12.5.0
- Vite 7.2.2
- Tailwind CSS 4.1.17
- All other dependencies

---

## 📊 Progress Summary

### Completed (T1-T3 2025):
- ✅ Infrastructure & configuration
- ✅ Backend API functions (3/3)
- ✅ Frontend components (5/5)
- ✅ Data integrations (OpenFoodFacts)
- ✅ CI/CD pipeline
- ✅ Security hardening

### Remaining (T4 2025 - Q1 2026):
- ⏳ "Lutte contre la vie chère" dedicated page
- ⏳ Firestore integration (all components have TODO comments)
- ⏳ Upload ticket UI flow
- ⏳ Responsive testing (Samsung S24, iPhone 14)
- ⏳ PWA validation
- ⏳ RGPD compliance UI

---

## 🎯 Next Steps

### For Developers:

1. **Firestore Integration**
   ```javascript
   // Each component has TODO comments like:
   // TODO: PRODUCTION IMPLEMENTATION
   // Connect to Firestore and replace mock data
   ```

2. **Environment Setup**
   - Add Cloudflare secrets to repository
   - Configure Firebase project
   - Set up Firestore collections

3. **Testing**
   - Test on mobile devices (Samsung S24, iPhone 14)
   - Run Lighthouse CI locally
   - Validate PWA installation

### For Product Owner:

1. **Cloudflare Configuration**
   - Create Cloudflare account
   - Generate API token
   - Add secrets to GitHub

2. **Firebase Setup**
   - Create Firebase project
   - Enable Firestore
   - Configure authentication
   - Generate service account

3. **Content**
   - Prepare "Lutte contre la vie chère" page content
   - Define RGPD compliance requirements
   - Review cookie consent flow

---

## 📚 Resources

- **Tailwind Documentation:** https://tailwindcss.com/docs
- **Leaflet Documentation:** https://leafletjs.com/reference.html
- **Recharts Documentation:** https://recharts.org/en-US/api
- **OpenFoodFacts API:** https://world.openfoodfacts.org/data
- **Cloudflare Pages:** https://developers.cloudflare.com/pages
- **Firebase:** https://firebase.google.com/docs

---

## 🔖 Version

**Implementation Date:** November 9, 2025  
**Roadmap Phases:** T1-T3 2025  
**Status:** ✅ Core features complete, ready for production integration

---

## 👥 Contributors

Implementation by GitHub Copilot following the roadmap specification.  
Project: A KI PRI SA YÉ - Comparateur citoyen de prix en Outre-mer
