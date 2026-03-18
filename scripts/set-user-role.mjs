#!/usr/bin/env node
/**
 * set-user-role.mjs
 *
 * Script générique d'attribution de rôle Firebase.
 * Attribue le rôle spécifié (creator ou admin) à un utilisateur via :
 *   - Firebase Custom Claims (token JWT) pour une résolution instantanée
 *   - Firestore users/{uid}.role pour la compatibilité avec le système existant
 *   - Firestore auditLogs/{id} pour la traçabilité des actions sensibles
 *
 * ── PROJET FIREBASE ────────────────────────────────────────────────────────
 *  Projet    : a-ki-pri-sa-ye
 *  Compte de service : firebase-adminsdk-fbsvc@a-ki-pri-sa-ye.iam.gserviceaccount.com
 *
 * ── PRÉREQUIS ──────────────────────────────────────────────────────────────
 *  1. Node.js ≥ 18
 *  2. firebase-admin installé : npm install
 *  3. Clé de service Firebase Admin :
 *     - Via variable d'environnement FIREBASE_SERVICE_ACCOUNT (JSON brut ou base64)
 *     - Via fichier serviceAccountKey.json à la racine du dépôt
 *
 * ── UTILISATION ────────────────────────────────────────────────────────────
 *  node scripts/set-user-role.mjs <email> <role>
 *
 *  Rôles acceptés : creator, admin
 *
 *  Exemples :
 *    node scripts/set-user-role.mjs teetee971@gmail.com creator
 *    node scripts/set-user-role.mjs admin@example.com admin
 *
 *  Via variable d'environnement :
 *    TARGET_EMAIL=user@example.com TARGET_ROLE=creator node scripts/set-user-role.mjs
 *
 * ── APRÈS EXÉCUTION ────────────────────────────────────────────────────────
 *  Le token Firebase doit être rafraîchi pour que les custom claims soient actifs.
 *  Dans l'application, l'utilisateur doit se déconnecter et se reconnecter,
 *  ou l'application peut appeler refreshClaims() pour forcer le rafraîchissement.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

/* ── Rôles valides ─────────────────────────────────────────────────────── */

const VALID_ROLES = ['creator', 'admin'];

/* ── 1. Lire l'email et le rôle depuis les arguments / variables d'env ── */

const email = process.argv[2] || process.env.TARGET_EMAIL;
const role  = process.argv[3] || process.env.TARGET_ROLE;

if (!email || !email.includes('@')) {
  console.error('\n❌ Usage : node scripts/set-user-role.mjs <email> <role>\n');
  console.error('   Rôles acceptés :', VALID_ROLES.join(', '));
  process.exit(1);
}

if (!role || !VALID_ROLES.includes(role)) {
  console.error(`\n❌ Rôle invalide : "${role || '(vide)'}"`);
  console.error('   Rôles acceptés :', VALID_ROLES.join(', '));
  console.error('   Usage : node scripts/set-user-role.mjs <email> <role>\n');
  process.exit(1);
}

/* ── 2. Charger la clé de service Firebase Admin ─────────────────────── */

const envKey = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let serviceAccount;

if (envKey) {
  try {
    try {
      serviceAccount = JSON.parse(Buffer.from(envKey, 'base64').toString('utf-8'));
    } catch {
      serviceAccount = JSON.parse(envKey);
    }
    console.log('\n✅ Clé de service chargée depuis FIREBASE_SERVICE_ACCOUNT');
  } catch {
    console.error('\n❌ FIREBASE_SERVICE_ACCOUNT contient un JSON invalide.');
    console.error('   → La valeur doit être du JSON brut ou encodé en base64.\n');
    process.exit(1);
  }
} else {
  const SERVICE_ACCOUNT_PATHS = [
    resolve(process.cwd(), 'serviceAccountKey.json'),
    resolve(__dirname, 'serviceAccountKey.json'),
    resolve(ROOT, 'serviceAccountKey.json'),
    resolve(ROOT, 'service-account.json'),
  ];

  const serviceAccountPath = SERVICE_ACCOUNT_PATHS.find(existsSync);
  if (!serviceAccountPath) {
    console.error(`
❌ Clé de service Firebase Admin introuvable.

   Définissez la variable d'environnement FIREBASE_SERVICE_ACCOUNT avec le
   contenu JSON de votre clé de service, ou placez serviceAccountKey.json
   à la racine du dépôt.

   Lien : https://console.firebase.google.com/project/a-ki-pri-sa-ye/settings/serviceaccounts/adminsdk
`);
    process.exit(1);
  }

  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    console.log(`\n✅ Clé de service chargée : ${serviceAccountPath}`);
  } catch (err) {
    const isIOError = err?.code && /^E[A-Z]+$/.test(err.code);
    if (isIOError) {
      console.error(`\n❌ Impossible de lire le fichier : ${serviceAccountPath}\n   ${err.code}\n`);
    } else {
      console.error(`\n❌ Clé de service invalide dans ${serviceAccountPath} — JSON mal formé.\n`);
    }
    process.exit(1);
  }
}

