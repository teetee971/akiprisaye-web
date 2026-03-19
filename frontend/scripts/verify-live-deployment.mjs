#!/usr/bin/env node
/**
 * verify-live-deployment.mjs
 *
 * Script de preuve de déploiement live.
 * Interroge le site en production et vérifie que version.json correspond
 * exactement au commit et à la branche attendus.
 *
 * Variables d'environnement requises :
 *   SITE_URL         — URL de base du site déployé (ex. https://teetee971.github.io/akiprisaye-web/)
 *   EXPECTED_COMMIT  — SHA complet du commit attendu (github.sha)
 *
 * Variables optionnelles :
 *   EXPECTED_BRANCH  — branche attendue (défaut : "main")
 *   MAX_ATTEMPTS     — nombre max de tentatives (défaut : 36)
 *   DELAY_MS         — délai entre tentatives en ms (défaut : 10000)
 *
 * Exécuté par le job "verify-live" dans deploy-pages.yml.
 */

const siteUrl = process.env.SITE_URL;
const expectedCommit = process.env.EXPECTED_COMMIT;
const expectedBranch = process.env.EXPECTED_BRANCH || 'main';
const maxAttempts = Number(process.env.MAX_ATTEMPTS || 36);
const delayMs = Number(process.env.DELAY_MS || 10000);

if (!siteUrl || !expectedCommit) {
  console.error('❌ SITE_URL et EXPECTED_COMMIT sont requis.');
  process.exit(1);
}

const baseUrl = siteUrl.replace(/\/$/, '');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} sur ${url}`);
  }

  return res.json();
}

let lastPayload = null;
let lastError = null;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  // Cache-buster prevents CDN from serving a stale version.json
  const versionUrl = `${baseUrl}/version.json?t=${Date.now()}`;

  try {
    const payload = await fetchJson(versionUrl);
    lastPayload = payload;

    console.log(`🔎 Tentative ${attempt}/${maxAttempts}`);
    console.log(payload);

    const commitOk = payload.commit === expectedCommit;
    const branchOk = payload.branch === expectedBranch;
    const shortOk = payload.shortCommit === expectedCommit.slice(0, 7);
    const runOk = Boolean(payload.runId);
    const urlOk = Boolean(payload.buildUrl);

    if (commitOk && branchOk && shortOk && runOk && urlOk) {
      console.log('✅ LIVE VERIFIED BUILD');
      process.exit(0);
    }

    const mismatches = [];
    if (!commitOk) mismatches.push(`commit=${payload.commit} (attendu: ${expectedCommit})`);
    if (!branchOk) mismatches.push(`branch=${payload.branch} (attendu: ${expectedBranch})`);
    if (!shortOk) mismatches.push(`shortCommit=${payload.shortCommit} (attendu: ${expectedCommit.slice(0, 7)})`);
    if (!runOk) mismatches.push('runId manquant');
    if (!urlOk) mismatches.push('buildUrl manquant');

    lastError = new Error(`Mismatch live: ${mismatches.join(', ')}`);
    console.warn(`⚠️ ${lastError.message}`);
  } catch (err) {
    lastError = err;
    console.warn(`⚠️ Tentative ${attempt} échouée: ${err.message}`);
  }

  if (attempt < maxAttempts) {
    await sleep(delayMs);
  }
}

console.error('❌ Déploiement live non conforme.');
if (lastPayload) {
  console.error('Dernier payload reçu :', JSON.stringify(lastPayload, null, 2));
}
if (lastError) {
  console.error('Dernière erreur :', lastError.message);
}
process.exit(1);
