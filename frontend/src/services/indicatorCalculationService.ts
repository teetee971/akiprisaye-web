 
/**
 * Indicator Calculation Service - v3.0.0
 * 
 * Calcul des indicateurs prioritaires de l'observatoire
 * Transparents, traçables, médiatiquement exploitables
 * 
 * @module indicatorCalculationService
 */

import type { PriceObservation, ProductCategory, TerritoryCode } from '../types/PriceObservation';
import type {
  AveragePriceIndicator,
  DomHexagoneGap,
  IVCIndicator,
  TemporalEvolution,
  StoreDispersion,
  IndicatorCalculationConfig,
  IndicatorCalculationResult,
  TemporalPeriod,
} from '../types/observatoryIndicators';

/**
 * Calculate average price by product and territory
 */
export function calculateAveragePrices(
  observations: PriceObservation[],
  config: IndicatorCalculationConfig
): IndicatorCalculationResult<AveragePriceIndicator[]> {
  const startTime = Date.now();
  
  try {
    // Filter observations by config
    let filtered = observations.filter((obs) => {
      if (config.territoire && obs.territory !== config.territoire) return false;
      if (config.categorie && obs.productCategory !== config.categorie) return false;

      const obsDate = new Date(obs.observedAt);
      const startDate = new Date(config.periode_debut);
      const endDate = new Date(config.periode_fin);
      
      return obsDate >= startDate && obsDate <= endDate;
    });
    
    // Apply quality filter
    if (config.qualite_minimale !== undefined) {
      filtered = filtered.filter(
        (obs) => obs.confidenceScore !== undefined && obs.confidenceScore >= (config.qualite_minimale ?? 0),
      );
    }
    
    // Group by product EAN or name
    const productGroups = new Map<string, PriceObservation[]>();
    
    filtered.forEach((obs) => {
      const key = obs.barcode || obs.productLabel;
      if (!productGroups.has(key)) {
        productGroups.set(key, []);
      }
      productGroups.get(key)!.push(obs);
    });
    
    // Calculate averages
    const results: AveragePriceIndicator[] = [];
    
    productGroups.forEach((obsGroup, key) => {
      if (obsGroup.length === 0) return;
      
      const firstObs = obsGroup[0];
      
      // Calculate average based on config
      let averagePrice: number;
      
      if (config.agregation === 'mediane') {
        const prices = obsGroup.map((o) => o.price).sort((a, b) => a - b);
        const mid = Math.floor(prices.length / 2);
        averagePrice = prices.length % 2 === 0 
          ? (prices[mid - 1] + prices[mid]) / 2 
          : prices[mid];
      } else {
        // Default: moyenne (average)
        const sum = obsGroup.reduce((acc, obs) => acc + obs.price, 0);
        averagePrice = sum / obsGroup.length;
      }
      
      results.push({
        produit: firstObs.productLabel,
        ean: firstObs.barcode,
        categorie: firstObs.productCategory ?? 'Autres',
        territoire: firstObs.territory,
        prix_moyen: Math.round(averagePrice * 100) / 100,
        nombre_observations: obsGroup.length,
        periode_debut: config.periode_debut,
        periode_fin: config.periode_fin,
        derniere_mise_a_jour: new Date().toISOString(),
      });
    });
    
    return {
      success: true,
      data: results,
      metadata: {
        observations_utilisees: filtered.length,
        observations_exclues: observations.length - filtered.length,
        temps_calcul_ms: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        observations_utilisees: 0,
        observations_exclues: 0,
        temps_calcul_ms: Date.now() - startTime,
      },
    };
  }
}

/**
 * Calculate DOM vs Hexagone price gaps
 */