/* ── 3. Initialiser Firebase Admin ────────────────────────────────────── */

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const authAdmin = getAuth();
const db = getFirestore();

/* ── 4. Chercher l'utilisateur par email ──────────────────────────────── */

console.log(`\n🔍 Recherche du compte Firebase pour : ${email}`);
console.log(`   Rôle à attribuer : ${role}`);

let userRecord;
try {
  userRecord = await authAdmin.getUserByEmail(email);
  console.log(`✅ Compte trouvé — UID : ${userRecord.uid}`);
} catch (err) {
  if (err.code === 'auth/user-not-found') {
    console.error(`
❌ Aucun compte Firebase trouvé pour l'email : ${email}

   Assurez-vous d'avoir d'abord créé un compte via l'application :
   https://teetee971.github.io/akiprisaye-web/inscription
`);
  } else {
    console.error(`\n❌ Erreur Firebase Auth : ${err.message}\n`);
  }
  process.exit(1);
}

/* ── 5. Construire les custom claims selon le rôle ─────────────────────── */

const uid = userRecord.uid;

// Custom claims: only store the canonical role string.
// The frontend rbac.ts resolves permissions from the role at runtime.
const claims = { role };

/* ── 6. Écrire Firestore + Custom Claims + Audit log ─────────────────── */

const userRef = db.collection('users').doc(uid);

try {
  const snap = await userRef.get();
  const existing = snap.exists ? snap.data() : {};

  // 6a. Firestore — mise à jour du document utilisateur (rétrocompatibilité)
  await userRef.set({
    ...existing,
    uid,
    email,
    role,
    displayName: existing?.displayName ?? userRecord.displayName ?? email,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  // 6b. Custom Claims — résolution rapide côté frontend sans aller en Firestore
  await authAdmin.setCustomUserClaims(uid, claims);

  // 6c. Audit log — traçabilité des actions sensibles (sans données personnelles)
  try {
    await db.collection('auditLogs').add({
      action: 'SET_ROLE',
      targetUid: uid,
      role,
      triggeredBy: process.env.GITHUB_ACTOR || 'cli',
      workflow: process.env.GITHUB_WORKFLOW || null,
      runId: process.env.GITHUB_RUN_ID || null,
      timestamp: new Date().toISOString(),
      success: true,
    });
  } catch {
    // Non-fatal
    console.warn('⚠️  Audit log non écrit (non bloquant).');
  }

  const BOX_DISPLAY_WIDTH = 48;
  const BOX_TRUNCATE_AT   = BOX_DISPLAY_WIDTH - 3;
  const fmt = (s) =>
    s.length > BOX_DISPLAY_WIDTH ? s.slice(0, BOX_TRUNCATE_AT) + '...' : s.padEnd(BOX_DISPLAY_WIDTH);

  const emoji = role === 'admin' ? '🛡️ ' : '✨';

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ${emoji} RÔLE "${role.toUpperCase()}" ATTRIBUÉ AVEC SUCCÈS${' '.repeat(Math.max(0, 29 - role.length))}║
╠══════════════════════════════════════════════════════════════╣
║  Email   : ${fmt(email)}  ║
║  UID     : ${fmt(uid)}  ║
║  Rôle    : ${fmt(role + ' (custom claims + Firestore)')}  ║
╠══════════════════════════════════════════════════════════════╣
║  PROCHAINES ÉTAPES :                                         ║
║  1. L'utilisateur doit rafraîchir son token (déco/reco)      ║
║     ou l'app appellera refreshClaims() automatiquement.      ║
║  2. Le nouveau rôle sera actif immédiatement.                ║
╚══════════════════════════════════════════════════════════════╝
`);

} catch (err) {
  // Write audit failure log (best-effort)
  try {
    await db.collection('auditLogs').add({
      action: 'SET_ROLE',
      targetUid: uid,
      role,
      triggeredBy: process.env.GITHUB_ACTOR || 'cli',
      workflow: process.env.GITHUB_WORKFLOW || null,
      runId: process.env.GITHUB_RUN_ID || null,
      timestamp: new Date().toISOString(),
      success: false,
      error: err.code || 'UNKNOWN',
    });
  } catch {
    // best-effort only
  }
  console.error(`\n❌ Erreur lors de l'attribution du rôle : ${err.message}\n`);
  process.exit(1);
}
