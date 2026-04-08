/**
 * Sponsorship Routes
 *
 * Routes pour les créneaux publicitaires sponsorisés :
 *   GET  /api/sponsorship/slots          — Liste les types de slots
 *   GET  /api/sponsorship/slots/:type    — Détails d'un type de slot
 *   POST /api/sponsorship/estimate       — Estimation de budget campagne
 *   POST /api/sponsorship/campaigns      — Créer une campagne (stub)
 */

import express, { Request, Response } from 'express';
import {
  SponsorshipService,
  type SlotType,
} from '../../services/monetization/sponsorshipService.js';
import { createLimiter } from '../middlewares/rateLimit.middleware.js';
import { isValidEmail } from '../../utils/validation.js';

const router = express.Router();

/**
 * GET /api/sponsorship/slots
 * List all available sponsorship slot types.
 */
router.get('/slots', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: SponsorshipService.getSlotConfigs(),
  });
});

/**
 * GET /api/sponsorship/slots/:type
 * Get details of a specific slot type.
 */
router.get('/slots/:type', (req: Request, res: Response): void => {
  const validTypes: SlotType[] = ['hero', 'search', 'newsletter', 'sidebar'];
  const type = req.params.type as SlotType;

  if (!validTypes.includes(type)) {
    res.status(404).json({ success: false, error: 'Type de slot inconnu' });
    return;
  }

  res.json({ success: true, data: SponsorshipService.getSlotConfig(type) });
});

/**
 * POST /api/sponsorship/estimate
 * Estimate campaign cost.
 */
router.post('/estimate', (req: Request, res: Response): void => {
  try {
    const { slotType, durationDays = 7, estimatedClicks } = req.body;

    const validTypes: SlotType[] = ['hero', 'search', 'newsletter', 'sidebar'];
    if (!validTypes.includes(slotType)) {
      res.status(400).json({ success: false, error: 'Type de slot invalide' });
      return;
    }

    const days = Number(durationDays);
    if (!Number.isFinite(days) || days <= 0 || days > 365) {
      res.status(400).json({ success: false, error: 'durationDays doit être entre 1 et 365' });
      return;
    }

    const estimate = SponsorshipService.estimateCampaignCost(
      slotType as SlotType,
      days,
      estimatedClicks
    );

    res.json({
      success: true,
      data: {
        slotType,
        durationDays: days,
        estimatedCost: estimate,
        currency: 'EUR',
        config: SponsorshipService.getSlotConfig(slotType),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur estimation' });
  }
});

/**
 * POST /api/sponsorship/campaigns
 * Create a sponsorship campaign (stub — full implementation requires auth + payment).
 */
router.post('/campaigns', createLimiter, (req: Request, res: Response): void => {
  const { sponsor, slotType, startDate, endDate, dailyBudget, contactEmail } = req.body;

  if (!sponsor || !slotType || !startDate || !endDate || !contactEmail) {
    res.status(400).json({ success: false, error: 'Champs requis manquants' });
    return;
  }

  if (!isValidEmail(contactEmail)) {
    res.status(400).json({ success: false, error: 'Format email invalide' });
    return;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    res.status(400).json({ success: false, error: 'Les dates sont invalides (endDate doit être après startDate)' });
    return;
  }

  const budget = Number(dailyBudget);
  if (dailyBudget !== undefined && (!Number.isFinite(budget) || budget < 0)) {
    res.status(400).json({ success: false, error: 'dailyBudget invalide' });
    return;
  }

  res.status(201).json({
    success: true,
    data: {
      id: `SPO-${Date.now()}`,
      sponsor,
      slotType,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      dailyBudget: budget || 50,
      status: 'pending_payment',
      contactEmail,
      createdAt: new Date().toISOString(),
    },
    message: 'Campagne créée. Un email de confirmation vous sera envoyé sous 24h.',
  });
});

export default router;
