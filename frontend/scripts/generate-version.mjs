#!/usr/bin/env node
/**
 * generate-version.mjs
 *
 * Génère dist/version.json après chaque build (postbuild).
 * En CI (GitHub Actions), les variables VITE_BUILD_* ou les variables natives
 * GITHUB_* sont utilisées. En local, des valeurs de fallback sont utilisées.
 *
 * Exécuté automatiquement via le script "postbuild" dans package.json.
 */

import { mkdirSync, writeFileSync } from 'node:fs';

const commit =
  process.env.VITE_BUILD_SHA || process.env.GITHUB_SHA || 'unknown';
const shortCommit = commit !== 'unknown' ? commit.slice(0, 7) : 'dev';

const branch =
  process.env.VITE_BUILD_REF ||
  process.env.GITHUB_REF_NAME ||
  'dev';

const runId =
  process.env.GITHUB_RUN_ID || process.env.VITE_BUILD_RUN_ID || 'local';
const builtAt = new Date().toISOString();
const repo =
  process.env.GITHUB_REPOSITORY || 'teetee971/akiprisaye-web';
const buildUrl =
  process.env.GITHUB_RUN_ID || process.env.VITE_BUILD_RUN_ID
    ? `https://github.com/${repo}/actions/runs/${runId}`
    : null;

const version = {
  commit,
  shortCommit,
  branch,
  runId,
  builtAt,
  buildUrl,
};

mkdirSync('dist', { recursive: true });
writeFileSync('dist/version.json', JSON.stringify(version, null, 2) + '\n');
console.log('✅ version.json généré :', version);
