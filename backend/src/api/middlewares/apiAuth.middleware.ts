/**
 * Middleware d'authentification unifié (JWT + API Key)
 * 
 * Supporte deux méthodes d'authentification:
 * 1. JWT Bearer Token (utilisateurs web)
 * 2. API Key (applications tierces)
 * 
 * Injecte dans req:
 * - user: informations utilisateur
 * - userRole: rôle utilisateur  
 * - apiKey: informations de la clé API (si applicable)
 * - subscriptionTier: niveau d'abonnement
 * 
 * RGPD: Minimisation des données, traçabilité des accès
 */

import { Request, Response, NextFunction } from 'express';
import { ApiKey, ApiPermission, SubscriptionTier } from '@prisma/client';
import { verifyAccessToken, extractTokenFromHeader } from '../../security/jwt.js';
import { ApiKeyService } from '../../services/api/ApiKeyService.js';
import { prisma } from '../../app.js';

const apiKeyService = new ApiKeyService(prisma);

// Extension du type Request
declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKey;
      subscriptionTier?: SubscriptionTier;
    }
  }
}

/**
 * Middleware d'authentification unifié
 * Supporte JWT Bearer Token et API Key
 */
export async function unifiedAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const startTime = Date.now();
    
    // Vérifier d'abord si une API Key est fournie
    const apiKeyHeader = req.headers['x-api-key'] as string;
    
    if (apiKeyHeader) {
      // Authentification par API Key
      await authenticateWithApiKey(req, apiKeyHeader, startTime);
      next();
    } else {
      // Authentification par JWT
      await authenticateWithJWT(req);
      next();
    }
  } catch (error) {
    console.warn('[API AUTH] Tentative d\'accès non autorisée:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    });

    res.status(401).json({
      error: 'Non autorisé',
      message: error instanceof Error ? error.message : 'Authentification requise',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Authentifie via API Key
 */
async function authenticateWithApiKey(
  req: Request, 
  apiKey: string,
  startTime: number
): Promise<void> {
  // Vérifier la clé API
  const key = await apiKeyService.verifyApiKey(apiKey);
  req.apiKey = key;
  
  // Charger les informations utilisateur
  const user = await prisma.user.findUnique({
    where: { id: key.userId },
    select: { 
      id: true, 
      email: true, 
      role: true, 
      subscriptionTier: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  if (!user.isActive) {
    throw new Error('Compte désactivé');
  }

  // Injecter dans la requête
  req.user = {
    userId: user.id,
    email: user.email,
    type: 'access' as const,
  };
  req.userRole = user.role;
  req.subscriptionTier = user.subscriptionTier;
  
  // Enregistrer l'usage (en arrière-plan pour ne pas ralentir la requête)
  setImmediate(async () => {
    try {
      const responseTime = Date.now() - startTime;
      await apiKeyService.trackUsage(
        key.id,
        req.path,
        req.method,
        200, // sera mis à jour par le middleware de tracking
        responseTime,
        req.ip
      );
    } catch (error) {
      console.error('[API AUTH] Erreur tracking usage:', error);
    }
  });
}

/**
 * Authentifie via JWT
 */
async function authenticateWithJWT(req: Request): Promise<void> {
  const token = extractTokenFromHeader(req.headers.authorization);
  const payload = verifyAccessToken(token);
  
  // Charger les informations complètes depuis la DB
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { 
      role: true, 
      isActive: true, 
      subscriptionTier: true,
    },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  if (!user.isActive) {
    throw new Error('Compte désactivé');
  }

  // Injecter dans la requête
  req.user = {
    ...payload,
  };
  req.userRole = user.role;
  req.subscriptionTier = user.subscriptionTier;
}

/**
 * Middleware optionnel d'authentification
 * N'échoue pas si aucune authentification n'est fournie
 */
export async function optionalUnifiedAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await unifiedAuthMiddleware(req, res, next);
  } catch (error) {
    // Continuer sans authentification
    req.user = undefined;
    req.userRole = undefined;
    req.apiKey = undefined;
    req.subscriptionTier = SubscriptionTier.FREE;
    next();
  }
}

/**
 * Middleware de vérification des permissions
 * Vérifie qu'une API Key a la permission requise
 */
export function requirePermission(permission: ApiPermission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Si pas d'API Key, vérifier le rôle utilisateur (pour JWT)
    if (!req.apiKey) {
      // Pour JWT, on peut vérifier des rôles spécifiques
      // Pour l'instant, on autorise tous les utilisateurs authentifiés
      return next();
    }

    // Vérifier les permissions de l'API Key
    if (!req.apiKey.permissions.includes(permission) && 
        !req.apiKey.permissions.includes(ApiPermission.ADMIN)) {
      res.status(403).json({
        error: 'Permission insuffisante',
        message: `La permission ${permission} est requise`,
        currentPermissions: req.apiKey.permissions,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Middleware de vérification du niveau d'abonnement
 * Vérifie que l'utilisateur a au moins le tier requis
 */
export function requireSubscriptionTier(minTier: SubscriptionTier) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.subscriptionTier) {
      res.status(401).json({
        error: 'Non autorisé',
        message: 'Authentification requise',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const tierOrder: SubscriptionTier[] = [
      SubscriptionTier.FREE,
      SubscriptionTier.CITIZEN_PREMIUM,
      SubscriptionTier.SME,
      SubscriptionTier.BUSINESS_PRO,
      SubscriptionTier.INSTITUTIONAL,
    ];

    const userTierIndex = tierOrder.indexOf(req.subscriptionTier);
    const requiredTierIndex = tierOrder.indexOf(minTier);

    if (userTierIndex < requiredTierIndex) {
      res.status(403).json({
        error: 'Abonnement insuffisant',
        message: 'Mise à niveau de l\'abonnement requise',
        currentTier: req.subscriptionTier,
        requiredTier: minTier,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Middleware de tracking des performances
 * Enregistre le temps de réponse et met à jour les stats d'usage
 */
export function trackApiUsage(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Capturer la réponse
  const originalSend = res.send;
  res.send = function (data): Response {
    res.send = originalSend; // Restaurer la fonction originale
    
    // Enregistrer l'usage si API Key utilisée
    if (req.apiKey) {
      const responseTime = Date.now() - startTime;
      
      setImmediate(async () => {
        try {
          await apiKeyService.trackUsage(
            req.apiKey!.id,
            req.path,
            req.method,
            res.statusCode,
            responseTime,
            req.ip
          );
        } catch (error) {
          console.error('[TRACK] Erreur tracking usage:', error);
        }
      });
    }

    return originalSend.call(this, data);
  };

  next();
}
