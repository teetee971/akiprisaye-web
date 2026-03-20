/**
 * GET /api/compare
 *
 * Query parameters:
 *   query      {string}  required — product name or EAN barcode
 *   territory  {string}  required — territory code (e.g. GP, MQ, RE)
 *   retailer   {string}  optional — filter by specific retailer name
 *
 * Response: CompareResult (see compare.service.ts)
 *
 * Errors:
 *   400  Missing required query parameters
 *   500  Unexpected service error
 */

import { Router, Request, Response } from 'express';
import { compareService } from '../services/compare.service.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { query, territory, retailer } = req.query;

  if (!query || typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ error: 'Missing required parameter: query' });
    return;
  }
  if (!territory || typeof territory !== 'string' || !territory.trim()) {
    res.status(400).json({ error: 'Missing required parameter: territory' });
    return;
  }

  try {
    const data = await compareService({
      query: query.trim(),
      territory: territory.trim(),
      retailer: typeof retailer === 'string' && retailer.trim() ? retailer.trim() : undefined,
    });
    res.json(data);
  } catch (err) {
    console.error('[compare] service error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
