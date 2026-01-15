/**
 * Middleware d'authentification JWT avec enrichissement du rôle
 *
 * Vérifie la présence et validité du token JWT dans les requêtes
 * Injecte les informations utilisateur dans req.user
 * Charge le rôle utilisateur depuis la base de données
 *
 * Conformité RGPD:
 * - Minimisation des données (uniquement userId et email)
 * - Traçabilité des accès via logs
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  verifyAccessToken,
  extractTokenFromHeader,
  JWTPayload,
} from '../../security/jwt.js';

const prisma = new PrismaClient();

// Extension du type Request pour inclure user et userRole
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userRole?: string; // UserRole from Prisma
    }
  }
}

/**
 * Middleware d'authentification JWT avec enrichissement du rôle
 *
 * Extrait et vérifie le token JWT du header Authorization
 * Charge le rôle utilisateur depuis la base de données
 * En cas de succès, ajoute req.user et req.userRole
 * En cas d'échec, retourne 401 Unauthorized
 *
 * @param req - Request Express
 * @param res - Response Express
 * @param next - Next function
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extraire le token du header Authorization
    const token = extractTokenFromHeader(req.headers.authorization);

    // Vérifier et décoder le token
    const payload = verifyAccessToken(token);

    // Injecter les infos utilisateur dans la requête
    req.user = payload;

    // Charger le rôle utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true, isActive: true },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (!user.isActive) {
      throw new Error('Compte désactivé');
    }

    // Injecter le rôle dans la requête
    req.userRole = user.role;

    // Continuer vers le handler suivant
    next();
  } catch (error) {
    // Log de sécurité (sans exposer le token)
    console.warn("[AUTH] Tentative d'accès non autorisée:", {
      ip: req.ip,
      path: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    });

    // Réponse 401 Unauthorized
    res.status(401).json({
      error: 'Non autorisé',
      message: error instanceof Error ? error.message : 'Token invalide',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Middleware optionnel d'authentification
 *
 * Tente d'extraire et vérifier le token JWT
 * Si présent et valide, ajoute req.user et req.userRole
 * Si absent ou invalide, continue sans erreur
 *
 * Utile pour les endpoints avec contenu public/privé mixte
 *
 * @param req - Request Express
 * @param res - Response Express
 * @param next - Next function
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const payload = verifyAccessToken(token);
    req.user = payload;

    // Charger le rôle
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true, isActive: true },
    });

    if (user && user.isActive) {
      req.userRole = user.role;
    }
  } catch (error) {
    // Ignorer les erreurs, continuer sans user
    req.user = undefined;
    req.userRole = undefined;
  }

  next();
}
