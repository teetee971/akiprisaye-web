import { Router, Request, Response } from 'express';

const router = Router();

const MOCK_PRICES = [
  { productId: 'riz-1kg', productName: 'Riz long grain 1kg', store: 'Carrefour', price: 3.20, territory: 'martinique', updatedAt: '2025-01-17T09:45:00Z' },
  { productId: 'huile-1l', productName: 'Huile tournesol 1L', store: 'Leclerc', price: 2.85, territory: 'guadeloupe', updatedAt: '2025-01-17T09:30:00Z' },
  { productId: 'lait-1l', productName: 'Lait demi-écrémé 1L', store: 'Jumbo', price: 1.12, territory: 'reunion', updatedAt: '2025-01-17T08:00:00Z' },
  { productId: 'sucre-1kg', productName: 'Sucre blanc 1kg', store: 'Hyper U', price: 1.58, territory: 'guyane', updatedAt: '2025-01-17T07:00:00Z' },
  { productId: 'farine-1kg', productName: 'Farine de blé 1kg', store: 'Intermarché', price: 1.30, territory: 'martinique', updatedAt: '2025-01-16T20:00:00Z' },
];

const MOCK_PRODUCTS = [
  { id: 'riz-1kg', name: 'Riz long grain 1kg', category: 'Épicerie', ean: '3017620422003', brand: 'Uncle Bens' },
  { id: 'huile-1l', name: 'Huile de tournesol 1L', category: 'Épicerie', ean: '3045320094084', brand: 'Lesieur' },
  { id: 'lait-1l', name: 'Lait demi-écrémé 1L', category: 'Produits laitiers', ean: '3033490250004', brand: 'Lactel' },
  { id: 'sucre-1kg', name: 'Sucre blanc 1kg', category: 'Épicerie', ean: '3271040011009', brand: 'Saint Louis' },
  { id: 'farine-1kg', name: 'Farine de blé T55 1kg', category: 'Épicerie', ean: '3228885000048', brand: 'Francine' },
];

const MOCK_TERRITORIES = [
  { code: 'martinique', name: 'Martinique', region: 'DOM', population: 350000, currency: 'EUR' },
  { code: 'guadeloupe', name: 'Guadeloupe', region: 'DOM', population: 395000, currency: 'EUR' },
  { code: 'reunion', name: 'La Réunion', region: 'DOM', population: 860000, currency: 'EUR' },
  { code: 'guyane', name: 'Guyane', region: 'DOM', population: 300000, currency: 'EUR' },
  { code: 'mayotte', name: 'Mayotte', region: 'DOM', population: 380000, currency: 'EUR' },
];

// Simple in-memory API key store (replace with DB in production)
const VALID_API_KEYS = new Set(['DEMO-KEY-12345', 'AKIP-TEST-0001']);

function addRateLimitNoteHeader(res: Response, hasKey: boolean): void {
  res.setHeader('X-RateLimit-Limit', hasKey ? '1000' : '100');
  res.setHeader('X-RateLimit-Note', hasKey ? 'Authenticated request' : 'No API key — limited to 100 req/day');
}

function validateApiKey(req: Request, res: Response): boolean {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  addRateLimitNoteHeader(res, !!apiKey);
  if (apiKey && !VALID_API_KEYS.has(apiKey)) {
    res.status(401).json({ error: 'Invalid API key', code: 'INVALID_API_KEY' });
    return false;
  }
  return true;
}

/**
 * GET /api/v1/prices
 * Liste des prix par territoire
 */
router.get('/prices', (req: Request, res: Response) => {
  if (!validateApiKey(req, res)) return;

  const { territory, limit = '20' } = req.query as Record<string, string>;
  let results = [...MOCK_PRICES];

  if (territory) results = results.filter((p) => p.territory === territory.toLowerCase());
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

  res.json({
    data: results.slice(0, limitNum),
    meta: { total: results.length, page: 1, limit: limitNum },
  });
});

/**
 * GET /api/v1/products
 * Catalogue produits
 */
router.get('/products', (req: Request, res: Response) => {
  if (!validateApiKey(req, res)) return;

  const { q, ean, category } = req.query as Record<string, string>;
  let results = [...MOCK_PRODUCTS];

  if (q) results = results.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  if (ean) results = results.filter((p) => p.ean === ean);
  if (category) results = results.filter((p) => p.category === category);

  res.json({ data: results, meta: { total: results.length, page: 1, limit: 20 } });
});

/**
 * GET /api/v1/territories
 * Liste des territoires
 */
router.get('/territories', (_req: Request, res: Response) => {
  res.json({ data: MOCK_TERRITORIES });
});

/**
 * GET /api/v1/health
 * Santé de l'API
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version: '1.0', timestamp: Date.now() });
});

export default router;
