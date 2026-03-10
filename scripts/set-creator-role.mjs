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
 *        → renommer le fichier en serviceAccountKey.json
 *        → le placer dans la RACINE du dépôt (voir arbre ci-dessous)
 *
 *     🔗 Lien direct :
 *        https://console.firebase.google.com/project/a-ki-pri-sa-ye/settings/serviceaccounts/adminsdk
 *
 *     📁 OÙ PLACER LE FICHIER — arborescence du dépôt :
 *
 *        akiprisaye-web/                  ← dossier cloné (racine du projet)
 *        ├── firebase.json
 *        ├── firestore.rules
 *        ├── package.json
 *        ├── serviceAccountKey.json       ← 👈 PLACER LE FICHIER ICI
 *        ├── frontend/
 *        └── scripts/
 *            └── set-creator-role.mjs    ← ce script
 *
 *     ⚠️  Ne commitez JAMAIS ce fichier JSON — il est dans .gitignore
 *
 *     💡 ALTERNATIVE — variable d'environnement (GitHub Actions / CI) :
 *        Exportez le contenu JSON brut dans la variable FIREBASE_SERVICE_ACCOUNT_KEY.
 *        Le script lira d'abord cette variable avant de chercher un fichier.
 *
 * ── UTILISATION ────────────────────────────────────────────────────────────
 *  Depuis un terminal (PC ou Termux Android) :
 *    node scripts/set-creator-role.mjs <votre-email@domaine.com>
 *
 *  Depuis Termux (Android) — guide rapide depuis ~/downloads :
 *    # 1. Vérifier/installer nodejs
 *    #    Note : "Abort." peut apparaître lors d'un premier "pkg upgrade" en raison
 *    #    de l'initialisation du gestionnaire de paquets — relancer suffit à corriger.
 *    node --version 2>/dev/null || pkg install nodejs
 *    # 2. Télécharger uniquement le script (pas besoin de cloner tout le dépôt)
 *    cd ~/downloads
 *    curl -fsSL https://raw.githubusercontent.com/teetee971/akiprisaye-web/main/scripts/set-creator-role.mjs -o set-creator-role.mjs
 *    # 3. Installer firebase-admin et activer le rôle
 *    npm install firebase-admin
 *    node set-creator-role.mjs teetee971@gmail.com
 *
 *  Depuis GitHub Actions (sans PC ni terminal) :
 *    1. Ajoutez le contenu JSON comme secret GitHub : FIREBASE_SERVICE_ACCOUNT_KEY
 *    2. Déclenchez le workflow "✨ Attribuer le rôle Créateur" depuis l'onglet Actions
 *
 *  Exemple local :
 *    node scripts/set-creator-role.mjs teetee971@gmail.com
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

/* ── 2. Localiser / lire la clé de service Firebase Admin ────────────── */

// Priorité 1 : variable d'environnement (GitHub Actions, CI, Termux inline)
const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let serviceAccount;

if (envKey) {
  try {
    serviceAccount = JSON.parse(envKey);
    console.log('\n✅ Clé de service chargée depuis FIREBASE_SERVICE_ACCOUNT_KEY (variable d\'environnement)');
  } catch (err) {
    console.error(`\n❌ FIREBASE_SERVICE_ACCOUNT_KEY contient un JSON invalide : ${err.message}\n`);
    process.exit(1);
  }
} else {
  // Priorité 2 : fichier sur disque (utilisation locale / Termux)
  const SERVICE_ACCOUNT_PATHS = [
    resolve(process.cwd(), 'serviceAccountKey.json'),    // répertoire courant
    resolve(__dirname, 'serviceAccountKey.json'),         // même dossier que le script
    resolve(ROOT, 'serviceAccountKey.json'),              // racine du dépôt (usage classique)
    resolve(process.cwd(), 'service-account-file.json'),
    resolve(__dirname, 'service-account-file.json'),
    resolve(ROOT, 'service-account-file.json'),
    resolve(process.cwd(), 'service-account.json'),
    resolve(__dirname, 'service-account.json'),
    resolve(ROOT, 'service-account.json'),
    resolve(process.cwd(), 'firebase-admin-key.json'),
    resolve(__dirname, 'firebase-admin-key.json'),
    resolve(ROOT, 'firebase-admin-key.json'),
  ];

  const serviceAccountPath = SERVICE_ACCOUNT_PATHS.find(existsSync);
  if (!serviceAccountPath) {
    console.error(`
❌ Clé de service Firebase Admin introuvable.

   Compte de service : firebase-adminsdk-fbsvc@a-ki-pri-sa-ye.iam.gserviceaccount.com
   Projet Firebase   : a-ki-pri-sa-ye

   ── Option A — Fichier local (PC ou Termux) ─────────────────────────────
   1. Ouvrez : https://console.firebase.google.com/project/a-ki-pri-sa-ye/settings/serviceaccounts/adminsdk
   2. Cliquez "Générer une nouvelle clé privée" → téléchargez le JSON
   3. Renommez-le serviceAccountKey.json et placez-le à la racine du dépôt :
${SERVICE_ACCOUNT_PATHS.map(p => '      • ' + p).join('\n')}

   ── Option B — Termux (Android) ─────────────────────────────────────────
   Le script et serviceAccountKey.json doivent être dans le même dossier :
   curl -fsSL https://raw.githubusercontent.com/teetee971/akiprisaye-web/main/scripts/set-creator-role.mjs -o set-creator-role.mjs
   node set-creator-role.mjs ${email}

   ── Option C — Variable d'environnement (GitHub Actions / CI) ───────────
   export FIREBASE_SERVICE_ACCOUNT_KEY='<contenu JSON brut>'
   node scripts/set-creator-role.mjs ${email}

   ⚠️  Ne commitez JAMAIS ce fichier dans Git (il est dans .gitignore).
`);
    process.exit(1);
  }

  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    console.log(`\n✅ Clé de service chargée : ${serviceAccountPath}`);
  } catch (err) {
    console.error(`\n❌ Impossible de lire la clé de service : ${err.message}\n`);
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

  /* Largeur d'affichage de la boîte de succès (en caractères) */
  const BOX_DISPLAY_WIDTH = 48;
  const BOX_TRUNCATE_AT   = BOX_DISPLAY_WIDTH - 3; // laisser 3 chars pour "..."

  const fmt = (s) =>
    s.length > BOX_DISPLAY_WIDTH ? s.slice(0, BOX_TRUNCATE_AT) + '...' : s.padEnd(BOX_DISPLAY_WIDTH);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ✨ RÔLE CRÉATEUR ACTIVÉ AVEC SUCCÈS                         ║
╠══════════════════════════════════════════════════════════════╣
║  Email   : ${fmt(email)}  ║
║  UID     : ${fmt(uid)}  ║
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
