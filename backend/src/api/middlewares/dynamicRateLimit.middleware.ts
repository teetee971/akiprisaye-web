/**
 * Middleware de rate limiting dynamique basé sur l'abonnement
 * 
 * Applique des limites différentes selon:
 * - Niveau d'abonnement (FREE, PREMIUM, PRO, etc.)
 * - Type d'authentification (JWT vs API Key)
 * - Endpoint appelé
 * 
 * Store: Redis lorsque REDIS_URL est défini, sinon Map en mémoire (dev/test).
 * 
 * Conformité RGPD: Minimisation des données stockées
 */

import { Request, Response, NextFunction } from 'express';
import { rateLimit, RateLimitRequestHandler, Store } from 'express-rate-limit';
import { SubscriptionTier } from '@prisma/client';
import { SUBSCRIPTION_PLANS } from '../../types/api.js';

// ─── Redis Store (optional) ────────────────────────────────────────────────────

let redisStore: Store | undefined;

/**
 * In-process fallback used by lazyStoreProxy while the async Redis import is
 * still pending (or when it has permanently failed).  Keyed by the same string
 * that express-rate-limit passes to the store, so it behaves identically to the
 * default in-memory store – except that it is shared across all rate-limit
 * instances created before Redis became available.
 * ⚠️ Single-instance only – not suitable for multi-process production deploys
 *    (those should always have REDIS_URL set so Redis initialises quickly).
 */
const proxyFallbackStore = new Map<string, { totalHits: number; resetTime: Date }>();

/**
 * Proxy store that delegates to the real Redis store once it is ready.
 * While Redis is still initialising (or if it fails), the proxy falls back to
 * an in-process map so that rate limiting continues to work instead of
 * returning a 500 error on every request.
 */
const lazyStoreProxy: Store = {
  async init(options) {
    if (redisStore?.init) await redisStore.init(options);
  },
  async increment(key) {
    if (redisStore) return redisStore.increment(key);
    // Redis not yet ready – use in-process fallback so requests are still
    // rate-limited rather than erroring with a 500.
    const now = Date.now();
    const windowMs = 24 * 60 * 60 * 1000; // conservative 24-hour window
    let entry = proxyFallbackStore.get(key);
    if (!entry || entry.resetTime.getTime() <= now) {
      entry = { totalHits: 0, resetTime: new Date(now + windowMs) };
      proxyFallbackStore.set(key, entry);
    }
    entry.totalHits += 1;
    return { totalHits: entry.totalHits, resetTime: entry.resetTime };
  },
  async decrement(key) {
    if (redisStore?.decrement) return redisStore.decrement(key);
    const entry = proxyFallbackStore.get(key);
    if (entry && entry.totalHits > 0) entry.totalHits -= 1;
  },
  async resetKey(key) {
    if (redisStore?.resetKey) return redisStore.resetKey(key);
    proxyFallbackStore.delete(key);
  },
  async resetAll() {
    if (redisStore?.resetAll) return redisStore.resetAll();
    proxyFallbackStore.clear();
  },
  async get(key) {
    if (redisStore?.get) return redisStore.get(key);
    const entry = proxyFallbackStore.get(key);
    if (!entry || entry.resetTime.getTime() <= Date.now()) return undefined;
    return { totalHits: entry.totalHits, resetTime: entry.resetTime };
  },
};

if (process.env.REDIS_URL) {
  Promise.all([
    import('ioredis'),
    import('rate-limit-redis'),
  ]).then(([{ default: Redis }, { default: RedisStore }]) => {
    const client = new Redis(process.env.REDIS_URL!, { lazyConnect: true });
    client.on('error', (err: Error) => console.warn('[RateLimit] Redis error:', err.message));
    redisStore = new RedisStore({
      sendCommand: (...args: string[]): Promise<boolean | number | string | Array<boolean | number | string>> =>
        client.call(...(args as [string, ...string[]])) as Promise<boolean | number | string | Array<boolean | number | string>>,
    });
    console.info('[RateLimit] Using Redis store for rate limiting');
  }).catch((err: unknown) => {
    console.warn('[RateLimit] Could not load Redis store, falling back to memory:', err);
  });
}

// ─── In-memory fallback ────────────────────────────────────────────────────────

/**
 * Map en mémoire utilisé quand Redis n'est pas disponible.
 * ⚠️ Ne fonctionne pas en multi-instance – uniquement pour dev/test.
 */