export function calculateDomHexagoneGaps(
  observations: PriceObservation[],
  config: IndicatorCalculationConfig
): IndicatorCalculationResult<DomHexagoneGap[]> {
  const startTime = Date.now();
  
  try {
    // Calculate average prices for all territories
    const allAverages = calculateAveragePrices(observations, {
      ...config,
      territoire: undefined, // Include all territories
    });
    
    if (!allAverages.success || !allAverages.data) {
      return {
        success: false,
        error: 'Failed to calculate average prices',
        metadata: {
          observations_utilisees: 0,
          observations_exclues: 0,
          temps_calcul_ms: Date.now() - startTime,
        },
      };
    }
    
    const results: DomHexagoneGap[] = [];
    
    // Group by product
    const productMap = new Map<string, AveragePriceIndicator[]>();
    allAverages.data.forEach((avg) => {
      const key = avg.ean || avg.produit;
      if (!productMap.has(key)) {
        productMap.set(key, []);
      }
      productMap.get(key)!.push(avg);
    });
    
    // Calculate gaps for each product
    productMap.forEach((averages, key) => {
      const hexagonePrice = averages.find((a) => a.territoire === 'FR');
      if (!hexagonePrice) return;
      
      const domPrices = averages.filter((a) => a.territoire !== 'FR');
      
      domPrices.forEach((domPrice) => {
        const ecartAbsolu = domPrice.prix_moyen - hexagonePrice.prix_moyen;
        const ecartPourcentage = (ecartAbsolu / hexagonePrice.prix_moyen) * 100;
        
        let signification: 'plus_cher' | 'moins_cher' | 'equivalent';
        if (Math.abs(ecartPourcentage) < 5) {
          signification = 'equivalent';
        } else if (ecartAbsolu > 0) {
          signification = 'plus_cher';
        } else {
          signification = 'moins_cher';
        }
        
        results.push({
          produit: domPrice.produit,
          ean: domPrice.ean,
          categorie: domPrice.categorie,
          territoire_dom: domPrice.territoire,
          prix_dom: domPrice.prix_moyen,
          prix_hexagone: hexagonePrice.prix_moyen,
          ecart_absolu: Math.round(ecartAbsolu * 100) / 100,
          ecart_pourcentage: Math.round(ecartPourcentage * 10) / 10,
          periode: `${config.periode_debut} à ${config.periode_fin}`,
          signification,
        });
      });
    });
    
    return {
      success: true,
      data: results,
      metadata: {
        observations_utilisees: allAverages.metadata.observations_utilisees,
        observations_exclues: allAverages.metadata.observations_exclues,
        temps_calcul_ms: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        observations_utilisees: 0,
        observations_exclues: 0,
        temps_calcul_ms: Date.now() - startTime,
      },
    };
  }
}

/**
 * Calculate Cost of Living Index (IVC) - base 100
 */
const DEFAULT_CATEGORY_WEIGHT = 1; // Equal weighting for all categories

export function calculateIVC(
  observations: PriceObservation[],
  territoire: TerritoryCode,
  referenceDate: string
): IndicatorCalculationResult<IVCIndicator> {
  const startTime = Date.now();
  
  try {
    // Define reference period (e.g., 30 days around reference date)
    const refDate = new Date(referenceDate);
    const startDate = new Date(refDate);
    startDate.setDate(startDate.getDate() - 15);
    const endDate = new Date(refDate);
    endDate.setDate(endDate.getDate() + 15);
    
    const config: IndicatorCalculationConfig = {
      territoire,
      periode_debut: startDate.toISOString().split('T')[0],
      periode_fin: endDate.toISOString().split('T')[0],
      agregation: 'moyenne',
    };
    
    // Calculate average prices by category
    const categories: ProductCategory[] = [
      'Produits laitiers',
      'Fruits et légumes',
      'Viandes et poissons',
      'Épicerie',
      'Boissons',
      'Hygiène et beauté',
      'Entretien',
      'Bébé',
      'Autres',
    ];
    
    const categoryIndices: { categorie: ProductCategory; indice: number; contribution: number }[] = [];
    let totalContribution = 0;
    
    for (const categorie of categories) {
      const categoryConfig = { ...config, categorie };
      
      const territoryAvg = calculateAveragePrices(
        observations.filter((o) => o.territory === territoire),
        categoryConfig,
      );
      
      const hexagoneAvg = calculateAveragePrices(
        observations.filter((o) => o.territory === 'FR'),
        categoryConfig,
      );
      
      if (territoryAvg.success && hexagoneAvg.success && 
          territoryAvg.data && hexagoneAvg.data &&
          territoryAvg.data.length > 0 && hexagoneAvg.data.length > 0) {
        
        // Calculate average of all products in category
        const territoryPrice = territoryAvg.data.reduce((s, d) => s + d.prix_moyen, 0) / territoryAvg.data.length;
        const hexagonePrice = hexagoneAvg.data.reduce((s, d) => s + d.prix_moyen, 0) / hexagoneAvg.data.length;
        
        const indice = (territoryPrice / hexagonePrice) * 100;
        const contribution = DEFAULT_CATEGORY_WEIGHT / categories.length; // Equal weighting
        
        categoryIndices.push({
          categorie,
          indice: Math.round(indice * 10) / 10,
          contribution: Math.round(contribution * 100),
        });
        
        totalContribution += indice * contribution;
      }
    }
    
    const indiceGlobal = categoryIndices.length > 0 
      ? Math.round(totalContribution * 10) / 10 
      : 100;
    
    return {
      success: true,
      data: {
        territoire,
        indice_global: indiceGlobal,
        date_reference: referenceDate,
        date_calcul: new Date().toISOString(),
        par_categorie: categoryIndices,
        methodologie: 'Base 100 = Hexagone. Moyenne pondérée des catégories disponibles.',
      },
      metadata: {
        observations_utilisees: observations.filter(
          (o) => o.territory === territoire || o.territory === 'FR',
        ).length,
        observations_exclues: 0,
        temps_calcul_ms: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        observations_utilisees: 0,
        observations_exclues: 0,
        temps_calcul_ms: Date.now() - startTime,
      },
    };
  }
}

