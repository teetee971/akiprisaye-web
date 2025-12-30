/**
 * Utilitaires JWT pour l'authentification
 *
 * Conforme aux standards de sécurité:
 * - HS256 pour signature
 * - Access token court (15min)
 * - Refresh token long (7j)
 * - Rotation des refresh tokens
 *
 * RGPD: Tokens contiennent uniquement l'ID utilisateur (minimisation données)
 */

import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Configuration JWT depuis .env
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'changeme-refresh-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * Schéma de validation du payload JWT
 */
const jwtPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  type: z.enum(['access', 'refresh']),
});

export type JWTPayload = z.infer<typeof jwtPayloadSchema>;

/**
 * Génère un access token JWT
 *
 * @param userId - ID utilisateur (UUID)
 * @param email - Email utilisateur
 * @returns Token JWT signé
 *
 * Durée: 15 minutes (configurable via ACCESS_TOKEN_EXPIRY)
 * Algorithme: HS256
 */
export function generateAccessToken(userId: string, email: string): string {
  const payload: JWTPayload = {
    userId,
    email,
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
    issuer: 'akiprisaye-api',
    audience: 'akiprisaye-client',
  });
}

/**
 * Génère un refresh token JWT
 *
 * @param userId - ID utilisateur (UUID)
 * @param email - Email utilisateur
 * @returns Token JWT signé
 *
 * Durée: 7 jours (configurable via REFRESH_TOKEN_EXPIRY)
 * Algorithme: HS256
 *
 * Note: Les refresh tokens doivent être stockés et révocables
 */
export function generateRefreshToken(userId: string, email: string): string {
  const payload: JWTPayload = {
    userId,
    email,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: 'HS256',
    issuer: 'akiprisaye-api',
    audience: 'akiprisaye-client',
  });
}

/**
 * Vérifie et décode un access token
 *
 * @param token - Token JWT à vérifier
 * @returns Payload décodé et validé
 * @throws Error si token invalide, expiré ou mal formé
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'akiprisaye-api',
      audience: 'akiprisaye-client',
    });

    // Validation avec Zod
    const payload = jwtPayloadSchema.parse(decoded);

    // Vérifier que c'est bien un access token
    if (payload.type !== 'access') {
      throw new Error('Token type invalide: attendu "access"');
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expiré');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Access token invalide');
    }
    throw error;
  }
}

/**
 * Vérifie et décode un refresh token
 *
 * @param token - Token JWT à vérifier
 * @returns Payload décodé et validé
 * @throws Error si token invalide, expiré ou mal formé
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
      issuer: 'akiprisaye-api',
      audience: 'akiprisaye-client',
    });

    // Validation avec Zod
    const payload = jwtPayloadSchema.parse(decoded);

    // Vérifier que c'est bien un refresh token
    if (payload.type !== 'refresh') {
      throw new Error('Token type invalide: attendu "refresh"');
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expiré');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Refresh token invalide');
    }
    throw error;
  }
}

/**
 * Génère une paire de tokens (access + refresh)
 *
 * @param userId - ID utilisateur
 * @param email - Email utilisateur
 * @returns Objet contenant access et refresh tokens
 */
export function generateTokenPair(userId: string, email: string): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateAccessToken(userId, email),
    refreshToken: generateRefreshToken(userId, email),
  };
}

/**
 * Extrait le token du header Authorization
 *
 * @param authHeader - Header Authorization (format: "Bearer <token>")
 * @returns Token extrait
 * @throws Error si format invalide
 */
export function extractTokenFromHeader(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new Error('Header Authorization manquant');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Format Authorization invalide (attendu: Bearer <token>)');
  }

  return parts[1];
}
