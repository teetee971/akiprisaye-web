/**
 * rbac.test.ts
 *
 * Unit tests for frontend/src/auth/rbac.ts
 *
 * Pure functions — no React, no Firebase, no mocking required.
 */

import { describe, it, expect } from 'vitest';
import {
  hasRole,
  hasPermission,
  isCreator,
  isAdmin,
  isValidRole,
  roleFromClaims,
} from '../auth/rbac';
import type { UserRole, Permission } from '../auth/rbac';

// ── hasRole ───────────────────────────────────────────────────────────────

describe('hasRole', () => {
  it('guest does not meet citoyen requirement', () => {
    expect(hasRole('guest', 'citoyen')).toBe(false);
  });

  it('citoyen meets citoyen requirement', () => {
    expect(hasRole('citoyen', 'citoyen')).toBe(true);
  });

  it('observateur meets citoyen requirement', () => {
    expect(hasRole('observateur', 'citoyen')).toBe(true);
  });

  it('creator meets creator requirement', () => {
    expect(hasRole('creator', 'creator')).toBe(true);
  });

  it('admin meets creator requirement', () => {
    expect(hasRole('admin', 'creator')).toBe(true);
  });

  it('creator does NOT meet admin requirement', () => {
    expect(hasRole('creator', 'admin')).toBe(false);
  });

  it('admin meets admin requirement', () => {
    expect(hasRole('admin', 'admin')).toBe(true);
  });

  it('any role meets guest requirement', () => {
    const roles: UserRole[] = ['guest', 'citoyen', 'observateur', 'creator', 'admin'];
    for (const role of roles) {
      expect(hasRole(role, 'guest')).toBe(true);
    }
  });
});

// ── isCreator ─────────────────────────────────────────────────────────────

describe('isCreator', () => {
  it('returns true for creator role', () => {
    expect(isCreator('creator')).toBe(true);
  });

  it('returns true for admin role (admin can access creator space)', () => {
    expect(isCreator('admin')).toBe(true);
  });

  it('returns false for guest', () => {
    expect(isCreator('guest')).toBe(false);
  });

  it('returns false for citoyen', () => {
    expect(isCreator('citoyen')).toBe(false);
  });

  it('returns false for observateur', () => {
    expect(isCreator('observateur')).toBe(false);
  });
});

// ── isAdmin ───────────────────────────────────────────────────────────────

describe('isAdmin', () => {
  it('returns true for admin role', () => {
    expect(isAdmin('admin')).toBe(true);
  });

  it('returns false for creator role', () => {
    expect(isAdmin('creator')).toBe(false);
  });

  it('returns false for guest, citoyen, observateur', () => {
    expect(isAdmin('guest')).toBe(false);
    expect(isAdmin('citoyen')).toBe(false);
    expect(isAdmin('observateur')).toBe(false);
  });
});

// ── hasPermission ─────────────────────────────────────────────────────────

describe('hasPermission', () => {
  it('guest has no permissions', () => {
    const permissions: Permission[] = ['write:prices', 'read:creator-space', 'read:admin-space'];
    for (const perm of permissions) {
      expect(hasPermission('guest', perm)).toBe(false);
    }
  });

  it('citoyen can write prices and alerts', () => {
    expect(hasPermission('citoyen', 'write:prices')).toBe(true);
    expect(hasPermission('citoyen', 'write:alerts')).toBe(true);
    expect(hasPermission('citoyen', 'read:creator-space')).toBe(false);
  });

  it('creator can access creator space and analytics', () => {
    expect(hasPermission('creator', 'read:creator-space')).toBe(true);
    expect(hasPermission('creator', 'read:analytics')).toBe(true);
    expect(hasPermission('creator', 'read:admin-space')).toBe(false);
  });

  it('admin can access both creator and admin spaces', () => {
    expect(hasPermission('admin', 'read:creator-space')).toBe(true);
    expect(hasPermission('admin', 'read:admin-space')).toBe(true);
    expect(hasPermission('admin', 'read:analytics')).toBe(true);
  });
});

// ── isValidRole ───────────────────────────────────────────────────────────

describe('isValidRole', () => {
  it('accepts all valid roles', () => {
    const valid: string[] = ['guest', 'citoyen', 'observateur', 'creator', 'admin'];
    for (const r of valid) {
      expect(isValidRole(r)).toBe(true);
    }
  });

  it('rejects invalid roles', () => {
    expect(isValidRole('superuser')).toBe(false);
    expect(isValidRole('')).toBe(false);
    expect(isValidRole('user')).toBe(false);
  });
});

// ── roleFromClaims ────────────────────────────────────────────────────────

describe('roleFromClaims', () => {
  it('uses claims.role when valid', () => {
    expect(roleFromClaims({ role: 'creator' })).toBe('creator');
    expect(roleFromClaims({ role: 'admin' })).toBe('admin');
  });

  it('ignores claims.role when invalid, falls back to boolean flags', () => {
    expect(roleFromClaims({ role: 'superuser', admin: true })).toBe('admin');
    expect(roleFromClaims({ role: 'superuser', creator: true })).toBe('creator');
  });

  it('uses admin:true when no role claim', () => {
    expect(roleFromClaims({ admin: true })).toBe('admin');
  });

  it('uses creator:true when no role claim', () => {
    expect(roleFromClaims({ creator: true })).toBe('creator');
  });

  it('returns default role when no relevant claims', () => {
    expect(roleFromClaims({})).toBe('citoyen');
    expect(roleFromClaims({ someOtherClaim: true })).toBe('citoyen');
  });

  it('admin flag takes priority over creator flag', () => {
    expect(roleFromClaims({ admin: true, creator: true })).toBe('admin');
  });

  it('respects custom default role', () => {
    expect(roleFromClaims({}, 'guest')).toBe('guest');
    expect(roleFromClaims({}, 'observateur')).toBe('observateur');
  });

  it('handles empty claims gracefully', () => {
    expect(() => roleFromClaims({})).not.toThrow();
    expect(roleFromClaims({})).toBe('citoyen');
  });
});
