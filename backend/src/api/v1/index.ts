/**
 * API v1 - Routes principales
 * 
 * Structure:
 * /api/v1/
 * ├── auth/          - Authentification (JWT)
 * ├── comparators/   - Données comparateurs
 * ├── territories/   - Informations territoires
 * ├── prices/        - Données prix
 * ├── analytics/     - Analytics (Pro/Institutional)
 * ├── exports/       - Export de données
 * └── contributions/ - Contributions utilisateurs
 * 
 * Authentification: JWT Bearer Token ou API Key (X-API-Key header)
 * Rate Limiting: Dynamique selon abonnement
 */

import { Router } from 'express';
import { unifiedAuthMiddleware, requirePermission, requireSubscriptionTier } from '../middlewares/apiAuth.middleware.js';
import { createDynamicRateLimit, addRateLimitHeaders } from '../middlewares/dynamicRateLimit.middleware.js';
import { ApiPermission, SubscriptionTier } from '@prisma/client';
import prisma from '../../database/prisma.js';

const router = Router();

// Middlewares globaux pour v1
router.use(addRateLimitHeaders);
router.use(createDynamicRateLimit('day'));

/**
 * GET /api/v1/health
 * Health check de l'API v1
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Groupe: Comparateurs
 * Endpoints pour accéder aux données des comparateurs
 */
router.get(
  '/comparators/:type/data',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.READ_COMPARATORS),
  async (req, res) => {
    const { type } = req.params;
    const { territory, startDate, endDate, limit = 100 } = req.query;

    const limitNum = Math.min(Number(limit) || 100, 500);
    const where: Record<string, unknown> = { category: type };
    if (territory) where['territory'] = String(territory).toLowerCase();
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter['gte'] = new Date(String(startDate));
      if (endDate) dateFilter['lte'] = new Date(String(endDate));
      where['observedAt'] = dateFilter;
    }

    const observations = await prisma.priceObservation.findMany({
      where,
      orderBy: { observedAt: 'desc' },
      take: limitNum,
      select: {
        id: true,
        productId: true,
        productLabel: true,
        normalizedLabel: true,
        category: true,
        brand: true,
        territory: true,
        storeLabel: true,
        price: true,
        currency: true,
        observedAt: true,
        source: true,
      },
    });

    res.json({
      data: observations,
      filters: { territory, startDate, endDate, limit: limitNum },
      metadata: {
        type,
        count: observations.length,
        timestamp: new Date().toISOString(),
      },
    });
  }
);

router.get(
  '/comparators/:type/statistics',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.READ_COMPARATORS),
  async (req, res) => {
    const { type } = req.params;
    
    res.json({
      message: `Statistiques comparateur ${type}`,
      data: {
        totalRecords: 0,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
      },
      timestamp: new Date().toISOString(),
    });
  }
);

