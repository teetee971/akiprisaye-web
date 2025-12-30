/**
 * Middleware de rate limiting
 *
 * Limite le nombre de requêtes par IP pour prévenir:
 * - Attaques par force brute
 * - Déni de service (DoS)
 * - Abus de l'API
 *
 * Utilise express-rate-limit avec stockage en mémoire
 * Pour production: utiliser Redis ou autre store distribué
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter général (API)
 *
 * Limite: 100 requêtes par 15 minutes par IP
 *適用 à toutes les routes API
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max
  message: {
    error: 'Trop de requêtes',
    message: 'Veuillez réessayer dans quelques minutes',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Retourne les headers RateLimit-*
  legacyHeaders: false, // Désactive les headers X-RateLimit-*
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop de requêtes',
      message:
        'Vous avez dépassé la limite de requêtes autorisées. Veuillez réessayer dans quelques minutes.',
      retryAfter: req.rateLimit?.resetTime
        ? new Date(req.rateLimit.resetTime).toISOString()
        : '15 minutes',
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter strict pour authentification
 *
 * Limite: 5 tentatives par 15 minutes par IP
 * Protection contre brute force sur login
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  skipSuccessfulRequests: true, // Ne compte que les échecs
  message: {
    error: 'Trop de tentatives de connexion',
    message: 'Veuillez réessayer dans 15 minutes',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Log de sécurité
    console.warn('[SECURITY] Rate limit dépassé pour authentification:', {
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString(),
    });

    res.status(429).json({
      error: 'Trop de tentatives de connexion',
      message:
        'Vous avez dépassé le nombre de tentatives autorisées. Veuillez réessayer dans 15 minutes.',
      retryAfter: req.rateLimit?.resetTime
        ? new Date(req.rateLimit.resetTime).toISOString()
        : '15 minutes',
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter modéré pour création de ressources
 *
 * Limite: 20 créations par heure par IP
 * Évite le spam de ressources
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 créations max
  message: {
    error: 'Trop de créations',
    message: 'Veuillez réessayer dans une heure',
    retryAfter: '1 heure',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop de créations',
      message:
        'Vous avez dépassé le nombre de créations autorisées. Veuillez réessayer dans une heure.',
      retryAfter: req.rateLimit?.resetTime
        ? new Date(req.rateLimit.resetTime).toISOString()
        : '1 heure',
      timestamp: new Date().toISOString(),
    });
  },
});
