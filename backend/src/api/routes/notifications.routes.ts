/**
 * Notifications API Routes
 * 
 * Endpoints for managing notifications and preferences
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { notificationService } from '../../services/notifications/notificationService.js';
import { pushChannel } from '../../services/notifications/channels/pushChannel.js';
import { PrismaClient, NotificationStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

/**
 * Get user's notifications
 * GET /api/notifications
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    const options = {
      status: req.query.status as NotificationStatus | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const notifications = await notificationService.getUserNotifications(userId, options);
    const unreadCount = await notificationService.getUnreadCount(userId);

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await notificationService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    await notificationService.markAsRead(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
router.patch('/read-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await notificationService.markAllAsRead(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    await notificationService.deleteNotification(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

/**
 * Get notification preferences
 * GET /api/notifications/preferences
 */
router.get('/preferences', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

/**
 * Update notification preferences
 * PUT /api/notifications/preferences
 */
router.put('/preferences', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        emailEnabled: req.body.emailEnabled,
        pushEnabled: req.body.pushEnabled,
      },
      create: {
        userId,
        emailEnabled: req.body.emailEnabled ?? true,
        pushEnabled: req.body.pushEnabled ?? true,
      },
    });

    res.json(preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

/**
 * Subscribe to push notifications
 * POST /api/notifications/push-subscription
 */
router.post('/push-subscription', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    await pushChannel.subscribe(
      userId,
      {
        endpoint: req.body.endpoint,
        keys: {
          p256dh: req.body.keys.p256dh,
          auth: req.body.keys.auth,
        },
      },
      req.headers['user-agent']
    );

    res.status(201).json({ message: 'Push subscription created' });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({ error: 'Failed to subscribe to push notifications' });
  }
});

/**
 * Unsubscribe from push notifications
 * DELETE /api/notifications/push-subscription
 */
router.delete('/push-subscription', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    await pushChannel.unsubscribe(userId, req.body.endpoint);
    res.status(204).send();
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from push notifications' });
  }
});

/**
 * Get push subscription status
 * GET /api/notifications/push-subscription
 */
router.get('/push-subscription', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return void res.status(401).json({ error: 'Unauthorized' });
    }

    const subscriptions = await pushChannel.getSubscriptions(userId);
    res.json({
      subscribed: subscriptions.length > 0,
      subscriptions,
    });
  } catch (error) {
    console.error('Error fetching push subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch push subscription status' });
  }
});

export default router;
