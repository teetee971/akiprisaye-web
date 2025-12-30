/**
 * Backend Function: comparePrices
 * Cloudflare Pages Function: /functions/compare.js
 * 
 * Compares prices for a given product (by EAN) across territories
 * Returns sorted list of prices from lowest to highest
 * 
 * @param {string} ean - Product EAN code (8-14 digits)
 * @param {string} territoire - Territory code (guadeloupe, martinique, etc.)
 * @returns {Array} Sorted array of price objects
 */

// Territory codes mapping
const TERRITORIES = {
  guadeloupe: 'GP',
  martinique: 'MQ',
  guyane: 'GF',
  reunion: 'RE',
  mayotte: 'YT',
  'saint-pierre': 'PM',
  'saint-barth': 'BL',
  'saint-martin': 'MF',
  wallis: 'WF',
  polynesie: 'PF',
  'nouvelle-caledonie': 'NC',
  taaf: 'TF',
};

/**
 * Sanitize EAN code
 * @param {string} ean - Raw EAN input
 * @returns {string|null} Sanitized EAN or null if invalid
 */
function sanitizeEan(ean) {
  if (!ean) return null;
  const cleaned = ean.replace(/\D/g, '');
  if (cleaned.length >= 8 && cleaned.length <= 14) {
    return cleaned;
  }
  return null;
}

/**
 * Validate territory code
 * @param {string} territoire - Territory name or code
 * @returns {string|null} Territory code or null if invalid
 */
function validateTerritory(territoire) {
  if (!territoire) return null;
  
  const normalized = territoire.toLowerCase().trim();
  
  // Check if it's a valid territory name
  if (TERRITORIES[normalized]) {
    return TERRITORIES[normalized];
  }
  
  // Check if it's a valid territory code
  const codes = Object.values(TERRITORIES);
  if (codes.includes(territoire.toUpperCase())) {
    return territoire.toUpperCase();
  }
  
  return null;
}

/**
 * Main handler for GET /api/compare
 */
export async function onRequestGet(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const params = url.searchParams;
    
    // Extract and validate parameters
    const rawEan = params.get('ean');
    const ean = sanitizeEan(rawEan);
    
    if (!ean) {
      return new Response(JSON.stringify({
        error: 'Invalid or missing EAN code',
        message: 'EAN must be 8-14 digits',
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    const rawTerritoire = params.get('territoire');
    const territoire = validateTerritory(rawTerritoire);
    
    // TODO: PRODUCTION IMPLEMENTATION
    // In production, this function should:
    // 1. Connect to Firestore using Firebase Admin SDK
    // 2. Query prices collection: where('ean', '==', ean)
    // 3. If territoire specified, filter: where('territory', '==', territoire)
    // 4. Filter out expired prices: where('expiresAt', '>', Date.now())
    // 5. Join with stores collection to get store details
    // 6. Calculate age in hours: (Date.now() - capturedAt) / (1000 * 60 * 60)
    // 7. Sort by price ascending
    // 8. Return structured response
    
    // Mock response structure for development
    const mockResponse = {
      ean: ean,
      territoire: territoire || 'all',
      product: {
        name: 'Produit Example',
        brand: 'Marque',
        category: 'Épicerie',
        image: null,
      },
      prices: [
        // Would be populated from Firestore in production
        // Example structure:
        // {
        //   storeId: 'store123',
        //   storeName: 'Supermarché Example',
        //   territory: 'GP',
        //   price: 2.99,
        //   currency: 'EUR',
        //   unit: 'unité',
        //   capturedAt: 1699564800000,
        //   ageHours: 24,
        //   source: 'user' | 'ocr' | 'api',
        //   verified: true,
        //   promo: false,
        // }
      ],
      count: 0,
      best: null, // Lowest price object
      message: 'API endpoint ready. Connect to Firestore for live data.',
    };
    
    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Error in /api/compare:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * CORS preflight handler
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
