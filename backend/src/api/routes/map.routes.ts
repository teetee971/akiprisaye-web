/**
 * Map API Routes
 * Endpoints for interactive map features
 */

import { Router, Request, Response } from 'express';
import { SEED_STORES } from '../../../../src/data/seedStores.js';
import { calculatePriceIndex } from '../../services/stores/priceIndexCalculator.js';
import { findNearbyStores } from '../../services/stores/nearbyStoresService.js';
import { generateHeatmap } from '../../services/stores/heatmapService.js';
import {
  calculateDistance,
  AVERAGE_SECONDS_PER_KM,
} from '../../utils/geoUtils.js';

// Helper function to get price category
function getPriceCategory(priceIndex: number): 'cheap' | 'medium' | 'expensive' {
  if (priceIndex <= 33) return 'cheap';
  if (priceIndex <= 66) return 'medium';
  return 'expensive';
}

const router = Router();

/**
 * GET /api/map/stores
 * Get all stores with price indices for map display
 */
router.get('/stores', async (req: Request, res: Response) => {
  try {
    const { territory, chains } = req.query;

    // Filter stores
    let stores = SEED_STORES;

    if (territory) {
      stores = stores.filter(
        s => s.territory?.toLowerCase() === String(territory).toLowerCase()
      );
    }

    if (chains) {
      const chainList = String(chains).split(',');
      stores = stores.filter(s =>
        chainList.some(chain =>
          s.chain?.toLowerCase().includes(chain.toLowerCase())
        )
      );
    }

    // Add price data to stores
    const storesWithPrices = await Promise.all(
      stores.map(async store => {
        try {
          const priceData = await calculatePriceIndex(store.id);
          return {
            id: store.id,
            name: store.name,
            chain: store.chain,
            coordinates: store.coordinates,
            priceIndex: priceData.priceIndex,
            priceCategory: getPriceCategory(priceData.priceIndex),
            averageBasketPrice: priceData.averageBasketPrice,
            address: store.address,
            city: store.city,
            postalCode: store.postalCode,
            phone: store.phone,
            services: store.services || [],
            territory: store.territory,
          };
        } catch (error) {
          console.error(`Error getting price data for ${store.id}:`, error);
          // Return store without price data
          return {
            id: store.id,
            name: store.name,
            chain: store.chain,
            coordinates: store.coordinates,
            priceIndex: 50,
            priceCategory: 'medium' as const,
            averageBasketPrice: 0,
            address: store.address,
            city: store.city,
            postalCode: store.postalCode,
            phone: store.phone,
            services: store.services || [],
            territory: store.territory,
          };
        }
      })
    );

    // Territory info
    const territories = [
      { code: 'GP', name: 'Guadeloupe', center: [16.25, -61.55], zoom: 10 },
      { code: 'MQ', name: 'Martinique', center: [14.64, -61.02], zoom: 10 },
      { code: 'GF', name: 'Guyane', center: [4.92, -52.33], zoom: 8 },
      { code: 'RE', name: 'La Réunion', center: [-21.11, 55.53], zoom: 10 },
      { code: 'YT', name: 'Mayotte', center: [-12.82, 45.17], zoom: 11 },
      { code: 'SX', name: 'Saint-Martin', center: [18.08, -63.05], zoom: 12 },
      { code: 'BL', name: 'Saint-Barthélemy', center: [17.9, -62.83], zoom: 13 },
    ];

    return res.json({
      success: true,
      data: {
        stores: storesWithPrices,
        territories,
      },
    });
  } catch (error) {
    console.error('Error fetching map stores:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/map/nearby
 * Get stores near a location
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lon, radius, chains, limit, sortBy } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lon));
    const searchRadius = radius ? parseFloat(String(radius)) : 10;

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude or longitude',
      });
    }

    const chainList = chains ? String(chains).split(',') : undefined;
    const maxLimit = limit ? parseInt(String(limit)) : undefined;

    const nearbyStores = await findNearbyStores({
      lat: latitude,
      lon: longitude,
      radius: searchRadius,
      chains: chainList,
      limit: maxLimit,
      sortBy: sortBy as any,
    });

    // Add price data
    const storesWithPrices = await Promise.all(
      nearbyStores.map(async store => {
        try {
          const priceData = await calculatePriceIndex(store.id);
          return {
            ...store,
            priceIndex: priceData.priceIndex,
            priceCategory: getPriceCategory(priceData.priceIndex),
            averageBasketPrice: priceData.averageBasketPrice,
          };
        } catch (error) {
          return {
            ...store,
            priceIndex: 50,
            priceCategory: 'medium' as const,
            averageBasketPrice: 0,
          };
        }
      })
    );

    return res.json({
      success: true,
      data: {
        stores: storesWithPrices,
        center: [latitude, longitude],
        radius: searchRadius,
      },
    });
  } catch (error) {
    console.error('Error fetching nearby stores:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/map/stores/:id/price-index
 * Get detailed price index for a store
 */
router.get('/stores/:id/price-index', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const priceData = await calculatePriceIndex(id);

    // Find store to get additional info
    const store = SEED_STORES.find(s => s.id === id);
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
      });
    }

    // Calculate ranking (mock for now)
    const ranking = {
      inTerritory: 15,
      totalInTerritory: 109,
      inChain: 3,
      totalInChain: 12,
    };

    return res.json({
      success: true,
      data: {
        ...priceData,
        ranking,
      },
    });
  } catch (error) {
    console.error('Error fetching price index:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/map/heatmap
 * Get heatmap data for price visualization
 */
router.get('/heatmap', async (req: Request, res: Response) => {
  try {
    const { territory } = req.query;
    const heatmapData = await generateHeatmap(
      territory ? String(territory) : undefined
    );

    return res.json({
      success: true,
      data: heatmapData,
    });
  } catch (error) {
    console.error('Error generating heatmap:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/map/route
 * Calculate route between two points (using OSRM)
 * For now, returns a mock route
 */
router.get('/route', async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'From and to coordinates are required',
      });
    }

    const [fromLat, fromLon] = String(from).split(',').map(parseFloat);
    const [toLat, toLon] = String(to).split(',').map(parseFloat);

    if (
      isNaN(fromLat) ||
      isNaN(fromLon) ||
      isNaN(toLat) ||
      isNaN(toLon)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates format',
      });
    }

    // Mock route for now
    // In production, this would call OSRM API
    const distance = calculateDistance(fromLat, fromLon, toLat, toLon) * 1000; // Convert to meters
    const duration = (distance / 1000) * AVERAGE_SECONDS_PER_KM;

    return res.json({
      success: true,
      data: {
        distance: Math.round(distance),
        duration: Math.round(duration),
        geometry: {
          type: 'LineString',
          coordinates: [
            [fromLon, fromLat],
            [toLon, toLat],
          ],
        },
        instructions: [
          {
            type: 'depart',
            distance: 0,
            duration: 0,
          },
          {
            type: 'arrive',
            distance: Math.round(distance),
            duration: Math.round(duration),
          },
        ],
      },
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
