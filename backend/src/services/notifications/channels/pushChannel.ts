/**
 * Push Channel
 * Handles sending push notifications via Web Push API
 */

import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';
import type { Notification } from '../notificationTypes.js';

const prisma = new PrismaClient();

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@akiprisaye.fr';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

class PushChannel {
  /**
   * Send push notification
   */
  async send(notification: Notification): Promise<void> {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.warn('VAPID keys not configured, skipping push notification');
      return;
    }

    // Get user's push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: notification.userId,
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      console.warn('No active push subscriptions found for user');
      return;
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: notification.data,
      actions: [
        { action: 'view', title: '👀 Voir' },
        { action: 'dismiss', title: '❌ Ignorer' },
      ],
    });

    // Send to all user's subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload
          );

          // Update last used timestamp
          await prisma.pushSubscription.update({
            where: { id: subscription.id },
            data: { lastUsedAt: new Date() },
          });
        } catch (error: any) {
          // Handle subscription errors (expired, invalid, etc.)
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription is no longer valid, deactivate it
            await prisma.pushSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false },
            });
          }
          throw error;
        }
      })
    );

    // Check if any notification was sent successfully
    const anySuccess = results.some(result => result.status === 'fulfilled');
    if (!anySuccess) {
      throw new Error('Failed to send push notification to any subscription');
    }
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribe(
    userId: string,
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    },
    userAgent?: string
  ): Promise<void> {
    // Check if subscription already exists
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });

    if (existing) {
      // Reactivate if it was deactivated
      await prisma.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          isActive: true,
          lastUsedAt: new Date(),
        },
      });
    } else {
      // Create new subscription
      await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          isActive: true,
        },
      });
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await prisma.pushSubscription.updateMany({
      where: {
        userId,
        endpoint,
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Get user's active subscriptions
   */
  async getSubscriptions(userId: string): Promise<any[]> {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    return subscriptions;
  }
}

export const pushChannel = new PushChannel();