const memoryStore = new Map<string, { count: number; resetTime: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of Array.from(memoryStore.entries())) {
    if (value.resetTime < now) memoryStore.delete(key);
  }
}, 5 * 60 * 1000);

// ─── Factory ───────────────────────────────────────────────────────────────────

/**
 * Crée un middleware de rate limiting dynamique.
 * Les limites sont ajustées selon le niveau d'abonnement.
 */
export function createDynamicRateLimit(
  window: 'minute' | 'hour' | 'day' = 'day'
): RateLimitRequestHandler {
  return rateLimit({
    windowMs: getWindowMs(window),

    max: async (req: Request) => {
      const tier = req.subscriptionTier || SubscriptionTier.FREE;
      const plan = SUBSCRIPTION_PLANS[tier];
      switch (window) {
        case 'minute': return Math.floor(plan.features.apiRateLimit / 1440);
        case 'hour':   return Math.floor(plan.features.apiRateLimit / 24);
        default:       return plan.features.apiRateLimit;
      }
    },

    keyGenerator: (req: Request) => {
      if (req.apiKey) return `apikey:${req.apiKey.id}:${window}`;
      if (req.user)   return `user:${req.user.userId}:${window}`;
      return `ip:${req.ip}:${window}`;
    },

    handler: (req: Request, res: Response) => {
      const tier = req.subscriptionTier || SubscriptionTier.FREE;
      const plan = SUBSCRIPTION_PLANS[tier];
      res.status(429).json({
        error: 'Limite de requêtes dépassée',
        message: `Vous avez atteint la limite de ${plan.features.apiRateLimit} requêtes par jour pour votre abonnement ${plan.name}`,
        retryAfter: res.getHeader('Retry-After'),
        currentTier: tier,
        upgradeUrl: tier !== SubscriptionTier.INSTITUTIONAL ? '/api/subscriptions/upgrade' : null,
        timestamp: new Date().toISOString(),
      });
    },

    // Use Redis proxy store when available; express-rate-limit uses its default
    // memory store when `store` is undefined.
    store: process.env.REDIS_URL ? lazyStoreProxy : undefined,

    standardHeaders: true,
    legacyHeaders: false,

    skip: (req: Request) => req.path === '/health' || req.path === '/api/health',
  });
}

// ─── Strict / Anonymous limiters ──────────────────────────────────────────────

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Trop de requêtes sur cet endpoint critique, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});

export const anonymousRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 100,
  keyGenerator: (req: Request) => `anon:${req.ip}`,
  message: 'Limite de requêtes atteinte. Authentifiez-vous pour des limites plus élevées.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── API Key rate limit check ─────────────────────────────────────────────────

export async function checkApiKeyRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.apiKey) return next();

  const now = Date.now();
  const windows = ['minute', 'hour', 'day'] as const;

  for (const win of windows) {
    const key = `apikey:${req.apiKey.id}:${win}`;
    const windowMs = getWindowMs(win);
    const limit = getApiKeyLimit(req.apiKey, win);

    let entry = memoryStore.get(key);
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + windowMs };
      memoryStore.set(key, entry);
    }

    if (entry.count >= limit) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      res.status(429).json({
        error: 'Limite de requêtes API dépassée',
        message: `Limite de ${limit} requêtes par ${win} atteinte`,
        window: win,
        limit,
        resetIn: `${resetIn}s`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    entry.count++;
  }

  next();
}

// ─── Header helper ────────────────────────────────────────────────────────────

export function addRateLimitHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.subscriptionTier) {
    const plan = SUBSCRIPTION_PLANS[req.subscriptionTier];
    res.setHeader('X-RateLimit-Limit', plan.features.apiRateLimit.toString());
    res.setHeader('X-Subscription-Tier', req.subscriptionTier);
  }
  next();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWindowMs(window: 'minute' | 'hour' | 'day'): number {
  switch (window) {
    case 'minute': return 60 * 1000;
    case 'hour':   return 60 * 60 * 1000;
    case 'day':    return 24 * 60 * 60 * 1000;
  }
}

function getApiKeyLimit(
  apiKey: { rateLimitMinute: number; rateLimitHour: number; rateLimitDay: number },
  window: 'minute' | 'hour' | 'day'
): number {
  switch (window) {
    case 'minute': return apiKey.rateLimitMinute;
    case 'hour':   return apiKey.rateLimitHour;
    case 'day':    return apiKey.rateLimitDay;
  }
}
