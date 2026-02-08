/**
 * Public Inflation API Routes
 * 
 * Public endpoints for accessing inflation data with rate limiting
 * 
 * @swagger
 * tags:
 *   name: Inflation (Public)
 *   description: Public API for accessing inflation monitoring data
 */

import { Router, Request, Response } from 'express';
import { apiLimiter } from '../../middlewares/rateLimit.middleware.js';
import { 
  calculatePriceIndex,
  calculateAllIndices 
} from '../../../services/inflation/priceIndexCalculator.js';
import { 
  getInflationHistory 
} from '../../../services/inflation/historyService.js';

const router = Router();

// Apply rate limiting to all public routes
router.use(apiLimiter);

/**
 * @swagger
 * /api/v1/public/inflation/latest:
 *   get:
 *     summary: Get latest inflation data
 *     description: Returns the most recent inflation indices for all DOM-TOM territories
 *     tags: [Inflation (Public)]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *           example: '2026-02'
 *         description: Period in YYYY-MM format (defaults to current month if not provided)
 *       - in: query
 *         name: territory
 *         schema:
 *           type: string
 *           enum: [GP, MQ, GF, RE, YT, NC, PF, PM, WF, BL, MF]
 *         description: Specific territory code (optional, returns all if not provided)
 *     responses:
 *       200:
 *         description: Latest inflation data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                   example: '2026-02'
 *                 territories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       territory:
 *                         type: string
 *                       indexValue:
 *                         type: number
 *                       monthlyChange:
 *                         type: number
 *                       yearlyChange:
 *                         type: number
 *                       basketPrice:
 *                         type: number
 *                       productCount:
 *                         type: number
 *                       confidence:
 *                         type: number
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid parameters
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || new Date().toISOString().slice(0, 7);
    const territory = req.query.territory as string | undefined;

    // Validate period format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({ 
        error: 'Invalid period format',
        message: 'Period must be in YYYY-MM format (e.g., 2026-02)' 
      });
    }

    let data;
    if (territory) {
      // Get data for specific territory
      data = await calculatePriceIndex(territory, period);
      res.json({
        period,
        territory,
        data,
        generatedAt: new Date().toISOString(),
      });
    } else {
      // Get data for all territories
      const territories = await calculateAllIndices(period);
      res.json({
        period,
        territories,
        generatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[PUBLIC API] Error fetching latest inflation:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch inflation data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /api/v1/public/inflation/history:
 *   get:
 *     summary: Get historical inflation data
 *     description: Returns historical inflation trends for a specific territory
 *     tags: [Inflation (Public)]
 *     parameters:
 *       - in: query
 *         name: territory
 *         required: true
 *         schema:
 *           type: string
 *           enum: [GP, MQ, GF, RE, YT, NC, PF, PM, WF, BL, MF]
 *         description: Territory code
 *         example: 'RE'
 *       - in: query
 *         name: startPeriod
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *         description: Start period in YYYY-MM format
 *         example: '2025-01'
 *       - in: query
 *         name: endPeriod
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *         description: End period in YYYY-MM format
 *         example: '2026-02'
 *     responses:
 *       200:
 *         description: Historical inflation data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 territory:
 *                   type: string
 *                 territoryName:
 *                   type: string
 *                 startPeriod:
 *                   type: string
 *                 endPeriod:
 *                   type: string
 *                 dataPoints:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period:
 *                         type: string
 *                       indexValue:
 *                         type: number
 *                       monthlyChange:
 *                         type: number
 *                       yearlyChange:
 *                         type: number
 *                       basketPrice:
 *                         type: number
 *                 averageInflation:
 *                   type: number
 *                 minInflation:
 *                   type: number
 *                 maxInflation:
 *                   type: number
 *                 trend:
 *                   type: string
 *                   enum: [increasing, decreasing, stable]
 *       400:
 *         description: Missing or invalid parameters
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const territory = req.query.territory as string;
    const startPeriod = req.query.startPeriod as string;
    const endPeriod = req.query.endPeriod as string;

    // Validate required parameters
    if (!territory || !startPeriod || !endPeriod) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        message: 'Territory, startPeriod, and endPeriod are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate period formats
    if (!/^\d{4}-\d{2}$/.test(startPeriod) || !/^\d{4}-\d{2}$/.test(endPeriod)) {
      return res.status(400).json({ 
        error: 'Invalid period format',
        message: 'Periods must be in YYYY-MM format (e.g., 2026-02)',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate date range (max 24 months)
    const start = new Date(startPeriod);
    const end = new Date(endPeriod);
    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + 
                       (end.getMonth() - start.getMonth());
    
    if (monthsDiff < 0) {
      return res.status(400).json({ 
        error: 'Invalid date range',
        message: 'Start period must be before end period',
        timestamp: new Date().toISOString(),
      });
    }

    if (monthsDiff > 24) {
      return res.status(400).json({ 
        error: 'Date range too large',
        message: 'Maximum allowed range is 24 months',
        timestamp: new Date().toISOString(),
      });
    }

    const history = await getInflationHistory(territory, startPeriod, endPeriod);
    
    res.json({
      ...history,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[PUBLIC API] Error fetching inflation history:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch inflation history',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /api/v1/public/inflation/territories:
 *   get:
 *     summary: Get list of available territories
 *     description: Returns the list of DOM-TOM territories with inflation monitoring
 *     tags: [Inflation (Public)]
 *     responses:
 *       200:
 *         description: List of territories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 territories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       region:
 *                         type: string
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/territories', async (req: Request, res: Response) => {
  try {
    const territories = [
      { code: 'GP', name: 'Guadeloupe', region: 'Antilles' },
      { code: 'MQ', name: 'Martinique', region: 'Antilles' },
      { code: 'GF', name: 'Guyane', region: 'Amérique du Sud' },
      { code: 'RE', name: 'La Réunion', region: 'Océan Indien' },
      { code: 'YT', name: 'Mayotte', region: 'Océan Indien' },
      { code: 'NC', name: 'Nouvelle-Calédonie', region: 'Pacifique' },
      { code: 'PF', name: 'Polynésie française', region: 'Pacifique' },
      { code: 'PM', name: 'Saint-Pierre-et-Miquelon', region: 'Amérique du Nord' },
      { code: 'WF', name: 'Wallis-et-Futuna', region: 'Pacifique' },
      { code: 'BL', name: 'Saint-Barthélemy', region: 'Antilles' },
      { code: 'MF', name: 'Saint-Martin', region: 'Antilles' },
    ];

    res.json({
      territories,
      count: territories.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[PUBLIC API] Error fetching territories:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch territories',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
