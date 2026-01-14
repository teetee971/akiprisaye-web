/**
 * Middleware de rate limiting dynamique basé sur l'abonnement
 * 
 * Applique des limites différentes selon:
 * - Niveau d'abonnement (FREE, PREMIUM, PRO, etc.)
 * - Type d'authentification (JWT vs API Key)
 * - Endpoint appelé
 * 
 * Note: Utilise actuellement un stockage en mémoire.
 * Pour la production, migrer vers Redis avec rate-limit-redis
 * 
 * Conformité RGPD: Minimisation des données stockées
 */

import { Request, Response, NextFunction } from 'express';
import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit';
import { SubscriptionTier } from '@prisma/client';
import { SUBSCRIPTION_PLANS } from '../../types/api.js';

/**
 * Store en mémoire pour le rate limiting
 * 
 * ⚠️ LIMITATION: Ne fonctionne pas correctement en multi-instance
 * Les limites seront par instance, pas globales
 * 
 * TODO PRODUCTION: Migrer vers Redis avec rate-limit-redis
 * Exemple: https://github.com/express-rate-limit/rate-limit-redis
 * 
 * Installation:
 * ```
 * npm install rate-limit-redis ioredis
 * ```
 * 
 * Usage:
 * ```typescript
 * import RedisStore from 'rate-limit-redis';
 * import Redis from 'ioredis';
 * const client = new Redis(process.env.REDIS_URL);
 * ```
 */
const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Nettoie les entrées expirées toutes les 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(memoryStore.entries());
  for (const [key, value] of entries) {
    if (value.resetTime < now) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Crée un middleware de rate limiting dynamique
 * Les limites sont ajustées selon le niveau d'abonnement
 */
export function createDynamicRateLimit(
  window: 'minute' | 'hour' | 'day' = 'day'
): RateLimitRequestHandler {
  return rateLimit({
    // Durée de la fenêtre
    windowMs: getWindowMs(window),
    
    // Limite dynamique basée sur l'abonnement
    max: async (req: Request) => {
      const tier = req.subscriptionTier || SubscriptionTier.FREE;
      const plan = SUBSCRIPTION_PLANS[tier];
      
      switch (window) {
        case 'minute':
          return Math.floor(plan.features.apiRateLimit / 1440); // 1440 minutes par jour
        case 'hour':
          return Math.floor(plan.features.apiRateLimit / 24);
        case 'day':
        default:
          return plan.features.apiRateLimit;
      }
    },
    
    // Clé unique par utilisateur/API Key
    keyGenerator: (req: Request) => {
      if (req.apiKey) {
        return `apikey:${req.apiKey.id}:${window}`;
      }
      if (req.user) {
        return `user:${req.user.userId}:${window}`;
      }
      // Utilisateurs non authentifiés (rate limit strict)
      return `ip:${req.ip}:${window}`;
    },
    
    // Handler quand la limite est atteinte
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
    
    // Désactiver les anciens headers
    standardHeaders: true,
    legacyHeaders: false,
    
    // Skip pour certaines conditions
    skip: (req: Request) => {
      // Ne pas appliquer le rate limiting aux health checks
      return req.path === '/health' || req.path === '/api/health';
    },
  });
}

/**
 * Rate limit strict pour les endpoints critiques
 * Applique une limite basse indépendamment de l'abonnement
 */
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requêtes max par minute
  message: 'Trop de requêtes sur cet endpoint critique, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limit pour les utilisateurs non authentifiés
 * Très restrictif pour éviter les abus
 */
export const anonymousRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 heures
  max: 100, // 100 requêtes par jour
  keyGenerator: (req: Request) => `anon:${req.ip}`,
  message: 'Limite de requêtes atteinte. Authentifiez-vous pour des limites plus élevées.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Middleware de vérification du rate limit pour API Keys
 * Vérifie les limites spécifiques de chaque clé
 */
export async function checkApiKeyRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.apiKey) {
    return next();
  }

  const now = Date.now();
  const windows = ['minute', 'hour', 'day'] as const;
  
  for (const window of windows) {
    const key = `apikey:${req.apiKey.id}:${window}`;
    const windowMs = getWindowMs(window);
    const limit = getApiKeyLimit(req.apiKey, window);
    
    // Récupérer ou créer l'entrée
    let entry = memoryStore.get(key);
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + windowMs };
      memoryStore.set(key, entry);
    }
    
    // Vérifier la limite
    if (entry.count >= limit) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      res.status(429).json({
        error: 'Limite de requêtes API dépassée',
        message: `Limite de ${limit} requêtes par ${window} atteinte`,
        window,
        limit,
        resetIn: `${resetIn}s`,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    // Incrémenter le compteur
    entry.count++;
  }

  next();
}

/**
 * Obtient la durée de la fenêtre en millisecondes
 */
function getWindowMs(window: 'minute' | 'hour' | 'day'): number {
  switch (window) {
    case 'minute':
      return 60 * 1000;
    case 'hour':
      return 60 * 60 * 1000;
    case 'day':
      return 24 * 60 * 60 * 1000;
  }
}

/**
 * Obtient la limite pour une API Key selon la fenêtre
 */
function getApiKeyLimit(
  apiKey: { rateLimitMinute: number; rateLimitHour: number; rateLimitDay: number },
  window: 'minute' | 'hour' | 'day'
): number {
  switch (window) {
    case 'minute':
      return apiKey.rateLimitMinute;
    case 'hour':
      return apiKey.rateLimitHour;
    case 'day':
      return apiKey.rateLimitDay;
  }
}

/**
 * Middleware qui ajoute les headers de rate limit aux réponses
 */
export function addRateLimitHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Ajouter des informations sur les limites dans les headers
  if (req.subscriptionTier) {
    const plan = SUBSCRIPTION_PLANS[req.subscriptionTier];
    res.setHeader('X-RateLimit-Limit', plan.features.apiRateLimit.toString());
    res.setHeader('X-Subscription-Tier', req.subscriptionTier);
  }

  next();
}
