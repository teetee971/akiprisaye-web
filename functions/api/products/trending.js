/**
 * Cloudflare Pages Function: /api/products/trending
 * Returns trending/popular products by territory with 24h cache
 */

// Simple in-memory cache with TTL
// In Cloudflare Workers, this cache lives per-worker instance
// For production, consider using Cloudflare KV or Durable Objects
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Static seed data for trending products by territory
 * In production, this would be computed from actual user search data
 */
const TRENDING_SEEDS = {
  Guadeloupe: [
    { ean: '3017620422003', name: 'Nutella 400g', brand: 'Ferrero', image: null },
    { ean: '3560070557547', name: 'Huile Tournesol 1L', brand: 'Lesieur', image: null },
    { ean: '3270160648023', name: 'Riz Basmati 1kg', brand: 'Taureau Ailé', image: null },
    { ean: '3564700256602', name: 'Lait demi-écrémé 1L', brand: 'Lactel', image: null },
    { ean: '3560070557554', name: 'Pâtes Spaghetti 500g', brand: 'Panzani', image: null },
  ],
  Martinique: [
    { ean: '3017620422003', name: 'Nutella 400g', brand: 'Ferrero', image: null },
    { ean: '3560070557547', name: 'Huile Tournesol 1L', brand: 'Lesieur', image: null },
    { ean: '3270160648023', name: 'Riz Basmati 1kg', brand: 'Taureau Ailé', image: null },
    { ean: '3564700256602', name: 'Lait demi-écrémé 1L', brand: 'Lactel', image: null },
    { ean: '3560070557554', name: 'Pâtes Spaghetti 500g', brand: 'Panzani', image: null },
  ],
  Réunion: [
    { ean: '3017620422003', name: 'Nutella 400g', brand: 'Ferrero', image: null },
    { ean: '3560070557547', name: 'Huile Tournesol 1L', brand: 'Lesieur', image: null },
    { ean: '3270160648023', name: 'Riz Basmati 1kg', brand: 'Taureau Ailé', image: null },
    { ean: '3564700256602', name: 'Lait demi-écrémé 1L', brand: 'Lactel', image: null },
    { ean: '3560070557554', name: 'Pâtes Spaghetti 500g', brand: 'Panzani', image: null },
  ],
  Guyane: [
    { ean: '3017620422003', name: 'Nutella 400g', brand: 'Ferrero', image: null },
    { ean: '3560070557547', name: 'Huile Tournesol 1L', brand: 'Lesieur', image: null },
    { ean: '3270160648023', name: 'Riz Basmati 1kg', brand: 'Taureau Ailé', image: null },
    { ean: '3564700256602', name: 'Lait demi-écrémé 1L', brand: 'Lactel', image: null },
    { ean: '3560070557554', name: 'Pâtes Spaghetti 500g', brand: 'Panzani', image: null },
  ],
};

/**
 * Get trending products from cache or seed data
 * @param {string} territory - Territory code
 * @returns {Array} List of trending products
 */
function getTrendingProducts(territory) {
  const cacheKey = `trending:${territory}`;
  const now = Date.now();
  
  // Check cache
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    // Cache expired, remove it
    cache.delete(cacheKey);
  }
  
  // Get seed data or default to Guadeloupe
  const data = TRENDING_SEEDS[territory] || TRENDING_SEEDS.Guadeloupe;
  
  // Store in cache
  cache.set(cacheKey, {
    data,
    timestamp: now,
  });
  
  return data;
}

/**
 * Main handler for GET /api/products/trending
 */
export async function onRequestGet(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const params = url.searchParams;
    
    const territory = params.get('territory') || 'Guadeloupe';
    
    const trending = getTrendingProducts(territory);
    
    return new Response(JSON.stringify(trending), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error in /api/products/trending:', error);
    
    return new Response(JSON.stringify({
      error: 'Error fetching trending products',
      message: error.message,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
