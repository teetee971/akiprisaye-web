/* eslint-env worker */
/**
 * Cloudflare Pages Function: /api/products/search
 * Search products by name/keywords using OpenFoodFacts API
 * Returns list of products with basic info for selection
 */

/**
 * Sanitize search query
 * @param {string} query - Raw search input
 * @returns {string|null} Sanitized query or null if invalid
 */
function sanitizeQuery(query) {
  if (!query || typeof query !== 'string') return null;
  
  // Remove special characters but keep spaces, letters, numbers, and hyphens
  const cleaned = query.trim().replace(/[^\w\s\-àâäæçéèêëïîôùûüÿœ]/gi, '');
  
  // Require minimum 2 characters
  if (cleaned.length < 2) return null;
  
  // Limit length to prevent abuse
  return cleaned.substring(0, 100);
}

/**
 * Search products on OpenFoodFacts API
 * @param {string} query - Search query
 * @param {number} pageSize - Results per page
 * @returns {Promise<Array>} List of products
 */
async function searchProducts(query, pageSize = 10) {
  try {
    const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
    url.searchParams.set('search_terms', query);
    url.searchParams.set('search_simple', '1');
    url.searchParams.set('action', 'process');
    url.searchParams.set('json', '1');
    url.searchParams.set('page', '1');
    url.searchParams.set('page_size', pageSize.toString());
    url.searchParams.set('fields', 'code,product_name,product_name_fr,brands,image_url,image_small_url');
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AkiPriSaYe/1.0 (https://akiprisaye.com)',
      },
    });
    
    if (!response.ok) {
      console.error('OpenFoodFacts API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    // Map to simpler format for frontend
    return (data.products || [])
      .filter(p => p.code && (p.product_name || p.product_name_fr))
      .map(product => ({
        ean: product.code,
        name: product.product_name_fr || product.product_name || 'Produit sans nom',
        brand: product.brands || '',
        image: product.image_small_url || product.image_url || null,
      }))

      .slice(0, pageSize); // Ensure we don't exceed page size
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

/**
 * Main handler for GET /api/products/search
 */
export async function onRequestGet(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const params = url.searchParams;
    
    // Extract and validate query parameter
    const rawQuery = params.get('q');
    const query = sanitizeQuery(rawQuery);
    
    if (!query) {
      return new Response(JSON.stringify({
        error: 'Invalid or missing search query',
        message: 'Query must be at least 2 characters',
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // Territory parameter (optional, for future use)
    const territory = params.get('territory') || 'Guadeloupe';
    
    // Search products
    const products = await searchProducts(query, 10);
    
    return new Response(JSON.stringify(products), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
    
  } catch (error) {
    console.error('Error in /api/products/search:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Handle OPTIONS request for CORS
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
