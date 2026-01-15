/**
 * Middleware d'audit automatique - Sprint 3
 *
 * Génère automatiquement des logs d'audit pour toutes les actions sensibles
 * Journalise les accès réussis, échoués et refusés
 *
 * Conformité RGPD Art. 30
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient, AuditResult, UserRole } from '@prisma/client';
import { AuditService } from './audit.service.js';

const prisma = new PrismaClient();
const auditService = new AuditService(prisma);

/**
 * Middleware d'audit pour les actions sur les ressources
 *
 * Génère un log d'audit après l'exécution du handler
 * Capture le résultat (succès/échec) et les détails
 *
 * @param action - Action effectuée (ex: CREATE_LEGAL_ENTITY)
 * @param entity - Type d'entité (ex: LegalEntity)
 * @returns Middleware Express
 */
export function auditAction(action: string, entity?: string) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Capturer la méthode originale res.json pour intercepter la réponse
    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      // Générer le log d'audit de manière asynchrone (ne pas bloquer la réponse)
      setImmediate(async () => {
        try {
          const userId = req.user?.userId || 'anonymous';
          const userRole = (req.userRole as UserRole) || 'USER';

          // Déterminer le résultat basé sur le code de statut
          let result: AuditResult = 'SUCCESS';
          if (res.statusCode >= 400 && res.statusCode < 500) {
            result = 'DENIED';
          } else if (res.statusCode >= 500) {
            result = 'FAILURE';
          }

          // Extraire l'entityId si présent
          let entityId: string | undefined;
          if (body?.data?.id) {
            entityId = body.data.id;
          } else if (req.params?.id) {
            entityId = req.params.id;
          }

          // Créer le log d'audit
          await auditService.create({
            userId,
            userRole,
            action,
            entity,
            entityId,
            result,
            message:
              result !== 'SUCCESS'
                ? body?.error || body?.message
                : undefined,
            ip: req.ip,
            userAgent: req.get('user-agent'),
          });
        } catch (error) {
          // Ne pas échouer la requête si l'audit échoue
          console.error('[AUDIT] Erreur lors de la création du log:', error);
        }
      });

      // Retourner la réponse normale
      return originalJson(body);
    };

    next();
  };
}

/**
 * Middleware d'audit pour les erreurs
 *
 * Journalise les accès refusés (403) et les erreurs (500)
 *
 * @param req - Request Express
 * @param res - Response Express
 * @param next - Next function
 */
export async function auditErrorMiddleware(
  err: Error,
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  // Générer un log d'audit pour l'erreur
  try {
    const userId = req.user?.userId || 'anonymous';
    const userRole = (req.userRole as UserRole) || 'USER';

    await auditService.create({
      userId,
      userRole,
      action: `ERROR_${req.method}_${req.path}`,
      entity: undefined,
      entityId: undefined,
      result: 'FAILURE',
      message: err.message,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  } catch (auditError) {
    console.error('[AUDIT] Erreur lors de la journalisation:', auditError);
  }

  // Passer au gestionnaire d'erreurs suivant
  next(err);
}

/**
 * Middleware d'audit pour les tentatives d'accès refusées
 *
 * À utiliser après les middlewares d'autorisation
 */
export async function auditAccessDenied(
  req: Request,
  _res: Response
): Promise<void> {
  try {
    const userId = req.user?.userId || 'anonymous';
    const userRole = (req.userRole as UserRole) || 'USER';

    await auditService.create({
      userId,
      userRole,
      action: `ACCESS_DENIED_${req.method}_${req.path}`,
      entity: undefined,
      entityId: undefined,
      result: 'DENIED',
      message: `Accès refusé à ${req.method} ${req.path}`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  } catch (error) {
    console.error('[AUDIT] Erreur lors de la journalisation:', error);
  }
}

/**
 * Middleware d'audit pour les connexions
 *
 * Journalise les tentatives de connexion (succès et échecs)
 */
export function auditLogin() {
  return auditAction('LOGIN', 'User');
}

/**
 * Middleware d'audit pour les déconnexions
 */
export function auditLogout() {
  return auditAction('LOGOUT', 'User');
}
