/**
 * Popup JavaScript
 * Gère l'interface utilisateur du popup de l'extension
 */

import { CONFIG } from '../shared/config.js';

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadUserData();
  setupEventListeners();
}

/**
 * Charge les données de l'utilisateur
 */
async function loadUserData() {
  // Charger le territoire
  chrome.runtime.sendMessage({ type: 'GET_TERRITORY' }, (response) => {
    if (response && response.success) {
      const territorySelect = document.getElementById('territory-select');
      if (territorySelect) {
        territorySelect.value = response.territory.code;
      }
    }
  });
  
  // Charger les statistiques
  chrome.storage.local.get([
    CONFIG.STORAGE_KEYS.SHOPPING_LIST,
    CONFIG.STORAGE_KEYS.FOLLOWED_PRODUCTS,
    CONFIG.STORAGE_KEYS.PRICE_ALERTS
  ], (result) => {
    // Mise à jour du compteur de la liste de courses
    const shoppingList = result[CONFIG.STORAGE_KEYS.SHOPPING_LIST] || [];
    const shoppingListCount = document.getElementById('shopping-list-count');
    if (shoppingListCount) {
      shoppingListCount.textContent = shoppingList.length;
    }
    
    // Mise à jour du compteur des produits suivis
    const followedProducts = result[CONFIG.STORAGE_KEYS.FOLLOWED_PRODUCTS] || [];
    const followedCount = document.getElementById('followed-count');
    if (followedCount) {
      followedCount.textContent = followedProducts.length;
    }
    
    // Mise à jour de l'état des alertes
    const alertsEnabled = result[CONFIG.STORAGE_KEYS.PRICE_ALERTS] || false;
    const alertsCheckbox = document.getElementById('alerts-enabled');
    if (alertsCheckbox) {
      alertsCheckbox.checked = alertsEnabled;
    }
  });
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
  // Changement de territoire
  const territorySelect = document.getElementById('territory-select');
  if (territorySelect) {
    territorySelect.addEventListener('change', handleTerritoryChange);
  }
  
  // Activation/désactivation des alertes
  const alertsCheckbox = document.getElementById('alerts-enabled');
  if (alertsCheckbox) {
    alertsCheckbox.addEventListener('change', handleAlertsToggle);
  }
  
  // Bouton: Voir la liste de courses
  const viewShoppingListBtn = document.getElementById('view-shopping-list');
  if (viewShoppingListBtn) {
    viewShoppingListBtn.addEventListener('click', () => {
      openAppPage('liste-courses');
    });
  }
  
  // Bouton: Gérer les suivis
  const viewFollowedBtn = document.getElementById('view-followed');
  if (viewFollowedBtn) {
    viewFollowedBtn.addEventListener('click', () => {
      openAppPage('alertes-prix');
    });
  }
  
  // Bouton: Ouvrir l'application
  const openAppBtn = document.getElementById('open-app');
  if (openAppBtn) {
    openAppBtn.addEventListener('click', () => {
      openAppPage('');
    });
  }
}

/**
 * Gère le changement de territoire
 */
function handleTerritoryChange(event) {
  const selectedCode = event.target.value;
  const territory = Object.values(CONFIG.TERRITORIES).find(t => t.code === selectedCode);
  
  if (territory) {
    chrome.runtime.sendMessage({
      type: 'SET_TERRITORY',
      territory: territory
    }, (response) => {
      if (response && response.success) {
        showNotification('Territoire mis à jour');
      }
    });
  }
}

/**
 * Gère l'activation/désactivation des alertes
 */
function handleAlertsToggle(event) {
  const enabled = event.target.checked;
  
  chrome.storage.local.set(
    { [CONFIG.STORAGE_KEYS.PRICE_ALERTS]: enabled },
    () => {
      if (enabled) {
        showNotification('Alertes prix activées');
      } else {
        showNotification('Alertes prix désactivées');
      }
    }
  );
}

/**
 * Ouvre une page de l'application
 */
function openAppPage(page) {
  const baseUrl = 'https://akiprisaye.web.app';
  const url = page ? `${baseUrl}/${page}.html` : baseUrl;
  chrome.tabs.create({ url });
}

/**
 * Affiche une notification temporaire
 */
function showNotification(message) {
  // Créer un élément de notification
  const notification = document.createElement('div');
  notification.className = 'popup-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(16, 185, 129, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 13px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideDown 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Retirer après 2 secondes
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Ajouter les animations CSS dynamiquement
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
  }
`;
document.head.appendChild(style);
