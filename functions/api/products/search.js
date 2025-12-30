/**
 * Cloudflare Pages Function: /api/products/search
 * Search products using Open Food Facts API
 */

/**
 * Main handler for GET /api/products/search
 */
export async function onRequestGet(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const params = url.searchParams;
    
    const q = (params.get('q') || '').trim();
    
    if (q.length < 3) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Territory parameter available for future filtering
    const _territory = params.get('territory') || 'Guadeloupe';

    // Search Open Food Facts
    const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=15`;
    const results = await fetch(offUrl).then((r) => r.json());

    const items = (results.products || [])
      .map((p) => ({
        name: p.product_name || p.generic_name || 'Produit inconnu',
        brand: p.brands || '—',
        ean: p.code,
        image: p.image_small_url || p.image_url || null,
      }))
      .filter((p) => p.ean)
      .slice(0, 15);

    return new Response(JSON.stringify(items), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error in /api/products/search:', error);
    
    return new Response(JSON.stringify({
      error: 'Error searching products',
      message: error.message,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
