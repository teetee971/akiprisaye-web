/**
 * Alert Engine
 * Detects when price alerts should be triggered based on price updates
 */

import type { PriceUpdate, TriggeredAlert, AlertCheckResult, PriceAlert } from './alertTypes.js';
import { alertService } from './alertService.js';

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
   * Check all alerts for a specific product
   */
  async checkProductAlerts(_productId: string): Promise<TriggeredAlert[]> {
    // This would need to fetch current prices for the product
    // and check against all alerts
    // Implementation depends on how price data is stored
    return [];
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

    for (const alert of alerts) {
      try {
        // TODO: Fetch current prices for the product and evaluate
        // This requires integration with price data storage
      } catch (error) {
        result.failedCount++;
        result.errors.push({
          alertId: alert.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
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
          // Trigger on any price increase > 5% (fixed threshold, schema has no percentageThreshold field)
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

      case 'BEST_PRICE':
        // TODO: Implement historical price comparison
        // Would need to check if current price is the lowest in history
        break;

      case 'NEW_STORE':
        // This would need to track which stores have been seen before
        // for this product
        break;
    }

    if (!triggered) {
      return null;
    }

    // Fetch product name for notification
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
   * Get product name by ID
   * TODO: Implement based on actual product data structure
   */
  private async getProductName(productId: string): Promise<string> {
    // This would query the product database
    // For now, return a placeholder
    return `Product ${productId}`;
  }
}

export const alertEngine = new AlertEngine();
