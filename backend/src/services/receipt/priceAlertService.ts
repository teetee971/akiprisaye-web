/**
 * Price Alert Service
 *
 * Évalue et génère des événements d'alerte prix.
 *
 * Déclencheurs:
 *   - new_low:          nouveau prix minimum historique pour ce produit + territoire
 *   - significant_drop: baisse ≥ DROP_THRESHOLD_PERCENT par rapport à la moyenne
 *   - significant_rise: hausse ≥ RISE_THRESHOLD_PERCENT par rapport à la moyenne
 *
 * Les événements sont stockés dans price_alert_events.
 * La dispatch vers les canaux (push/email/in_app) est extensible via dispatchNotification().
 */

import { randomUUID } from 'node:crypto';
import prisma from '../../database/prisma.js';
import type { PriceAlertEventInput, TerritoryCode } from '../../types/receipt.types.js';
import { priceObservationService } from './priceObservationService.js';
import { notificationService } from '../notifications/notificationService.js';
import type { TriggeredAlert } from '../alerts/alertTypes.js';

const DROP_THRESHOLD_PERCENT = 10;  // -10% vs moyenne → significant_drop
const RISE_THRESHOLD_PERCENT = 15;  // +15% vs moyenne → significant_rise

export class PriceAlertService {

  /**
   * Évalue les alertes pour une nouvelle observation.
   * Retourne le nombre d'événements créés.
   */
  async evaluate(
    productId: string,
    territory: TerritoryCode,
    observedAt: Date,
    currentPrice: number,
    storeLabel?: string,
  ): Promise<number> {
    const events: PriceAlertEventInput[] = [];

    // 1. Nouveau plus bas historique
    const historicalMin = await priceObservationService.getHistoricalMin(productId, territory);
    if (historicalMin !== null && currentPrice < historicalMin) {
      events.push({
        productId,
        territory,
        observedAt,
        currentPrice,
        previousPrice: historicalMin,
        eventType: 'new_low',
        payloadJson: {
          store: storeLabel,
          drop: +(historicalMin - currentPrice).toFixed(2),
          dropPercent: +(((historicalMin - currentPrice) / historicalMin) * 100).toFixed(1),
        },
      });
    }

    // 2. Variation forte (basée sur moyenne du dernier mois)
    const monthHistory = await this._getLastMonthAvg(productId, territory);
    if (monthHistory !== null) {
      const dropPct = ((monthHistory - currentPrice) / monthHistory) * 100;
      const risePct = ((currentPrice - monthHistory) / monthHistory) * 100;

      if (dropPct >= DROP_THRESHOLD_PERCENT) {
        events.push({
          productId,
          territory,
          observedAt,
          currentPrice,
          previousPrice: monthHistory,
          eventType: 'significant_drop',
          payloadJson: {
            store: storeLabel,
            monthAvg: monthHistory,
            dropPercent: +dropPct.toFixed(1),
          },
        });
      } else if (risePct >= RISE_THRESHOLD_PERCENT) {
        events.push({
          productId,
          territory,
          observedAt,
          currentPrice,
          previousPrice: monthHistory,
          eventType: 'significant_rise',
          payloadJson: {
            store: storeLabel,
            monthAvg: monthHistory,
            risePercent: +risePct.toFixed(1),
          },
        });
      }
    }

    for (const ev of events) {
      await this._persistEvent(ev);
      await this.dispatchNotification(ev);
    }

    return events.length;
  }

  /** Persiste l'événement en base */
  private async _persistEvent(ev: PriceAlertEventInput): Promise<void> {
    await prisma.priceAlertEvent.create({
      data: {
        id: randomUUID(),
        productId: ev.productId,
        territory: ev.territory,
        observedAt: ev.observedAt,
        newPrice: ev.currentPrice,
        oldPrice: ev.previousPrice ?? null,
        eventType: ev.eventType,
        processed: false,
      },
    });
  }

  /**
   * Dispatch d'une notification vers les canaux actifs (push / email / in-app).
   *
   * Recherche les abonnements priceAlert actifs pour ce produit + territoire,
   * puis délègue l'envoi au NotificationService (email + push).
   */
  async dispatchNotification(event: PriceAlertEventInput): Promise<void> {
    // Fetch active subscriptions for this product / territory
    const activeAlerts = await prisma.priceAlert.findMany({
      where: {
        productId: event.productId,
        territory: event.territory,
        isActive: true,
      },
    });

    if (activeAlerts.length === 0) return;

    const reason = this._buildReason(event);

    await Promise.allSettled(
      activeAlerts.map((alert) => {
        const triggered: TriggeredAlert = {
          alert: {
            id: alert.id,
            userId: alert.userId,
            productId: alert.productId,
            alertType: alert.alertType,
            targetPrice: alert.targetPrice ?? undefined,
            territory: alert.territory,
            notifyEmail: alert.notifyEmail,
            notifyPush: alert.notifyPush,
            notifySms: alert.notifySms,
            isActive: alert.isActive,
            triggeredCount: alert.triggeredCount,
            triggeredAt: alert.triggeredAt ?? undefined,
            createdAt: alert.createdAt,
            updatedAt: alert.updatedAt,
            expiresAt: alert.expiresAt ?? undefined,
          },
          trigger: {
            reason,
            oldPrice: event.previousPrice,
            newPrice: event.currentPrice,
            productName: event.productId,
            storeName: String(event.payloadJson?.['store'] ?? ''),
            storeId: undefined,
            savings: event.previousPrice != null
              ? +(event.previousPrice - event.currentPrice).toFixed(2)
              : undefined,
            savingsPercent: event.previousPrice != null
              ? +(((event.previousPrice - event.currentPrice) / event.previousPrice) * 100).toFixed(1)
              : undefined,
          },
        };
        return notificationService.sendAlertNotification(triggered);
      }),
    );
  }

  private _buildReason(event: PriceAlertEventInput): string {
    switch (event.eventType) {
      case 'new_low':
        return `Nouveau prix le plus bas : ${event.currentPrice}€${event.previousPrice != null ? ` (précédent min : ${event.previousPrice}€)` : ''}`;
      case 'significant_drop':
        return `Baisse significative : ${event.currentPrice}€${event.previousPrice != null ? ` (était ${event.previousPrice}€)` : ''}`;
      case 'significant_rise':
        return `Hausse significative : ${event.currentPrice}€${event.previousPrice != null ? ` (était ${event.previousPrice}€)` : ''}`;
      default:
        return `Mise à jour prix : ${event.currentPrice}€`;
    }
  }

  private async _getLastMonthAvg(
    productId: string,
    territory: string,
  ): Promise<number | null> {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const result = await prisma.priceObservation.aggregate({
      where: { productId, territory, observedAt: { gte: from } },
      _avg: { price: true },
    });
    return result._avg.price ?? null;
  }

  async getPendingEvents(limit = 50) {
    return prisma.priceAlertEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async markProcessed(ids: string[]): Promise<void> {
    await prisma.priceAlertEvent.updateMany({
      where: { id: { in: ids } },
      data: { processed: true },
    });
  }
}

export const priceAlertService = new PriceAlertService();
