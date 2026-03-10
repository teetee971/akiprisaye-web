#!/usr/bin/env node
/**
 * set-creator-role.mjs
 *
 * Script d'initialisation unique : attribue le rôle "creator" à votre compte
 * dans Firestore, ce qui active le plan CREATOR (accès illimité à toutes les
 * fonctionnalités) dès votre prochaine connexion.
 *
 * ── PROJET FIREBASE ────────────────────────────────────────────────────────
 *  Projet    : a-ki-pri-sa-ye
 *  Compte de service : firebase-adminsdk-fbsvc@a-ki-pri-sa-ye.iam.gserviceaccount.com
 *
 * ── PRÉREQUIS ──────────────────────────────────────────────────────────────
 *  1. Node.js ≥ 18
 *  2. firebase-admin installé localement dans ce dépôt :
 *        cd <racine-du-projet> && npm install firebase-admin
 *     (firebase-admin est déjà une devDependency — lancez juste npm install)
 *  3. Clé privée JSON du compte de service Firebase Admin SDK :
 *        Console Firebase → Paramètres du projet ⚙️ → Comptes de service
 *        → Compte : firebase-adminsdk-fbsvc@a-ki-pri-sa-ye.iam.gserviceaccount.com
 *        → Bouton "Générer une nouvelle clé privée" → confirmer → télécharger le JSON
 *        → placer le fichier à la racine du projet sous l'un des noms ci-dessous
 *
 *     🔗 Lien direct :
 *        https://console.firebase.google.com/project/a-ki-pri-sa-ye/settings/serviceaccounts/adminsdk
 *
 *     ⚠️  Ne commitez JAMAIS ce fichier JSON — il est dans .gitignore
 *
 * ── UTILISATION ────────────────────────────────────────────────────────────
 *  node scripts/set-creator-role.mjs <votre-email@domaine.com>
 *
 *  Exemple :
 *  node scripts/set-creator-role.mjs teetee971@gmail.com
 *
 * ── APRÈS EXÉCUTION ────────────────────────────────────────────────────────
 *  1. Ouvrez l'application dans votre navigateur
 *  2. Connectez-vous avec cet email
 *  3. Votre avatar s'affiche en ✨ doré (rôle Créateur)
 *  4. Accédez à /espace-createur pour votre tableau de bord illimité
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

/* ── 1. Lire l'email depuis les arguments ─────────────────────────────── */

const email = process.argv[2];
if (!email || !email.includes('@')) {
  console.error('\n❌ Usage : node scripts/set-creator-role.mjs <votre-email@domaine.com>\n');
  process.exit(1);
}

/* ── 2. Localiser la clé de service Firebase Admin ───────────────────── */

const SERVICE_ACCOUNT_PATHS = [
  resolve(ROOT, 'service-account-file.json'),
  resolve(ROOT, 'service-account.json'),
  resolve(ROOT, 'firebase-admin-key.json'),
  resolve(ROOT, 'serviceAccountKey.json'),
];

const serviceAccountPath = SERVICE_ACCOUNT_PATHS.find(existsSync);
if (!serviceAccountPath) {
  console.error(`
❌ Clé de service Firebase Admin introuvable.

   Compte de service : firebase-adminsdk-fbsvc@a-ki-pri-sa-ye.iam.gserviceaccount.com
   Projet Firebase   : a-ki-pri-sa-ye

   ── Étapes pour télécharger la clé ──────────────────────────────────────
   1. Ouvrez ce lien dans votre navigateur :
      https://console.firebase.google.com/project/a-ki-pri-sa-ye/settings/serviceaccounts/adminsdk

   2. Cliquez sur "Générer une nouvelle clé privée"

   3. Confirmez dans la boîte de dialogue

   4. Un fichier JSON est téléchargé (ex: a-ki-pri-sa-ye-firebase-adminsdk-xxxx.json)

   5. Renommez-le et placez-le à la racine du projet sous l'un de ces noms :
${SERVICE_ACCOUNT_PATHS.map(p => '      • ' + p).join('\n')}

   ⚠️  Ne commitez JAMAIS ce fichier dans Git (il est dans .gitignore).
`);
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  console.log(`\n✅ Clé de service chargée : ${serviceAccountPath}`);
} catch (err) {
  console.error(`\n❌ Impossible de lire la clé de service : ${err.message}\n`);
  process.exit(1);
}

/* ── 3. Initialiser Firebase Admin ────────────────────────────────────── */

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const authAdmin = getAuth();
const db = getFirestore();

/* ── 4. Chercher l'utilisateur par email ──────────────────────────────── */

console.log(`\n🔍 Recherche du compte Firebase pour : ${email}`);

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

   Ensuite, relancez ce script.
`);
  } else {
    console.error(`\n❌ Erreur Firebase Auth : ${err.message}\n`);
  }
  process.exit(1);
}

/* ── 5. Écrire le rôle "creator" dans Firestore ──────────────────────── */

const uid = userRecord.uid;
const userRef = db.collection('users').doc(uid);

try {
  const snap = await userRef.get();
  const existing = snap.exists ? snap.data() : {};

  await userRef.set({
    ...existing,
    uid,
    email,
    role: 'creator',
    plan: 'creator',
    displayName: existing?.displayName ?? userRecord.displayName ?? 'Créateur',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ✨ RÔLE CRÉATEUR ACTIVÉ AVEC SUCCÈS                         ║
╠══════════════════════════════════════════════════════════════╣
║  Email   : ${email.padEnd(50)}  ║
║  UID     : ${uid.padEnd(50)}  ║
║  Rôle    : creator (plan CREATOR — accès illimité)           ║
╠══════════════════════════════════════════════════════════════╣
║  PROCHAINES ÉTAPES :                                         ║
║  1. Ouvrez l'application dans votre navigateur               ║
║  2. Connectez-vous avec cet email                            ║
║  3. Votre accès créateur est immédiatement actif             ║
║  4. Accédez à /espace-createur pour votre tableau de bord    ║
╚══════════════════════════════════════════════════════════════╝
`);

} catch (err) {
  console.error(`\n❌ Erreur lors de l'écriture Firestore : ${err.message}\n`);
  process.exit(1);
}
