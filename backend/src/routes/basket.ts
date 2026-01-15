/**
 * Basket Comparison API Routes
 * 
 * Phase 8: REST API endpoints for basket price comparison and optimization
 * Provides comprehensive analysis and recommendations
 */

import { Router, Request, Response } from 'express';

const router = Router();

// In-memory data (replace with database in production)
let baskets: any[] = [];

/**
 * Analyze basket pricing
 * POST /api/basket/analyze
 * 
 * Body:
 * {
 *   "items": [
 *     { "ean": "3017620422003", "quantity": 2 },
 *     { "ean": "3029330003533", "quantity": 1 }
 *   ],
 *   "userPosition": { "lat": 16.2415, "lon": -61.5331 }
 * }
 */
router.post('/analyze', (req: Request, res: Response) => {
  try {
    const { items, userPosition } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required and must not be empty',
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.ean || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Each item must have an EAN and positive quantity',
        });
      }
    }

    // Validate user position if provided
    if (userPosition) {
      if (
        typeof userPosition.lat !== 'number' ||
        typeof userPosition.lon !== 'number' ||
        userPosition.lat < -90 ||
        userPosition.lat > 90 ||
        userPosition.lon < -180 ||
        userPosition.lon > 180
      ) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user position coordinates',
        });
      }
    }

    // Calculate basket analysis (mock implementation)
    const analysis = calculateBasketAnalysis(items, userPosition);

    return res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error analyzing basket:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Compare basket across stores
 * POST /api/basket/compare
 * 
 * Body:
 * {
 *   "items": [...],
 *   "territory": "GP",
 *   "userPosition": { "lat": 16.2415, "lon": -61.5331 },
 *   "sortBy": "price" | "distance" | "freshness"
 * }
 */
