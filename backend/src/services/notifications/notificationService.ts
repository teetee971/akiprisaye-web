/**
 * Notification Service
 * Handles creation and management of notifications
 */

import { PrismaClient, NotificationStatus } from '@prisma/client';
import type {
  CreateNotificationInput,
  Notification,
  SendNotificationResult,
} from './notificationTypes.js';
import type { TriggeredAlert } from '../alerts/alertTypes.js';
import { emailChannel } from './channels/emailChannel.js';
import { pushChannel } from './channels/pushChannel.js';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Create and send notifications for a triggered alert
   */
  async sendAlertNotification(triggeredAlert: TriggeredAlert): Promise<SendNotificationResult[]> {
    const { alert, trigger } = triggeredAlert;
    const results: SendNotificationResult[] = [];

    // Prepare notification data
    const title = `🔔 ${trigger.productName}`;
    const body = trigger.reason;
    const data = {
      productId: alert.productId,
      productName: trigger.productName,
      oldPrice: trigger.oldPrice,
      newPrice: trigger.newPrice,
      storeName: trigger.storeName,
      storeId: trigger.storeId,
      savings: trigger.savings,
      savingsPercent: trigger.savingsPercent,
      alertType: alert.alertType,
    };

    // Send via enabled channels
    if (alert.notifyEmail) {
      const result = await this.sendNotification({
        userId: alert.userId,
        alertId: alert.id,
        type: 'PRICE_ALERT',
        channel: 'EMAIL',
        title,
        body,
        data,
      });
      results.push(result);
    }

    if (alert.notifyPush) {
      const result = await this.sendNotification({
        userId: alert.userId,
        alertId: alert.id,
        type: 'PRICE_ALERT',
        channel: 'PUSH',
        title,
        body,
        data,
      });
      results.push(result);
    }

    // SMS channel not supported — notifySms flag is ignored

    return results;
  }

  /**
   * Send a notification via specified channel
   */
  async sendNotification(input: CreateNotificationInput): Promise<SendNotificationResult> {
    // Create notification record using Prisma model fields
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.body,
        metadata: input.data ?? undefined,
        status: 'UNREAD',
      },
    });

    try {
      // Build a Notification object (custom type) for channel dispatch
      const notificationObj: Notification = {
        id: notification.id,
        userId: notification.userId,
        alertId: input.alertId,
        type: notification.type,
        channel: input.channel,
        title: notification.title,
        body: input.body,
        data: input.data,
        status: 'UNREAD',
        createdAt: notification.createdAt,
      };

      // Send via appropriate channel
      await this.dispatchToChannel(notificationObj);

      return {
        success: true,
        notificationId: notification.id,
      };
    } catch (error) {
      // Archive notification on dispatch failure
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'ARCHIVED' },
      });

      return {
        success: false,
        notificationId: notification.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Dispatch notification to appropriate channel
   */
  private async dispatchToChannel(notification: Notification): Promise<void> {
    switch (notification.channel) {
      case 'EMAIL':
        await emailChannel.send(notification);
        break;
      case 'PUSH':
        await pushChannel.send(notification);
        break;
      case 'IN_APP':
        // In-app notifications are just stored in the database
        break;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options?: {
      status?: NotificationStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<Notification[]> {
    const where: { userId: string; status?: NotificationStatus } = { userId };

    if (options?.status) {
      where.status = options.status;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return notifications as unknown as Notification[];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId,
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId: userId,
        status: { in: ['UNREAD'] },
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: userId,
      },
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const count = await prisma.notification.count({
      where: {
        userId: userId,
        status: { in: ['UNREAD'] },
      },
    });

    return count;
  }
}

export const notificationService = new NotificationService();
