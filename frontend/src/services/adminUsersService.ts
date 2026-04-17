/**
 * adminUsersService.ts
 *
 * Typed wrappers around the Firebase callable functions deployed in functions/src/index.ts.
 * Provides a clean API for the admin panel to search users and change roles.
 *
 * The underlying callable functions require the caller to have the "admin" role
 * (verified server-side via Firebase custom claims).
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase';

export type AppRole = 'citoyen' | 'observateur' | 'creator' | 'admin';

export interface AdminUserResult {
  uid: string;
  email: string | null;
  displayName: string | null;
  disabled: boolean;
  /** Role effectif = claimRole ?? firestoreRole ?? "citoyen" */
  role: AppRole;
  /** Rôle stocké dans Firestore users/{uid}.role */
  firestoreRole: AppRole | null;
  /** Rôle dans les Firebase custom claims du token ID */
  claimRole: AppRole | null;
}

export interface SetUserRoleResponse {
  ok: boolean;
  uid: string;
  oldRole: AppRole;
  newRole: AppRole;
}

const functions = getFunctions(app ?? undefined);

/**
 * Recherche un utilisateur Firebase par email ou UID.
 * Retourne les infos utilisateur et ses rôles (claims + Firestore).
 * Lève une erreur si l'utilisateur est introuvable ou si l'appelant n'est pas admin.
 */
export async function findUserAdmin(query: string): Promise<AdminUserResult> {
  const fn = httpsCallable<{ query: string }, AdminUserResult>(functions, 'findUser');
  const res = await fn({ query: query.trim() });
  return res.data;
}

/**
 * Change le rôle d'un utilisateur Firebase :
 *   - Met à jour les custom claims (token ID, effective au prochain refresh)
 *   - Synchronise Firestore users/{uid}.role
 *   - Crée une entrée auditLogs
 *
 * Lève une erreur si l'utilisateur est introuvable ou si l'appelant n'est pas admin.
 */
export async function setUserRoleAdmin(uid: string, role: AppRole): Promise<SetUserRoleResponse> {
  const fn = httpsCallable<{ uid: string; role: AppRole }, SetUserRoleResponse>(
    functions,
    'setUserRole'
  );
  const res = await fn({ uid, role });
  return res.data;
}
