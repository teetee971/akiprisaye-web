/**
 * Price Anomaly Detection Service - Détection d'anomalies de prix
 * Version: 1.0.0
 * 
 * Conformité:
 * - Méthodes statistiques explicables uniquement
 * - Aucun Machine Learning opaque
 * - Règles configurables et auditables
 * - Détection descriptive (pas d'accusation)
 * - Méthodologie transparente
 * 
 * Fonctionnalités:
 * - Détection d'anomalies temporelles (hausses brutales)
 * - Détection d'anomalies territoriales (écarts régionaux)
 * - Détection d'outliers statistiques
 * - Scoring de sévérité
 */

import { Territory } from '../comparison/types.js';

/**
 * Type d'anomalie détectée
 */
// Enum members are used as values, not directly referenced
/* eslint-disable no-unused-vars */
export enum AnomalyType {
  /** Variation temporelle anormale */
  TEMPORAL = 'TEMPORAL',
  /** Écart territorial incohérent */
  TERRITORIAL = 'TERRITORIAL',
  /** Valeur aberrante statistique */
  OUTLIER = 'OUTLIER',
}

/**
 * Niveau de sévérité de l'anomalie
 */
export enum AnomalySeverity {
  /** Variation faible, informative */
  LOW = 'LOW',
  /** Variation notable, à surveiller */
  MEDIUM = 'MEDIUM',
  /** Variation importante, critique */
  HIGH = 'HIGH',
}
/* eslint-enable no-unused-vars */

/**
 * Anomalie de prix détectée
 */
export interface PriceAnomaly {
  /** EAN ou identifiant du produit */
  productId: string;
  /** Nom du produit */
  productName?: string;
  /** Territoire concerné */
  territory: Territory;
  /** Type d'anomalie */
  type: AnomalyType;
  /** Niveau de sévérité */
  severity: AnomalySeverity;
  /** Description explicative citoyenne */
  description: string;
  /** Détails quantifiés */
  details: {
    /** Prix actuel observé */
    currentPrice?: number;
    /** Prix précédent ou de référence */
    referencePrice?: number;
    /** Variation absolue en € */
    absoluteChange?: number;
    /** Variation relative en % */
    percentageChange?: number;
    /** Période concernée */
    period?: {
      from: Date;
      to: Date;
    };
  };
  /** Date de détection */
  detectedAt: Date;
  /** Méthode de détection utilisée */
  detectionMethod: string;
}

/**
 * Point de prix pour l'analyse
 */
export interface PriceDataPoint {
  /** Date d'observation */
  date: Date;
  /** Prix TTC en € */
  price: number;
  /** Territoire */
  territory: Territory;
  /** Source de l'observation */
  source?: string;
}

/**
 * Série de prix pour un produit
 */
export interface ProductPriceSeries {
  /** Identifiant du produit */
  productId: string;
  /** Nom du produit */
  productName?: string;
  /** Points de données */
  dataPoints: PriceDataPoint[];
}

/**
 * Configuration des seuils de détection
 */
export interface AnomalyThresholds {
  /** Seuils temporels (variation en % sur période) */
  temporal: {
    /** Seuil LOW (ex: 5% en 7 jours) */
    low: number;
    /** Seuil MEDIUM (ex: 10% en 7 jours) */
    medium: number;
    /** Seuil HIGH (ex: 20% en 7 jours) */
    high: number;
    /** Nombre de jours pour la période de référence */
    periodDays: number;
  };
  /** Seuils territoriaux (écart vs référence France) */
  territorial: {
    /** Seuil LOW (ex: 10% d'écart) */
    low: number;
    /** Seuil MEDIUM (ex: 20% d'écart) */
    medium: number;
    /** Seuil HIGH (ex: 30% d'écart) */
    high: number;
  };
  /** Seuils outliers (écart-types) */
  outlier: {
    /** Seuil MEDIUM (ex: 2 écarts-types) */
    medium: number;
    /** Seuil HIGH (ex: 3 écarts-types) */
    high: number;
  };
}

/**
 * Service de détection d'anomalies de prix
 */
export class PriceAnomalyService {
  private static instance: PriceAnomalyService;
  
  // Seuils par défaut configurables
  private thresholds: AnomalyThresholds = {
    temporal: {
      low: 0.05,      // 5%
      medium: 0.10,   // 10%
      high: 0.20,     // 20%
      periodDays: 7,  // 7 jours
    },
    territorial: {
      low: 0.10,      // 10%
      medium: 0.20,   // 20%
      high: 0.30,     // 30%
    },
    outlier: {
      medium: 2.0,    // 2 écarts-types
      high: 3.0,      // 3 écarts-types
    },
  };

  private constructor() {}

  /**
   * Singleton pattern
   */
  public static getInstance(): PriceAnomalyService {
    if (!PriceAnomalyService.instance) {
      PriceAnomalyService.instance = new PriceAnomalyService();
    }
    return PriceAnomalyService.instance;
  }

