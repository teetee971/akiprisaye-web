/**
 * Service d'analytics avancés
 * A KI PRI SA YÉ - Version 1.0.0
 * 
 * Fonctionnalités réservées aux abonnés Pro/Institutionnel:
 * - Vue marché globale
 * - Parts de marché estimées
 * - Évolution prix dans le temps
 * - Sentiment consommateur
 * - Rapports personnalisés
 * 
 * RGPD: Données agrégées uniquement, pas de données personnelles
 */

import { PrismaClient } from '@prisma/client';
import { Territory } from '../comparison/types.js';
import {
  MarketOverview,
  MarketShareData,
  TimeSeriesData,
  SentimentAnalysis,
  Report,
  ReportConfig,
  DateRange,
} from '../../types/credits.js';

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Vue marché globale
   * 
   * @param territory - Territoire à analyser
   * @param sector - Secteur à analyser
   * @param dateRange - Plage de dates
   * @returns Vue d'ensemble du marché
   */
  async getMarketOverview(
    territory: Territory,
    sector: string,
    dateRange: DateRange
  ): Promise<MarketOverview> {
    // Récupérer les observations de prix pour le territoire et secteur
    const observations = await this.prisma.priceObservation.findMany({
      where: {
        territory: territory.toString(),
        category: sector,
        observedAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
    });
    
    if (observations.length === 0) {
      return this.getEmptyMarketOverview(territory, sector, dateRange);
    }
    
    // Calculer statistiques de base
    const priceValues = observations.map(p => p.price);
    const avgPrice = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
    
    // Prix index (100 = prix moyen)
    const priceIndex = 100;
    
    // Calculer volatilité (écart-type)
    const variance = priceValues.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / priceValues.length;
    const volatility = Math.sqrt(variance) / avgPrice * 100;
    
    // Changement de prix (comparer début vs fin période)
    const priceChange = await this.calculatePriceChangeFromObservations(observations, dateRange);
    
    // Top produits chers/abordables
    const productPrices = this.aggregatePricesByProductLabel(observations);
    const topExpensive = [...productPrices].sort((a, b) => b.averagePrice - a.averagePrice).slice(0, 10);
    const topAffordable = [...productPrices].sort((a, b) => a.averagePrice - b.averagePrice).slice(0, 10);
    
    // Compter contributeurs uniques (approximation via transactions de crédits)
    const contributions = await this.prisma.creditTransaction.count({
      where: {
        type: 'EARN',
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
    });
    
    const activeContributors = await this.prisma.creditTransaction.groupBy({
      by: ['userId'],
      where: {
        type: 'EARN',
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
    });
    
    // Générer insights
    const insights = this.generateMarketInsights(
      volatility,
      priceChange,
      contributions
    );
    
    return {
      territory: territory.toString(),
      sector,
      period: dateRange,
      priceIndex,
      priceChange,
      volatility,
      topExpensiveProducts: topExpensive,
      topAffordableProducts: topAffordable,
      contributionsCount: contributions,
      activeContributors: activeContributors.length,
      insights,
    };
  }

  /**
   * Parts de marché estimées
   * 
   * @param sector - Secteur
   * @param territory - Territoire
   * @returns Données de parts de marché
   */
  async getMarketShare(
    sector: string,
    territory: Territory
  ): Promise<MarketShareData> {
    // Calculer mentions par marque (via les observations de prix)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const observations = await this.prisma.priceObservation.findMany({
      where: {
        territory: territory.toString(),
        category: sector,
        observedAt: {
          gte: threeMonthsAgo,
        },
      },
    });
    
    // Compter mentions par marque
    const mentions: Record<string, number> = {};
    observations.forEach(obs => {
      const brand = obs.brand || 'Inconnu';
      mentions[brand] = (mentions[brand] || 0) + 1;
    });
    
    const total = Object.values(mentions).reduce((sum, count) => sum + count, 0);
    
    const shares = Object.entries(mentions).map(([brand, count]) => ({
      brand,
      mentions: count,
      estimatedShare: total > 0 ? (count / total) * 100 : 0,
      trend: 'stable' as const,
    })).sort((a, b) => b.estimatedShare - a.estimatedShare);
    
    // Évaluer qualité des données
    const dataQuality = total > 1000 ? 'high' : total > 100 ? 'medium' : 'low';
    
    return {
      sector,
      territory: territory.toString(),
      shares,
      dataQuality,
    };
  }

  /**
   * Évolution prix dans le temps
   * 
   * @param category - Catégorie de produits
   * @param territory - Territoire
   * @param period - Période en mois
   * @returns Séries temporelles
   */
  async getPriceEvolution(
    category: string,
    territory: Territory,
    period: number
  ): Promise<TimeSeriesData> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - period);
    
    const observations = await this.prisma.priceObservation.findMany({
      where: {
        territory: territory.toString(),
        category,
        observedAt: {
          gte: startDate,
        },
      },
      orderBy: {
        observedAt: 'asc',
      },
    });
    
    // Agréger par semaine
    const weeklyData: Record<string, number[]> = {};
    
    observations.forEach(obs => {
      const date = new Date(obs.observedAt);
      // Début de semaine (lundi)
      const monday = new Date(date);
      monday.setDate(date.getDate() - date.getDay() + 1);
      const weekKey = monday.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = [];
      }
      weeklyData[weekKey].push(obs.price);
    });
    
    const timeSeries = Object.entries(weeklyData)
      .map(([date, priceValues]) => ({
        date,
        average: priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length,
        min: Math.min(...priceValues),
        max: Math.max(...priceValues),
        count: priceValues.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Détecter tendance
    const trend = this.detectTrend(timeSeries);
    
    return {
      category,
      territory: territory.toString(),
      period,
      data: timeSeries,
      trend,
      seasonality: undefined, // Simplification - nécessiterait analyse plus poussée
    };
  }

  /**
   * Analyse sentiment consommateur
   * Note: Version simplifiée - nécessiterait intégration NLP pour analyse complète
   * 
   * @param brand - Marque
   * @param territory - Territoire
   * @returns Analyse de sentiment
   */
  async getConsumerSentiment(
    brand: string,
    territory: Territory
  ): Promise<SentimentAnalysis> {
    // Note: Nécessiterait table reviews/ratings
    // Pour l'instant, retour de données mockées pour l'architecture
    
    return {
      brand,
      territory: territory.toString(),
      period: '6 months',
      averageRating: 3.5,
      distribution: {
        1: 10,
        2: 15,
        3: 30,
        4: 25,
        5: 20,
      },
      totalReviews: 100,
      sentimentScore: 0.3, // -1 à +1
      topKeywords: ['qualité', 'prix', 'service'],
      trend: 'stable',
    };
  }

  /**
   * Générer rapport personnalisé
   * 
   * @param userId - ID de l'utilisateur
   * @param config - Configuration du rapport
   * @returns Rapport généré
   */
  async generateCustomReport(
    userId: string,
    config: ReportConfig
  ): Promise<Report> {
    // Vérifier abonnement Pro/Institutionnel
    // Note: À implémenter avec SubscriptionService
    
    const report: Report = {
      id: crypto.randomUUID(),
      userId,
      title: config.title,
      createdAt: new Date(),
      sections: [],
      pdfUrl: undefined,
    };
    
    // Générer sections selon config
    for (const section of config.sections) {
      try {
        let sectionData;
        
        switch (section.type) {
          case 'market_overview':
            sectionData = await this.getMarketOverview(...(section.params as [Territory, string, DateRange]));
            break;
          case 'price_evolution':
            sectionData = await this.getPriceEvolution(...(section.params as [string, Territory, number]));
            break;
          case 'market_share':
            sectionData = await this.getMarketShare(...(section.params as [string, Territory]));
            break;
          case 'sentiment':
            sectionData = await this.getConsumerSentiment(...(section.params as [string, Territory]));
            break;
          default:
            sectionData = { error: 'Unknown section type' };
        }
        
        report.sections.push({
          type: section.type,
          data: sectionData,
        });
      } catch (error) {
        report.sections.push({
          type: section.type,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    // Note: Génération PDF serait faite avec une lib comme puppeteer ou pdfkit
    // report.pdfUrl = await this.generatePDF(report);
    
    return report;
  }

  // ==========================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ==========================================

  private getEmptyMarketOverview(
    territory: Territory,
    sector: string,
    dateRange: DateRange
  ): MarketOverview {
    return {
      territory: territory.toString(),
      sector,
      period: dateRange,
      priceIndex: 100,
      priceChange: 0,
      volatility: 0,
      topExpensiveProducts: [],
      topAffordableProducts: [],
      contributionsCount: 0,
      activeContributors: 0,
      insights: ['Données insuffisantes pour cette période'],
    };
  }

  private calculatePriceChangeFromObservations(
    observations: Array<{ price: number; observedAt: Date }>,
    _dateRange: DateRange
  ): number {
    if (observations.length < 2) return 0;
    
    const sorted = [...observations].sort((a, b) => 
      a.observedAt.getTime() - b.observedAt.getTime()
    );
    
    const firstPrices = sorted.slice(0, Math.max(1, Math.floor(sorted.length / 10)));
    const lastPrices = sorted.slice(-Math.max(1, Math.floor(sorted.length / 10)));
    
    const firstAvg = firstPrices.reduce((sum, p) => sum + p.price, 0) / firstPrices.length;
    const lastAvg = lastPrices.reduce((sum, p) => sum + p.price, 0) / lastPrices.length;
    
    return firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;
  }

  private aggregatePricesByProductLabel(
    observations: Array<{ price: number; normalizedLabel: string; category: string | null }>
  ) {
    const productMap: Record<string, { prices: number[]; label: string; category: string | null }> = {};
    
    observations.forEach(obs => {
      const key = obs.normalizedLabel;
      if (!productMap[key]) {
        productMap[key] = { prices: [], label: obs.normalizedLabel, category: obs.category };
      }
      productMap[key].prices.push(obs.price);
    });
    
    return Object.values(productMap).map(({ prices, label, category }) => ({
      id: label,
      name: label,
      category: category || '',
      averagePrice: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      priceChange: undefined,
    }));
  }

  private generateMarketInsights(
    volatility: number,
    priceChange: number,
    contributions: number
  ): string[] {
    const insights: string[] = [];
    
    if (volatility > 20) {
      insights.push('Forte volatilité des prix détectée');
    } else if (volatility < 5) {
      insights.push('Prix relativement stables');
    }
    
    if (priceChange > 5) {
      insights.push(`Hausse significative des prix (+${priceChange.toFixed(1)}%)`);
    } else if (priceChange < -5) {
      insights.push(`Baisse significative des prix (${priceChange.toFixed(1)}%)`);
    }
    
    if (contributions > 1000) {
      insights.push('Très bonne couverture de données');
    } else if (contributions < 100) {
      insights.push('Données limitées, résultats à interpréter avec prudence');
    }
    
    return insights;
  }

  private detectTrend(
    timeSeries: Array<{ date: string; average: number }>
  ): 'up' | 'down' | 'stable' {
    if (timeSeries.length < 2) return 'stable';
    
    const first = timeSeries[0].average;
    const last = timeSeries[timeSeries.length - 1].average;
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }
}
