/**
 * Alerts API Routes
 * 
 * Endpoints for managing price alerts
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { alertService } from '../../services/alerts/alertService.js';
import type { CreateAlertInput, UpdateAlertInput } from '../../services/alerts/alertTypes.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Create a new alert
 * POST /api/alerts
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    const input: CreateAlertInput = {
      userId,
      productId: req.body.productId,
      alertType: req.body.alertType,
      targetPrice: req.body.targetPrice,
      territory: req.body.territory,
      notifyEmail: req.body.notifyEmail,
      notifyPush: req.body.notifyPush,
      notifySms: req.body.notifySms,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
    };

    const alert = await alertService.createAlert(input);
    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ 
      error: 'Failed to create alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get user's alerts
 * GET /api/alerts
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    const options = {
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      productId: req.query.productId as string | undefined,
      skip: req.query.skip ? parseInt(req.query.skip as string) : undefined,
      take: req.query.take ? parseInt(req.query.take as string) : undefined,
    };

    const alerts = await alertService.getUserAlerts(userId, options);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * Get alert by ID
 * GET /api/alerts/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    const alert = await alertService.getAlert(req.params.id, userId);
    if (!alert) {
      return void res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

/**
 * Update alert
 * PUT /api/alerts/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    const input: UpdateAlertInput = {
      alertType: req.body.alertType,
      targetPrice: req.body.targetPrice,
      territory: req.body.territory,
      notifyEmail: req.body.notifyEmail,
      notifyPush: req.body.notifyPush,
      notifySms: req.body.notifySms,
      isActive: req.body.isActive,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
    };

    const alert = await alertService.updateAlert(req.params.id, userId, input);
    res.json(alert);
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ 
      error: 'Failed to update alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Toggle alert active status
 * PATCH /api/alerts/:id/toggle
 */
router.patch('/:id/toggle', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    const alert = await alertService.toggleAlert(req.params.id, userId);
    res.json(alert);
  } catch (error) {
    console.error('Error toggling alert:', error);
    res.status(500).json({ 
      error: 'Failed to toggle alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete alert
 * DELETE /api/alerts/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    await alertService.deleteAlert(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ 
      error: 'Failed to delete alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create quick alert (simplified)
 * POST /api/alerts/quick
 */
router.post('/quick', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    const input: CreateAlertInput = {
      userId,
      productId: req.body.productId,
      alertType: req.body.alertType || 'PRICE_DROP',
      targetPrice: req.body.targetPrice,
      notifyEmail: true,
      notifyPush: true,
      notifySms: false,
    };

    const alert = await alertService.createAlert(input);
    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating quick alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

export default router;
