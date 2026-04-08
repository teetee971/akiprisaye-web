/**
 * Reports Routes
 *
 * Routes pour les rapports de données et licences :
 *   GET  /api/reports                — Liste les rapports disponibles
 *   GET  /api/reports/:id            — Détails d'un rapport
 *   POST /api/reports/order          — Commander un rapport
 *   GET  /api/reports/schedule       — Schedule de génération automatique
 */

import express, { Request, Response } from 'express';
import {
  DataLicenseService,
  type ReportOrder,
  type ReportType,
} from '../../services/monetization/dataLicenseService.js';
import { createLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

/**
 * GET /api/reports
 * List all available data reports.
 */
router.get('/', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: DataLicenseService.getAvailableReports(),
  });
});

/**
 * GET /api/reports/schedule
 * Get the automatic generation schedule.
 */
router.get('/schedule', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      cron: DataLicenseService.getScheduleCron(),
      description: 'Chaque dimanche à 23h00 (Europe/Paris)',
      nextRun: 'Calculé dynamiquement',
    },
  });
});

/**
 * GET /api/reports/:id
 * Get details of a specific report.
 */
router.get('/:id', (req: Request, res: Response): void => {
  const report = DataLicenseService.getReportById(req.params.id);
  if (!report) {
    res.status(404).json({ success: false, error: 'Rapport non trouvé' });
    return;
  }
  res.json({ success: true, data: report });
});

/**
 * POST /api/reports/order
 * Place an order for a data report.
 */
router.post('/order', createLimiter, (req: Request, res: Response): void => {
  try {
    const order = req.body as ReportOrder;
    const validation = DataLicenseService.validateOrder(order);

    if (!validation.valid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }

    const report = DataLicenseService.getReportByType(order.reportType as ReportType);
    let price = report?.price ?? 0;

    if (order.reportType === 'custom_export') {
      price = DataLicenseService.computeCustomExportPrice({
        months: 1,
        territories: order.territory ? 1 : 4,
        categories: order.categories?.length ?? 5,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        orderId: `RPT-${Date.now()}`,
        reportType: order.reportType,
        email: order.email,
        price,
        status: 'pending',
        estimatedDelivery: report?.deliveryTime ?? 'Sous 48h',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur commande rapport' });
  }
});

export default router;
