/**
 * Product Search Module
 * Provides product search by name functionality
 */

// Sample product database (would be replaced by API calls in production)
const sampleProducts = [
  { ean: '3017620422003', name: 'Nutella 400g', brand: 'Ferrero', category: 'Petit déjeuner' },
  { ean: '3033710065967', name: 'Lait demi-écrémé UHT 1L', brand: 'Lactel', category: 'Produits laitiers' },
  { ean: '3228857000166', name: 'Pain de mie complet 500g', brand: 'Harrys', category: 'Boulangerie' },
  { ean: '3168930010883', name: 'Riz long grain 1kg', brand: 'Taureau Ailé', category: 'Épicerie' },
  { ean: '3029330003502', name: 'Pâtes Spaghetti 500g', brand: 'Panzani', category: 'Épicerie' },
  { ean: '5449000000996', name: 'Coca-Cola 1.5L', brand: 'Coca-Cola', category: 'Boissons' },
  { ean: '3560070623457', name: 'Eau minérale 6x1.5L', brand: 'Cristaline', category: 'Boissons' },
  { ean: '8076800195057', name: 'Huile d\'olive 1L', brand: 'Filippo Berio', category: 'Épicerie' },
  { ean: '3083680085007', name: 'Yaourt nature x8', brand: 'Danone', category: 'Produits laitiers' },
  { ean: '3017800820001', name: 'Emmental râpé 200g', brand: 'Président', category: 'Produits laitiers' },
  { ean: '3250391805037', name: 'Poulet rôti 1kg', brand: 'Maître Coq', category: 'Viandes' },
  { ean: '3760074380190', name: 'Bananes 1kg', brand: 'Tropical', category: 'Fruits' },
  { ean: '3270160988471', name: 'Tomates fraîches 500g', brand: 'Local', category: 'Légumes' },
  { ean: '3168930009184', name: 'Farine de blé 1kg', brand: 'Francine', category: 'Épicerie' },
  { ean: '3017620422010', name: 'Sucre blanc 1kg', brand: 'Daddy', category: 'Épicerie' },
];

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Search products by name
 * @param {string} query - Search query
 * @returns {Array} Matching products
 */
function searchProducts(query) {
  if (!query || query.length < 2) {
    return [];
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return sampleProducts.filter(product => {
    const nameMatch = product.name.toLowerCase().includes(normalizedQuery);
    const brandMatch = product.brand.toLowerCase().includes(normalizedQuery);
    const categoryMatch = product.category.toLowerCase().includes(normalizedQuery);
    
    return nameMatch || brandMatch || categoryMatch;
  }).slice(0, 8); // Limit to 8 results
}

/**
 * Display search suggestions
 * @param {Array} products - Products to display
 */
function displaySuggestions(products) {
  const suggestionsDiv = document.getElementById('search-suggestions');
  
  if (!suggestionsDiv) return;
  
  if (products.length === 0) {
    suggestionsDiv.style.display = 'none';
    return;
  }
  
  let html = '<ul style="list-style: none; margin: 0; padding: 0;">';
  
  products.forEach(product => {
    html += `
      <li class="suggestion-item" 
          data-ean="${escapeHtml(product.ean)}" 
          data-name="${escapeHtml(product.name)}"
          style="padding: 10px; cursor: pointer; border-bottom: 1px solid #2a2d3e; color: #ffffff; background: #1a1d2e;"
          onmouseover="this.style.backgroundColor='rgba(15, 98, 254, 0.1)'" 
          onmouseout="this.style.backgroundColor='#1a1d2e'">
        <div style="font-weight: bold; color: #0f62fe;">${escapeHtml(product.name)}</div>
        <div style="font-size: 0.85rem; color: #b8b8b8;">
          ${escapeHtml(product.brand)} • ${escapeHtml(product.category)} • EAN: ${escapeHtml(product.ean)}
        </div>
      </li>
    `;
  });
  
  html += '</ul>';
  
  suggestionsDiv.innerHTML = html;
  suggestionsDiv.style.display = 'block';
  
  // Add click handlers to suggestions
  const suggestionItems = suggestionsDiv.querySelectorAll('.suggestion-item');
  suggestionItems.forEach(item => {
    item.addEventListener('click', function() {
      const ean = this.getAttribute('data-ean');
      const name = this.getAttribute('data-name');
      
      // Fill EAN input and trigger search
      const eanInput = document.getElementById('ean-input');
      const searchInput = document.getElementById('product-search-input');
      
      if (eanInput) {
        eanInput.value = ean;
      }
      
      if (searchInput) {
        searchInput.value = name;
      }
      
      // Hide suggestions
      suggestionsDiv.style.display = 'none';
      
      // Trigger form submission
      const form = document.getElementById('comparateur-form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    });
  });
}

/**
 * Initialize product search functionality
 */
function initProductSearch() {
  const searchInput = document.getElementById('product-search-input');
  const suggestionsDiv = document.getElementById('search-suggestions');
  
  if (!searchInput) return;
  
  // Handle input changes
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    const products = searchProducts(query);
    displaySuggestions(products);
  });
  
  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (suggestionsDiv && !searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
      suggestionsDiv.style.display = 'none';
    }
  });
  
  // Handle form submission with product search
  const form = document.getElementById('comparateur-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      const eanInput = document.getElementById('ean-input');
      const searchValue = searchInput.value.trim();
      
      // If only search input is filled, try to find the product
      if (searchValue && (!eanInput.value || eanInput.value.trim() === '')) {
        const products = searchProducts(searchValue);
        if (products.length > 0) {
          // Use the first matching product
          eanInput.value = products[0].ean;
        }
      }
    });
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductSearch);
} else {
  initProductSearch();
}
