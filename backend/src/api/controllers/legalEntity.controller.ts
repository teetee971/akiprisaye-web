/**
 * Contrôleur LegalEntity
 *
 * Endpoints CRUD pour les entités juridiques
 * - POST /api/legal-entities - Créer
 * - GET /api/legal-entities - Lister (avec pagination)
 * - GET /api/legal-entities/:id - Détails
 * - PUT /api/legal-entities/:id - Modifier
 * - DELETE /api/legal-entities/:id - Supprimer
 * - GET /api/legal-entities/stats - Statistiques
 *
 * Sécurité: Tous les endpoints protégés par JWT (authMiddleware)
 * Validation: Zod avec schémas SIREN/SIRET
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { LegalEntityService } from '../../services/company/LegalEntityService.js';
import {
  createLegalEntitySchema,
  updateLegalEntitySchema,
} from '@validators/legalEntitySchemas';

const prisma = new PrismaClient();
const legalEntityService = new LegalEntityService(prisma);

/**
 * Schéma de validation pour recherche/listing
 */
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  siren: z.string().optional(),
  siret: z.string().optional(),
  name: z.string().optional(),
  status: z.enum(['ACTIVE', 'CEASED']).optional(),
});

/**
 * POST /api/legal-entities
 *
 * Crée une nouvelle entité juridique
 *
 * Body: { siren, siret, name, status? }
 * Returns: LegalEntity créée
 */
export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validation avec schéma Zod (inclut validation SIREN/SIRET)
    const data = createLegalEntitySchema.parse(req.body);

    // Création
    const entity = await legalEntityService.create(data);

    res.status(201).json({
      message: 'Entité juridique créée avec succès',
      data: entity,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/legal-entities
 *
 * Liste les entités juridiques avec pagination et filtres
 *
 * Query params: ?page=1&limit=20&siren=...&siret=...&name=...&status=ACTIVE
 * Returns: { data: LegalEntity[], pagination: {...} }
 */
export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validation des query params
    const query = listQuerySchema.parse(req.query);

    // Calcul pagination
    const skip = (query.page - 1) * query.limit;

    // Recherche avec critères
    const entities = await legalEntityService.search({
      siren: query.siren,
      siret: query.siret,
      name: query.name,
      status: query.status as any,
    });

    // Pagination
    const total = entities.length;
    const paginatedEntities = entities.slice(skip, skip + query.limit);

    res.status(200).json({
      data: paginatedEntities,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/legal-entities/:id
 *
 * Récupère les détails d'une entité juridique
 *
 * Params: id (UUID)
 * Returns: LegalEntity
 */
export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const entity = await legalEntityService.findById(id);

    if (!entity) {
      res.status(404).json({
        error: 'Non trouvé',
        message: 'Entité juridique non trouvée',
      });
      return;
    }

    res.status(200).json({
      data: entity,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/legal-entities/:id
 *
 * Met à jour une entité juridique
 *
 * Params: id (UUID)
 * Body: { siren?, siret?, name?, status? }
 * Returns: LegalEntity mise à jour
 */
export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Validation
    const data = updateLegalEntitySchema.parse(req.body);

    // Mise à jour
    const entity = await legalEntityService.update(id, data);

    res.status(200).json({
      message: 'Entité juridique mise à jour avec succès',
      data: entity,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/legal-entities/:id
 *
 * Supprime une entité juridique
 *
 * Params: id (UUID)
 * Returns: { message }
 */
export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    await legalEntityService.delete(id);

    res.status(200).json({
      message: 'Entité juridique supprimée avec succès',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/legal-entities/stats
 *
 * Récupère les statistiques des entités juridiques
 *
 * Returns: { total, active, ceased }
 */
export async function getStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await legalEntityService.getStatistics();

    res.status(200).json({
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
