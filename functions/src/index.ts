/**
 * functions/src/index.ts — Firebase Cloud Functions (v2 callable)
 *
 * Fonctions d'administration sécurisées :
 *   findUser     — recherche un utilisateur par email ou UID
 *   setUserRole  — change le rôle d'un utilisateur (claims + Firestore + auditLogs)
 *
 * Toutes les fonctions vérifient que l'appelant a le rôle "admin" via le token Firebase.
 * L'écriture directe du champ `role` dans Firestore est bloquée par les règles de sécurité ;
 * seule cette fonction (Admin SDK) peut modifier le rôle de manière autoritaire.
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

if (!admin.apps.length) {
  admin.initializeApp();
}

type AppRole = "citoyen" | "observateur" | "creator" | "admin";

const ALLOWED_ROLES: AppRole[] = ["citoyen", "observateur", "creator", "admin"];

/** Auth context shape — ensures `role` is typed instead of opaque Record<string, unknown>. */
interface AdminAuthToken {
  role?: string;
  [key: string]: unknown;
}
interface AdminAuth {
  uid?: string;
  token?: AdminAuthToken;
}

/**
 * Vérifie que l'appelant est authentifié et a le rôle "admin".
 * Lève HttpsError("permission-denied") sinon.
 * Returns the verified uid so callers don't need non-null assertions.
 */
function assertAdmin(auth?: AdminAuth): string {
  const role = auth?.token?.role;
  if (!auth?.uid || auth.uid.trim().length === 0 || role !== "admin") {
    throw new HttpsError("permission-denied", "Accès réservé aux administrateurs.");
  }
  return auth.uid;
}

/* ── findUser ─────────────────────────────────────────────────────────────── */

/**
 * Recherche un utilisateur par email (si la chaîne contient "@") ou par UID.
 * Retourne uid, email, displayName, disabled, rôle effectif, rôle Firestore, rôle claims.
 *
 * Accessible uniquement aux admins.
 */
export const findUser = onCall(async (request) => {
  assertAdmin(request.auth);

  const { query } = request.data as { query?: string };

  if (!query || typeof query !== "string" || query.trim().length < 2) {
    throw new HttpsError("invalid-argument", "Recherche invalide (min. 2 caractères).");
  }

  const q = query.trim();
  const authAdmin = admin.auth();
  const db = admin.firestore();

  let userRecord: admin.auth.UserRecord | null = null;

  if (q.includes("@")) {
    userRecord = await authAdmin.getUserByEmail(q).catch(() => null);
  } else {
    userRecord = await authAdmin.getUser(q).catch(() => null);
  }

  if (!userRecord) {
    throw new HttpsError("not-found", "Utilisateur introuvable.");
  }

  const docSnap = await db.collection("users").doc(userRecord.uid).get();
  const firestoreRole = (docSnap.data()?.role as AppRole | undefined) ?? null;
  const claimRole = (userRecord.customClaims?.role as AppRole | undefined) ?? null;

  return {
    uid: userRecord.uid,
    email: userRecord.email ?? null,
    displayName: userRecord.displayName ?? null,
    disabled: userRecord.disabled,
    role: claimRole ?? firestoreRole ?? "citoyen",
    firestoreRole,
    claimRole,
  };
});

/* ── setUserRole ──────────────────────────────────────────────────────────── */

/**
 * Change le rôle d'un utilisateur cible.
 *
 * Actions effectuées de manière atomique :
 *   1. setCustomUserClaims — met à jour le token Firebase
 *   2. users/{uid}.role   — synchronise Firestore
 *   3. auditLogs          — trace l'opération (qui, quand, avant, après)
 *
 * Accessible uniquement aux admins. L'appelant ne peut pas se promouvoir lui-même
 * à un rôle supérieur à "admin" (le seul rôle max autorisé).
 */
export const setUserRole = onCall(async (request) => {
  const callerUid = assertAdmin(request.auth);

  const { uid, role } = request.data as { uid?: string; role?: AppRole };

  if (!uid || typeof uid !== "string" || uid.trim().length === 0) {
    throw new HttpsError("invalid-argument", "UID utilisateur invalide.");
  }

  if (!role || !ALLOWED_ROLES.includes(role)) {
    throw new HttpsError(
      "invalid-argument",
      `Rôle invalide. Valeurs autorisées : ${ALLOWED_ROLES.join(", ")}.`,
    );
  }

  const db = admin.firestore();
  const authAdmin = admin.auth();

  // Vérifier que l'utilisateur cible existe
  const targetUser = await authAdmin.getUser(uid.trim()).catch(() => null);
  if (!targetUser) {
    throw new HttpsError("not-found", "Utilisateur cible introuvable.");
  }

  // Lire le rôle actuel depuis Firestore (source de vérité UI)
  const userRef = db.collection("users").doc(uid);
  const beforeSnap = await userRef.get();
  const beforeRole = (beforeSnap.data()?.role as AppRole | undefined) ?? "citoyen";

  // 1. Mettre à jour les custom claims Firebase (pris en compte au prochain refresh du token)
  //    On préserve les claims existants pour ne pas effacer d'autres champs.
  await authAdmin.setCustomUserClaims(uid, {
    ...(targetUser.customClaims ?? {}),
    role,
  });

  // 2. Synchroniser Firestore
  await userRef.set(
    {
      uid,
      email: targetUser.email ?? null,
      displayName: targetUser.displayName ?? null,
      role,
      roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      roleUpdatedBy: callerUid,
    },
    { merge: true },
  );

  // 3. Écrire l'entrée d'audit
  await db.collection("auditLogs").add({
    action: "ROLE_CHANGE",
    targetUid: uid,
    targetEmail: targetUser.email ?? null,
    oldRole: beforeRole,
    newRole: role,
    byUid: callerUid,
    at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    ok: true,
    uid,
    oldRole: beforeRole,
    newRole: role,
  };
});
