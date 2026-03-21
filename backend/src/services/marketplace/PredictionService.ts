/**
 * Service de prédiction des prix par IA - Sprint 4
 *
 * RÈGLES JURIDIQUES STRICTES:
 * - ❌ PAS de promesse de prix futur
 * - ❌ PAS de conseil financier
 * - ✅ Indication probabiliste uniquement
 * - ✅ Mention obligatoire "aide à la décision"
 * - ✅ Historique conservé pour auditabilité
 *
 * Conformité:
 * - Code de la consommation (pratiques commerciales trompeuses)
 * - RGPD Art. 22 (décision automatisée)
 */

import { PrismaClient } from '@prisma/client';
import type { pricePrediction } from '@prisma/client';
import { Territory } from '../comparison/types.js';

const prisma = new PrismaClient();

// Horizon de prédiction par défaut: 7 jours
const DEFAULT_HORIZON_DAYS = 7;

export class PredictionService {
  /**
   * Générer une prédiction de prix pour un produit
   *
   * IMPORTANT: Prédiction basée sur moyenne historique simple
   * Pas d'IA réelle dans cette version (modèle déterministe)
   */
  async generate(
    productId: string,
    territory: Territory,
    horizonDays = DEFAULT_HORIZON_DAYS
  ): Promise<pricePrediction> {
    // Récupérer les storeIds pour ce territoire
    const storesInTerritory = await prisma.store.findMany({
      where: { territory },
      select: { id: true },
    });
    const storeIds = storesInTerritory.map((s) => s.id);

    // Récupérer l'historique des prix pour ce produit dans ce territoire
    const prices = await prisma.productPrice.findMany({
      where: {
        productId,
        storeId: { in: storeIds },
      },
      orderBy: { observedAt: 'desc' },
      take: 30, // Derniers 30 prix
    });

    if (prices.length === 0) {
      throw new Error('Pas assez de données historiques pour générer une prédiction');
    }

    // Calcul simple: moyenne des prix récents
    const sum = prices.reduce((acc, p) => acc + p.price, 0);
    const currentPrice = prices[0].price;
    const averagePrice = Math.round(sum / prices.length);

    // Prédiction = moyenne pondérée (70% prix actuel + 30% moyenne)
    const predictedPrice = Math.round(currentPrice * 0.7 + averagePrice * 0.3);

    // Score de confiance basé sur la variance
    const variance = prices.reduce((acc, p) => acc + Math.pow(p.price - averagePrice, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const coeffVariation = stdDev / (averagePrice || 1);

    // Confidence: élevée si faible variation, faible si forte variation
    const confidence = Math.max(0.1, Math.min(1.0, 1 - coeffVariation));

    // Créer la prédiction (schéma: productId, territory, predictedPrice, confidence, horizon)
    return prisma.pricePrediction.create({
      data: {
        productId,
        territory,
        predictedPrice,
        confidence,
        horizon: horizonDays,
      },
    });
  }

  /**
   * Récupérer les prédictions pour un produit
   */
  async getByProduct(
    productId: string,
    territory?: Territory
  ): Promise<pricePrediction[]> {
    const where: Record<string, unknown> = { productId };
    if (territory) where.territory = territory;

    return prisma.pricePrediction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  /**
   * Récupérer toutes les prédictions pour un territoire
   */
  async getByTerritory(
    territory: Territory,
    page = 1,
    limit = 20
  ): Promise<{ predictions: pricePrediction[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const [predictions, total] = await Promise.all([
      prisma.pricePrediction.findMany({
        where: { territory },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pricePrediction.count({ where: { territory } }),
    ]);

    return { predictions, total, page, totalPages: Math.ceil(total / take) };
  }

  /**
   * Obtenir les statistiques des prédictions
   */
  async getStatistics(): Promise<{
    total: number;
    byTerritory: Partial<Record<Territory, number>>;
    averageConfidence: number;
  }> {
    const [total, avg, ...territoryCounts] = await Promise.all([
      prisma.pricePrediction.count(),
      prisma.pricePrediction.aggregate({ _avg: { confidence: true } }),
      prisma.pricePrediction.count({ where: { territory: Territory.FRANCE_HEXAGONALE } }),
      prisma.pricePrediction.count({ where: { territory: Territory.GUADELOUPE } }),
      prisma.pricePrediction.count({ where: { territory: Territory.MARTINIQUE } }),
      prisma.pricePrediction.count({ where: { territory: Territory.GUYANE } }),
      prisma.pricePrediction.count({ where: { territory: Territory.LA_REUNION } }),
      prisma.pricePrediction.count({ where: { territory: Territory.MAYOTTE } }),
      prisma.pricePrediction.count({ where: { territory: Territory.DOM } }),
      prisma.pricePrediction.count({ where: { territory: Territory.COM } }),
    ]);

    const [gf, gp, mq, gy, re, yt, dom, com] = territoryCounts;

    return {
      total,
      byTerritory: {
        [Territory.FRANCE_HEXAGONALE]: gf,
        [Territory.GUADELOUPE]: gp,
        [Territory.MARTINIQUE]: mq,
        [Territory.GUYANE]: gy,
        [Territory.LA_REUNION]: re,
        [Territory.MAYOTTE]: yt,
        [Territory.DOM]: dom,
        [Territory.COM]: com,
      },
      averageConfidence: avg._avg.confidence ?? 0,
    };
  }
}

export default new PredictionService();
