/**
 * Définition des rôles et permissions - Sprint 3
 *
 * Système RBAC (Role-Based Access Control) complet
 * Conforme aux exigences institutionnelles
 *
 * Hiérarchie des rôles:
 * USER < ANALYSTE < ENSEIGNE < INSTITUTION < SUPER_ADMIN
 */

/**
 * Énumération des permissions disponibles
 *
 * Chaque permission contrôle l'accès à une fonctionnalité spécifique
 */
export enum Permission {
  // Legal Entities
  LEGAL_ENTITY_CREATE = 'LEGAL_ENTITY_CREATE',
  LEGAL_ENTITY_READ = 'LEGAL_ENTITY_READ',
  LEGAL_ENTITY_UPDATE = 'LEGAL_ENTITY_UPDATE',
  LEGAL_ENTITY_DELETE = 'LEGAL_ENTITY_DELETE',

  // Audit
  AUDIT_READ = 'AUDIT_READ',

  // Administration
  ADMIN_MANAGE_USERS = 'ADMIN_MANAGE_USERS',
  ADMIN_MANAGE_ROLES = 'ADMIN_MANAGE_ROLES',
  ADMIN_VIEW_STATS = 'ADMIN_VIEW_STATS',

  // Marketplace - Sprint 4
  // Brands (Enseignes)
  BRAND_CREATE = 'BRAND_CREATE',
  BRAND_READ = 'BRAND_READ',
  BRAND_UPDATE = 'BRAND_UPDATE',
  BRAND_APPROVE = 'BRAND_APPROVE', // INSTITUTION/SUPER_ADMIN uniquement
  BRAND_SUSPEND = 'BRAND_SUSPEND', // INSTITUTION/SUPER_ADMIN uniquement

  // Stores (Magasins)
  STORE_CREATE = 'STORE_CREATE',
  STORE_READ = 'STORE_READ',
  STORE_UPDATE = 'STORE_UPDATE',
  STORE_DELETE = 'STORE_DELETE',

  // Products (Produits)
  PRODUCT_CREATE = 'PRODUCT_CREATE',
  PRODUCT_READ = 'PRODUCT_READ',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',

  // Prices (Prix)
  PRICE_CREATE = 'PRICE_CREATE',
  PRICE_READ = 'PRICE_READ',
  PRICE_UPDATE = 'PRICE_UPDATE',

  // Predictions (Prédictions IA)
  PREDICTION_VIEW = 'PREDICTION_VIEW',
  PREDICTION_GENERATE = 'PREDICTION_GENERATE', // INSTITUTION/SUPER_ADMIN

  // Subscriptions (Abonnements)
  SUBSCRIPTION_CREATE = 'SUBSCRIPTION_CREATE',
  SUBSCRIPTION_READ = 'SUBSCRIPTION_READ',
  SUBSCRIPTION_MANAGE = 'SUBSCRIPTION_MANAGE',

  // Quotes (Devis)
  QUOTE_REQUEST = 'QUOTE_REQUEST',
  QUOTE_VIEW = 'QUOTE_VIEW',
  QUOTE_GENERATE = 'QUOTE_GENERATE', // INSTITUTION/SUPER_ADMIN
  QUOTE_APPROVE = 'QUOTE_APPROVE', // INSTITUTION/SUPER_ADMIN
}

/**
 * Type pour les rôles (correspond à l'enum Prisma)
 */
export type UserRole =
  | 'USER'
  | 'ANALYSTE'
  | 'ENSEIGNE'
  | 'INSTITUTION'
  | 'SUPER_ADMIN';

