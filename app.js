// Navigation and Price Comparison Logic for A KI PRI SA YÉ

// Placeholder product data for price comparison
const placeholderProducts = [
  {
    id: 1,
    name: 'Lait demi-écrémé 1L',
    prices: [
      { store: 'Super U', territory: 'Martinique', price: 2.45 },
      { store: 'Carrefour', territory: 'Martinique', price: 2.60 },
      { store: 'Leader Price', territory: 'Martinique', price: 2.30 },
    ],
  },
  {
    id: 2,
    name: 'Pain de mie complet 500g',
    prices: [
      { store: 'Super U', territory: 'Guadeloupe', price: 1.85 },
      { store: 'Carrefour', territory: 'Guadeloupe', price: 1.95 },
      { store: 'Leader Price', territory: 'Guadeloupe', price: 1.75 },
    ],
  },
  {
    id: 3,
    name: 'Riz blanc 1kg',
    prices: [
      { store: 'Super U', territory: 'Réunion', price: 3.20 },
      { store: 'Carrefour', territory: 'Réunion', price: 3.40 },
      { store: 'Leader Price', territory: 'Réunion', price: 2.95 },
    ],
  },
  {
    id: 4,
    name: 'Huile de tournesol 1L',
    prices: [
      { store: 'Super U', territory: 'Guyane', price: 4.50 },
      { store: 'Carrefour', territory: 'Guyane', price: 4.80 },
      { store: 'Leader Price', territory: 'Guyane', price: 4.20 },
    ],
  },
  {
    id: 5,
    name: 'Pâtes 500g',
    prices: [
      { store: 'Super U', territory: 'Martinique', price: 1.40 },
      { store: 'Carrefour', territory: 'Martinique', price: 1.55 },
      { store: 'Leader Price', territory: 'Martinique', price: 1.30 },
    ],
  },
];

// Section visibility management
function showSection(sectionId) {
  const sections = ['landing-section', 'app-section', 'price-comparison-section'];
  sections.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = id === sectionId ? 'block' : 'none';
    }
  });

  // Scroll to top when changing sections
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Search products by keyword
function searchProducts(keyword) {
  if (!keyword || keyword.trim() === '') {
    return [];
  }

  const searchTerm = keyword.toLowerCase().trim();
  return placeholderProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm),
  );
}

// Render product results
function renderProductResults(products) {
  const resultsContainer = document.getElementById('product-results');
  if (!resultsContainer) return;

  if (products.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <p>😔 Aucun produit trouvé</p>
        <p>Essayez avec un autre terme de recherche comme "lait", "pain", "riz", "huile" ou "pâtes".</p>
      </div>
    `;
    return;
  }

  let html = '';
  products.forEach(product => {
    // Find best price
    const sortedPrices = [...product.prices].sort((a, b) => a.price - b.price);
    const bestPrice = sortedPrices[0];

    html += `
      <div class="product-item">
        <div class="product-name">${escapeHtml(product.name)}</div>
        <div class="price-info">
          <div>
            <div class="price">${bestPrice.price.toFixed(2)} €</div>
            <div class="store-info">Meilleur prix: ${escapeHtml(bestPrice.store)} (${escapeHtml(bestPrice.territory)})</div>
          </div>
        </div>
        <details style="margin-top: 1rem;">
          <summary style="cursor: pointer; color: var(--primary); font-weight: bold;">
            Voir tous les prix (${product.prices.length})
          </summary>
          <div style="margin-top: 0.75rem;">
            ${product.prices.map(p => `
              <div style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                <strong>${p.price.toFixed(2)} €</strong> - ${escapeHtml(p.store)} (${escapeHtml(p.territory)})
              </div>
            `).join('')}
          </div>
        </details>
      </div>
    `;
  });

  resultsContainer.innerHTML = html;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Initialize navigation
function initNavigation() {
  // Discover app button
  const discoverBtn = document.getElementById('discover-app-btn');
  if (discoverBtn) {
    discoverBtn.addEventListener('click', () => {
      showSection('app-section');
    });
  }

  // Back to landing button
  const backToLandingBtn = document.getElementById('back-to-landing-btn');
  if (backToLandingBtn) {
    backToLandingBtn.addEventListener('click', () => {
      showSection('landing-section');
    });
  }

  // Back to app button
  const backToAppBtn = document.getElementById('back-to-app-btn');
  if (backToAppBtn) {
    backToAppBtn.addEventListener('click', () => {
      showSection('app-section');
    });
  }

  // Navigate to price comparison from card
  const priceComparisonCard = document.querySelector('[data-navigate="price-comparison"]');
  if (priceComparisonCard) {
    priceComparisonCard.addEventListener('click', (e) => {
      e.preventDefault();
      showSection('price-comparison-section');
    });
  }

  // Search functionality
  const searchBtn = document.getElementById('search-btn');
  const productSearchInput = document.getElementById('product-search');

  if (searchBtn && productSearchInput) {
    searchBtn.addEventListener('click', () => {
      const keyword = productSearchInput.value;
      const results = searchProducts(keyword);
      renderProductResults(results);
    });

    // Allow search on Enter key
    productSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const keyword = productSearchInput.value;
        const results = searchProducts(keyword);
        renderProductResults(results);
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}