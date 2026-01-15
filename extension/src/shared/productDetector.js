/**
 * Product Detection Utility
 * Détecte les pages produits de manière sûre et limitée
 * PRINCIPE: User-triggered only, NO automatic background scan
 */

import { CONFIG } from './config.js';

/**
 * Détecte si l'URL actuelle correspond à une page produit supportée
 * @param {string} url - URL à vérifier
 * @returns {Object|null} - Informations du magasin ou null
 */
export function detectProductPage(url) {
  for (const [storeKey, storeConfig] of Object.entries(CONFIG.SUPPORTED_STORES)) {
    if (storeConfig.pattern.test(url)) {
      return {
        storeKey,
        storeName: storeConfig.name,
        productUrlPattern: storeConfig.productUrlPattern
      };
    }
  }
  return null;
}

/**
 * Extrait l'identifiant du produit depuis l'URL
 * @param {string} url - URL de la page produit
 * @param {RegExp} pattern - Pattern du magasin
 * @returns {string|null} - ID du produit ou null
 */
export function extractProductId(url, pattern) {
  const match = url.match(pattern);
  return match ? match[1] : null;
}

/**
 * Détecte les informations de base du produit depuis le DOM
 * IMPORTANT: Seulement après consentement utilisateur
 * @returns {Object|null} - Informations du produit
 */
export function extractProductInfo() {
  // Sélecteurs génériques pour les pages produits
  const productInfo = {
    name: null,
    brand: null,
    ean: null,
    price: null,
    quantity: null,
    unit: null
  };
  
  // Tentative d'extraction du nom du produit
  const nameSelectors = [
    'h1[itemprop="name"]',
    'h1.product-name',
    'h1.product-title',
    '[data-testid="product-title"]',
    'h1'
  ];
  
  for (const selector of nameSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      productInfo.name = element.textContent.trim();
      break;
    }
  }
  
  // Tentative d'extraction de la marque
  const brandSelectors = [
    '[itemprop="brand"]',
    '.product-brand',
    '[data-testid="product-brand"]'
  ];
  
  for (const selector of brandSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      productInfo.brand = element.textContent.trim();
      break;
    }
  }
  
  // Tentative d'extraction du prix
  const priceSelectors = [
    '[itemprop="price"]',
    '.product-price',
    '[data-testid="product-price"]',
    '.price'
  ];
  
  for (const selector of priceSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const priceText = element.textContent || element.getAttribute('content');
      if (priceText) {
        // Extraire le prix numérique
        const priceMatch = priceText.match(/(\d+[,.]?\d*)/);
        if (priceMatch) {
          productInfo.price = parseFloat(priceMatch[1].replace(',', '.'));
        }
      }
      break;
    }
  }
  
  // Tentative d'extraction de l'EAN depuis les métadonnées
  const eanMeta = document.querySelector('[itemprop="gtin13"]') ||
                  document.querySelector('[data-ean]') ||
                  document.querySelector('[data-gtin]');
  
  if (eanMeta) {
    productInfo.ean = eanMeta.getAttribute('content') || 
                      eanMeta.getAttribute('data-ean') ||
                      eanMeta.getAttribute('data-gtin');
  }
  
  // Retourner null si aucune information critique n'a été trouvée
  if (!productInfo.name && !productInfo.price) {
    return null;
  }
  
  return productInfo;
}

/**
 * Vérifie si l'utilisateur a donné son consentement
 * @returns {Promise<boolean>}
 */
export async function hasUserConsent() {
  return new Promise((resolve) => {
    chrome.storage.local.get([CONFIG.STORAGE_KEYS.USER_CONSENT], (result) => {
      resolve(result[CONFIG.STORAGE_KEYS.USER_CONSENT] === true);
    });
  });
}

/**
 * Enregistre le consentement de l'utilisateur
 * @param {boolean} consent - Consentement accordé ou non
 * @returns {Promise<void>}
 */
export async function setUserConsent(consent) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      { [CONFIG.STORAGE_KEYS.USER_CONSENT]: consent },
      resolve
    );
  });
}
