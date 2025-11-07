/**
 * Cloudflare Pages Function: /api/prices
 * Returns price information for a given EAN with optional location-based filtering
 */

// Note: This is a Cloudflare Pages Function
// Firebase Admin SDK would be used here in production, but this is a client-side compatible stub
// In production, use Firebase Admin SDK with service account credentials

/**
 * Sanitize EAN code (digits only, length 8-14)
 * @param {string} ean - Raw EAN input
 * @returns {string|null} Sanitized EAN or null if invalid
 */
function sanitizeEan(ean) {
  if (!ean) return null;
  
  // Remove all non-digits
  const cleaned = ean.replace(/\D/g, '');
  
  // Validate length (EAN-8, EAN-13, or other valid lengths)
  if (cleaned.length >= 8 && cleaned.length <= 14) {
    return cleaned;
  }
  
  return null;
}

/**
 * Clamp radius to maximum allowed value
 * @param {number} radius - Requested radius in km
 * @returns {number} Clamped radius (max 200km)
 */
function clampRadius(radius) {
  const MAX_RADIUS = 200;
  const num = parseFloat(radius);
  
  if (isNaN(num) || num <= 0) {
    return 50; // Default radius
  }
  
  return Math.min(num, MAX_RADIUS);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Note: This function is duplicated from src/data/firestorePrices.js
 * because Cloudflare Workers cannot import from src/ directory.
 * @param {number} lat1 - Latitude 1
 * @param {number} lng1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lng2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Main handler for GET /api/prices
 */
export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const params = url.searchParams;
    
    // Extract and validate parameters
    const rawEan = params.get('ean');
    const ean = sanitizeEan(rawEan);
    
    if (!ean) {
      return new Response(JSON.stringify({
        error: 'Invalid or missing EAN code',
        message: 'EAN must be 8-14 digits'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Optional location parameters
    const lat = params.get('lat') ? parseFloat(params.get('lat')) : null;
    const lng = params.get('lng') ? parseFloat(params.get('lng')) : null;
    const radius = clampRadius(params.get('radius') || 50);
    
    // TODO: PRODUCTION IMPLEMENTATION REQUIRED
    // This is a stub response for MVP development and testing.
    // 
    // In production, connect to Firestore using Firebase Admin SDK:
    // 1. Initialize Admin SDK with service account credentials
    // 2. Query products/{ean} for product info
    // 3. Query prices collection where ean == ean and filter by expiresAt
    // 4. If lat/lng provided, query stores and filter by distance using calculateDistance()
    // 5. Calculate ageHours for each price: (Date.now() - capturedAt) / (1000 * 60 * 60)
    // 6. Sort prices by price (ascending) to find best deal
    // 7. Return structured response as shown below
    //
    // This mock response allows frontend development and testing independently.
    
    // Mock data structure for demonstration
    const mockResponse = {
      ean: ean,
      product: null, // Would be fetched from products collection
      prices: [], // Would be fetched from prices collection
      best: null, // Would be calculated from available prices
      message: 'API endpoint is ready. Connect to Firestore for live data.'
    };
    
    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
    
  } catch (error) {
    console.error('Error in /api/prices:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Export for other methods (POST, PUT, etc.) - currently not implemented
export function onRequestPost(context) {
  return new Response(JSON.stringify({
    error: 'Method not allowed',
    message: 'POST not supported on this endpoint'
  }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}
