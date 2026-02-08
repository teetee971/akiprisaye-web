/**
 * Inflation Dashboard API Routes
 * 
 * Private endpoints for inflation monitoring and analysis
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { 
  calculatePriceIndex,
  calculateAllIndices 
} from '../../services/inflation/priceIndexCalculator.js';
import { 
  getCategoryInflation,
  getAllCategoriesInflation 
} from '../../services/inflation/categoryAnalysisService.js';
import { 
  getMetroComparison,
  getAllMetroComparisons 
} from '../../services/inflation/metroComparisonService.js';
import { 
  getTopMovers 
} from '../../services/inflation/topMoversService.js';
import { 
  getInflationHistory 
} from '../../services/inflation/historyService.js';
import { 
  exportInflationData,
  ExportFormat,
  ExportType 
} from '../../services/inflation/exportService.js';
import { 
  generatePressKit,
  getPressKits 
} from '../../services/inflation/pressKitService.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Get inflation overview for all territories
 * GET /api/inflation/overview
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string;
    
    if (!period) {
      return res.status(400).json({ 
        error: 'Missing required parameter',
        message: 'Period parameter is required (format: YYYY-MM)' 
      });
    }

    const indices = await calculateAllIndices(period);
    
    res.json({
      period,
      territories: indices,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching inflation overview:', error);
    res.status(500).json({ 
      error: 'Failed to fetch inflation overview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get inflation data for a specific territory
 * GET /api/inflation/territory/:code
 */
router.get('/territory/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const period = req.query.period as string;

    if (!period) {
      return res.status(400).json({ 
        error: 'Missing required parameter',
        message: 'Period parameter is required (format: YYYY-MM)' 
      });
    }

    const priceIndex = await calculatePriceIndex(code, period);
    const categories = await getAllCategoriesInflation(code, period);

    res.json({
      territory: code,
      period,
      priceIndex,
      categories,
    });
  } catch (error) {
    console.error('Error fetching territory inflation:', error);
    res.status(500).json({ 
      error: 'Failed to fetch territory inflation data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get all category inflation data
 * GET /api/inflation/categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const territory = req.query.territory as string;
    const period = req.query.period as string;

    if (!territory || !period) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        message: 'Territory and period parameters are required' 
      });
    }

    const categories = await getAllCategoriesInflation(territory, period);
    
    res.json({
      territory,
      period,
      categories,
    });
  } catch (error) {
    console.error('Error fetching category data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch category inflation data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get inflation data for a specific category
 * GET /api/inflation/category/:category
 */
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const territory = req.query.territory as string;
    const period = req.query.period as string;

    if (!territory || !period) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        message: 'Territory and period parameters are required' 
      });
    }

    const categoryData = await getCategoryInflation(territory, period, category);
    
    res.json(categoryData);
  } catch (error) {
    console.error('Error fetching category inflation:', error);
    res.status(500).json({ 
      error: 'Failed to fetch category inflation data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get historical inflation data
 * GET /api/inflation/history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const territory = req.query.territory as string;
    const startPeriod = req.query.startPeriod as string;
    const endPeriod = req.query.endPeriod as string;

    if (!territory || !startPeriod || !endPeriod) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        message: 'Territory, startPeriod, and endPeriod parameters are required' 
      });
    }

    const history = await getInflationHistory(territory, startPeriod, endPeriod);
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching inflation history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch inflation history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get top price movers
 * GET /api/inflation/top-movers
 */
router.get('/top-movers', async (req: Request, res: Response) => {
  try {
    const territory = req.query.territory as string;
    const period = req.query.period as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!territory || !period) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        message: 'Territory and period parameters are required' 
      });
    }

    const topMovers = await getTopMovers(territory, period, limit);
    
    res.json(topMovers);
  } catch (error) {
    console.error('Error fetching top movers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch top movers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get metro comparison data
 * GET /api/inflation/compare/metro
 */
router.get('/compare/metro', async (req: Request, res: Response) => {
  try {
    const territory = req.query.territory as string;
    const period = req.query.period as string;

    if (!period) {
      return res.status(400).json({ 
        error: 'Missing required parameter',
        message: 'Period parameter is required' 
      });
    }

    let comparison;
    if (territory) {
      comparison = await getMetroComparison(territory, period);
    } else {
      comparison = await getAllMetroComparisons(period);
    }
    
    res.json(comparison);
  } catch (error) {
    console.error('Error fetching metro comparison:', error);
    res.status(500).json({ 
      error: 'Failed to fetch metro comparison data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Export inflation data
 * GET /api/inflation/export
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as ExportFormat) || 'json';
    const type = (req.query.type as ExportType) || 'full-report';
    const territory = req.query.territory as string | undefined;
    const period = req.query.period as string | undefined;
    const startPeriod = req.query.startPeriod as string | undefined;
    const endPeriod = req.query.endPeriod as string | undefined;

    const exportResult = await exportInflationData({
      format,
      type,
      territory,
      period,
      startPeriod,
      endPeriod,
    });

    res.setHeader('Content-Type', exportResult.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.send(exportResult.data);
  } catch (error) {
    console.error('Error exporting inflation data:', error);
    res.status(500).json({ 
      error: 'Failed to export inflation data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get or generate press kit
 * GET /api/inflation/press-kit
 */
router.get('/press-kit', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string;
    const list = req.query.list === 'true';

    if (list) {
      // List all available press kits
      const startPeriod = req.query.startPeriod as string || '2025-01';
      const endPeriod = req.query.endPeriod as string || new Date().toISOString().slice(0, 7);
      const pressKits = await getPressKits(startPeriod, endPeriod);
      return res.json(pressKits);
    }

    if (!period) {
      return res.status(400).json({ 
        error: 'Missing required parameter',
        message: 'Period parameter is required when not listing press kits' 
      });
    }

    const pressKit = await generatePressKit(period);
    
    res.json(pressKit);
  } catch (error) {
    console.error('Error generating press kit:', error);
    res.status(500).json({ 
      error: 'Failed to generate press kit',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
