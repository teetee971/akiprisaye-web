/**
 * Map API Routes
 * Endpoints for interactive store map functionality
 */

import express, { Request, Response } from 'express';
import {
  getReferenceBasket,
} from '../../services/stores/priceIndexCalculator.js';
import {
  findNearbyStores,
  filterStoresByChains,
  type Store,
  type NearbyStoresOptions,
} from '../../services/stores/nearbyStoresService.js';
import {
  generateHeatmapData,
  getHeatmapConfig,
  getHeatmapStats,
  toLeafletHeatFormat,
} from '../../services/stores/heatmapService.js';
import { calculateDistance, calculateTravelTime } from '../../utils/geoUtils.js';

const router = express.Router();

// Store data loader - in production, this should load from database or a seed service
// We lazily initialize the cache from an environment-provided JSON payload
let storesCache: Store[] | null = null;

/**
 * Load stores from data source
 * Currently loads from the STORES_DATA environment variable (JSON array)
 * and caches the result for subsequent calls.
 */
function loadStores(): Store[] {
  if (storesCache && storesCache.length > 0) {
    return storesCache;
  }

  const rawStoresData = process.env.STORES_DATA;
  if (!rawStoresData) {
    throw new Error('STORES_DATA environment variable is not set');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawStoresData);
  } catch (err) {
    throw new Error('Failed to parse STORES_DATA environment variable as JSON');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('STORES_DATA JSON must be an array of stores');
  }

  storesCache = parsed as Store[];
  return storesCache;
}

/**
 * GET /api/map/stores
 * Get stores filtered by territory and optionally by chains
 * Query params:
 *  - territory: Territory code (e.g., 'GP', 'MQ')
 *  - chains: Comma-separated list of chain names (optional)
 */
router.get('/stores', async (req: Request, res: Response) => {
  try {
    const { territory, chains } = req.query;

    if (!territory || typeof territory !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: territory',
      });
    }

    let stores = loadStores();

    // Filter by territory (case-insensitive match)
    const territoryLower = territory.toLowerCase();
    stores = stores.filter(
      (store) => store.territory.toLowerCase().includes(territoryLower) ||
                territoryLower.includes(store.territory.toLowerCase())
    );

    // Filter by chains if provided
    if (chains && typeof chains === 'string') {
      const chainList = chains.split(',').map((c) => c.trim());
      stores = filterStoresByChains(stores, chainList);
    }

    return res.json({
      success: true,
      data: {
        territory,
        count: stores.length,
        stores,
      },
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch stores',
    });
  }
});

/**
 * GET /api/map/nearby
 * Find stores near a given location
 * Query params:
 *  - lat: Latitude
 *  - lon: Longitude
 *  - radius: Search radius in km (1-50, default 10)
 *  - chains: Comma-separated chain names (optional)
 *  - maxResults: Maximum number of results (optional)
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lon, radius = '10', chains, maxResults } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: lat, lon',
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);
    const searchRadius = parseFloat(radius as string);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(searchRadius)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinate or radius values',
      });
    }

    const stores = loadStores();

    const options: NearbyStoresOptions = {
      chains: chains ? (chains as string).split(',').map((c) => c.trim()) : undefined,
      maxResults: maxResults ? parseInt(maxResults as string) : undefined,
      sortBy: 'distance',
    };

    const nearbyStores = findNearbyStores(
      stores,
      latitude,
      longitude,
      searchRadius,
      options
    );

    return res.json({
      success: true,
      data: {
        location: { lat: latitude, lon: longitude },
        radius: searchRadius,
        count: nearbyStores.length,
        stores: nearbyStores,
      },
    });
  } catch (error) {
    console.error('Error finding nearby stores:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to find nearby stores',
    });
  }
});

/**
 * GET /api/map/stores/:id/price-index
 * Get price index for a specific store
 * This is a placeholder - actual implementation would need price data
 */
router.get('/stores/:id/price-index', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: id',
      });
    }

    const stores = loadStores();
    const store = stores.find((s) => s.id === id);

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
      });
    }

    // TODO: Load actual price data and calculate index
    // For now, return mock data
    return res.json({
      success: true,
      data: {
        storeId: id,
        storeName: store.name,
        priceIndex: 50, // Mock value
        category: 'medium',
        basketTotal: 0,
        territoryAverage: 0,
        missingProducts: [],
        productsFound: 0,
        productsTotal: 10,
        referenceBasket: getReferenceBasket(),
      },
    });
  } catch (error) {
    console.error('Error fetching price index:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch price index',
    });
  }
});

/**
 * GET /api/map/heatmap
 * Get heatmap data for a territory
 * Query params:
 *  - territory: Territory code (required)
 */
router.get('/heatmap', async (req: Request, res: Response) => {
  try {
    const { territory } = req.query;

    if (!territory || typeof territory !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: territory',
      });
    }

    let stores = loadStores();

    // Filter by territory
    const territoryLower = territory.toLowerCase();
    stores = stores.filter(
      (store) => store.territory.toLowerCase().includes(territoryLower)
    );

    // TODO: Load actual price indices
    // For now, generate mock price indices
    const priceIndices = new Map<string, number>();
    stores.forEach((store, index) => {
      // Generate mock price index (0-100)
      priceIndices.set(store.id, (index * 7) % 100);
    });

    const heatmapData = generateHeatmapData(stores, priceIndices, territory);
    const config = getHeatmapConfig(heatmapData);
    const stats = getHeatmapStats(heatmapData.points);
    const leafletData = toLeafletHeatFormat(heatmapData.points);

    return res.json({
      success: true,
      data: {
        territory,
        heatmap: heatmapData,
        config,
        stats,
        leafletFormat: leafletData,
      },
    });
  } catch (error) {
    console.error('Error generating heatmap:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate heatmap',
    });
  }
});

/**
 * GET /api/map/route
 * Calculate route between two points
 * Query params:
 *  - from: Start coordinates (lat,lon)
 *  - to: End coordinates (lat,lon)
 */
router.get('/route', async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: from, to (format: lat,lon)',
      });
    }

    const fromCoords = from.split(',').map((c) => parseFloat(c.trim()));
    const toCoords = to.split(',').map((c) => parseFloat(c.trim()));

    if (
      fromCoords.length !== 2 ||
      toCoords.length !== 2 ||
      fromCoords.some(isNaN) ||
      toCoords.some(isNaN)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinate format. Use: lat,lon',
      });
    }

    const [fromLat, fromLon] = fromCoords;
    const [toLat, toLon] = toCoords;

    const distance = calculateDistance(fromLat, fromLon, toLat, toLon);
    const travelTime = calculateTravelTime(distance); // Using default 180 sec/km

    return res.json({
      success: true,
      data: {
        from: { lat: fromLat, lon: fromLon },
        to: { lat: toLat, lon: toLon },
        distance: {
          km: distance,
          meters: Math.round(distance * 1000),
        },
        estimatedTime: {
          seconds: travelTime,
          minutes: Math.round(travelTime / 60),
        },
        // Note: This is a simple straight-line calculation
        // For actual turn-by-turn directions, integrate with a routing service
        note: 'This is a straight-line distance calculation. For actual routes, use a routing service.',
      },
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate route',
    });
  }
});

export default router;
