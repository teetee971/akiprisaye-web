/**
 * Cloudflare Pages Function: /api/price-history/:productId
 * 
 * CORE MODULE 3: Price History API
 * 
 * Returns complete price history timeline for a product
 * - All fields: product_id, product_name, store_name, territory, price, unit, quantity, 
 *   date_of_observation, data_source, confidence_level
 * - Append-only data (immutable)
 * - Sorted by date
 * 
 * Query parameters:
 * - territory: Filter by territory (optional)
 * - start_date: Filter from date (ISO format, optional)
 * - end_date: Filter to date (ISO format, optional)
 */

export async function onRequestGet(context) {
  try {
    const { request, params } = context;
    const url = new URL(request.url);
    const productId = params.productId;
    
    // Extract optional filters
    const territory = url.searchParams.get('territory');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    
    if (!productId) {
      return new Response(JSON.stringify({
        error: 'Missing product ID',
        message: 'Product ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // TODO: PRODUCTION IMPLEMENTATION
    // In production, connect to Firestore:
    // 1. Query priceHistory collection where product_id == productId
    // 2. Apply filters (territory, date range)
    // 3. Sort by date_of_observation ascending
    // 4. Return complete timeline with metadata
    
    const mockResponse = {
      product_id: productId,
      product_name: 'Product Name Here',
      total_observations: 0,
      territories: [],
      date_range: {
        earliest: null,
        latest: null
      },
      filters_applied: {
        territory: territory || 'all',
        start_date: startDate || null,
        end_date: endDate || null
      },
      history: [],
      disclaimer: 'Cette plateforme présente des observations factuelles de prix basées sur des données publiques et soumises par les utilisateurs.',
      metadata: {
        append_only: true,
        no_prediction: true,
        factual_only: true
      }
    };
    
    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minutes
      }
    });
    
  } catch (error) {
    console.error('Error in /api/price-history:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
