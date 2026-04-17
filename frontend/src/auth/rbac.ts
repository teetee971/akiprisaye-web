/**
 * rbac.ts
 *
 * Centralized RBAC (Role-Based Access Control) helpers.
 * No React, no Firebase — pure functions, fully testable.
 *
 * Role hierarchy (ascending privilege):
 *   guest < citoyen < observateur < creator < admin
 */

/* ── Types ──────────────────────────────────────────────────────────────── */

export type UserRole = 'guest' | 'citoyen' | 'observateur' | 'creator' | 'admin';

export type Permission =
  | 'read:creator-space'
  | 'read:admin-space'
  | 'write:prices'
  | 'write:alerts'
  | 'read:analytics';

/* ── Role hierarchy ─────────────────────────────────────────────────────── */

const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  citoyen: 1,
  observateur: 2,
  creator: 3,
  admin: 4,
};

/* ── Permission matrix ──────────────────────────────────────────────────── */

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  guest: [],
  citoyen: ['write:prices', 'write:alerts'],
  observateur: ['write:prices', 'write:alerts'],
  creator: ['write:prices', 'write:alerts', 'read:creator-space', 'read:analytics'],
  admin: [
    'write:prices',
    'write:alerts',
    'read:creator-space',
    'read:admin-space',
    'read:analytics',
  ],
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

/**
 * Returns true when `userRole` is at least as privileged as `required`.
 */
export function hasRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

/**
 * Returns true when the user has the given fine-grained permission.
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

/**
 * Returns true when the user is a creator or admin (both can access creator space).
 */
export function isCreator(userRole: UserRole): boolean {
  return userRole === 'creator' || userRole === 'admin';
}

/**
 * Returns true when the user has admin-level privileges.
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin';
}

/**
 * Validates whether a given string is a known UserRole.
 */
export function isValidRole(role: string): role is UserRole {
  return role in ROLE_HIERARCHY;
}

/**
 * Resolves a UserRole from Firebase custom claims object.
 * Priority: claims.role > creator/admin boolean flags > default.
 */
export function roleFromClaims(
  claims: Record<string, unknown>,
  defaultRole: UserRole = 'citoyen'
): UserRole {
  const claimRole = claims?.role;
  if (typeof claimRole === 'string' && isValidRole(claimRole)) {
    return claimRole;
  }
  if (claims?.admin === true) return 'admin';
  if (claims?.creator === true) return 'creator';
  return defaultRole;
}
