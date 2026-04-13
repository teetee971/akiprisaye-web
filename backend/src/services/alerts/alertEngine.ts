/**
 * Alert Engine
 * Detects when price alerts should be triggered based on price updates
 */

import type { PriceUpdate, TriggeredAlert, AlertCheckResult, PriceAlert } from './alertTypes.js';
import { alertService } from './alertService.js';
import prisma from '../../database/prisma.js';

export class AlertEngine {
  /**
   * Check if a price update triggers any alerts
   */
  async checkPriceUpdate(priceUpdate: PriceUpdate): Promise<TriggeredAlert[]> {
    const alerts = await alertService.getProductAlerts(priceUpdate.productId);
    const triggeredAlerts: TriggeredAlert[] = [];

    for (const alert of alerts) {
      const triggered = await this.evaluateAlert(alert, priceUpdate);
      if (triggered) {
        triggeredAlerts.push(triggered);
        await alertService.incrementTriggeredCount(alert.id);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Check all alerts for a specific product by fetching its latest price
   */
  async checkProductAlerts(productId: string): Promise<TriggeredAlert[]> {
    // Fetch the most recent price observation for this product
    const latest = await prisma.priceObservation.findFirst({
      where: { productId },
      orderBy: { observedAt: 'desc' },
      select: {
        price: true,
        territory: true,
        storeId: true,
        storeLabel: true,
        observedAt: true,
      },
    });

    if (!latest) {
      return [];
    }

    // Fetch the previous observation to compute old price
    const previous = await prisma.priceObservation.findFirst({
      where: {
        productId,
        observedAt: { lt: latest.observedAt },
      },
      orderBy: { observedAt: 'desc' },
      select: { price: true },
    });

    const priceUpdate: PriceUpdate = {
      productId,
      newPrice: latest.price,
      oldPrice: previous?.price,
      territory: latest.territory,
      storeId: latest.storeId ?? undefined,
      storeName: latest.storeLabel,
      inStock: true,
      isPromotion: previous ? latest.price < previous.price * 0.95 : false,
    };

    return this.checkPriceUpdate(priceUpdate);
  }

  /**
   * Run a batch check of all active alerts
   */
  async runAlertCheck(): Promise<AlertCheckResult> {
    const alerts = await alertService.getActiveAlerts();
    const result: AlertCheckResult = {
      totalChecked: alerts.length,
      triggeredCount: 0,
      failedCount: 0,
      triggeredAlerts: [],
      errors: [],
    };

    // Deduplicate by productId to avoid fetching the same product multiple times
    const productAlertMap = new Map<string, string[]>();
    for (const alert of alerts) {
      if (!productAlertMap.has(alert.productId)) {
        productAlertMap.set(alert.productId, []);
      }
      productAlertMap.get(alert.productId)!.push(alert.id);
    }

    for (const [productId, alertIds] of productAlertMap) {
      try {
        const triggered = await this.checkProductAlerts(productId);
        result.triggeredAlerts.push(...triggered);
        result.triggeredCount += triggered.length;
      } catch (error) {
        result.failedCount++;
        // Report each alert associated with this product as failed
        for (const alertId of alertIds) {
          result.errors.push({
            alertId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return result;
  }

  /**
   * Evaluate if an alert should be triggered based on a price update
   */
  private async evaluateAlert(
    alert: PriceAlert,
    priceUpdate: PriceUpdate
  ): Promise<TriggeredAlert | null> {
    // Check territory filter
    if (alert.territory && priceUpdate.territory !== alert.territory) {
      return null;
    }

    // Evaluate based on alert type
    let triggered = false;
    let reason = '';
    let savings = 0;
    let savingsPercent = 0;

    switch (alert.alertType) {
      case 'PRICE_DROP':
        if (alert.targetPrice && priceUpdate.newPrice < alert.targetPrice) {
          triggered = true;
          savings = alert.targetPrice - priceUpdate.newPrice;
          savingsPercent = (savings / alert.targetPrice) * 100;
          reason = `Le prix est passé sous ${alert.targetPrice}€ !`;
        }
        break;

      case 'PRICE_TARGET':
        if (alert.targetPrice && Math.abs(priceUpdate.newPrice - alert.targetPrice) < 0.01) {
          triggered = true;
          reason = `Le prix a atteint votre cible de ${alert.targetPrice}€ !`;
        }
        break;

      case 'PROMOTION':
        if (priceUpdate.isPromotion) {
          triggered = true;
          if (priceUpdate.oldPrice) {
            savings = priceUpdate.oldPrice - priceUpdate.newPrice;
            savingsPercent = (savings / priceUpdate.oldPrice) * 100;
            reason = `Promotion détectée : -${savingsPercent.toFixed(0)}% !`;
          } else {
            reason = 'Promotion détectée !';
          }
        }
        break;

      case 'PRICE_INCREASE':
        if (priceUpdate.oldPrice) {
          const increase = ((priceUpdate.newPrice - priceUpdate.oldPrice) / priceUpdate.oldPrice) * 100;
          if (increase > 5) {
            triggered = true;
            reason = `Le prix a augmenté de ${increase.toFixed(0)}% !`;
          }
        }
        break;

      case 'BACK_IN_STOCK':
        if (priceUpdate.inStock) {
          triggered = true;
          reason = 'Le produit est de nouveau en stock !';
        }
        break;

      case 'BEST_PRICE': {
        // Check if current price is the lowest recorded in the last 90 days
        const minRecord = await prisma.priceObservation.aggregate({
          where: {
            productId: alert.productId,
            territory: alert.territory ?? priceUpdate.territory,
            observedAt: { gte: new Date(Date.now() - 90 * 86_400_000) },
          },
          _min: { price: true },
        });
        const historicalMin = minRecord._min.price;
        if (historicalMin !== null && priceUpdate.newPrice <= historicalMin) {
          triggered = true;
          reason = `Meilleur prix des 90 derniers jours : ${priceUpdate.newPrice.toFixed(2)}€ !`;
        }
        break;
      }

      case 'NEW_STORE':
        // Detect if this store has not been seen before for this product/territory
        if (priceUpdate.storeId) {
          const previousStore = await prisma.priceObservation.findFirst({
            where: {
              productId: alert.productId,
              storeId: priceUpdate.storeId,
              territory: alert.territory ?? priceUpdate.territory,
              observedAt: { lt: new Date() },
            },
            orderBy: { observedAt: 'asc' },
          });
          if (!previousStore) {
            triggered = true;
            reason = `Nouveau magasin proposant ce produit : ${priceUpdate.storeName} !`;
          }
        }
        break;
    }

    if (!triggered) {
      return null;
    }

    const productName = await this.getProductName(alert.productId);

    return {
      alert,
      trigger: {
        reason,
        oldPrice: priceUpdate.oldPrice,
        newPrice: priceUpdate.newPrice,
        savings,
        savingsPercent,
        storeName: priceUpdate.storeName,
        storeId: priceUpdate.storeId,
        productName,
      },
    };
  }

  /**
   * Get product display name by ID
   */
  private async getProductName(productId: string): Promise<string> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { displayName: true },
    });
    return product?.displayName ?? `Produit ${productId}`;
  }
}

export const alertEngine = new AlertEngine();
