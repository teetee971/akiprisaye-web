/**
 * Sync Routes
 *
 * API endpoints for synchronization management.
 * All routes require a valid JWT with the ADMIN permission.
 */

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import prisma from '../../database/prisma.js';
import { syncOrchestrator } from '../../services/sync/syncOrchestrator.js';
import { syncScheduler } from '../../services/scheduler/syncScheduler.js';
import {
  unifiedAuthMiddleware,
  requirePermission,
} from '../middlewares/apiAuth.middleware.js';
import { ApiPermission } from '@prisma/client';

const router = Router();

const syncTriggerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit manual sync triggers per admin client per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many sync trigger requests, please try again later.',
  },
});

// All sync routes are admin-only
router.use(syncTriggerRateLimiter);
router.use(unifiedAuthMiddleware, requirePermission(ApiPermission.ADMIN));

/**
 * POST /api/sync/openfoodfacts/trigger
 * Trigger Open Food Facts sync manually
 */
router.post('/openfoodfacts/trigger', async (_req: Request, res: Response) => {
  try {
    console.info('🔄 Manual trigger: Open Food Facts sync');
    
    // Run sync in background
    syncOrchestrator.syncOpenFoodFacts().catch((error) => {
      console.error('Open Food Facts sync failed:', error);
    });

    res.json({
      success: true,
      message: 'Open Food Facts sync triggered',
    });
  } catch (error) {
    console.error('Error triggering Open Food Facts sync:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/openprices/trigger
 * Trigger Open Prices sync manually
 */
router.post('/openprices/trigger', async (_req: Request, res: Response) => {
  try {
    console.info('🔄 Manual trigger: Open Prices sync');
    
    // Run sync in background
    syncOrchestrator.syncOpenPrices().catch((error) => {
      console.error('Open Prices sync failed:', error);
    });

    res.json({
      success: true,
      message: 'Open Prices sync triggered',
    });
  } catch (error) {
    console.error('Error triggering Open Prices sync:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/all/trigger
 * Trigger all syncs manually
 */
router.post('/all/trigger', async (_req: Request, res: Response) => {
  try {
    console.info('🔄 Manual trigger: All syncs');
    
    // Run sync in background
    syncOrchestrator.syncAll().catch((error) => {
      console.error('Full sync failed:', error);
    });

    res.json({
      success: true,
      message: 'Full synchronization triggered',
    });
  } catch (error) {
    console.error('Error triggering full sync:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sync/status
 * Get current sync status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    // Get latest sync logs
    const latestSyncs = await prisma.syncLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    // Get scheduler status
    const jobs = syncScheduler.getJobs();

    res.json({
      success: true,
      syncs: latestSyncs,
      jobs,
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sync/history
 * Get sync history with pagination
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const source = req.query.source as string | undefined;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.syncLog.findMany({
        where: source ? { source } : undefined,
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.syncLog.count({
        where: source ? { source } : undefined,
      }),
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting sync history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sync/jobs
 * Get scheduled jobs status
 */
router.get('/jobs', async (_req: Request, res: Response) => {
  try {
    const jobs = syncScheduler.getJobs();

    res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error('Error getting jobs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/jobs/:jobId/trigger
 * Manually trigger a scheduled job
 */
router.post('/jobs/:jobId/trigger', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    await syncScheduler.triggerJob(jobId);

    res.json({
      success: true,
      message: `Job ${jobId} triggered successfully`,
    });
  } catch (error) {
    console.error('Error triggering job:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
