/**
 * Geocoding API Routes
 * 
 * Phase 7: REST API endpoints for geocoding services
 * Provides address-to-coordinates conversion and reverse geocoding
 */

import { Router, Request, Response } from 'express';

const router = Router();

// Rate limiting for geocoding (1 request per second to respect Nominatim)
const geocodingRateLimit: Record<string, number> = {};
const RATE_LIMIT_MS = 1000;

/**
 * Check rate limit for IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const lastRequest = geocodingRateLimit[ip] || 0;
  
  if (now - lastRequest < RATE_LIMIT_MS) {
    return false;
  }
  
  geocodingRateLimit[ip] = now;
  return true;
}

/**
 * Geocode an address
 * POST /api/geocoding/geocode
 * 
 * Body:
 * {
 *   "address": "123 Rue de la République, Pointe-à-Pitre, Guadeloupe"
 * }
 */
router.post('/geocode', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    // Rate limiting
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait 1 second between requests.',
      });
    }

    // Call Nominatim API
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}&limit=1`;

    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'fr',
        'User-Agent': 'akiprisaye-web/2.1.0 (+https://github.com/teetee971/akiprisaye-web)',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data: any = await response.json();

    if (!data || data.length === 0) {
      return res.json({
        success: false,
        address,
        error: 'Address not found',
      });
    }

    const location = data[0];
    return res.json({
      success: true,
      address,
      coordinates: {
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon),
      },
      displayName: location.display_name,
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Reverse geocode coordinates to address
 * POST /api/geocoding/reverse
 * 
 * Body:
 * {
 *   "lat": 16.2415,
 *   "lon": -61.5331
 * }
 */
router.post('/reverse', async (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.body;

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Valid latitude and longitude are required',
      });
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
      });
    }

    // Rate limiting
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait 1 second between requests.',
      });
    }

    // Call Nominatim API
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'fr',
        'User-Agent': 'akiprisaye-web/2.1.0 (+https://github.com/teetee971/akiprisaye-web)',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data: any = await response.json();

    if (!data || !data.display_name) {
      return res.json({
        success: false,
        coordinates: { lat, lon },
        error: 'Address not found for these coordinates',
      });
    }

    return res.json({
      success: true,
      coordinates: { lat, lon },
      address: data.display_name,
      details: {
        road: data.address?.road,
        city: data.address?.city || data.address?.town || data.address?.village,
        postcode: data.address?.postcode,
        country: data.address?.country,
      },
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Batch geocode multiple addresses
 * POST /api/geocoding/batch
 * 
 * Body:
 * {
 *   "addresses": ["address1", "address2", ...]
 * }
 * 
 * Note: Limited to 10 addresses per request to prevent abuse
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { addresses } = req.body;

    if (!Array.isArray(addresses)) {
      return res.status(400).json({
        success: false,
        error: 'Addresses must be an array',
      });
    }

    if (addresses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one address is required',
      });
    }

    if (addresses.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 addresses per batch request',
      });
    }

    // Rate limiting
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait 1 second between requests.',
      });
    }

    const results = [];
    let successful = 0;
    let failed = 0;

    // Process each address with rate limiting
    for (const address of addresses) {
      if (typeof address !== 'string') {
        results.push({
          success: false,
          address,
          error: 'Invalid address format',
        });
        failed++;
        continue;
      }

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}&limit=1`;

        const response = await fetch(url, {
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'akiprisaye-web/2.1.0 (+https://github.com/teetee971/akiprisaye-web)',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: any = await response.json();

        if (!data || data.length === 0) {
          results.push({
            success: false,
            address,
            error: 'Address not found',
          });
          failed++;
          continue;
        }

        const location = data[0];
        results.push({
          success: true,
          address,
          coordinates: {
            lat: parseFloat(location.lat),
            lon: parseFloat(location.lon),
          },
          displayName: location.display_name,
        });
        successful++;
      } catch (error) {
        results.push({
          success: false,
          address,
          error: error instanceof Error ? error.message : 'Geocoding failed',
        });
        failed++;
      }

      // Wait 1 second between requests to respect Nominatim rate limit
      // Note: For batch operations, consider implementing a queue-based approach
      // for better performance with large batches
      if (results.length < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
      }
    }

    return res.json({
      success: failed === 0,
      results,
      statistics: {
        total: addresses.length,
        successful,
        failed,
      },
    });
  } catch (error) {
    console.error('Batch geocoding error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Validate coordinates
 * POST /api/geocoding/validate
 * 
 * Body:
 * {
 *   "lat": 16.2415,
 *   "lon": -61.5331
 * }
 */
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.body;

    const isValid =
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      !isNaN(lat) &&
      !isNaN(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180;

    return res.json({
      valid: isValid,
      coordinates: { lat, lon },
      errors: isValid
        ? []
        : [
            ...(typeof lat !== 'number' || isNaN(lat)
              ? ['Invalid latitude: must be a number']
              : []),
            ...(lat < -90 || lat > 90
              ? ['Latitude out of range: must be between -90 and 90']
              : []),
            ...(typeof lon !== 'number' || isNaN(lon)
              ? ['Invalid longitude: must be a number']
              : []),
            ...(lon < -180 || lon > 180
              ? ['Longitude out of range: must be between -180 and 180']
              : []),
          ],
    });
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
