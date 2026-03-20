/**
 * GET /api/products/:id/signal
 *
 * Returns a buy / wait / neutral recommendation for a product.
 * In production, derive this from real stored history via the DB.
 *
 * Response:
 *   { status: 'buy' | 'wait' | 'neutral'; label: string; reason: string }
 */

import { Router, Request, Response } from 'express';
import { signalService } from '../services/signal.service.js';

const router = Router();

router.get('/:id/signal', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { territory = 'GP' } = req.query as { territory?: string };

  try {
    const result = await signalService({ id, territory });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to compute signal' });
  }
});

export default router;
