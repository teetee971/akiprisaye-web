/**
 * Anti-Crisis Basket Service - Panier Anti-Crise
 * Version: 1.0.0
 * 
 * OBJECTIF FONCTIONNEL:
 * Identifier les produits structurellement les moins chers dans le temps,
 * basé uniquement sur l'historique réel des prix observés.
 * 
 * CONFORMITÉ STRICTE:
 * - ❌ Aucune logique de promotion ou réduction
 * - ❌ Aucun scoring marketing ou pondération opaque
 * - ❌ Aucun bouton d'achat, lien externe ou CTA
 * - ❌ Aucune dépendance externe
 * - ✅ Données observées uniquement
 * - ✅ Logique simple, explicable et auditée
 * - ✅ Code TypeScript strict
 * 
 * MÉTHODOLOGIE TRANSPARENTE:
 * Un produit est éligible au Panier Anti-Crise s'il respecte TOUS les critères:
 * 1. Nombre d'observations ≥ seuil (défaut: 5)
 * 2. L'enseigne est la moins chère ≥ taux (défaut: 70%)
 * 3. Variance de prix faible (prix stable)
 * 4. Prix moyen inférieur au 2ᵉ prix avec écart significatif
 * 5. Données récentes disponibles (pas de rupture > 90 jours)
 * 
 * AUCUNE HEURISTIQUE CACHÉE - TOUT EST TRAÇABLE
 */

/**
 * Point d'observation de prix
 */
export interface PriceObservation {
  /** Date de l'observation */
  date: Date;
  /** Prix TTC observé en € */
  price: number;
  /** Identifiant du magasin/enseigne */
  storeId: string;
  /** Nom de l'enseigne */
  storeName: string;
  /** Identifiant du produit */
  productId: string;
  /** Nom du produit */
  productName: string;
  /** Catégorie du produit */
  category: string;
  /** Source de l'observation */
  source: string;
  /** Territoire (optionnel, pour comparaisons multi-territoires) */
  territory?: string;
}

/**
 * Produit éligible au Panier Anti-Crise
 */
export interface AntiCrisisProduct {
  /** Identifiant du produit */
  productId: string;
  /** Nom du produit */
  productName: string;
  /** Catégorie */
  category: string;
  /** Identifiant de l'enseigne la moins chère */
  storeId: string;
  /** Nom de l'enseigne la moins chère */
  storeName: string;
  /** Prix moyen TTC en € */
  avgPrice: number;
  /** Pourcentage du temps où cette enseigne est la moins chère (0-100) */
  cheapestRate: number;
  /** Nombre d'observations totales */
  observations: number;
  /** Écart moyen avec le 2ᵉ prix en € */
  avgDeltaVsSecond: number;
  /** Date de la dernière observation */
  lastObservedAt: string;
}

/**
 * Options de configuration pour le Panier Anti-Crise
 */
export interface AntiCrisisBasketOptions {
  /** Nombre minimum d'observations requis (défaut: 5) */
  minObservations?: number;
  /** Pourcentage minimum du temps où l'enseigne doit être la moins chère (défaut: 70) */
  minCheapestRate?: number;
  /** Variance maximale tolérée pour considérer un prix stable (défaut: calculée automatiquement) */
  maxVariance?: number;
  /** Nombre maximum de jours depuis la dernière observation (défaut: 90) */
  maxDaysSinceLastObservation?: number;
  /** Écart minimum avec le 2ᵉ prix en pourcentage (défaut: 5%) */
  minDeltaVsSecondPercent?: number;
}

/**
 * Statistiques d'un produit pour évaluation
 */
interface ProductStats {
  productId: string;
  productName: string;
  category: string;
  observations: PriceObservation[];
  avgPrice: number;
  variance: number;
  standardDeviation: number;
  minPrice: number;
  maxPrice: number;
  lastObservedAt: Date;
  cheapestStoreFrequency: Map<string, number>; // storeId -> count
  pricesByDate: Map<string, Map<string, number>>; // date -> (storeId -> price)
}

/**
 * Service de Panier Anti-Crise
 * Service pur, sans état global, sans UI, facilement testable
 */
export class AntiCrisisBasketService {
  private static instance: AntiCrisisBasketService;

  private constructor() {}

  /**
   * Singleton pattern
   * Note: In Node.js single-threaded environment, this is safe.
   * For multi-threaded environments, additional synchronization would be needed.
   */
  public static getInstance(): AntiCrisisBasketService {
    if (!AntiCrisisBasketService.instance) {
      AntiCrisisBasketService.instance = new AntiCrisisBasketService();
    }
    return AntiCrisisBasketService.instance;
  }

