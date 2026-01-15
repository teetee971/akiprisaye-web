/**
 * Rate Limiting spécifique pour l'API Open Data publique
 * 
 * Limite: 1000 requêtes par heure par IP
 * Plus permissif que l'API authentifiée car usage public
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter pour l'API Open Data (public)
 * 1000 requêtes par heure par IP
 */
export const opendataRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 1000, // 1000 requêtes par fenêtre
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer dans une heure.',
    retryAfter: '1 hour',
  },
  standardHeaders: true, // Retourne rate limit info dans headers `RateLimit-*`
  legacyHeaders: false, // Désactive headers `X-RateLimit-*`
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message:
        'Trop de requêtes API Open Data. Limite: 1000 requêtes par heure.',
      retryAfter: '1 hour',
      documentation: '/api/opendata/v1/metadata',
    });
  },
});

/**
 * Rate limiter pour les endpoints intensifs (historique, etc.)
 * 100 requêtes par heure par IP
 */
export const opendataHeavyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 100, // 100 requêtes par fenêtre
  message: {
    error:
      'Trop de requêtes sur cet endpoint intensif, veuillez réessayer dans une heure.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message:
        'Trop de requêtes sur cet endpoint. Limite: 100 requêtes par heure.',
      retryAfter: '1 hour',
      documentation: '/api/opendata/v1/metadata',
    });
  },
});
