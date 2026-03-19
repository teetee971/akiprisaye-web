#!/usr/bin/env node
/**
 * generate-version.mjs
 *
 * Génère dist/version.json après chaque build (postbuild).
 * En CI (GitHub Actions), les variables VITE_BUILD_* ou les variables natives
 * GITHUB_* sont utilisées. En local, des valeurs de fallback sont utilisées.
 * Le champ sha256 est le hash SHA-256 de dist/index.html (preuve forte du build).
 *
 * Exécuté automatiquement via le script "postbuild" dans package.json.
 */

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const DIST_DIR = resolve('dist');
const VERSION_PATH = resolve(DIST_DIR, 'version.json');
const INDEX_HTML_PATH = resolve(DIST_DIR, 'index.html');

const commit =
  process.env.VITE_BUILD_SHA ||
  process.env.GITHUB_SHA ||
  'unknown';

const branch =
  process.env.VITE_BUILD_REF ||
  process.env.GITHUB_REF_NAME ||
  'dev';

const runId =
  process.env.VITE_BUILD_RUN_ID ||
  process.env.GITHUB_RUN_ID ||
  'local';

const buildId = runId;

const builtAt = new Date().toISOString();

const repository = process.env.GITHUB_REPOSITORY || 'teetee971/akiprisaye-web';

const buildUrl =
  process.env.GITHUB_RUN_ID
    ? `https://github.com/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;

let sha256 = 'unknown';

try {
  const indexHtml = readFileSync(INDEX_HTML_PATH);
  sha256 = createHash('sha256').update(indexHtml).digest('hex');
} catch {
  // Keep "unknown" outside CI or if dist/index.html doesn't exist yet.
}

const payload = {
  commit,
  shortCommit: commit && commit !== 'unknown' ? commit.slice(0, 7) : 'dev',
  branch,
  runId: String(runId),
  buildId: String(buildId),
  builtAt,
  buildUrl,
  sha256,
};

mkdirSync(DIST_DIR, { recursive: true });
writeFileSync(VERSION_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');

console.log('✅ version.json généré :');
console.log(payload);
