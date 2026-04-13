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
router.get(
  '/territories/:code/overview',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.READ_TERRITORIES),
  async (req, res) => {
    const { code } = req.params;
    
    res.json({
      message: `Aperçu territoire ${code}`,
      data: {
        code,
        name: 'Territoire',
        population: 0,
        economicIndicators: {},
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
    
    res.json({
      message: `Prix catégorie ${category}`,
      data: [],
      metadata: {
        category,
        count: 0,
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
    const { startDate, endDate } = req.query;
    
    res.json({
      message: `Historique prix ${category}`,
      data: [],
      filters: { startDate, endDate },
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
    const { sector, territory } = req.query;
    
    res.json({
      message: 'Parts de marché',
      data: {
        sector,
        territory,
        marketShare: [],
      },
      timestamp: new Date().toISOString(),
    });
  }
);

router.get(
  '/analytics/price-evolution',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.READ_ANALYTICS),
  requireSubscriptionTier(SubscriptionTier.BUSINESS_PRO),
  async (_req, res) => {
    res.json({
      message: 'Évolution des prix',
      data: {
        evolution: [],
      },
      timestamp: new Date().toISOString(),
    });
  }
);

router.post(
  '/analytics/custom-report',
  unifiedAuthMiddleware,
  requirePermission(ApiPermission.READ_ANALYTICS),
  requireSubscriptionTier(SubscriptionTier.INSTITUTIONAL),
  async (_req, res) => {
    res.json({
      message: 'Rapport personnalisé généré',
      data: {
        reportId: 'custom_report_' + Date.now(),
        status: 'processing',
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