/**
 * Mapping des rôles vers leurs permissions
 *
 * RÈGLES:
 * - USER: Lecture seule des entités + marketplace
 * - ANALYSTE: Lecture + audit + statistiques + prédictions
 * - ENSEIGNE: Gestion entités + brands + produits/prix
 * - INSTITUTION: Gestion multi-enseignes + validation + prédictions IA
 * - SUPER_ADMIN: Tous les pouvoirs (administration complète)
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  /**
   * USER - Utilisateur standard
   * - Consultation des entités juridiques
   * - Consultation marketplace (brands, stores, products, prices)
   * - Vue des prédictions
   */
  USER: [
    Permission.LEGAL_ENTITY_READ,
    Permission.BRAND_READ,
    Permission.STORE_READ,
    Permission.PRODUCT_READ,
    Permission.PRICE_READ,
    Permission.PREDICTION_VIEW,
  ],

  /**
   * ANALYSTE - Analyste de données
   * - Lecture complète
   * - Consultation des logs d'audit
   * - Accès aux statistiques
   * - Vue des prédictions
   */
  ANALYSTE: [
    Permission.LEGAL_ENTITY_READ,
    Permission.AUDIT_READ,
    Permission.ADMIN_VIEW_STATS,
    Permission.BRAND_READ,
    Permission.STORE_READ,
    Permission.PRODUCT_READ,
    Permission.PRICE_READ,
    Permission.PREDICTION_VIEW,
    Permission.SUBSCRIPTION_READ,
  ],

  /**
   * ENSEIGNE - Gestionnaire d'enseigne
   * - CRUD complet sur les entités juridiques
   * - Création et gestion de sa propre enseigne (brand)
   * - Gestion stores, produits, prix
   * - Gestion abonnements
   * - Demande devis
   */
  ENSEIGNE: [
    Permission.LEGAL_ENTITY_CREATE,
    Permission.LEGAL_ENTITY_READ,
    Permission.LEGAL_ENTITY_UPDATE,
    Permission.LEGAL_ENTITY_DELETE,
    Permission.AUDIT_READ,
    Permission.BRAND_CREATE,
    Permission.BRAND_READ,
    Permission.BRAND_UPDATE,
    Permission.STORE_CREATE,
    Permission.STORE_READ,
    Permission.STORE_UPDATE,
    Permission.STORE_DELETE,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.PRICE_CREATE,
    Permission.PRICE_READ,
    Permission.PRICE_UPDATE,
    Permission.PREDICTION_VIEW,
    Permission.SUBSCRIPTION_CREATE,
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_MANAGE,
    Permission.QUOTE_REQUEST,
    Permission.QUOTE_VIEW,
  ],

  /**
   * INSTITUTION - Gestionnaire institutionnel
   * - Toutes les permissions ENSEIGNE
   * - Validation des enseignes (BRAND_APPROVE)
   * - Suspension des enseignes
   * - Génération prédictions IA
   * - Génération devis
   * - Statistiques avancées
   */
  INSTITUTION: [
    Permission.LEGAL_ENTITY_CREATE,
    Permission.LEGAL_ENTITY_READ,
    Permission.LEGAL_ENTITY_UPDATE,
    Permission.LEGAL_ENTITY_DELETE,
    Permission.AUDIT_READ,
    Permission.ADMIN_VIEW_STATS,
    Permission.BRAND_CREATE,
    Permission.BRAND_READ,
    Permission.BRAND_UPDATE,
    Permission.BRAND_APPROVE,
    Permission.BRAND_SUSPEND,
    Permission.STORE_CREATE,
    Permission.STORE_READ,
    Permission.STORE_UPDATE,
    Permission.STORE_DELETE,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.PRICE_CREATE,
    Permission.PRICE_READ,
    Permission.PRICE_UPDATE,
    Permission.PREDICTION_VIEW,
    Permission.PREDICTION_GENERATE,
    Permission.SUBSCRIPTION_CREATE,
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_MANAGE,
    Permission.QUOTE_REQUEST,
    Permission.QUOTE_VIEW,
    Permission.QUOTE_GENERATE,
    Permission.QUOTE_APPROVE,
  ],

  /**
   * SUPER_ADMIN - Super administrateur
   * - Toutes les permissions
   * - Gestion des utilisateurs
   * - Gestion des rôles
   * - Accès complet au système
   */
  SUPER_ADMIN: [
    Permission.LEGAL_ENTITY_CREATE,
    Permission.LEGAL_ENTITY_READ,
    Permission.LEGAL_ENTITY_UPDATE,
    Permission.LEGAL_ENTITY_DELETE,
    Permission.AUDIT_READ,
    Permission.ADMIN_MANAGE_USERS,
    Permission.ADMIN_MANAGE_ROLES,
    Permission.ADMIN_VIEW_STATS,
    Permission.BRAND_CREATE,
    Permission.BRAND_READ,
    Permission.BRAND_UPDATE,
    Permission.BRAND_APPROVE,
    Permission.BRAND_SUSPEND,
    Permission.STORE_CREATE,
    Permission.STORE_READ,
    Permission.STORE_UPDATE,
    Permission.STORE_DELETE,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.PRICE_CREATE,
    Permission.PRICE_READ,
    Permission.PRICE_UPDATE,
    Permission.PREDICTION_VIEW,
    Permission.PREDICTION_GENERATE,
    Permission.SUBSCRIPTION_CREATE,
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_MANAGE,
    Permission.QUOTE_REQUEST,
    Permission.QUOTE_VIEW,
    Permission.QUOTE_GENERATE,
    Permission.QUOTE_APPROVE,
  ],
};

/**
 * Vérifie si un rôle possède une permission donnée
 *
 * @param role - Rôle à vérifier
 * @param permission - Permission requise
 * @returns true si le rôle possède la permission
 */
export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Vérifie si un rôle possède toutes les permissions données
 *
 * @param role - Rôle à vérifier
 * @param requiredPermissions - Liste des permissions requises
 * @returns true si le rôle possède toutes les permissions
 */
export function hasAllPermissions(
  role: UserRole,
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every((permission) =>
    hasPermission(role, permission)
  );
}

/**
 * Vérifie si un rôle possède au moins une des permissions données
 *
 * @param role - Rôle à vérifier
 * @param requiredPermissions - Liste des permissions (OR)
 * @returns true si le rôle possède au moins une permission
 */
export function hasAnyPermission(
  role: UserRole,
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some((permission) =>
    hasPermission(role, permission)
  );
}

/**
 * Récupère toutes les permissions d'un rôle
 *
 * @param role - Rôle
 * @returns Liste des permissions
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Vérifie si un rôle est de niveau admin
 *
 * @param role - Rôle à vérifier
 * @returns true si admin (INSTITUTION ou SUPER_ADMIN)
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'INSTITUTION' || role === 'SUPER_ADMIN';
}

/**
 * Vérifie si un rôle est super admin
 *
 * @param role - Rôle à vérifier
 * @returns true si SUPER_ADMIN
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN';
}

/**
 * Liste des rôles par ordre hiérarchique
 */
export const ROLE_HIERARCHY: UserRole[] = [
  'USER',
  'ANALYSTE',
  'ENSEIGNE',
  'INSTITUTION',
  'SUPER_ADMIN',
];

/**
 * Récupère le niveau hiérarchique d'un rôle
 *
 * @param role - Rôle
 * @returns Niveau (0 = USER, 4 = SUPER_ADMIN)
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

/**
 * Vérifie si un rôle est supérieur ou égal à un autre
 *
 * @param role - Rôle à vérifier
 * @param minimumRole - Rôle minimum requis
 * @returns true si role >= minimumRole
 */
export function hasRoleLevel(
  role: UserRole,
  minimumRole: UserRole
): boolean {
  return getRoleLevel(role) >= getRoleLevel(minimumRole);
}