  /**
   * Configure les seuils de détection
   */
  public setThresholds(thresholds: Partial<AnomalyThresholds>): void {
    if (thresholds.temporal) {
      this.thresholds.temporal = { ...this.thresholds.temporal, ...thresholds.temporal };
    }
    if (thresholds.territorial) {
      this.thresholds.territorial = { ...this.thresholds.territorial, ...thresholds.territorial };
    }
    if (thresholds.outlier) {
      this.thresholds.outlier = { ...this.thresholds.outlier, ...thresholds.outlier };
    }
  }

  /**
   * Détecte les anomalies temporelles (hausses brutales)
   * Méthode: Comparaison de la variation de prix sur une période glissante
   */
  public detectTemporalAnomalies(series: ProductPriceSeries): PriceAnomaly[] {
    const anomalies: PriceAnomaly[] = [];
    
    if (series.dataPoints.length < 2) {
      return anomalies;
    }

    // Tri par date
    const sortedPoints = [...series.dataPoints].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Détection de variations sur période glissante
    for (let i = 1; i < sortedPoints.length; i++) {
      const current = sortedPoints[i];
      const previous = sortedPoints[i - 1];
      
      // Calcul de la période en jours
      const daysDiff = Math.abs(current.date.getTime() - previous.date.getTime()) / (1000 * 60 * 60 * 24);
      
      // On vérifie uniquement si la période est dans la fenêtre configurée
      if (daysDiff <= this.thresholds.temporal.periodDays && daysDiff > 0) {
        const absoluteChange = current.price - previous.price;
        const percentageChange = previous.price > 0 ? (absoluteChange / previous.price) : 0;
        
        // Détermination de la sévérité
        let severity: AnomalySeverity | null = null;
        if (Math.abs(percentageChange) >= this.thresholds.temporal.high) {
          severity = AnomalySeverity.HIGH;
        } else if (Math.abs(percentageChange) >= this.thresholds.temporal.medium) {
          severity = AnomalySeverity.MEDIUM;
        } else if (Math.abs(percentageChange) >= this.thresholds.temporal.low) {
          severity = AnomalySeverity.LOW;
        }
        
        if (severity) {
          const changeType = absoluteChange > 0 ? 'hausse' : 'baisse';
          const days = Math.round(daysDiff);
          const percentRounded = Math.abs(Math.round(percentageChange * 100));
          const threshold = Math.round(
            this.thresholds.temporal[severity.toLowerCase() as keyof typeof this.thresholds.temporal] as number * 100
          );
          const description = `Variation inhabituelle: ${changeType} de ${percentRounded}% en ${days} jour${days > 1 ? 's' : ''} (seuil: ${threshold}%)`;
          
          anomalies.push({
            productId: series.productId,
            productName: series.productName,
            territory: current.territory,
            type: AnomalyType.TEMPORAL,
            severity,
            description,
            details: {
              currentPrice: current.price,
              referencePrice: previous.price,
              absoluteChange: Math.round(absoluteChange * 100) / 100,
              percentageChange: Math.round(percentageChange * 100 * 100) / 100,
              period: {
                from: previous.date,
                to: current.date,
              },
            },
            detectedAt: new Date(),
            detectionMethod: 'Comparaison temporelle glissante',
          });
        }
      }
    }
    
    return anomalies;
  }

  /**
   * Détecte les anomalies territoriales (écarts régionaux incohérents)
   * Méthode: Comparaison du prix territorial vs prix de référence France hexagonale
   */
  public detectTerritoryAnomalies(
    productId: string,
    productName: string | undefined,
    territoryPrices: Map<Territory, number>,
  ): PriceAnomaly[] {
    const anomalies: PriceAnomaly[] = [];
    
    // Prix de référence (France hexagonale)
    const referencePrice = territoryPrices.get(Territory.FRANCE_HEXAGONALE);
    
    if (!referencePrice || referencePrice <= 0) {
      return anomalies;
    }
    
    // Comparaison de chaque territoire vs référence
    territoryPrices.forEach((price, territory) => {
      // Ne pas comparer la référence avec elle-même
      if (territory === Territory.FRANCE_HEXAGONALE) {
        return;
      }
      
      const absoluteChange = price - referencePrice;
      const percentageChange = (absoluteChange / referencePrice);
      
      // Détermination de la sévérité
      let severity: AnomalySeverity | null = null;
      if (Math.abs(percentageChange) >= this.thresholds.territorial.high) {
        severity = AnomalySeverity.HIGH;
      } else if (Math.abs(percentageChange) >= this.thresholds.territorial.medium) {
        severity = AnomalySeverity.MEDIUM;
      } else if (Math.abs(percentageChange) >= this.thresholds.territorial.low) {
        severity = AnomalySeverity.LOW;
      }
      
      if (severity) {
        const changeType = absoluteChange > 0 ? 'supérieur' : 'inférieur';
        const percentRounded = Math.abs(Math.round(percentageChange * 100));
        const threshold = Math.round(
          this.thresholds.territorial[severity.toLowerCase() as keyof typeof this.thresholds.territorial] * 100
        );
        const description = `Écart territorial inhabituel: prix ${changeType} de ${percentRounded}% par rapport à la France hexagonale (seuil: ${threshold}%)`;
        
        anomalies.push({
          productId,
          productName,
          territory,
          type: AnomalyType.TERRITORIAL,
          severity,
          description,
          details: {
            currentPrice: price,
            referencePrice,
            absoluteChange: Math.round(absoluteChange * 100) / 100,
            percentageChange: Math.round(percentageChange * 100 * 100) / 100,
          },
          detectedAt: new Date(),
          detectionMethod: 'Comparaison territoriale vs référence France',
        });
      }
    });
    
    return anomalies;
  }

