/**
 * Contrôleur d'authentification
 *
 * Endpoints:
 * - POST /api/auth/login - Connexion
 * - POST /api/auth/refresh - Rafraîchir access token
 * - POST /api/auth/logout - Déconnexion
 * - POST /api/auth/register - Inscription (admin uniquement en production)
 *
 * Validation: Zod
 * Sécurité: Rate limiting sur login
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../../services/auth/AuthService.js';
import { passwordSchema } from '../../security/password.js';

const prisma = new PrismaClient();
const authService = new AuthService(prisma);

/**
 * Schéma de validation pour login
 */
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

/**
 * Schéma de validation pour register
 */
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: passwordSchema,
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères'),
});

/**
 * Schéma de validation pour refresh
 */
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requis'),
});

/**
 * POST /api/auth/login
 *
 * Authentifie un utilisateur avec email et mot de passe
 *
 * Body: { email, password }
 * Returns: { user, accessToken, refreshToken }
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validation des données
    const { email, password } = loginSchema.parse(req.body);

    // Authentification
    const result = await authService.login(email, password);

    res.status(200).json({
      message: 'Connexion réussie',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 *
 * Rafraîchit l'access token avec un refresh token valide
 *
 * Body: { refreshToken }
 * Returns: { accessToken, refreshToken }
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validation
    const { refreshToken } = refreshSchema.parse(req.body);

    // Rafraîchissement
    const tokens = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      message: 'Token rafraîchi',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 *
 * Déconnecte un utilisateur (révoque refresh token)
 *
 * Body: { refreshToken }
 * Returns: { message }
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validation
    const { refreshToken } = refreshSchema.parse(req.body);

    // Déconnexion
    await authService.logout(refreshToken);

    res.status(200).json({
      message: 'Déconnexion réussie',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/register
 *
 * Crée un nouvel utilisateur
 *
 * Note: En production, devrait être protégé (admin uniquement)
 *
 * Body: { email, password, name }
 * Returns: { user }
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validation
    const { email, password, name } = registerSchema.parse(req.body);

    // Création utilisateur
    const user = await authService.register(email, password, name);

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user,
    });
  } catch (error) {
    next(error);
  }
}
