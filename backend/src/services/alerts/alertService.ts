/**
 * Alert Service
 * Handles CRUD operations for price alerts
 */

import { PrismaClient } from '@prisma/client';
import type { CreateAlertInput, UpdateAlertInput, PriceAlert } from './alertTypes.js';

const prisma = new PrismaClient();

export class AlertService {
  /**
   * Create a new price alert
   */
  async createAlert(input: CreateAlertInput): Promise<PriceAlert> {
    const alert = await prisma.priceAlert.create({
      data: {
        userId: input.userId,
        productId: input.productId,
        alertType: input.alertType,
        targetPrice: input.targetPrice,
        territory: input.territory || '',
        notifyEmail: input.notifyEmail ?? true,
        notifyPush: input.notifyPush ?? true,
        notifySms: input.notifySms ?? false,
        expiresAt: input.expiresAt,
        isActive: true,
        triggeredCount: 0,
      },
    });

    return alert;
  }

  /**
   * Get alert by ID
   */
  async getAlert(alertId: string, userId: string): Promise<PriceAlert | null> {
    const alert = await prisma.priceAlert.findFirst({
      where: {
        id: alertId,
        userId: userId,
      },
    });

    return alert;
  }

  /**
   * Get all alerts for a user
   */
  async getUserAlerts(userId: string, options?: {
    isActive?: boolean;
    productId?: string;
    skip?: number;
    take?: number;
  }): Promise<PriceAlert[]> {
    const where: any = { userId };

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.productId) {
      where.productId = options.productId;
    }

    const alerts = await prisma.priceAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });

    return alerts;
  }

  /**
   * Get alerts for a specific product
   */
  async getProductAlerts(productId: string): Promise<PriceAlert[]> {
    const alerts = await prisma.priceAlert.findMany({
      where: {
        productId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return alerts;
  }

  /**
   * Update alert
   */
  async updateAlert(alertId: string, userId: string, input: UpdateAlertInput): Promise<PriceAlert> {
    // Verify ownership
    const existing = await this.getAlert(alertId, userId);
    if (!existing) {
      throw new Error('Alert not found or unauthorized');
    }

    const alert = await prisma.priceAlert.update({
      where: { id: alertId },
      data: input,
    });

    return alert;
  }

  /**
   * Toggle alert active status
   */
  async toggleAlert(alertId: string, userId: string): Promise<PriceAlert> {
    const existing = await this.getAlert(alertId, userId);
    if (!existing) {
      throw new Error('Alert not found or unauthorized');
    }

    const alert = await prisma.priceAlert.update({
      where: { id: alertId },
      data: { isActive: !existing.isActive },
    });

    return alert;
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId: string, userId: string): Promise<void> {
    const existing = await this.getAlert(alertId, userId);
    if (!existing) {
      throw new Error('Alert not found or unauthorized');
    }

    await prisma.priceAlert.delete({
      where: { id: alertId },
    });
  }

  /**
   * Increment triggered count
   */
  async incrementTriggeredCount(alertId: string): Promise<void> {
    await prisma.priceAlert.update({
      where: { id: alertId },
      data: {
        triggeredCount: { increment: 1 },
        triggeredAt: new Date(),
      },
    });
  }

  /**
   * Clean up expired alerts
   */
  async cleanupExpiredAlerts(): Promise<number> {
    const result = await prisma.priceAlert.updateMany({
      where: {
        expiresAt: { lte: new Date() },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    return result.count;
  }

  /**
   * Get all active alerts for checking
   */
  async getActiveAlerts(): Promise<PriceAlert[]> {
    const alerts = await prisma.priceAlert.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return alerts;
  }
}

export const alertService = new AlertService();
