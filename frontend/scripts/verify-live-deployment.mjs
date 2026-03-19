#!/usr/bin/env node
/**
 * verify-live-deployment.mjs
 *
 * Script de preuve de déploiement live.
 * Interroge le site en production et vérifie que version.json correspond
 * exactement au commit, à la branche et au sha256 attendus.
 *
 * Variables d'environnement requises :
 *   SITE_URL         — URL de base du site déployé (ex. https://teetee971.github.io/akiprisaye-web/)
 *   EXPECTED_COMMIT  — SHA complet du commit attendu (github.sha)
 *
 * Variables optionnelles :
 *   EXPECTED_BRANCH  — branche attendue (défaut : "main")
 *   EXPECTED_SHA256  — sha256 attendu du build (vérifié si fourni)
 *   MAX_ATTEMPTS     — nombre max de tentatives (défaut : 36)
 *   DELAY_MS         — délai entre tentatives en ms (défaut : 10000)
 *
 * Exécuté par le job "verify-live" dans deploy-pages.yml.
 */

const LIVE_URL = process.env.SITE_URL;
const EXPECTED_COMMIT = process.env.EXPECTED_COMMIT;
const EXPECTED_BRANCH = process.env.EXPECTED_BRANCH || 'main';
const EXPECTED_SHA256 = process.env.EXPECTED_SHA256 || '';
const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS || 36);
const DELAY_MS = Number(process.env.DELAY_MS || 10000);

if (!LIVE_URL || !EXPECTED_COMMIT) {
  console.error('❌ Missing required env vars: SITE_URL and EXPECTED_COMMIT');
  process.exit(1);
}

const baseUrl = LIVE_URL.replace(/\/$/, '');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function mismatchReasons(payload) {
  const reasons = [];

  if (payload.commit !== EXPECTED_COMMIT) {
    reasons.push(`commit="${payload.commit}" expected="${EXPECTED_COMMIT}"`);
  }

  if (payload.branch !== EXPECTED_BRANCH) {
    reasons.push(`branch="${payload.branch}" expected="${EXPECTED_BRANCH}"`);
  }

  if (payload.shortCommit !== EXPECTED_COMMIT.slice(0, 7)) {
    reasons.push(`shortCommit="${payload.shortCommit}" expected="${EXPECTED_COMMIT.slice(0, 7)}"`);
  }

  if (!payload.runId || !/^\d+$/.test(String(payload.runId))) {
    reasons.push(`runId="${payload.runId}" is not numeric`);
  }

  if (
    !payload.buildUrl ||
    !String(payload.buildUrl).startsWith('https://github.com/') ||
    !String(payload.buildUrl).includes('/actions/runs/')
  ) {
    reasons.push(`buildUrl="${payload.buildUrl}" is not a valid GitHub Actions run URL`);
  }

  if (!payload.builtAt) {
    reasons.push('builtAt is missing');
  }

  if (EXPECTED_SHA256 && payload.sha256 !== EXPECTED_SHA256) {
    reasons.push(`sha256="${payload.sha256}" expected="${EXPECTED_SHA256}"`);
  }

  return reasons;
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  // Cache-buster prevents CDN from serving a stale version.json
  const url = `${baseUrl}/version.json?t=${Date.now()}`;

  try {
    const res = await fetch(url, {
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        pragma: 'no-cache',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`⚠️ Attempt ${attempt}/${MAX_ATTEMPTS}: HTTP ${res.status}`);
    } else {
      const payload = await res.json();
      const reasons = mismatchReasons(payload);

      if (reasons.length === 0) {
        console.log('✅ LIVE DEPLOYMENT VERIFIED');
        console.log(`🌍 URL: ${LIVE_URL}`);
        console.log(`📌 Commit: ${payload.commit}`);
        console.log(`🌿 Branch: ${payload.branch}`);
        console.log(`🔐 SHA256: ${payload.sha256}`);
        process.exit(0);
      }

      console.warn(`⚠️ Attempt ${attempt}/${MAX_ATTEMPTS}: live mismatch`);
      console.warn(reasons.join(' | '));
    }
  } catch (error) {
    console.warn(`⚠️ Attempt ${attempt}/${MAX_ATTEMPTS}: fetch error: ${error.message}`);
  }

  if (attempt < MAX_ATTEMPTS) {
    await sleep(DELAY_MS);
  }
}

console.error('❌ LIVE DEPLOYMENT VERIFICATION FAILED');
process.exit(1);
