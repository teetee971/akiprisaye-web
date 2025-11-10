# Trending Products - Usage Examples

## Quick Start

### 1. Track a Product Selection
When a user selects/views a product anywhere in your app:

```javascript
// Example: User clicks on a product in search results
async function trackProductSelection(product) {
  const response = await fetch('/api/products/select', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ean: product.ean,
      territory: 'Guadeloupe', // or get from user's location
      name: product.name,
      brand: product.brand,
      image: product.image,
    }),
  });
  
  const data = await response.json();
  console.log(`Product tracked! New score: ${data.score}`);
}

// Usage in your code
document.querySelector('.product-card').addEventListener('click', () => {
  trackProductSelection({
    ean: '3017620422003',
    name: 'Nutella',
    brand: 'Ferrero',
    image: 'https://...',
  });
});
```

### 2. Display Trending Products
Show the most popular products in a widget:

```javascript
// Example: Load trending products for homepage widget
async function loadTrendingProducts(territory = 'Guadeloupe', limit = 5) {
  const response = await fetch(
    `/api/products/trending?territory=${territory}&limit=${limit}`
  );
  
  const data = await response.json();
  return data.products;
}

// Usage
async function displayTrendingWidget() {
  const trending = await loadTrendingProducts('Guadeloupe', 5);
  
  const widget = document.querySelector('#trending-products');
  widget.innerHTML = trending.map(product => `
    <div class="trending-item">
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.brand}</p>
      <span class="badge">${product.score} selections</span>
    </div>
  `).join('');
}
```

## Integration Points

### Product Search Results
Track when users click on search results:

```javascript
// In your product search component
searchResults.forEach(product => {
  product.addEventListener('click', () => {
    // Track the selection
    fetch('/api/products/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ean: product.ean,
        name: product.name,
        brand: product.brand,
        image: product.image,
      }),
    });
    
    // Then navigate to product details
    window.location.href = `/product/${product.ean}`;
  });
});
```

### Scanner Integration
Track when users scan products:

```javascript
// After successful barcode scan
async function onBarcodeScanned(ean) {
  // Get product info from Open Food Facts
  const productInfo = await fetchProductInfo(ean);
  
  // Track the scan as a selection
  await fetch('/api/products/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ean: ean,
      name: productInfo.name,
      brand: productInfo.brand,
      image: productInfo.image,
    }),
  });
  
  // Show product details
  displayProductDetails(productInfo);
}
```

### Price Comparator
Track when users compare prices:

```javascript
// When user selects a product to compare
async function addToComparison(product) {
  // Track selection
  await fetch('/api/products/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ean: product.ean,
      territory: getCurrentTerritory(),
      name: product.name,
      brand: product.brand,
      image: product.image,
    }),
  });
  
  // Add to comparison list
  comparisonList.push(product);
  updateComparisonUI();
}
```

## UI Components

### Trending Badge
Add a "trending" badge to popular products:

```javascript
// Check if product is in top trending
async function isTrending(ean, territory = 'Guadeloupe') {
  const trending = await loadTrendingProducts(territory, 50);
  return trending.some(p => p.ean === ean);
}

// Usage
async function renderProduct(product) {
  const trending = await isTrending(product.ean);
  
  return `
    <div class="product-card">
      ${trending ? '<span class="badge-trending">🔥 Trending</span>' : ''}
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.brand}</p>
    </div>
  `;
}
```

### Trending Section on Homepage
Create a dedicated trending section:

```html
<!-- Homepage trending section -->
<section class="trending-section">
  <h2>Produits Tendance en Guadeloupe 🔥</h2>
  <div id="trending-grid" class="product-grid">
    <!-- Loaded dynamically -->
  </div>
</section>

<script>
async function loadTrendingSection() {
  const products = await loadTrendingProducts('Guadeloupe', 8);
  const grid = document.querySelector('#trending-grid');
  
  grid.innerHTML = products.map((product, index) => `
    <div class="product-card" onclick="viewProduct('${product.ean}')">
      <div class="rank-badge">#${index + 1}</div>
      <img src="${product.image || '/assets/placeholder.png'}" 
           alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="brand">${product.brand}</p>
      <p class="selections">${product.score} personnes l'ont consulté</p>
    </div>
  `).join('');
}

// Load on page ready
document.addEventListener('DOMContentLoaded', loadTrendingSection);

// Refresh every 5 minutes
setInterval(loadTrendingSection, 5 * 60 * 1000);
</script>
```

### Territory Selector with Trending
Show trending products per territory:

