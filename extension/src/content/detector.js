/**
 * Content Script - Product Page Detector
 * S'exécute uniquement sur les pages de magasins supportés
 * PRINCIPE: User-triggered only, NO automatic background scan
 */

import { detectProductPage, extractProductInfo, hasUserConsent } from '../shared/productDetector.js';
import { CONFIG } from '../shared/config.js';

let overlayInjected = false;
let currentProductInfo = null;

/**
 * Initialise le détecteur de produit
 */
async function initDetector() {
  const url = window.location.href;
  const storeInfo = detectProductPage(url);
  
  if (!storeInfo) {
    return; // Pas une page produit supportée
  }
  
  // Vérifier le consentement utilisateur
  const consent = await hasUserConsent();
  
  if (!consent) {
    // Afficher une notification discrète pour demander le consentement
    showConsentNotification(storeInfo);
  } else {
    // L'utilisateur a déjà donné son consentement
    showAnalyzeButton(storeInfo);
  }
}

/**
 * Affiche une notification pour demander le consentement
 */
function showConsentNotification(storeInfo) {
  if (document.getElementById('akpsy-consent-notification')) {
    return; // Déjà affiché
  }
  
  const notification = document.createElement('div');
  notification.id = 'akpsy-consent-notification';
  notification.className = 'akpsy-consent-notification';
  notification.innerHTML = `
    <div class="akpsy-consent-content">
      <div class="akpsy-consent-header">
        <img src="${chrome.runtime.getURL('icons/icon-48.png')}" alt="A KI PRI SA YÉ" class="akpsy-consent-logo" />
        <h3>A KI PRI SA YÉ</h3>
      </div>
      <p>Cette extension vous aide à comparer les prix de manière transparente.</p>
      <p><strong>Votre vie privée est respectée :</strong></p>
      <ul>
        <li>✓ Aucune donnée personnelle collectée</li>
        <li>✓ Aucun historique de navigation</li>
        <li>✓ Analyse uniquement sur demande</li>
        <li>✓ Données stockées localement</li>
      </ul>
      <p>Souhaitez-vous activer l'assistant prix sur les sites de magasins ?</p>
      <div class="akpsy-consent-actions">
        <button id="akpsy-consent-accept" class="akpsy-btn akpsy-btn-primary">
          Activer l'assistant
        </button>
        <button id="akpsy-consent-decline" class="akpsy-btn akpsy-btn-secondary">
          Non merci
        </button>
      </div>
      <p class="akpsy-consent-note">
        L'extension fonctionne uniquement sur les pages produits que vous visitez.
      </p>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Gérer les actions
  document.getElementById('akpsy-consent-accept').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ 
      type: 'SET_CONSENT', 
      consent: true 
    });
    notification.remove();
    showAnalyzeButton(storeInfo);
  });
  
  document.getElementById('akpsy-consent-decline').addEventListener('click', () => {
    notification.remove();
  });
}

/**
 * Affiche le bouton d'analyse de produit
 */
function showAnalyzeButton(storeInfo) {
  if (document.getElementById('akpsy-analyze-button')) {
    return; // Déjà affiché
  }
  
  const button = document.createElement('button');
  button.id = 'akpsy-analyze-button';
  button.className = 'akpsy-analyze-button';
  button.innerHTML = `
    <img src="${chrome.runtime.getURL('icons/icon-32.png')}" alt="" />
    <span>Analyser avec A KI PRI SA YÉ</span>
  `;
  
  button.addEventListener('click', () => {
    analyzeProduct(storeInfo);
  });
  
  document.body.appendChild(button);
}

/**
 * Analyse le produit et affiche l'overlay
 */
async function analyzeProduct(storeInfo) {
  // Extraire les informations du produit
  currentProductInfo = extractProductInfo();
  
  if (!currentProductInfo) {
    showError('Impossible de détecter les informations du produit sur cette page.');
    return;
  }
  
  // Ajouter les informations du magasin
  currentProductInfo.store = storeInfo.storeName;
  currentProductInfo.storeKey = storeInfo.storeKey;
  
  // Envoyer au background pour récupérer les données de prix
  chrome.runtime.sendMessage({
    type: 'ANALYZE_PRODUCT',
    productInfo: currentProductInfo
  }, (response) => {
    if (response && response.success) {
      showPriceOverlay(currentProductInfo, response.priceData);
    } else {
      showError(response?.error || 'Erreur lors de la récupération des données.');
    }
  });
}

/**
 * Affiche l'overlay avec les informations de prix
 */
function showPriceOverlay(productInfo, priceData) {
  if (overlayInjected) {
    // Mettre à jour l'overlay existant
    updateOverlay(productInfo, priceData);
    return;
  }
  
  const overlay = document.createElement('div');
  overlay.id = 'akpsy-price-overlay';
  overlay.className = 'akpsy-price-overlay';
  overlay.innerHTML = `
    <div class="akpsy-overlay-header">
      <div class="akpsy-overlay-title">
        <img src="${chrome.runtime.getURL('icons/icon-32.png')}" alt="" />
        <h3>A KI PRI SA YÉ</h3>
      </div>
      <button id="akpsy-overlay-close" class="akpsy-overlay-close">×</button>
    </div>
    <div class="akpsy-overlay-content" id="akpsy-overlay-content">
      <!-- Contenu dynamique -->
    </div>
  `;
  
  document.body.appendChild(overlay);
  overlayInjected = true;
  
  // Bouton de fermeture
  document.getElementById('akpsy-overlay-close').addEventListener('click', () => {
    overlay.classList.remove('akpsy-overlay-visible');
  });
  
  // Rendre visible
  setTimeout(() => overlay.classList.add('akpsy-overlay-visible'), 10);
  
  // Remplir avec les données
  updateOverlay(productInfo, priceData);
}

/**
 * Met à jour le contenu de l'overlay
 */
function updateOverlay(productInfo, priceData) {
  const content = document.getElementById('akpsy-overlay-content');
  if (!content) return;
  
  const hasComparison = priceData && priceData.comparison && priceData.comparison.length > 0;
  const hasHistory = priceData && priceData.history && priceData.history.length > 0;
  
  content.innerHTML = `
    <div class="akpsy-product-info">
      <h4>${productInfo.name}</h4>
      ${productInfo.brand ? `<p class="akpsy-brand">${productInfo.brand}</p>` : ''}
      ${productInfo.quantity ? `<p class="akpsy-quantity">${productInfo.quantity} ${productInfo.unit || ''}</p>` : ''}
    </div>
    
    <div class="akpsy-current-price">
      <span class="akpsy-label">Prix observé chez ${productInfo.store}</span>
      <span class="akpsy-price">${productInfo.price ? productInfo.price.toFixed(2) + ' €' : 'N/A'}</span>
      ${priceData?.observationDate ? `<span class="akpsy-date">Observation: ${priceData.observationDate}</span>` : ''}
    </div>
    
    ${hasComparison ? `
      <div class="akpsy-comparison">
        <h5>Comparaison territoriale</h5>
        <div class="akpsy-comparison-list">
          ${priceData.comparison.map(item => `
            <div class="akpsy-comparison-item ${item.isBest ? 'akpsy-best-price' : ''}">
              <span class="akpsy-store-name">${item.storeName}</span>
              <span class="akpsy-price">${item.price.toFixed(2)} €</span>
              ${item.isBest ? '<span class="akpsy-badge">Meilleur prix</span>' : ''}
            </div>
          `).join('')}
        </div>
        ${priceData.territoryAverage ? `
          <p class="akpsy-average">Moyenne territoriale: ${priceData.territoryAverage.toFixed(2)} €</p>
        ` : ''}
        ${priceData.source ? `
          <p class="akpsy-source">Source: ${priceData.source}</p>
        ` : ''}
      </div>
    ` : `
      <div class="akpsy-no-data">
        <p>Aucune donnée de comparaison disponible pour ce produit.</p>
        <p class="akpsy-note">Les données proviennent uniquement de sources officielles.</p>
      </div>
    `}
    
    ${hasHistory ? `
      <div class="akpsy-history">
        <h5>Historique des prix</h5>
        <p class="akpsy-trend">${priceData.trendSummary || 'Données en cours de collecte'}</p>
      </div>
    ` : ''}
    
    <div class="akpsy-actions">
      <button class="akpsy-btn akpsy-btn-primary" id="akpsy-add-to-list">
        Ajouter à ma liste
      </button>
      <button class="akpsy-btn akpsy-btn-secondary" id="akpsy-follow-price">
        Suivre le prix
      </button>
      <button class="akpsy-btn akpsy-btn-secondary" id="akpsy-view-full">
        Voir analyse complète
      </button>
    </div>
  `;
  
  // Gérer les actions
  document.getElementById('akpsy-add-to-list')?.addEventListener('click', () => {
    addToShoppingList(productInfo);
  });
  
  document.getElementById('akpsy-follow-price')?.addEventListener('click', () => {
    followPrice(productInfo);
  });
  
  document.getElementById('akpsy-view-full')?.addEventListener('click', () => {
    openFullAnalysis(productInfo);
  });
}

/**
 * Affiche un message d'erreur
 */
function showError(message) {
  // Créer une notification d'erreur
  const errorDiv = document.createElement('div');
  errorDiv.className = 'akpsy-error-notification';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

/**
 * Ajoute le produit à la liste de courses
 */
function addToShoppingList(productInfo) {
  chrome.runtime.sendMessage({
    type: 'ADD_TO_SHOPPING_LIST',
    product: productInfo
  }, (response) => {
    if (response && response.success) {
      showNotification('Produit ajouté à votre liste de courses');
    }
  });
}

/**
 * Active le suivi du prix
 */
function followPrice(productInfo) {
  chrome.runtime.sendMessage({
    type: 'FOLLOW_PRICE',
    product: productInfo
  }, (response) => {
    if (response && response.success) {
      showNotification('Suivi du prix activé. Vous serez notifié en cas de variation.');
    }
  });
}

/**
 * Ouvre l'analyse complète dans l'application
 */
function openFullAnalysis(productInfo) {
  const appUrl = `https://akiprisaye.web.app/comparateur.html?product=${encodeURIComponent(productInfo.name)}`;
  window.open(appUrl, '_blank');
}

/**
 * Affiche une notification de succès
 */
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'akpsy-success-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialiser le détecteur au chargement de la page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDetector);
} else {
  initDetector();
}

// Réinitialiser lors des changements d'URL (pour les SPA)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    overlayInjected = false;
    initDetector();
  }
}).observe(document, { subtree: true, childList: true });
