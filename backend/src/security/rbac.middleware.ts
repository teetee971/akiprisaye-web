/**
 * Middleware RBAC (Role-Based Access Control) - Sprint 3
 *
 * Contrôle d'accès basé sur les permissions
 * Réponses 403 explicites en cas de refus
 *
 * Utilisation:
 * ```typescript
 * router.get('/admin/users', authMiddleware, requirePermission(Permission.ADMIN_MANAGE_USERS), controller)
 * router.get('/stats', authMiddleware, requireRole('ANALYSTE'), controller)
 * ```
 */

import { Request, Response, NextFunction } from 'express';
import {
  Permission,
  UserRole,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasRoleLevel,
} from './permissions.js';

/**
 * Middleware: Requiert une permission spécifique
 *
 * Vérifie que l'utilisateur connecté possède la permission requise
 * Retourne 403 Forbidden si la permission est manquante
 *
 * @param permission - Permission requise
 * @returns Middleware Express
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      res.status(401).json({
        error: 'Non autorisé',
        message: 'Authentification requise',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const userRole = req.user.email.includes('@')
      ? ((req as any).userRole as UserRole)
      : undefined;

    // Récupérer le rôle depuis la base si nécessaire
    // Pour simplifier, on suppose que le rôle est dans req.user via un middleware enrichi
    const role: UserRole = userRole || 'USER';

    // Vérifier la permission
    if (!hasPermission(role, permission)) {
      // Log de sécurité
      console.warn('[RBAC] Accès refusé:', {
        userId: req.user.userId,
        role,
        permission,
        path: req.path,
        method: req.method,
      });

      res.status(403).json({
        error: 'Accès refusé',
        message: `Permission requise: ${permission}`,
        required: permission,
        userRole: role,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Permission accordée
    next();
  };
}

/**
 * Middleware: Requiert toutes les permissions données
 *
 * @param permissions - Liste des permissions requises (AND)
 * @returns Middleware Express
 */
export function requireAllPermissions(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Non autorisé',
        message: 'Authentification requise',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const role: UserRole = ((req as any).userRole as UserRole) || 'USER';

    if (!hasAllPermissions(role, permissions)) {
      console.warn('[RBAC] Accès refusé (permissions multiples):', {
        userId: req.user.userId,
        role,
        permissions,
        path: req.path,
      });

      res.status(403).json({
        error: 'Accès refusé',
        message: 'Permissions insuffisantes',
        required: permissions,
        userRole: role,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Requiert au moins une des permissions données
 *
 * @param permissions - Liste des permissions (OR)
 * @returns Middleware Express
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Non autorisé',
        message: 'Authentification requise',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const role: UserRole = ((req as any).userRole as UserRole) || 'USER';

    if (!hasAnyPermission(role, permissions)) {
      console.warn('[RBAC] Accès refusé (aucune permission):', {
        userId: req.user.userId,
        role,
        permissions,
        path: req.path,
      });

      res.status(403).json({
        error: 'Accès refusé',
        message: 'Aucune des permissions requises',
        required: permissions,
        userRole: role,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Requiert un rôle spécifique (minimum)
 *
 * Vérifie que l'utilisateur a au moins le niveau de rôle requis
 *
 * @param minimumRole - Rôle minimum requis
 * @returns Middleware Express
 */
export function requireRole(minimumRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Non autorisé',
        message: 'Authentification requise',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const role: UserRole = ((req as any).userRole as UserRole) || 'USER';

    if (!hasRoleLevel(role, minimumRole)) {
      console.warn('[RBAC] Accès refusé (rôle insuffisant):', {
        userId: req.user.userId,
        role,
        minimumRole,
        path: req.path,
      });

      res.status(403).json({
        error: 'Accès refusé',
        message: `Rôle minimum requis: ${minimumRole}`,
        required: minimumRole,
        userRole: role,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Réservé aux super admins uniquement
 *
 * @returns Middleware Express
 */
export function requireSuperAdmin() {
  return requireRole('SUPER_ADMIN');
}
