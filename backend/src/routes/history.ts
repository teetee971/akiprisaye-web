/**
 * GET /api/products/:id/history
 *
 * Returns historical price points for a product in a given territory.
 *
 * Query parameters:
 *   territory  {string}  required — territory code (e.g. GP)
 *   range      {'7d'|'30d'}  optional — defaults to '7d'
 *
 * Response:
 *   { history: Array<{ date: string; price: number }> }
 *
 * Data source: real DB queries via historyService (PriceObservation + PriceHistoryMonthly).
 */

import { Router, Request, Response } from 'express';
import { historyService } from '../services/history.service.js';

const router = Router();

router.get('/:id/history', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { territory = 'GP', range = '7d' } = req.query as { territory?: string; range?: string };

  try {
    const history = await historyService({ id, territory, range });
    res.json({ history });
  } catch {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
