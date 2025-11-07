/**
 * Comparateur Price Fetcher
 * Fetches and displays price comparison data from the API
 */

/**
 * Fetch prices for a given EAN code
 * @param {string} ean - Product EAN code
 * @returns {Promise<Object>} Price data
 */
async function fetchPrices(ean) {
  try {
    const response = await fetch(`/api/prices?ean=${encodeURIComponent(ean)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching prices:', error);
    throw error;
  }
}

/**
 * Render prices table
 * @param {Object} data - Price data from API
 */
function renderPricesTable(data) {
  const resultsDiv = document.getElementById('price-results');
  
  if (!resultsDiv) {
    console.error('Results container not found');
    return;
  }
  
  // Clear previous results
  resultsDiv.innerHTML = '';
  
  // Check if we have prices
  if (!data.prices || data.prices.length === 0) {
    resultsDiv.innerHTML = `
      <div class="no-results">
        <p>❌ Aucun prix disponible actuellement</p>
        <p class="hint">Essayez de scanner un ticket ou attendez que les données soient ajoutées.</p>
      </div>
    `;
    return;
  }
  
  // Show product info if available
  let html = '';
  if (data.product) {
    html += `
      <div class="product-info">
        <h3>${data.product.name || 'Produit'}</h3>
        ${data.product.brand ? `<p><strong>Marque:</strong> ${data.product.brand}</p>` : ''}
        ${data.product.category ? `<p><strong>Catégorie:</strong> ${data.product.category}</p>` : ''}
      </div>
    `;
  }
  
  // Create prices table
  html += `
    <table class="prices-table">
      <thead>
        <tr>
          <th>Magasin</th>
          <th>Territoire</th>
          <th>Prix</th>
          <th>Prix/unité</th>
          <th>Source</th>
          <th>Âge (h)</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  // Sort prices by price (ascending)
  const sortedPrices = [...data.prices].sort((a, b) => a.price - b.price);
  
  sortedPrices.forEach((priceItem, index) => {
    const isBest = index === 0; // First item is best price
    const rowClass = isBest ? 'best-price' : '';
    
    html += `
      <tr class="${rowClass}">
        <td>${priceItem.storeName || priceItem.storeId || 'N/A'}</td>
        <td>${priceItem.territory || 'N/A'}</td>
        <td class="price-cell">${priceItem.price?.toFixed(2) || 'N/A'} €</td>
        <td>${priceItem.unit_price ? priceItem.unit_price.toFixed(2) + ' €/' + (priceItem.unit || 'kg') : 'N/A'}</td>
        <td>
          <span class="source-badge source-${priceItem.source}">
            ${getSourceLabel(priceItem.source)}
          </span>
        </td>
        <td>${priceItem.ageHours || 0}h</td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  // Show best price summary
  if (data.best) {
    html += `
      <div class="best-price-summary">
        <p>🏆 <strong>Meilleur prix:</strong> ${data.best.price?.toFixed(2) || 'N/A'} € 
        ${data.best.storeName ? `chez ${data.best.storeName}` : ''}</p>
      </div>
    `;
  }
  
  resultsDiv.innerHTML = html;
}

/**
 * Get human-readable label for price source
 * @param {string} source - Source type
 * @returns {string} Label
 */
function getSourceLabel(source) {
  const labels = {
    'partner': 'Partenaire',
    'ocr': 'Ticket',
    'user': 'Utilisateur'
  };
  return labels[source] || source;
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
async function handleSearch(event) {
  event.preventDefault();
  
  const eanInput = document.getElementById('ean-input');
  const ean = eanInput?.value?.trim();
  
  if (!ean) {
    // Show error in results area instead of alert
    const resultsDiv = document.getElementById('price-results');
    if (resultsDiv) {
      resultsDiv.innerHTML = '<p class="error">⚠️ Veuillez saisir un code EAN</p>';
    }
    return;
  }
  
  // Show loading state
  const resultsDiv = document.getElementById('price-results');
  if (resultsDiv) {
    resultsDiv.innerHTML = '<p class="loading">⏳ Chargement des prix...</p>';
  }
  
  try {
    const data = await fetchPrices(ean);
    renderPricesTable(data);
  } catch (error) {
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="error">
          <p>❌ Erreur lors de la récupération des prix</p>
          <p class="hint">${error.message}</p>
        </div>
      `;
    }
  }
}

/**
 * Initialize the comparateur when DOM is ready
 */
function initComparateur() {
  const form = document.getElementById('comparateur-form');
  
  if (form) {
    form.addEventListener('submit', handleSearch);
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initComparateur);
} else {
  initComparateur();
}