  /**
   * Récupère le Panier Anti-Crise pour un territoire donné
   * 
   * @param territory - Territoire géographique (ex: "971", "972", "GUADELOUPE", "MARTINIQUE")
   * @param priceHistory - Historique complet des observations de prix
   * @param options - Options de configuration (optionnelles)
   * @returns Liste des produits éligibles au Panier Anti-Crise
   */
  public getAntiCrisisBasket(
    territory: string,
    priceHistory: PriceObservation[],
    options?: AntiCrisisBasketOptions
  ): AntiCrisisProduct[] {
    // Valeurs par défaut conformes aux contraintes
    const config = {
      minObservations: options?.minObservations ?? 5,
      minCheapestRate: options?.minCheapestRate ?? 70,
      maxVariance: options?.maxVariance,
      maxDaysSinceLastObservation: options?.maxDaysSinceLastObservation ?? 90,
      minDeltaVsSecondPercent: options?.minDeltaVsSecondPercent ?? 5,
    };

    // FILTRE CRITIQUE: Ne garder QUE les observations du territoire demandé
    // Principe fondamental: ❌ JAMAIS de comparaison inter-territoires
    const territoryObservations = priceHistory.filter(obs => {
      // Si territory n'est pas défini dans l'observation, on la garde (compatibilité ascendante)
      // IMPORTANT: Dans un environnement de production, le champ territory devrait être obligatoire
      if (!obs.territory) return true;
      // Sinon, on ne garde que si le territoire correspond exactement
      return obs.territory === territory;
    });

    // 1. Grouper les observations par produit
    const productGroups = this.groupObservationsByProduct(territoryObservations);

    // 2. Calculer les statistiques pour chaque produit
    const productStats = this.calculateProductStatistics(productGroups);

    // 3. Filtrer selon les critères d'éligibilité
    const eligibleProducts = this.filterEligibleProducts(productStats, config);

    // 4. Convertir en format de sortie
    return this.convertToAntiCrisisProducts(eligibleProducts);
  }

  /**
   * Groupe les observations par produit
   */
  private groupObservationsByProduct(
    observations: PriceObservation[]
  ): Map<string, PriceObservation[]> {
    const groups = new Map<string, PriceObservation[]>();

    for (const obs of observations) {
      if (!groups.has(obs.productId)) {
        groups.set(obs.productId, []);
      }
      groups.get(obs.productId)!.push(obs);
    }

    return groups;
  }

  /**
   * Calcule les statistiques pour chaque produit
   */
  private calculateProductStatistics(
    productGroups: Map<string, PriceObservation[]>
  ): ProductStats[] {
    const stats: ProductStats[] = [];

    for (const [productId, observations] of productGroups.entries()) {
      if (observations.length === 0) continue;

      // Trier par date
      const sortedObs = [...observations].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      // Grouper prix par date pour identifier l'enseigne la moins chère à chaque observation
      const pricesByDate = new Map<string, Map<string, number>>();
      for (const obs of sortedObs) {
        const dateKey = obs.date.toISOString().split('T')[0];
        if (!pricesByDate.has(dateKey)) {
          pricesByDate.set(dateKey, new Map());
        }
        pricesByDate.get(dateKey)!.set(obs.storeId, obs.price);
      }

      // Calculer fréquence "enseigne la moins chère"
      // Et collecter les prix du magasin le plus fréquemment moins cher pour calculer statistiques
      const cheapestStoreFrequency = new Map<string, number>();
      const cheapestPricesByDate = new Map<string, number>(); // date -> prix du moins cher

      for (const [dateKey, storePrices] of pricesByDate.entries()) {
        // Trouver le prix minimum et les enseignes avec ce prix
        const minPriceForDate = Math.min(...Array.from(storePrices.values()));
        cheapestPricesByDate.set(dateKey, minPriceForDate);
        
        for (const [storeId, price] of storePrices.entries()) {
          if (price === minPriceForDate) {
            cheapestStoreFrequency.set(
              storeId,
              (cheapestStoreFrequency.get(storeId) ?? 0) + 1
            );
          }
        }
      }

      // Identifier le magasin le plus fréquemment moins cher
      let bestStoreId = '';
      let bestStoreCount = 0;
      for (const [storeId, count] of cheapestStoreFrequency.entries()) {
        if (count > bestStoreCount) {
          bestStoreCount = count;
          bestStoreId = storeId;
        }
      }

      // Calculer les statistiques basées sur les prix du magasin le moins cher
      const pricesForBestStore: number[] = [];
      for (const obs of sortedObs) {
        if (obs.storeId === bestStoreId) {
          pricesForBestStore.push(obs.price);
        }
      }

      // Si aucun prix trouvé pour bestStore (cas improbable), utiliser tous les prix min
      const prices = pricesForBestStore.length > 0 ? pricesForBestStore : Array.from(cheapestPricesByDate.values());
      
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

      // Calculer variance et écart-type
      const variance =
        prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) /
        prices.length;
      const standardDeviation = Math.sqrt(variance);

      // Min/Max
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Date de dernière observation
      const lastObservedAt = sortedObs[sortedObs.length - 1].date;

      stats.push({
        productId,
        productName: sortedObs[0].productName,
        category: sortedObs[0].category,
        observations: sortedObs,
        avgPrice: Math.round(avgPrice * 100) / 100,
        variance: Math.round(variance * 10000) / 10000,
        standardDeviation: Math.round(standardDeviation * 100) / 100,
        minPrice: Math.round(minPrice * 100) / 100,
        maxPrice: Math.round(maxPrice * 100) / 100,
        lastObservedAt,
        cheapestStoreFrequency,
        pricesByDate,
      });
    }

