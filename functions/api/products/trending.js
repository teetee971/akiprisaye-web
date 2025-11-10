/**
 * Cloudflare Pages Function: /api/products/trending
 * Retrieves top trending products by territory
 */

import { getRedisClient, getTrendingProducts } from '../../utils/redis.js';

/**
 * GET /api/products/trending
 * Get top trending products for a territory
 * 
 * Query parameters:
 * - territory: string (default: 'Guadeloupe') - Territory code
 * - limit: number (default: 10, max: 100) - Number of products to return
 */
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    // Parse query parameters
    const territory = params.get('territory') || 'Guadeloupe';
    const limitParam = params.get('limit');
    let limit = 10;

    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 100); // Cap at 100
      }
    }

    // Initialize Redis client
    const redis = getRedisClient(env);

    if (!redis) {
      // If Redis is not configured, return empty array
      return new Response(JSON.stringify({
        territory,
        limit,
        products: [],
        message: 'Redis not configured - no trending data available',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        },
      });
    }

    // Get trending products
    const products = await getTrendingProducts(redis, territory, limit);

    return new Response(JSON.stringify({
      territory,
      limit,
      count: products.length,
      products,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    });

  } catch (error) {
    console.error('Error in /api/products/trending:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Handle other HTTP methods
 */
export function onRequestPost(_context) {
  return new Response(JSON.stringify({
    error: 'Method not allowed',
    message: 'Use GET to retrieve trending products',
  }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function onRequestPut(_context) {
  return onRequestPost(_context);
}

export function onRequestDelete(_context) {
  return onRequestPost(_context);
}

export function onRequestPatch(_context) {
  return onRequestPost(_context);
}