```javascript
// Territory selector component
class TerritoryTrendingWidget {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.currentTerritory = 'Guadeloupe';
    this.render();
  }
  
  async loadData() {
    const products = await loadTrendingProducts(this.currentTerritory, 5);
    this.updateProductList(products);
  }
  
  render() {
    this.container.innerHTML = `
      <div class="territory-trending">
        <select id="territory-select">
          <option value="Guadeloupe">Guadeloupe</option>
          <option value="Martinique">Martinique</option>
          <option value="Guyane">Guyane</option>
          <option value="Réunion">Réunion</option>
          <option value="Mayotte">Mayotte</option>
        </select>
        <div id="trending-list"></div>
      </div>
    `;
    
    // Set up event listener
    this.container.querySelector('#territory-select')
      .addEventListener('change', (e) => {
        this.currentTerritory = e.target.value;
        this.loadData();
      });
    
    // Initial load
    this.loadData();
  }
  
  updateProductList(products) {
    const list = this.container.querySelector('#trending-list');
    list.innerHTML = products.map((p, i) => `
      <div class="trending-item">
        <span class="rank">${i + 1}</span>
        <img src="${p.image}" alt="${p.name}">
        <div class="info">
          <strong>${p.name}</strong>
          <small>${p.brand}</small>
        </div>
        <span class="score">${p.score}</span>
      </div>
    `).join('');
  }
}

// Initialize
new TerritoryTrendingWidget('#trending-widget');
```

## Analytics Dashboard

### Track Trending Metrics
Monitor trending product performance:

```javascript
// Admin dashboard - trending analytics
async function getTrendingAnalytics() {
  const territories = ['Guadeloupe', 'Martinique', 'Guyane', 'Réunion', 'Mayotte'];
  
  const analytics = await Promise.all(
    territories.map(async (territory) => {
      const trending = await loadTrendingProducts(territory, 10);
      return {
        territory,
        topProduct: trending[0],
        totalSelections: trending.reduce((sum, p) => sum + p.score, 0),
        productCount: trending.length,
      };
    })
  );
  
  return analytics;
}

// Display analytics
async function displayAnalytics() {
  const data = await getTrendingAnalytics();
  
  console.table(data.map(d => ({
    'Territory': d.territory,
    'Top Product': d.topProduct?.name || 'N/A',
    'Total Selections': d.totalSelections,
    'Products': d.productCount,
  })));
}
```

## Best Practices

### 1. Don't Track Everything
Only track meaningful user interactions:
- ✅ Product detail page views
- ✅ Search result clicks
- ✅ Scan results
- ✅ Price comparison additions
- ❌ Hover events
- ❌ Autocomplete suggestions

### 2. Batch Tracking (Optional)
For high-traffic scenarios, consider batching:

```javascript
// Simple batching implementation
class SelectionTracker {
  constructor() {
    this.queue = [];
    this.flushInterval = 5000; // 5 seconds
    
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  track(selection) {
    this.queue.push(selection);
    
    // Flush if queue gets large
    if (this.queue.length >= 10) {
      this.flush();
    }
  }
  
  async flush() {
    if (this.queue.length === 0) return;
    
    const selections = [...this.queue];
    this.queue = [];
    
    // Send all selections
    await Promise.all(
      selections.map(s => 
        fetch('/api/products/select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s),
        })
      )
    );
  }
}

const tracker = new SelectionTracker();

// Usage
tracker.track({
  ean: '3017620422003',
  name: 'Nutella',
  brand: 'Ferrero',
});
```

### 3. Cache Trending Results
Reduce API calls by caching trending data:

```javascript
class TrendingCache {
  constructor(ttl = 60000) { // 1 minute default
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  async get(territory, limit) {
    const key = `${territory}:${limit}`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    const data = await loadTrendingProducts(territory, limit);
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}

const trendingCache = new TrendingCache(60000);

// Usage
const trending = await trendingCache.get('Guadeloupe', 10);
```

## Testing

### Manual Testing
Test the endpoints with curl:

```bash
# Track a selection
curl -X POST https://akiprisaye.pages.dev/api/products/select \
  -H "Content-Type: application/json" \
  -d '{"ean":"3017620422003","territory":"Guadeloupe","name":"Nutella"}'

# Get trending
curl "https://akiprisaye.pages.dev/api/products/trending?territory=Guadeloupe&limit=5"
```

### Browser Console Testing
Quick test in browser DevTools:

```javascript
// Track a test selection
await fetch('/api/products/select', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ean: '3017620422003',
    name: 'Test Product',
    brand: 'Test Brand',
  })
}).then(r => r.json()).then(console.log);

// Get trending
await fetch('/api/products/trending?limit=5')
  .then(r => r.json())
  .then(console.log);
```