  /**
   * Détecte les outliers statistiques (valeurs aberrantes)
   * Méthode: Détection basée sur les écarts-types (méthode Z-score)
   */
  public detectOutliers(
    productId: string,
    productName: string | undefined,
    prices: Array<{ territory: Territory; price: number }>,
  ): PriceAnomaly[] {
    const anomalies: PriceAnomaly[] = [];
    
    if (prices.length < 3) {
      return anomalies; // Besoin d'au moins 3 points pour une analyse statistique
    }
    
    // Calcul de la moyenne et de l'écart-type
    const priceValues = prices.map(p => p.price);
    const mean = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
    const variance = priceValues.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / priceValues.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) {
      return anomalies; // Tous les prix sont identiques
    }
    
    // Détection des outliers
    prices.forEach(({ territory, price }) => {
      const zScore = Math.abs((price - mean) / stdDev);
      
      let severity: AnomalySeverity | null = null;
      if (zScore >= this.thresholds.outlier.high) {
        severity = AnomalySeverity.HIGH;
      } else if (zScore >= this.thresholds.outlier.medium) {
        severity = AnomalySeverity.MEDIUM;
      }
      
      if (severity) {
        const deviation = price - mean;
        const deviationType = deviation > 0 ? 'au-dessus' : 'en-dessous';
        const zScoreRounded = Math.round(zScore * 10) / 10;
        const threshold = this.thresholds.outlier[severity.toLowerCase() as keyof typeof this.thresholds.outlier];
        const description = `Valeur statistiquement atypique: prix ${deviationType} de ${zScoreRounded} écarts-types par rapport à la moyenne (seuil: ${threshold})`;
        
        anomalies.push({
          productId,
          productName,
          territory,
          type: AnomalyType.OUTLIER,
          severity,
          description,
          details: {
            currentPrice: price,
            referencePrice: mean,
            absoluteChange: Math.round(deviation * 100) / 100,
            percentageChange: Math.round((deviation / mean) * 100 * 100) / 100,
          },
          detectedAt: new Date(),
          detectionMethod: 'Analyse statistique Z-score (écarts-types)',
        });
      }
    });
    
    return anomalies;
  }

  /**
   * Score une anomalie (utile pour priorisation)
   * Retourne un score de 0 à 100
   */
  public scoreAnomaly(anomaly: PriceAnomaly): number {
    let baseScore = 0;
    
    // Score basé sur la sévérité
    switch (anomaly.severity) {
      case AnomalySeverity.LOW:
        baseScore = 30;
        break;
      case AnomalySeverity.MEDIUM:
        baseScore = 60;
        break;
      case AnomalySeverity.HIGH:
        baseScore = 90;
        break;
    }
    
    // Bonus basé sur le type d'anomalie
    switch (anomaly.type) {
      case AnomalyType.TEMPORAL:
        baseScore += 5; // Hausses brutales prioritaires
        break;
      case AnomalyType.TERRITORIAL:
        baseScore += 3; // Écarts territoriaux importants
        break;
      case AnomalyType.OUTLIER:
        baseScore += 2; // Outliers moins prioritaires
        break;
    }
    
    // Bonus basé sur l'amplitude de la variation
    if (anomaly.details.percentageChange) {
      const absChange = Math.abs(anomaly.details.percentageChange);
      if (absChange > 50) {
        baseScore += 10;
      } else if (absChange > 30) {
        baseScore += 5;
      }
    }
    
    return Math.min(100, baseScore);
  }

  /**
   * Détecte toutes les anomalies pour une série de prix
   */
  public detectAllAnomalies(series: ProductPriceSeries): PriceAnomaly[] {
    const anomalies: PriceAnomaly[] = [];
    
    // Anomalies temporelles
    anomalies.push(...this.detectTemporalAnomalies(series));
    
    // Anomalies territoriales (si données multi-territoires)
    const territoryPrices = new Map<Territory, number>();
    series.dataPoints.forEach(point => {
      if (!territoryPrices.has(point.territory)) {
        territoryPrices.set(point.territory, point.price);
      }
    });
    
    if (territoryPrices.size > 1) {
      anomalies.push(...this.detectTerritoryAnomalies(
        series.productId,
        series.productName,
        territoryPrices,
      ));
    }
    
    // Outliers (si suffisamment de données)
    const priceData = Array.from(territoryPrices.entries()).map(([territory, price]) => ({
      territory,
      price,
    }));
    
    if (priceData.length >= 3) {
      anomalies.push(...this.detectOutliers(series.productId, series.productName, priceData));
    }
    
    return anomalies;
  }

  /**
   * Récupère les seuils configurés
   */
  public getThresholds(): AnomalyThresholds {
    return { ...this.thresholds };
  }
}
