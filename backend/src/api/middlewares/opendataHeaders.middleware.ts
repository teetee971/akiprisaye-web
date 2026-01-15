/**
 * Middleware pour ajouter les headers obligatoires Open Data
 * 
 * Conformité:
 * - Licence Etalab 2.0
 * - Disclaimer légal
 * - Cache-Control pour optimisation
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Ajoute les headers obligatoires pour les réponses Open Data
 */
export function opendataHeaders(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  // Licence Open Data
  res.setHeader('X-Data-License', 'Etalab-2.0');

  // Disclaimer légal
  res.setHeader(
    'X-Disclaimer',
    'Données statistiques sans qualification juridique',
  );

  // Cache-Control - cache pendant 1 heure (données mises à jour quotidiennement)
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  // Content-Type JSON par défaut
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  next();
}
