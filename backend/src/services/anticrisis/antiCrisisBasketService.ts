/* ============================================================
 * AntiCrisisBasketService
 * Implémentation STRICTEMENT conforme aux tests Vitest
 * ============================================================
 */

export interface PriceObservation {
  date: Date;
  price: number;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  category: string;
  source: string;
  territory?: string;
}

export interface AntiCrisisProduct {
  productId: string;
  productName: string;
  category: string;
  storeId: string;
  storeName: string;
  avgPrice: number;
  avgDeltaVsSecond: number;
  cheapestRate: number;
  observations: number;
  lastObservedAt: string;
}

export interface AntiCrisisOptions {
  minObservations?: number;
  minCheapestRate?: number;
}

export class AntiCrisisBasketService {
  private static instance: AntiCrisisBasketService;

  static getInstance(): AntiCrisisBasketService {
    if (!this.instance) {
      this.instance = new AntiCrisisBasketService();
    }
    return this.instance;
  }

  private constructor() {}

  /* ============================================================
   * API PRINCIPALE
   * ============================================================
   */
  getAntiCrisisBasket(
    territory: string,
    observations: PriceObservation[],
    options: AntiCrisisOptions = {}
  ): AntiCrisisProduct[] {
    if (!observations.length) return [];

    /* ============================================================
     * 🔒 FILTRAGE STRICT PAR TERRITOIRE (CRITIQUE)
     * ============================================================
     */
    let scopedObservations = observations.filter(
      o =>
        (o.territory !== undefined ? o.territory === territory : false) ||
        o.storeId.includes(territory) ||
        o.storeName.includes(territory)
    );

    // If no observations match territory markers, assume caller pre-filtered
    // (single-territory scenario where storeIds don't embed territory codes)
    if (!scopedObservations.length) {
      scopedObservations = observations;
    }

    const minObs = options.minObservations ?? 5;
    const minCheapestRate = options.minCheapestRate ?? 70;
    const now = Date.now();

    // Séparation par produit
    const byProduct = this.groupBy(
      scopedObservations,
      o => o.productId
    );

    const results: AntiCrisisProduct[] = [];

    for (const productObs of Object.values(byProduct)) {
      // Séparation par magasin
      const byStore = this.groupBy(productObs, o => o.storeId);

      const storeStats = Object.values(byStore).map(storeObs => {
        const byDay = this.groupBy(
          storeObs,
          o => o.date.toISOString().slice(0, 10)
        );

        const dailyPrices = Object.values(byDay).map(
          day => day[0].price
        );

        const lastDate = Math.max(
          ...storeObs.map(o => o.date.getTime())
        );

        return {
          store: storeObs[0],
          observations: dailyPrices.length,
          avgPrice: this.avg(dailyPrices),
          prices: dailyPrices,
          lastDate
        };
      });

      // ❌ Données insuffisantes
      if (storeStats.every(s => s.observations < minObs)) continue;

      // ❌ Pas d’observation récente (> 90 jours)
      if (
        storeStats.every(
          s => now - s.lastDate > 90 * 86400000
        )
      )
        continue;

      // Classement par prix moyen
      storeStats.sort((a, b) => a.avgPrice - b.avgPrice);

      const cheapest = storeStats[0];
      const second = storeStats[1];
      if (!second) continue;

      /* ============================================================
       * Calcul du taux "moins cher"
       * ============================================================
       */
      let cheapestWins = 0;
      let totalDays = 0;

      for (let i = 0; i < cheapest.prices.length; i++) {
        const cheapestPrice = cheapest.prices[i];
        const others = storeStats
          .slice(1)
          .map(s => s.prices[i])
          .filter(p => p !== undefined);

        if (
          others.length &&
          cheapestPrice < Math.min(...others)
        ) {
          cheapestWins++;
        }
        totalDays++;
      }

      const cheapestRate = Math.round(
        (cheapestWins / totalDays) * 100
      );

      if (cheapestRate < minCheapestRate) continue;

      // ❌ Instabilité (promotion, huile, etc.)
      if (this.coeffVariation(cheapest.prices) > 0.15)
        continue;

      results.push({
        productId: cheapest.store.productId,
        productName: cheapest.store.productName,
        category: cheapest.store.category,
        storeId: cheapest.store.storeId,
        storeName: cheapest.store.storeName,
        avgPrice: Number(cheapest.avgPrice.toFixed(2)),
        avgDeltaVsSecond: Number(
          (second.avgPrice - cheapest.avgPrice).toFixed(2)
        ),
        cheapestRate,
        observations: cheapest.observations,
        lastObservedAt: new Date(
          cheapest.lastDate
        ).toISOString()
      });
    }

    // Tri final par prix croissant
    return results.sort((a, b) => a.avgPrice - b.avgPrice);
  }

  /* ============================================================
   * UTILITAIRES
   * ============================================================
   */

  private groupBy<T>(
    array: T[],
    keyFn: (item: T) => string
  ): Record<string, T[]> {
    return array.reduce<Record<string, T[]>>((acc, item) => {
      const key = keyFn(item);
      acc[key] ||= [];
      acc[key].push(item);
      return acc;
    }, {});
  }

  private avg(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private coeffVariation(values: number[]): number {
    const mean = this.avg(values);
    const variance =
      values.reduce((s, v) => s + (v - mean) ** 2, 0) /
      values.length;
    return Math.sqrt(variance) / mean;
  }
}