router.post('/compare', (req: Request, res: Response) => {
  try {
    const { items, territory, userPosition, sortBy = 'price' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required',
      });
    }

    // Calculate store comparisons
    const comparisons = calculateStoreComparisons(items, territory, userPosition, sortBy);

    return res.json({
      success: true,
      data: {
        comparisons,
        metadata: {
          itemCount: items.length,
          storeCount: comparisons.length,
          sortBy,
          territory: territory || 'all',
        },
      },
    });
  } catch (error) {
    console.error('Error comparing stores:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Get optimization recommendations
 * POST /api/basket/optimize
 * 
 * Body:
 * {
 *   "items": [...],
 *   "preferences": {
 *     "maxDistance": 10,
 *     "prioritize": "savings" | "convenience" | "balanced"
 *   },
 *   "userPosition": { "lat": 16.2415, "lon": -61.5331 }
 * }
 */
router.post('/optimize', (req: Request, res: Response) => {
  try {
    const { items, preferences = {}, userPosition } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required',
      });
    }

    const recommendations = generateOptimizationRecommendations(
      items,
      preferences,
      userPosition
    );

    return res.json({
      success: true,
      data: {
        recommendations,
        preferences,
      },
    });
  } catch (error) {
    console.error('Error optimizing basket:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Save basket for later
 * POST /api/basket/save
 * 
 * Body:
 * {
 *   "name": "Mon panier",
 *   "items": [...],
 *   "territory": "GP"
 * }
 */
router.post('/save', (req: Request, res: Response) => {
  try {
    const { name, items, territory } = req.body;

    if (!name || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Name and items are required',
      });
    }

    const basket = {
      id: `basket-${Date.now()}`,
      name,
      items,
      territory: territory || 'GP',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    baskets.push(basket);

    return res.status(201).json({
      success: true,
      data: basket,
    });
  } catch (error) {
    console.error('Error saving basket:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Get saved baskets
 * GET /api/basket/saved
 */
router.get('/saved', (req: Request, res: Response) => {
  try {
    return res.json({
      success: true,
      data: baskets,
      meta: {
        total: baskets.length,
      },
    });
  } catch (error) {
    console.error('Error fetching baskets:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Calculate basket analysis (mock implementation)
 */
function calculateBasketAnalysis(items: any[], userPosition?: any): any {
  // Mock data - replace with actual calculation
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

  return {
    basket: {
      items: totalItems,
      totalQuantity,
    },
    bestOption: {
      storeId: 'carrefour-jarry-gp',
      storeName: 'Carrefour Jarry',
      totalPrice: 45.99,
      availableItems: totalItems,
      dataFreshness: 95,
      distance: userPosition ? 2.5 : undefined,
    },
    comparison: {
      lowestPrice: 45.99,
      highestPrice: 52.50,
      averagePrice: 48.75,
      priceRange: 6.51,
      potentialSavings: 6.51,
    },
    recommendations: [
      {
        type: 'price',
        priority: 'high',
        title: 'Économisez en changeant de magasin',
        description: 'Faites vos courses chez Carrefour Jarry au lieu de Super U',
        savings: 6.51,
      },
    ],
    multiStoreOption: {
      stores: [
        {
          storeId: 'carrefour-jarry-gp',
          storeName: 'Carrefour Jarry',
          items: ['3017620422003'],
          totalPrice: 23.00,
          distance: 2.5,
        },
        {
          storeId: 'leclerc-destrellan-gp',
          storeName: 'E.Leclerc Destrellan',
          items: ['3029330003533'],
          totalPrice: 21.50,
          distance: 3.2,
        },
      ],
      totalPrice: 44.50,
      savings: 1.49,
      extraDistance: 0.7,
      worthwhile: false,
      reason: 'Économies trop faibles pour justifier plusieurs magasins',
    },
  };
}

/**
 * Calculate store comparisons (mock implementation)
 */
function calculateStoreComparisons(
  items: any[],
  territory?: string,
  userPosition?: any,
  sortBy = 'price'
): any[] {
  // Mock data - replace with actual calculation
  const stores = [
    {
      storeId: 'carrefour-jarry-gp',
      storeName: 'Carrefour Jarry',
      chain: 'Carrefour',
      territory: 'GP',
      totalPrice: 45.99,
      availableItems: items.length,
      totalItems: items.length,
      dataFreshness: 95,
      distance: userPosition ? 2.5 : undefined,
    },
    {
      storeId: 'leclerc-destrellan-gp',
      storeName: 'E.Leclerc Destrellan',
      chain: 'E.Leclerc',
      territory: 'GP',
      totalPrice: 47.20,
      availableItems: items.length,
      totalItems: items.length,
      dataFreshness: 88,
      distance: userPosition ? 3.2 : undefined,
    },
    {
      storeId: 'super-u-gp',
      storeName: 'Super U',
      chain: 'Super U',
      territory: 'GP',
      totalPrice: 52.50,
      availableItems: items.length,
      totalItems: items.length,
      dataFreshness: 92,
      distance: userPosition ? 1.8 : undefined,
    },
  ];

  // Filter by territory if provided
  let filtered = territory
    ? stores.filter(s => s.territory === territory.toUpperCase())
    : stores;

  // Sort based on criteria
  switch (sortBy) {
    case 'distance':
      filtered.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      break;
    case 'freshness':
      filtered.sort((a, b) => b.dataFreshness - a.dataFreshness);
      break;
    case 'price':
    default:
      filtered.sort((a, b) => a.totalPrice - b.totalPrice);
      break;
  }

  return filtered;
}

/**
 * Generate optimization recommendations (mock implementation)
 */
function generateOptimizationRecommendations(
  items: any[],
  preferences: any,
  userPosition?: any
): any[] {
  const prioritize = preferences.prioritize || 'balanced';

  const recommendations = [];

  if (prioritize === 'savings' || prioritize === 'balanced') {
    recommendations.push({
      type: 'price',
      priority: 'high',
      title: 'Meilleur prix global',
      description: 'Carrefour Jarry offre le meilleur prix total pour votre panier',
      savings: 6.51,
      storeId: 'carrefour-jarry-gp',
    });
  }

  if (prioritize === 'convenience' || prioritize === 'balanced') {
    recommendations.push({
      type: 'distance',
      priority: 'medium',
      title: 'Magasin le plus proche',
      description: 'Super U est à seulement 1.8km avec un prix légèrement plus élevé',
      extraDistance: -0.7,
      storeId: 'super-u-gp',
    });
  }

  if (prioritize === 'balanced') {
    recommendations.push({
      type: 'mixed',
      priority: 'medium',
      title: 'Compromis idéal',
      description: 'E.Leclerc offre un bon équilibre entre prix et distance',
      savings: 5.30,
      extraDistance: 0.7,
      storeId: 'leclerc-destrellan-gp',
    });
  }

  return recommendations;
}

export default router;
