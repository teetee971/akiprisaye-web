/**
 * Search History Manager
 * Tracks EAN searches and displays history with localStorage
 */

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Get search history from localStorage
 * @returns {Array} Array of search history items
 */
function getSearchHistory() {
  try {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error reading search history:', error);
    return [];
  }
}

/**
 * Save search history to localStorage
 * @param {Array} history - History array to save
 */
function saveSearchHistory(history) {
  try {
    localStorage.setItem('searchHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

/**
 * Add search to history
 * @param {string} ean - EAN code
 * @param {string} productName - Product name (optional)
 */
export function addToHistory(ean, productName = '') {
  const history = getSearchHistory();
  
  // Remove duplicate if exists
  const filteredHistory = history.filter(item => item.ean !== ean);
  
  // Add new search at the beginning
  filteredHistory.unshift({
    ean,
    productName,
    date: new Date().toISOString(),
    timestamp: Date.now()
  });
  
  // Keep only last 50 searches
  const limitedHistory = filteredHistory.slice(0, 50);
  
  saveSearchHistory(limitedHistory);
}

/**
 * Clear all search history
 */
function clearHistory() {
  if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
    saveSearchHistory([]);
    renderHistory();
  }
}

/**
 * Delete specific history item
 * @param {string} ean - EAN code to delete
 */
function deleteHistoryItem(ean) {
  const history = getSearchHistory();
  const filteredHistory = history.filter(item => item.ean !== ean);
  saveSearchHistory(filteredHistory);
  renderHistory();
}

/**
 * Format date for display
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(isoDate) {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Render search history
 */
function renderHistory() {
  const historyList = document.querySelector('.history-list');
  if (!historyList) return;
  
  const history = getSearchHistory();
  
  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <p>📭 Aucun historique pour le moment</p>
        <p style="margin-top: 1rem; font-size: 0.9rem;">
          Vos recherches de prix apparaîtront ici
        </p>
        <a href="/comparateur.html" 
           style="display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; 
                  background: #0f62fe; color: white; text-decoration: none; 
                  border-radius: 8px; font-weight: 600;">
          🔍 Faire une recherche
        </a>
      </div>
    `;
    return;
  }
  
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h3 style="color: #0f62fe; margin: 0;">
        ${history.length} recherche${history.length > 1 ? 's' : ''}
      </h3>
      <button id="clear-history-btn" 
              style="padding: 0.5rem 1rem; background: rgba(239, 68, 68, 0.1); 
                     color: #ef4444; border: 1px solid #ef4444; border-radius: 6px; 
                     cursor: pointer; font-size: 0.85rem; font-weight: 600;">
        🗑️ Tout effacer
      </button>
    </div>
  `;
  
  history.forEach((item, index) => {
    html += `
      <div class="history-item" 
           style="background: rgba(26, 29, 46, 0.5); border-radius: 8px; 
                  padding: 1rem; margin-bottom: 0.75rem; border: 1px solid #2a2d3e;
                  transition: all 0.2s;">
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span style="color: #0f62fe; font-weight: 600; font-size: 0.9rem;">
                ${escapeHtml(item.ean)}
              </span>
              <span style="color: #64748b; font-size: 0.75rem;">
                ${formatDate(item.date)}
              </span>
            </div>
            ${item.productName ? `
              <div style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.5rem;">
                ${escapeHtml(item.productName)}
              </div>
            ` : ''}
          </div>
          <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
            <a href="/comparateur.html?ean=${encodeURIComponent(item.ean)}"
               style="padding: 0.5rem 1rem; background: #0f62fe; color: white; 
                      text-decoration: none; border-radius: 6px; font-size: 0.85rem;
                      font-weight: 600; white-space: nowrap;">
              🔍 Rechercher
            </a>
            <button class="delete-item-btn" data-ean="${escapeHtml(item.ean)}"
                    style="padding: 0.5rem; background: rgba(239, 68, 68, 0.1); 
                           color: #ef4444; border: 1px solid #ef4444; border-radius: 6px; 
                           cursor: pointer; font-size: 0.85rem;">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  historyList.innerHTML = html;
  
  // Add event listeners
  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearHistory);
  }
  
  const deleteButtons = document.querySelectorAll('.delete-item-btn');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ean = e.target.dataset.ean || e.target.closest('.delete-item-btn').dataset.ean;
      if (ean) {
        deleteHistoryItem(ean);
      }
    });
  });
}

/**
 * Initialize history page
 */
function initHistory() {
  renderHistory();
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHistory);
} else {
  initHistory();
}