/**
 * Calculate temporal evolution (J-30, J-90, J-365)
 */
export function calculateTemporalEvolution(
  observations: PriceObservation[],
  productKey: string,
  territoire: TerritoryCode
): IndicatorCalculationResult<TemporalEvolution> {
  const startTime = Date.now();
  
  try {
    const today = new Date();
    const periods: TemporalPeriod[] = ['J-30', 'J-90', 'J-365'];
    
    // Find current price
    const recentObs = observations.filter((obs) => {
      const match =
        (obs.barcode === productKey || obs.productLabel === productKey) &&
        obs.territory === territoire;
      if (!match) return false;
      
      const obsDate = new Date(obs.observedAt);
      const daysDiff = (today.getTime() - obsDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });
    
    if (recentObs.length === 0) {
      return {
        success: false,
        error: 'No recent observations found',
        metadata: {
          observations_utilisees: 0,
          observations_exclues: 0,
          temps_calcul_ms: Date.now() - startTime,
        },
      };
    }
    
    const prixActuel = recentObs.reduce((sum, obs) => sum + obs.price, 0) / recentObs.length;
    
    const evolutions: TemporalEvolution['evolutions'] = [];
    
    for (const period of periods) {
      const daysBack = period === 'J-30' ? 30 : period === 'J-90' ? 90 : 365;
      const periodStart = new Date(today);
      periodStart.setDate(periodStart.getDate() - daysBack - 7);
      const periodEnd = new Date(today);
      periodEnd.setDate(periodEnd.getDate() - daysBack + 7);
      
      const periodObs = observations.filter((obs) => {
        const match =
          (obs.barcode === productKey || obs.productLabel === productKey) &&
          obs.territory === territoire;
        if (!match) return false;
        
        const obsDate = new Date(obs.observedAt);
        return obsDate >= periodStart && obsDate <= periodEnd;
      });
      
      if (periodObs.length > 0) {
        const prixAnterieur =
          periodObs.reduce((sum, obs) => sum + obs.price, 0) / periodObs.length;
        const variationAbsolue = prixActuel - prixAnterieur;
        const variationPourcentage = (variationAbsolue / prixAnterieur) * 100;
        
        evolutions.push({
          periode: period,
          prix_anterieur: Math.round(prixAnterieur * 100) / 100,
          variation_absolue: Math.round(variationAbsolue * 100) / 100,
          variation_pourcentage: Math.round(variationPourcentage * 10) / 10,
        });
      }
    }
    
    // Determine trend
    let tendance: 'hausse' | 'baisse' | 'stable' = 'stable';
    if (evolutions.length > 0) {
      const avgVariation = evolutions.reduce((sum, e) => sum + e.variation_pourcentage, 0) / evolutions.length;
      if (avgVariation > 2) tendance = 'hausse';
      else if (avgVariation < -2) tendance = 'baisse';
    }
    
    return {
      success: true,
      data: {
        produit: recentObs[0].productLabel,
        ean: recentObs[0].barcode,
        territoire,
        prix_actuel: Math.round(prixActuel * 100) / 100,
        evolutions,
        tendance,
      },
      metadata: {
        observations_utilisees: recentObs.length + evolutions.reduce((sum, e) => sum + 1, 0),
        observations_exclues: 0,
        temps_calcul_ms: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        observations_utilisees: 0,
        observations_exclues: 0,
        temps_calcul_ms: Date.now() - startTime,
      },
    };
  }
}

/**
 * Calculate store price dispersion
 */
export function calculateStoreDispersion(
  observations: PriceObservation[],
  productKey: string,
  territoire: TerritoryCode,
  periodeDays: number = 30
): IndicatorCalculationResult<StoreDispersion> {
  const startTime = Date.now();
  
  try {
    const today = new Date();
    const periodStart = new Date(today);
    periodStart.setDate(periodStart.getDate() - periodeDays);
    
    // Filter observations
    const filtered = observations.filter((obs) => {
      const match =
        (obs.barcode === productKey || obs.productLabel === productKey) &&
        obs.territory === territoire &&
        obs.storeLabel;
      if (!match) return false;
      
      const obsDate = new Date(obs.observedAt);
      return obsDate >= periodStart && obsDate <= today;
    });
    
    if (filtered.length === 0) {
      return {
        success: false,
        error: 'No observations with store information found',
        metadata: {
          observations_utilisees: 0,
          observations_exclues: 0,
          temps_calcul_ms: Date.now() - startTime,
        },
      };
    }
    
    // Group by enseigne
    const storeGroups = new Map<string, number[]>();
    filtered.forEach((obs) => {
      if (!obs.storeLabel) return;
      if (!storeGroups.has(obs.storeLabel)) {
        storeGroups.set(obs.storeLabel, []);
      }
      storeGroups.get(obs.storeLabel)!.push(obs.price);
    });
    
    // Calculate store averages
    const storePrices: { enseigne: string; prix: number }[] = [];
    storeGroups.forEach((prices, enseigne) => {
      const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      storePrices.push({ enseigne, prix: Math.round(avg * 100) / 100 });
    });
    
    // Sort by price
    storePrices.sort((a, b) => a.prix - b.prix);
    
    // Calculate statistics
    const prices = storePrices.map((sp) => sp.prix);
    const prixMin = prices[0];
    const prixMax = prices[prices.length - 1];
    const prixMoyen = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    
    const midIndex = Math.floor(prices.length / 2);
    const prixMedian = prices.length % 2 === 0
      ? (prices[midIndex - 1] + prices[midIndex]) / 2
      : prices[midIndex];
    
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - prixMoyen, 2), 0) / prices.length;
    const ecartType = Math.sqrt(variance);
    
    // Create store details with positions
    const parEnseigne = storePrices.map((sp) => {
      let position: 'min' | 'median' | 'max' | 'autre';
      if (sp.prix === prixMin) position = 'min';
      else if (sp.prix === prixMax) position = 'max';
      else if (Math.abs(sp.prix - prixMedian) < 0.01) position = 'median';
      else position = 'autre';
      
      return {
        enseigne: sp.enseigne,
        prix: sp.prix,
        position,
        ecart_vs_median: Math.round((sp.prix - prixMedian) * 100) / 100,
      };
    });
    
    return {
      success: true,
      data: {
        produit: filtered[0].productLabel,
        ean: filtered[0].barcode,
        territoire,
        statistiques: {
          prix_min: Math.round(prixMin * 100) / 100,
          prix_max: Math.round(prixMax * 100) / 100,
          prix_median: Math.round(prixMedian * 100) / 100,
          prix_moyen: Math.round(prixMoyen * 100) / 100,
          ecart_type: Math.round(ecartType * 100) / 100,
        },
        par_enseigne: parEnseigne,
        nombre_enseignes: storeGroups.size,
        periode: `${periodStart.toISOString().split('T')[0]} à ${today.toISOString().split('T')[0]}`,
      },
      metadata: {
        observations_utilisees: filtered.length,
        observations_exclues: 0,
        temps_calcul_ms: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        observations_utilisees: 0,
        observations_exclues: 0,
        temps_calcul_ms: Date.now() - startTime,
      },
    };
  }
}