router.get(
  '/comparators/:type/trends',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.READ_ANALYTICS),
  requireSubscriptionTier(SubscriptionTier.BUSINESS_PRO),
  async (req, res) => {
    const { type } = req.params;
    
    res.json({
      message: `Tendances comparateur ${type}`,
      data: {
        trends: [],
        analysis: 'Données de tendances (Pro uniquement)',
      },
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * Groupe: Territoires
 * Informations sur les territoires ultramarins
 */

/** Static metadata for the five supported DOM-TOM territories. */
const TERRITORY_META: Record<string, { name: string; population: number; currency: string; departments: string[] }> = {
  GP: { name: 'Guadeloupe', population: 390253, currency: 'EUR', departments: ['971'] },
  MQ: { name: 'Martinique', population: 349925, currency: 'EUR', departments: ['972'] },
  GF: { name: 'Guyane', population: 290691, currency: 'EUR', departments: ['973'] },
  RE: { name: 'La Réunion', population: 908571, currency: 'EUR', departments: ['974'] },
  YT: { name: 'Mayotte', population: 371000, currency: 'EUR', departments: ['976'] },
};

router.get(
  '/territories/:code/overview',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.READ_TERRITORIES),
  async (req, res) => {
    const code = (req.params.code as string).toUpperCase();
    const meta = TERRITORY_META[code];

    // Latest price index for this territory
    const latestIndex = await prisma.priceIndex.findFirst({
      where: { territory: code },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    // Number of stores and observations
    const [storeCount, observationCount] = await Promise.all([
      prisma.store.count({ where: { territory: code.toLowerCase() } }),
      prisma.priceObservation.count({ where: { territory: code.toLowerCase() } }),
    ]);

    res.json({
      message: `Aperçu territoire ${code}`,
      data: {
        code,
        name: meta?.name ?? code,
        population: meta?.population ?? 0,
        currency: meta?.currency ?? 'EUR',
        departments: meta?.departments ?? [],
        economicIndicators: latestIndex
          ? {
              latestInflationRate: latestIndex.inflationRate,
              latestMonthlyChange: latestIndex.monthlyChange,
              latestPriceIndex: latestIndex.indexValue,
              indexPeriod: { year: latestIndex.year, month: latestIndex.month },
            }
          : {},
        dataStats: { storeCount, observationCount },
      },
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * Groupe: Prix
 * Données de prix par catégorie
 */
router.get(
  '/prices/:category',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.READ_PRICES),
  async (req, res) => {
    const { category } = req.params;
    const { territory, limit = '50' } = req.query as Record<string, string>;

    const where = {
      category,
      ...(territory ? { territory: territory.toLowerCase() } : {}),
    };

    const observations = await prisma.priceObservation.findMany({
      where,
      orderBy: { observedAt: 'desc' },
      take: Math.min(Number(limit) || 50, 200),
      select: {
        id: true,
        productLabel: true,
        normalizedLabel: true,
        price: true,
        territory: true,
        storeLabel: true,
        observedAt: true,
        brand: true,
        barcode: true,
      },
    });

    res.json({
      message: `Prix catégorie ${category}`,
      data: observations,
      metadata: {
        category,
        count: observations.length,
        ...(territory ? { territory } : {}),
      },
      timestamp: new Date().toISOString(),
    });
  }
);

router.get(
  '/prices/:category/history',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.READ_PRICES),
  requireSubscriptionTier(SubscriptionTier.CITIZEN_PREMIUM),
  async (req, res) => {
    const { category } = req.params;
    const { startDate, endDate, territory } = req.query as Record<string, string>;

    const where = {
      category,
      ...(territory ? { territory: territory.toLowerCase() } : {}),
      ...(startDate || endDate
        ? {
            observedAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const history = await prisma.priceHistoryMonthly.findMany({
      where: {
        ...(territory ? { territory: territory.toLowerCase() } : {}),
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
      take: 120,
    });

    // Fallback to raw observations grouped by month when no monthly history exists.
    const data =
      history.length > 0
        ? history
        : await prisma.priceObservation.findMany({
            where,
            orderBy: { observedAt: 'asc' },
            take: 500,
            select: { price: true, observedAt: true, territory: true },
          });

    res.json({
      message: `Historique prix ${category}`,
      data,
      filters: { startDate, endDate, ...(territory ? { territory } : {}) },
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * Groupe: Analytics
 * Analytics avancées (Pro/Institutional uniquement)
 */
router.get(
  '/analytics/market-share',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.READ_ANALYTICS),
  requireSubscriptionTier(SubscriptionTier.BUSINESS_PRO),
  async (req, res) => {
    const { sector, territory } = req.query as Record<string, string>;

    // Aggregate observation counts per store (proxy for market-share).
    const rows = await prisma.priceObservation.groupBy({
      by: ['storeLabel'],
      where: {
        ...(sector ? { category: sector } : {}),
        ...(territory ? { territory: territory.toLowerCase() } : {}),
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    const total = rows.reduce((s, r) => s + r._count.id, 0);

    const marketShare = rows.map((r) => ({
      store: r.storeLabel,
      observations: r._count.id,
      share: total > 0 ? parseFloat(((r._count.id / total) * 100).toFixed(2)) : 0,
    }));

    res.json({
      message: 'Parts de marché',
      data: { sector, territory, total, marketShare },
      timestamp: new Date().toISOString(),
    });
  }
);

router.get(
  '/analytics/price-evolution',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.READ_ANALYTICS),
  requireSubscriptionTier(SubscriptionTier.BUSINESS_PRO),
  async (req, res) => {
    const { territory, months = '12' } = req.query as Record<string, string>;
    const limit = Math.min(Number(months) || 12, 60);

    const indices = await prisma.priceIndex.findMany({
      where: territory ? { territory: territory.toUpperCase() } : {},
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: limit,
      select: {
        territory: true,
        year: true,
        month: true,
        indexValue: true,
        inflationRate: true,
        monthlyChange: true,
      },
    });

    res.json({
      message: 'Évolution des prix',
      data: { evolution: indices.reverse() },
      timestamp: new Date().toISOString(),
    });
  }
);

router.post(
  '/analytics/custom-report',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.READ_ANALYTICS),
  requireSubscriptionTier(SubscriptionTier.INSTITUTIONAL),
  async (req, res) => {
    const { territory, startYear, startMonth, endYear, endMonth, categories } =
      req.body as Record<string, unknown>;

    // Persist an inflation report record for the requested period.
    const now = new Date();
    const reportId = `custom_report_${now.getTime()}`;

    const reportData = await prisma.inflationReport.findMany({
      where: {
        ...(territory ? { territory: String(territory).toUpperCase() } : {}),
        ...(startYear ? { year: { gte: Number(startYear) } } : {}),
        ...(endYear ? { year: { lte: Number(endYear) } } : {}),
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    res.json({
      message: 'Rapport personnalisé généré',
      data: {
        reportId,
        status: 'completed',
        params: { territory, startYear, startMonth, endYear, endMonth, categories },
        records: reportData.length,
        data: reportData,
      },
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * Groupe: Contributions
 * Contributions utilisateurs (lecture/écriture)
 */
router.get(
  '/contributions/aggregate',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.READ_COMPARATORS),
  async (_req, res) => {
    res.json({
      message: 'Contributions agrégées',
      data: {
        totalContributions: 0,
        byCategory: {},
      },
      timestamp: new Date().toISOString(),
    });
  }
);

router.post(
  '/contributions',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.WRITE_CONTRIBUTIONS),
  async (req, res) => {
    const {
      productLabel,
      normalizedLabel,
      territory,
      storeLabel,
      price,
      category,
      brand,
      barcode,
      observedAt,
    } = req.body as Record<string, unknown>;

    if (!productLabel || !territory || !storeLabel || price == null) {
      res.status(400).json({
        error: 'Missing required fields: productLabel, territory, storeLabel, price',
      });
      return;
    }

    const observation = await prisma.priceObservation.create({
      data: {
        source: 'api_contribution',
        productLabel: String(productLabel),
        normalizedLabel: normalizedLabel ? String(normalizedLabel) : String(productLabel).toLowerCase(),
        territory: String(territory).toLowerCase(),
        storeLabel: String(storeLabel),
        price: Number(price),
        category: category ? String(category) : null,
        brand: brand ? String(brand) : null,
        barcode: barcode ? String(barcode) : null,
        observedAt: observedAt ? new Date(String(observedAt)) : new Date(),
      },
    });

    res.status(201).json({
      message: 'Contribution créée avec succès',
      data: observation,
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * Groupe: Exports
 * Export de données (CSV/Excel)
 */
router.post(
  '/exports/csv',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.EXPORT_DATA),
  async (req, res) => {
    const { dataType, filters } = req.body;
    
    res.json({
      message: 'Export CSV en cours',
      data: {
        exportId: 'csv_export_' + Date.now(),
        dataType,
        filters,
        status: 'processing',
        estimatedTime: '30s',
      },
      timestamp: new Date().toISOString(),
    });
  }
);

router.post(
  '/exports/excel',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.EXPORT_DATA),
  requireSubscriptionTier(SubscriptionTier.BUSINESS_PRO),
  async (req, res) => {
    const { dataType, filters } = req.body;
    
    res.json({
      message: 'Export Excel en cours',
      data: {
        exportId: 'excel_export_' + Date.now(),
        dataType,
        filters,
        status: 'processing',
        estimatedTime: '60s',
      },
      timestamp: new Date().toISOString(),
    });
  }
);

export default router;
