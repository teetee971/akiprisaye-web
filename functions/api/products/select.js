/**
 * Cloudflare Pages Function: /api/products/select
 * Tracks product selections for trending analytics using Redis sorted sets
 */

import { getRedisClient, trackProductSelection } from '../../utils/redis.js';

/**
 * Validate EAN code format
 * @param {string} ean - EAN code to validate
 * @returns {boolean} True if valid
 */
function isValidEan(ean) {
  if (!ean || typeof ean !== 'string') return false;
  const cleaned = ean.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 14;
}

/**
 * POST /api/products/select
 * Track a product selection with territory context
 * 
 * Body: {
 *   ean: string (required) - Product EAN code
 *   territory?: string - Territory code (default: 'Guadeloupe')
 *   name?: string - Product name
 *   brand?: string - Product brand
 *   image?: string | null - Product image URL
 * }
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    const { ean, territory = 'Guadeloupe', name, brand, image } = body;

    if (!ean) {
      return new Response(JSON.stringify({
        error: 'Missing EAN',
        message: 'EAN code is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!isValidEan(ean)) {
      return new Response(JSON.stringify({
        error: 'Invalid EAN',
        message: 'EAN must be 8-14 digits',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Redis client
    const redis = getRedisClient(env);

    if (!redis) {
      // If Redis is not configured, return success but log warning
      console.warn('Redis not configured - selection not tracked');
      return new Response(JSON.stringify({
        success: true,
        ean,
        territory,
        message: 'Selection recorded (Redis not configured)',
        tracked: false,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Track the selection
    const result = await trackProductSelection(redis, {
      ean,
      territory,
      name,
      brand,
      image,
    });

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      ean,
      territory,
      score: result.newScore,
      tracked: true,
      message: 'Product selection tracked successfully',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error in /api/products/select:', error);
    
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
export function onRequestGet(_context) {
  return new Response(JSON.stringify({
    error: 'Method not allowed',
    message: 'Use POST to track product selections',
  }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function onRequestPut(_context) {
  return onRequestGet(_context);
}

export function onRequestDelete(_context) {
  return onRequestGet(_context);
}

export function onRequestPatch(_context) {
  return onRequestGet(_context);
}
