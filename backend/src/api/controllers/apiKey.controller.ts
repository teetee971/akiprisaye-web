/**
 * Contrôleur de gestion des API Keys
 * 
 * Endpoints:
 * - GET /api/api-keys - Liste des clés
 * - POST /api/api-keys - Créer une clé
 * - DELETE /api/api-keys/:id - Révoquer une clé
 * - GET /api/api-keys/:id/usage - Statistiques d'usage
 * 
 * Sécurité: Requiert authentification JWT (pas d'API Key)
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, ApiPermission } from '@prisma/client';
import { ApiKeyService } from '../../services/api/ApiKeyService.js';

const prisma = new PrismaClient();
const apiKeyService = new ApiKeyService(prisma);

/**
 * Schéma de validation pour création d'API Key
 */
const createApiKeySchema = z.object({
  name: z.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  permissions: z.array(z.nativeEnum(ApiPermission)).optional(),
  expiresIn: z.number()
    .int()
    .positive()
    .max(365)
    .optional()
    .describe('Durée de validité en jours (max 365)'),
});

/**
 * GET /api/api-keys
 * 
 * Liste toutes les API keys de l'utilisateur
 */
export async function listApiKeys(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentification requise' });
      return;
    }

    const apiKeys = await apiKeyService.listApiKeys(req.user.userId);

    res.status(200).json({
      message: 'Liste des clés API',
      data: apiKeys,
      count: apiKeys.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/api-keys
 * 
 * Crée une nouvelle API key
 * Retourne la clé secrète (affichée une seule fois)
 */
export async function createApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentification requise' });
      return;
    }

    // Validation
    const { name, permissions, expiresIn } = createApiKeySchema.parse(req.body);

    // Créer la clé
    const apiKey = await apiKeyService.generateApiKey(
      req.user.userId,
      name,
      permissions,
      expiresIn
    );

    res.status(201).json({
      message: 'Clé API créée avec succès',
      data: apiKey,
      warning: 'Copiez cette clé maintenant, elle ne sera plus affichée',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/api-keys/:id
 * 
 * Révoque une API key
 */
export async function revokeApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentification requise' });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID de clé requis' });
      return;
    }

    await apiKeyService.revokeApiKey(id, req.user.userId);

    res.status(200).json({
      message: 'Clé API révoquée avec succès',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/api-keys/:id/usage
 * 
 * Récupère les statistiques d'usage d'une clé
 */
export async function getApiKeyUsage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentification requise' });
      return;
    }

    const { id } = req.params;
    const { period = 'day' } = req.query;

    if (!id) {
      res.status(400).json({ error: 'ID de clé requis' });
      return;
    }

    // Valider la période
    if (!['day', 'week', 'month'].includes(period as string)) {
      res.status(400).json({ 
        error: 'Période invalide',
        validPeriods: ['day', 'week', 'month'],
      });
      return;
    }

    // Vérifier que la clé appartient à l'utilisateur
    const apiKeys = await apiKeyService.listApiKeys(req.user.userId);
    const apiKey = apiKeys.find(k => k.id === id);

    if (!apiKey) {
      res.status(404).json({ 
        error: 'Clé API non trouvée ou vous n\'avez pas les droits',
      });
      return;
    }

    // Récupérer les statistiques
    const stats = await apiKeyService.getUsageStats(
      id, 
      period as 'day' | 'week' | 'month'
    );

    res.status(200).json({
      message: 'Statistiques d\'usage',
      data: stats,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        status: apiKey.status,
      },
    });
  } catch (error) {
    next(error);
  }
}
