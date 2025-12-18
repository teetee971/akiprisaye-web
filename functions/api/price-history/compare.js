/**
 * Cloudflare Pages Function: /api/price-history/compare
 * 
 * CORE MODULE 3: Territorial Price Comparison API
 * 
 * Compare the same product across multiple territories/stores
 * 
 * Query parameters:
 * - product_id: Product identifier (required)
 * - territories: Comma-separated territory codes (optional, defaults to all)
 */

export async function onRequestGet(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    
    const productId = url.searchParams.get('product_id');
    const territories = url.searchParams.get('territories')?.split(',') || [];
    
    if (!productId) {
      return new Response(JSON.stringify({
        error: 'Missing product_id',
        message: 'Product ID is required for comparison'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // TODO: PRODUCTION IMPLEMENTATION
    // In production:
    // 1. Fetch price history for productId from all requested territories
    // 2. Calculate average, min, max per territory
    // 3. Calculate price dispersion
    // 4. Return comparison data with observation counts
    // 5. Include warning if insufficient data
    
    const mockResponse = {
      product_id: productId,
      product_name: 'Product Name Here',
      comparison: {},
      warning: territories.length < 2 ? 'Comparaison nécessite au moins 2 territoires' : null,
      disclaimer: 'Cette plateforme présente des observations factuelles de prix basées sur des données publiques et soumises par les utilisateurs.',
      metadata: {
        calculation_method: 'Prix moyens observés par territoire',
        same_product_reference: true
      }
    };
    
    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      }
    });
    
  } catch (error) {
    console.error('Error in /api/price-history/compare:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