    return stats;
  }

  /**
   * Filtre les produits selon les critères d'éligibilité
   */
  private filterEligibleProducts(
    productStats: ProductStats[],
    config: Required<Omit<AntiCrisisBasketOptions, 'maxVariance'>> & { maxVariance?: number }
  ): ProductStats[] {
    const now = new Date();

    return productStats.filter(stat => {
      // Critère 1: Nombre d'observations suffisant (dates distinctes)
      const uniqueDates = stat.pricesByDate.size;
      if (uniqueDates < config.minObservations) {
        return false;
      }

      // Critère 2: Données récentes (pas de rupture)
      const daysSinceLastObs =
        (now.getTime() - stat.lastObservedAt.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceLastObs > config.maxDaysSinceLastObservation) {
        return false;
      }

      // Critère 3: Identifier l'enseigne la plus fréquemment la moins chère
      const totalDates = stat.pricesByDate.size;
      let bestStoreCount = 0;

      for (const count of stat.cheapestStoreFrequency.values()) {
        if (count > bestStoreCount) {
          bestStoreCount = count;
        }
      }

      const cheapestRate = (bestStoreCount / totalDates) * 100;

      // Critère 4: Taux "moins cher" suffisant
      if (cheapestRate < config.minCheapestRate) {
        return false;
      }

      // Critère 5: Variance faible (prix stable)
      // Si maxVariance n'est pas spécifiée, on utilise un critère basé sur le coefficient de variation
      if (config.maxVariance !== undefined) {
        if (stat.variance > config.maxVariance) {
          return false;
        }
      } else {
        // Coefficient de variation < 15% considéré comme stable
        const coefficientOfVariation = (stat.standardDeviation / stat.avgPrice) * 100;
        if (coefficientOfVariation > 15) {
          return false;
        }
      }

      // Critère 6: Écart significatif avec le 2ᵉ prix
      // Calculer le prix moyen du 2ᵉ moins cher
      const avgSecondLowestPrice = this.calculateAvgSecondLowestPrice(stat);
      if (avgSecondLowestPrice !== null) {
        const deltaPercent =
          ((avgSecondLowestPrice - stat.avgPrice) / avgSecondLowestPrice) * 100;
        if (deltaPercent < config.minDeltaVsSecondPercent) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Calcule le prix moyen du 2ᵉ moins cher pour chaque date
   */
  private calculateAvgSecondLowestPrice(stat: ProductStats): number | null {
    const secondPrices: number[] = [];

    for (const storePrices of stat.pricesByDate.values()) {
      const prices = Array.from(storePrices.values()).sort((a, b) => a - b);
      if (prices.length >= 2) {
        secondPrices.push(prices[1]);
      }
    }

    if (secondPrices.length === 0) {
      return null;
    }

    const avg = secondPrices.reduce((sum, p) => sum + p, 0) / secondPrices.length;
    return Math.round(avg * 100) / 100;
  }

  /**
   * Convertit les statistiques filtrées en produits Anti-Crise
   */
  private convertToAntiCrisisProducts(
    productStats: ProductStats[]
  ): AntiCrisisProduct[] {
    const products: AntiCrisisProduct[] = [];

    for (const stat of productStats) {
      // Trouver l'enseigne la plus fréquemment la moins chère
      let bestStoreId = '';
      let bestStoreName = '';
      let bestStoreCount = 0;

      for (const [storeId, count] of stat.cheapestStoreFrequency.entries()) {
        if (count > bestStoreCount) {
          bestStoreCount = count;
          bestStoreId = storeId;
          // Trouver le nom de l'enseigne
          const storeObs = stat.observations.find(o => o.storeId === storeId);
          bestStoreName = storeObs?.storeName ?? '';
        }
      }

      const totalDates = stat.pricesByDate.size;
      const cheapestRate = Math.round((bestStoreCount / totalDates) * 100 * 10) / 10;

      // Calculer l'écart moyen avec le 2ᵉ prix
      const avgSecondLowestPrice = this.calculateAvgSecondLowestPrice(stat);
      const avgDeltaVsSecond =
        avgSecondLowestPrice !== null
          ? Math.round((avgSecondLowestPrice - stat.avgPrice) * 100) / 100
          : 0;

      products.push({
        productId: stat.productId,
        productName: stat.productName,
        category: stat.category,
        storeId: bestStoreId,
        storeName: bestStoreName,
        avgPrice: stat.avgPrice,
        cheapestRate,
        observations: stat.pricesByDate.size, // Nombre de dates distinctes
        avgDeltaVsSecond,
        lastObservedAt: stat.lastObservedAt.toISOString(),
      });
    }

    // Trier par prix moyen croissant
    return products.sort((a, b) => a.avgPrice - b.avgPrice);
  }
}
