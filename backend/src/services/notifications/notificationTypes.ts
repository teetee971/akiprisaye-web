/**
 * Notification Types and Interfaces
 */

import {
  NotificationType as PrismaNotificationType,
  NotificationChannel as PrismaNotificationChannel,
  NotificationStatus as PrismaNotificationStatus,
} from '@prisma/client';

export type NotificationType = PrismaNotificationType;
export type NotificationChannel = PrismaNotificationChannel;
export type NotificationStatus = PrismaNotificationStatus;

export interface Notification {
  id: string;
  userId: string;
  alertId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: any;
  status: NotificationStatus;
  sentAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  alertId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: any;
}

export interface NotificationData {
  productId: string;
  productName: string;
  oldPrice?: number;
  newPrice: number;
  storeName: string;
  storeId: string;
  savings?: number;
  savingsPercent?: number;
  alertType?: string;
}

export interface SendNotificationResult {
  success: boolean;
  notificationId: string;
  error?: string;
}
