#!/usr/bin/env node
/**
 * generate-version.mjs
 *
 * Génère dist/version.json après chaque build (postbuild).
 * En CI (GitHub Actions), les variables VITE_BUILD_* sont injectées par le workflow.
 * En local, des valeurs de fallback sont utilisées (pas d'impact sur le build).
 *
 * Exécuté automatiquement via le script "postbuild" dans package.json.
 */

import { mkdirSync, writeFileSync } from 'fs';

const sha = process.env.VITE_BUILD_SHA ?? '';
const shortCommit = sha ? sha.slice(0, 7) : 'dev';

const version = {
  commit:      sha          || 'unknown',
  shortCommit: shortCommit,
  branch:      process.env.VITE_BUILD_REF    || 'dev',
  runId:       process.env.VITE_BUILD_RUN_ID || 'local',
  builtAt:     process.env.VITE_BUILD_TIME   || new Date().toISOString(),
  buildUrl:    process.env.VITE_BUILD_RUN_ID
    ? `https://github.com/teetee971/akiprisaye-web/actions/runs/${process.env.VITE_BUILD_RUN_ID}`
    : null,
};

mkdirSync('dist', { recursive: true });
writeFileSync('dist/version.json', JSON.stringify(version, null, 2) + '\n');
console.log('✅ version.json généré :', version);
