#!/usr/bin/env node
/**
 * eslint-warning-check.mjs
 *
 * Exécute ESLint en sortie JSON sur src/, compte le nombre total de warnings,
 * et fait échouer le processus (exit 1) si ce nombre dépasse MAX_WARNINGS.
 *
 * Usage : node scripts/eslint-warning-check.mjs
 * Env   : MAX_WARNINGS (optionnel, défaut = 17)
 *
 * Ce script ne modifie aucune règle ESLint : il lit uniquement les résultats
 * produits par la configuration existante (frontend/eslint.config.cjs).
 */

import { spawnSync } from 'node:child_process';

const MAX_WARNINGS = Number(process.env.MAX_WARNINGS ?? 17);
const SEP = '─'.repeat(60);

// ── Lancement ESLint en mode JSON ────────────────────────────────────────────
// --format json : sortie JSON parseable
// --no-warn-ignored : supprime le bruit sur les fichiers ignorés
// On laisse ESLint se terminer même avec des warnings (exit 0 ou 1).
// La sortie stderr (erreurs fatales) est transmise à l'écran.
const result = spawnSync(
  'npx',
  ['eslint', 'src', '--format', 'json', '--no-warn-ignored'],
  {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  },
);

// ── Vérification sortie ───────────────────────────────────────────────────────
if (!result.stdout || result.stdout.trim() === '') {
  // Sortie vide = erreur fatale de configuration ESLint (pas de rapport JSON)
  console.error('❌  ESLint n\'a produit aucune sortie JSON. Vérifier la configuration.');
  process.exit(1);
}

// ── Parsing du rapport JSON ───────────────────────────────────────────────────
let report;
try {
  report = JSON.parse(result.stdout);
} catch (err) {
  console.error('❌  Impossible de parser la sortie JSON d\'ESLint :', err.message);
  console.error('Sortie brute :', result.stdout.slice(0, 500));
  process.exit(1);
}

// ── Décompte des warnings ─────────────────────────────────────────────────────
// Chaque entrée du rapport correspond à un fichier analysé.
// warningCount = nombre de messages avec severity === 1.
let totalWarnings = 0;
let totalErrors   = 0;

for (const file of report) {
  totalWarnings += file.warningCount;
  totalErrors   += file.errorCount;
}

// ── Affichage du résumé ───────────────────────────────────────────────────────
console.log('\n' + SEP);
console.log('  ESLINT — GARDE-FOU WARNINGS');
console.log(SEP);
console.log(`  Erreurs   : ${totalErrors}`);
console.log(`  Warnings  : ${totalWarnings}  (seuil max = ${MAX_WARNINGS})`);

if (totalWarnings <= MAX_WARNINGS) {
  console.log(`  Résultat  : ✅  ${totalWarnings} <= ${MAX_WARNINGS} — OK`);
  console.log(SEP + '\n');
  process.exit(0);
} else {
  console.log(`  Résultat  : ❌  ${totalWarnings} > ${MAX_WARNINGS} — FAIL CI`);
  console.log('');
  console.log('  Nouveaux warnings détectés. Corriger les violations ESLint');
  console.log('  ou soumettre une PR dédiée pour réviser le seuil.');
  console.log(SEP + '\n');
  process.exit(1);
}
