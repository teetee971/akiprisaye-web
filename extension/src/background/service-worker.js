/**
 * Background Service Worker
 * Gère la communication entre content script et API
 * PRINCIPE: NO TRACKING, NO BACKGROUND SCAN
 */

import { CONFIG } from '../shared/config.js';
import { setUserConsent } from '../shared/productDetector.js';

// Écouteur de messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_CONSENT') {
    handleSetConsent(message.consent).then(() => {
      sendResponse({ success: true });
    });
    return true; // Indique que la réponse sera asynchrone
  }
  
  if (message.type === 'ANALYZE_PRODUCT') {
    handleAnalyzeProduct(message.productInfo).then((result) => {
      sendResponse(result);
    });
    return true;
  }
  
  if (message.type === 'ADD_TO_SHOPPING_LIST') {
    handleAddToShoppingList(message.product).then((result) => {
      sendResponse(result);
    });
    return true;
  }
  
  if (message.type === 'FOLLOW_PRICE') {
    handleFollowPrice(message.product).then((result) => {
      sendResponse(result);
    });
    return true;
  }
  
  if (message.type === 'GET_TERRITORY') {
    handleGetTerritory().then((result) => {
      sendResponse(result);
    });
    return true;
  }
  
  if (message.type === 'SET_TERRITORY') {
    handleSetTerritory(message.territory).then((result) => {
      sendResponse(result);
    });
    return true;
  }
});

/**
 * Gère le consentement de l'utilisateur
 */
async function handleSetConsent(consent) {
  await setUserConsent(consent);
  
  // Enregistrer la date du consentement
  if (consent) {
    await chrome.storage.local.set({
      consent_date: new Date().toISOString()
    });
  }
}

/**
 * Analyse un produit et récupère les données de prix
 */
async function handleAnalyzeProduct(productInfo) {
  try {
    // Récupérer le territoire de l'utilisateur
    const territory = await getUserTerritory();
    
    // Construire la requête API
    const apiUrl = `${CONFIG.API_BASE_URL}/prices/compare`;
    const params = new URLSearchParams({
      productName: productInfo.name,
      territory: territory.code,
      store: productInfo.storeKey
    });
    
    if (productInfo.ean) {
      params.append('ean', productInfo.ean);
    }
    
    // Appel API avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(`${apiUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const priceData = await response.json();
      
      return {
        success: true,
        priceData: formatPriceData(priceData, productInfo, territory)
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error analyzing product:', error);
    
    // Retourner des données vides en cas d'erreur
    // Pas de données simulées - respect du principe "mieux vaut une page vide qu'un chiffre faux"
    return {
      success: true,
      priceData: {
        observationDate: new Date().toLocaleDateString('fr-FR'),
        comparison: [],
        history: [],
        source: null,
        territoryAverage: null,
        trendSummary: null
      }
    };
  }
}

/**
 * Formate les données de prix reçues de l'API
 */
function formatPriceData(apiData, productInfo, territory) {
  const formatted = {
    observationDate: apiData.observation_date || new Date().toLocaleDateString('fr-FR'),
    comparison: [],
    history: [],
    source: apiData.source || null,
    territoryAverage: apiData.territory_average || null,
    trendSummary: apiData.trend_summary || null
  };
  
  // Formater les comparaisons
  if (apiData.comparison && Array.isArray(apiData.comparison)) {
    const prices = apiData.comparison.map(item => item.price);
    const minPrice = Math.min(...prices);
    
    formatted.comparison = apiData.comparison.map(item => ({
      storeName: item.store_name,
      price: item.price,
      isBest: item.price === minPrice
    }));
  }
  
  // Formater l'historique
  if (apiData.history && Array.isArray(apiData.history)) {
    formatted.history = apiData.history;
  }
  
  return formatted;
}

/**
 * Récupère le territoire de l'utilisateur
 */
async function getUserTerritory() {
  return new Promise((resolve) => {
    chrome.storage.local.get([CONFIG.STORAGE_KEYS.USER_TERRITORY], (result) => {
      if (result[CONFIG.STORAGE_KEYS.USER_TERRITORY]) {
        resolve(result[CONFIG.STORAGE_KEYS.USER_TERRITORY]);
      } else {
        // Territoire par défaut: France métropolitaine
        resolve(CONFIG.TERRITORIES.METROPOLE);
      }
    });
  });
}

/**
 * Gère la récupération du territoire
 */
async function handleGetTerritory() {
  const territory = await getUserTerritory();
  return { success: true, territory };
}

/**
 * Gère la mise à jour du territoire
 */
async function handleSetTerritory(territory) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      { [CONFIG.STORAGE_KEYS.USER_TERRITORY]: territory },
      () => {
        resolve({ success: true });
      }
    );
  });
}

