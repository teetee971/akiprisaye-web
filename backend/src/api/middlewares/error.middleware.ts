/**
 * Middleware de gestion centralisée des erreurs
 *
 * Capture toutes les erreurs non gérées dans l'application
 * Formatage uniforme des réponses d'erreur
 * Logs sécurisés (pas de données sensibles)
 *
 * Conformité RGPD: Pas d'exposition de données sensibles dans les erreurs
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Interface pour les erreurs applicatives
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de gestion des erreurs
 *
 * Formats d'erreur supportés:
 * - AppError (erreurs applicatives)
 * - ZodError (erreurs de validation)
 * - Error standard (erreurs inattendues)
 *
 * @param err - Erreur capturée
 * @param req - Request Express
 * @param res - Response Express
 * @param _next - Next function (non utilisée mais requise par Express)
 */
// eslint-disable-next-line no-unused-vars
export function errorMiddleware(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Log de l'erreur (serveur uniquement)
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    error: err.message,
    stack: nodeEnv === 'development' ? err.stack : undefined,
  });

  // Gestion des erreurs Zod (validation)
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Erreur de validation',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Gestion des erreurs applicatives
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      timestamp: new Date().toISOString(),
      ...(nodeEnv === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Erreurs Prisma (base de données)
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;

    // Violation de contrainte unique
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        error: 'Conflit',
        message: 'Cette ressource existe déjà',
        field: prismaError.meta?.target?.[0],
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Ressource non trouvée
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        error: 'Non trouvé',
        message: 'Ressource non trouvée',
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }

  // Erreur générique (500 Internal Server Error)
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message:
      nodeEnv === 'development'
        ? err.message
        : 'Une erreur est survenue',
    timestamp: new Date().toISOString(),
    ...(nodeEnv === 'development' && { stack: err.stack }),
  });
}

/**
 * Middleware pour les routes non trouvées (404)
 *
 * @param req - Request Express
 * @param res - Response Express
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
}
