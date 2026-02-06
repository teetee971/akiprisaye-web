import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

// ===============================
// INIT EXPRESS
// ===============================
const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// CONFIG
// ===============================

// SOURCE OFFICIELLE UNIQUE (JSON statique)
const DATA_FILE_PATH: string =
  process.env.MEGA_DATASET_PATH ||
  path.join(
    __dirname,
    '../../frontend/public/data/mega-panier-anti-crise.json'
  );

// Cache mémoire (performance + stabilité)
let CACHE: any | null = null;
let CACHE_MTIME = 0;

// ===============================
// TYPES MINIMAUX
// ===============================
type StoreId = string;
type ProductId = string;

// ===============================
// UTILITAIRES
// ===============================
function loadMegaDataset(): any {
  if (!fs.existsSync(DATA_FILE_PATH)) {
    throw new Error('mega-panier-anti-crise.json introuvable');
  }

  const stat = fs.statSync(DATA_FILE_PATH);

  // 🔁 Recharge uniquement si le fichier a changé
  if (!CACHE || stat.mtimeMs !== CACHE_MTIME) {
    const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    CACHE = JSON.parse(raw);
    CACHE_MTIME = stat.mtimeMs;
  }

  return CACHE;
}

function safeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ===============================
// MIDDLEWARE ASYNC SAFE
// ===============================
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}

// ===============================
// ROUTES SYSTEME
// ===============================

/**
 * GET /api/health
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'A KI PRI SA YÉ API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/meta
 */
app.get(
  '/meta',
  asyncHandler(async (_req, res) => {
    const data = loadMegaDataset();
    res.json(data.meta);
  })
);

// ===============================
// PANIER ANTI-CRISE
// ===============================

/**
 * GET /api/panier/anti-crise
 */
app.get(
  '/panier/anti-crise',
  asyncHandler(async (_req, res) => {
    const data = loadMegaDataset();
    res.json(data);
  })
);

/**
 * GET /api/panier/anti-crise/recommandation
 */
app.get(
  '/panier/anti-crise/recommandation',
  asyncHandler(async (_req, res) => {
    const data = loadMegaDataset();
    const basket = data.baskets?.[0];

    if (!basket?.recommendedStore) {
      return res.status(404).json({
        error: 'Aucune recommandation disponible'
      });
    }

    const store = data.stores.find(
      (s: any) => s.storeId === basket.recommendedStore.storeId
    );

    res.json({
      basketId: basket.basketId,
      recommendedStore: {
        ...basket.recommendedStore,
        storeDetails: store || null
      }
    });
  })
);

// ===============================
// STORES
// ===============================

/**
 * GET /api/stores
 */
app.get(
  '/stores',
  asyncHandler(async (_req, res) => {
    const data = loadMegaDataset();
    res.json(data.stores || []);
  })
);

/**
 * GET /api/stores/:id
 */
app.get(
  '/stores/:id',
  asyncHandler(async (req, res) => {
    const data = loadMegaDataset();
    const store = data.stores.find(
      (s: any) => s.storeId === req.params.id
    );

    if (!store) {
      return res.status(404).json({
        error: 'Magasin introuvable'
      });
    }

    res.json(store);
  })
);

// ===============================
// PRODUITS
// ===============================

/**
 * GET /api/products
 */
app.get(
  '/products',
  asyncHandler(async (_req, res) => {
    const data = loadMegaDataset();
    res.json(data.products || []);
  })
);

/**
 * GET /api/products/:id
 */
app.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const data = loadMegaDataset();
    const product = data.products.find(
      (p: any) => p.productId === req.params.id
    );

    if (!product) {
      return res.status(404).json({
        error: 'Produit introuvable'
      });
    }

    res.json(product);
  })
);

// ===============================
// PRIX & COMPARAISONS
// ===============================

/**
 * GET /api/prices/by-store/:storeId
 */
app.get(
  '/prices/by-store/:storeId',
  asyncHandler(async (req, res) => {
    const data = loadMegaDataset();
    const store = data.stores.find(
      (s: any) => s.storeId === req.params.storeId
    );

    if (!store) {
      return res.status(404).json({
        error: 'Magasin introuvable'
      });
    }

    res.json({
      storeId: store.storeId,
      storeName: store.storeName,
      prices: store.prices || {}
    });
  })
);

/**
 * GET /api/prices/by-product/:productId
 */
app.get(
  '/prices/by-product/:productId',
  asyncHandler(async (req, res) => {
    const data = loadMegaDataset();
    const productId: ProductId = req.params.productId;

    const prices = data.stores
      .map((store: any) => ({
        storeId: store.storeId,
        storeName: store.storeName,
        price: safeNumber(store.prices?.[productId])
      }))
      .filter((p: any) => p.price !== null);

    res.json({
      productId,
      prices
    });
  })
);

// ===============================
// ANALYTICS
// ===============================

/**
 * GET /api/analytics
 */
app.get(
  '/analytics',
  asyncHandler(async (_req, res) => {
    const data = loadMegaDataset();
    res.json(data.analytics || {});
  })
);

/**
 * GET /api/analytics/price-range
 */
app.get(
  '/analytics/price-range',
  asyncHandler(async (_req, res) => {
    const data = loadMegaDataset();
    res.json(data.analytics?.priceRange || {});
  })
);

// ===============================
// GESTION ERREURS GLOBALE
// ===============================
app.use(
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API ERROR:', err);
    res.status(500).json({
      error: 'Erreur interne API',
      message: err?.message || 'unknown_error'
    });
  }
);

// ===============================
// EXPORT
// ===============================
export default app;