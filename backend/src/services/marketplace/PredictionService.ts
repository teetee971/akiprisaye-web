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

import { PrismaClient, PricePrediction, Territory } from '@prisma/client';

const prisma = new PrismaClient();

// Version actuelle du modèle IA (fictive pour Sprint 4)
const MODEL_VERSION = 'v1.0.0-baseline';

// Horizon de prédiction par défaut: 7 jours
const DEFAULT_HORIZON_DAYS = 7;

export class PredictionService {
  /**
   * Générer une prédiction de prix pour un produit
   *
   * IMPORTANT: Prédiction basée sur moyenne historique simple
   * Pas d'IA réelle dans cette version (modèle déterministe)
   *
   * @param productId - ID du produit
   * @param territory - Territoire concerné
   * @param horizonDays - Horizon de prédiction (jours)
   * @returns Prédiction générée
   */
  async generate(
    productId: string,
    territory: Territory,
    horizonDays = DEFAULT_HORIZON_DAYS
  ): Promise<PricePrediction> {
    // Récupérer l'historique des prix pour ce produit dans ce territoire
    const prices = await prisma.price.findMany({
      where: {
        productId,
        store: {
          territory,
        },
      },
      orderBy: { effectiveDate: 'desc' },
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
    const coeffVariation = stdDev / averagePrice;

    // Confidence: élevée si faible variation, faible si forte variation
    const confidenceScore = Math.max(0.1, Math.min(1.0, 1 - coeffVariation));

    // Créer la prédiction
    return prisma.pricePrediction.create({
      data: {
        productId,
        territory,
        currentPrice,
        predictedPrice,
        confidenceScore,
        modelVersion: MODEL_VERSION,
        horizonDays,
      },
      include: {
        product: true,
      },
    });
  }

  /**
   * Récupérer les prédictions pour un produit
   *
   * @param productId - ID du produit
   * @param territory - Territoire (optionnel)
   * @returns Liste des prédictions
   */
  async getByProduct(
    productId: string,
    territory?: Territory
  ): Promise<PricePrediction[]> {
    const where: any = { productId };
    if (territory) where.territory = territory;

    return prisma.pricePrediction.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  /**
   * Récupérer toutes les prédictions pour un territoire
   *
   * @param territory - Territoire
   * @param page - Page
   * @param limit - Limite
   * @returns Liste des prédictions
   */
  async getByTerritory(
    territory: Territory,
    page = 1,
    limit = 20
  ): Promise<{ predictions: PricePrediction[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const [predictions, total] = await Promise.all([
      prisma.pricePrediction.findMany({
        where: { territory },
        include: { product: true },
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
   *
   * @returns Statistiques
   */
  async getStatistics(): Promise<{
    total: number;
    byTerritory: Record<Territory, number>;
    averageConfidence: number;
  }> {
    const [total, france, dom, com, avg] = await Promise.all([
      prisma.pricePrediction.count(),
      prisma.pricePrediction.count({ where: { territory: 'FRANCE_HEXAGONALE' } }),
      prisma.pricePrediction.count({ where: { territory: 'DOM' } }),
      prisma.pricePrediction.count({ where: { territory: 'COM' } }),
      prisma.pricePrediction.aggregate({
        _avg: { confidenceScore: true },
      }),
    ]);

    return {
      total,
      byTerritory: {
        FRANCE_HEXAGONALE: france,
        DOM: dom,
        COM: com,
      },
      averageConfidence: avg._avg.confidenceScore || 0,
    };
  }
}

export default new PredictionService();