/**
 * Ajoute un produit à la liste de courses
 */
async function handleAddToShoppingList(product) {
  return new Promise((resolve) => {
    chrome.storage.local.get([CONFIG.STORAGE_KEYS.SHOPPING_LIST], (result) => {
      const shoppingList = result[CONFIG.STORAGE_KEYS.SHOPPING_LIST] || [];
      
      // Vérifier si le produit n'est pas déjà dans la liste
      const exists = shoppingList.some(item => 
        item.name === product.name && item.store === product.store
      );
      
      if (!exists) {
        shoppingList.push({
          ...product,
          addedAt: new Date().toISOString()
        });
        
        chrome.storage.local.set(
          { [CONFIG.STORAGE_KEYS.SHOPPING_LIST]: shoppingList },
          () => {
            // Synchroniser avec l'app principale si possible
            syncWithPWA('shopping_list', shoppingList);
            resolve({ success: true });
          }
        );
      } else {
        resolve({ success: true, message: 'Product already in list' });
      }
    });
  });
}

/**
 * Active le suivi du prix d'un produit
 */
async function handleFollowPrice(product) {
  return new Promise((resolve) => {
    chrome.storage.local.get([CONFIG.STORAGE_KEYS.FOLLOWED_PRODUCTS], (result) => {
      const followedProducts = result[CONFIG.STORAGE_KEYS.FOLLOWED_PRODUCTS] || [];
      
      // Vérifier si le produit n'est pas déjà suivi
      const exists = followedProducts.some(item => 
        item.name === product.name && item.store === product.store
      );
      
      if (!exists) {
        followedProducts.push({
          ...product,
          followedAt: new Date().toISOString(),
          lastPrice: product.price,
          alerts: {
            priceIncrease: true,
            priceDecrease: true,
            threshold: 0.05 // 5% de variation
          }
        });
        
        chrome.storage.local.set(
          { [CONFIG.STORAGE_KEYS.FOLLOWED_PRODUCTS]: followedProducts },
          () => {
            // Synchroniser avec l'app principale
            syncWithPWA('followed_products', followedProducts);
            resolve({ success: true });
          }
        );
      } else {
        resolve({ success: true, message: 'Product already followed' });
      }
    });
  });
}

/**
 * Synchronise les données avec la PWA principale
 * Utilise l'API de l'app si disponible
 */
async function syncWithPWA(dataType, data) {
  try {
    const syncUrl = `${CONFIG.API_BASE_URL}/sync/${dataType}`;
    
    // Tentative de synchronisation
    await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data })
    });
  } catch (error) {
    // La synchronisation échoue silencieusement
    // Les données restent en local
    console.log('Sync failed, data stored locally only');
  }
}

/**
 * Vérification périodique des prix suivis
 * Exécuté uniquement si l'utilisateur a activé les alertes
 */
async function checkFollowedPrices() {
  const result = await chrome.storage.local.get([
    CONFIG.STORAGE_KEYS.FOLLOWED_PRODUCTS,
    CONFIG.STORAGE_KEYS.PRICE_ALERTS
  ]);
  
  const followedProducts = result[CONFIG.STORAGE_KEYS.FOLLOWED_PRODUCTS] || [];
  const alertsEnabled = result[CONFIG.STORAGE_KEYS.PRICE_ALERTS] || false;
  
  if (!alertsEnabled || followedProducts.length === 0) {
    return;
  }
  
  // Vérifier chaque produit suivi
  for (const product of followedProducts) {
    try {
      const response = await handleAnalyzeProduct(product);
      
      if (response.success && response.priceData.comparison.length > 0) {
        const currentPrice = response.priceData.comparison.find(
          item => item.storeName === product.store
        )?.price;
        
        if (currentPrice && product.lastPrice) {
          const variation = (currentPrice - product.lastPrice) / product.lastPrice;
          
          if (Math.abs(variation) >= product.alerts.threshold) {
            // Envoyer une notification
            chrome.notifications.create({
              type: 'basic',
              iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
              title: 'A KI PRI SA YÉ - Alerte Prix',
              message: `${product.name} : ${variation > 0 ? 'hausse' : 'baisse'} de ${Math.abs(variation * 100).toFixed(1)}%`,
              priority: 1
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking price for', product.name, error);
    }
  }
}

// Vérifier les prix suivis toutes les 24 heures
chrome.alarms.create('checkPrices', { periodInMinutes: 1440 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkPrices') {
    checkFollowedPrices();
  }
});
