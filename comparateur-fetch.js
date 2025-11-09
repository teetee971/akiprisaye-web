/**
 * Comparateur Price Fetcher
 * Fetches and displays price comparison data from the API
 */

import { addToHistory } from './historique.js';
import { fetchProductFromOFF } from './openfoodfacts.js';

/**
 * Escape HTML to prevent XSS attacks
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
 * @param {Object} offProduct - Product data from Open Food Facts
 */
function renderPricesTable(data, offProduct = null) {
  const resultsDiv = document.getElementById('price-results');
  
  if (!resultsDiv) {
    console.error('Results container not found');
    return;
  }
  
  // Clear previous results
  resultsDiv.innerHTML = '';
  
  // Show product info from Open Food Facts if available
  let html = '';
  const productInfo = offProduct || data.product;
  
  if (productInfo) {
    html += `
      <div class="product-info" style="display: flex; gap: 1.5rem; align-items: start; margin-bottom: 1.5rem;">
        ${offProduct?.image ? `
          <img src="${escapeHtml(offProduct.image)}" 
               alt="${escapeHtml(offProduct.name)}" 
               style="width: 120px; height: 120px; object-fit: contain; border-radius: 8px; background: white; padding: 0.5rem;" />
        ` : ''}
        <div style="flex: 1;">
          <h3 style="margin: 0 0 0.5rem 0;">${escapeHtml(productInfo.name) || 'Produit'}</h3>
          ${productInfo.brand ? `<p style="margin: 0.25rem 0;"><strong>Marque:</strong> ${escapeHtml(productInfo.brand)}</p>` : ''}
          ${productInfo.quantity ? `<p style="margin: 0.25rem 0;"><strong>Quantité:</strong> ${escapeHtml(productInfo.quantity)}</p>` : ''}
          ${productInfo.category ? `<p style="margin: 0.25rem 0;"><strong>Catégorie:</strong> ${escapeHtml(productInfo.category)}</p>` : ''}
          ${offProduct?.nutriscore ? `
            <p style="margin: 0.5rem 0 0 0;">
              <span style="background: ${getNutriscoreColor(offProduct.nutriscore)}; 
                           color: white; padding: 0.25rem 0.5rem; border-radius: 4px; 
                           font-weight: bold; font-size: 0.85rem;">
                Nutri-Score: ${offProduct.nutriscore.toUpperCase()}
              </span>
            </p>
          ` : ''}
          ${offProduct ? `
            <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #64748b;">
              Source: Open Food Facts
            </p>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  // Check if we have prices
  if (!data.prices || data.prices.length === 0) {
    html += `
      <div class="no-results">
        <p>❌ Aucun prix disponible actuellement pour ce produit</p>
        <p class="hint">Les prix locaux pour ce produit ne sont pas encore dans notre base de données.</p>
        ${offProduct ? `
          <p class="hint">Cependant, nous avons trouvé les informations du produit grâce à Open Food Facts.</p>
        ` : ''}
      </div>
    `;
    resultsDiv.innerHTML = html;
    return;
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
        <td>${escapeHtml(priceItem.storeName || priceItem.storeId || 'N/A')}</td>
        <td>${escapeHtml(priceItem.territory || 'N/A')}</td>
        <td class="price-cell">${priceItem.price?.toFixed(2) || 'N/A'} €</td>
        <td>${priceItem.unit_price ? priceItem.unit_price.toFixed(2) + ' €/' + escapeHtml(priceItem.unit || 'kg') : 'N/A'}</td>
        <td>
          <span class="source-badge source-${escapeHtml(priceItem.source)}">
            ${escapeHtml(getSourceLabel(priceItem.source))}
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
        ${data.best.storeName ? `chez ${escapeHtml(data.best.storeName)}` : ''}</p>
      </div>
    `;
  }
  
  resultsDiv.innerHTML = html;
}

/**
 * Get color for Nutri-Score grade
 * @param {string} grade - Nutri-Score grade (a-e)
 * @returns {string} Color code
 */
function getNutriscoreColor(grade) {
  const colors = {
    'a': '#038141',
    'b': '#85bb2f',
    'c': '#fecb02',
    'd': '#ee8100',
    'e': '#e63e11'
  };
  return colors[grade?.toLowerCase()] || '#999';
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
    // Fetch from both our API and Open Food Facts in parallel
    const [data, offProduct] = await Promise.all([
      fetchPrices(ean),
      fetchProductFromOFF(ean)
    ]);
    
    renderPricesTable(data, offProduct);
    
    // Add to search history with product name from OFF if available
    const productName = offProduct?.name || data.product?.name || '';
    addToHistory(ean, productName);
  } catch (error) {
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="error">
          <p>❌ Erreur lors de la récupération des prix</p>
          <p class="hint">${escapeHtml(error.message)}</p>
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
  
  // Check for EAN in URL params (from history)
  const urlParams = new URLSearchParams(window.location.search);
  const eanFromUrl = urlParams.get('ean');
  
  if (eanFromUrl) {
    const eanInput = document.getElementById('ean-input');
    if (eanInput) {
      eanInput.value = eanFromUrl;
      // Auto-submit the search
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initComparateur);
} else {
  initComparateur();
}
