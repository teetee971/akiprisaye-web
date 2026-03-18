#!/usr/bin/env node
/**
 * lighthouse-guard.mjs
 *
 * Régression guard Lighthouse CI.
 *
 * Modes :
 *   --write   Lit .lighthouseci/*.report.json → écrit .lighthouseci/lighthouse-scores.json
 *   --compare Télécharge l'artifact "lighthouse-scores" du dernier run main réussi via
 *             l'API GitHub, compare avec les scores actuels, échoue si baisse > THRESHOLD.
 *             Écrit également la baseline dans /tmp/lh-baseline.json pour le script de
 *             commentaire PR (lighthouse-pr-comment.mjs).
 *
 * Variables d'environnement :
 *   GITHUB_TOKEN          — token GitHub (requis pour --compare)
 *   GITHUB_REPOSITORY     — "owner/repo" (automatique en GitHub Actions)
 *   REGRESSION_THRESHOLD  — points max de baisse acceptés (défaut : 5)
 *   LH_ARTIFACT_NAME      — nom de l'artifact baseline (défaut : lighthouse-scores)
 *   LHCI_DIR              — répertoire des rapports (défaut : .lighthouseci)
 *
 * Usage :
 *   node scripts/lighthouse-guard.mjs --write
 *   node scripts/lighthouse-guard.mjs --compare
 */

import fs            from 'fs';
import path          from 'path';
import { execSync }  from 'child_process';
import { fileURLToPath } from 'url';

const __dirname      = path.dirname(fileURLToPath(import.meta.url));
const mode           = process.argv[2] || '--write';
const dir            = path.resolve(process.cwd(), process.env.LHCI_DIR || '.lighthouseci');
const scoresFile     = path.join(dir, 'lighthouse-scores.json');
const THRESHOLD      = Number(process.env.REGRESSION_THRESHOLD ?? 5);
const ARTIFACT_NAME  = process.env.LH_ARTIFACT_NAME || 'lighthouse-scores';
const BASELINE_OUT   = '/tmp/lh-baseline.json';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readReports() {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(
    f => f.endsWith('.report.json') && f !== 'lighthouse-scores.json'
  );
}

function extractScores(reportPath) {
  const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  return {
    url:           data.finalUrl || data.requestedUrl || 'unknown',
    performance:   Math.round((data.categories.performance?.score   ?? 0) * 100),
    accessibility: Math.round((data.categories.accessibility?.score ?? 0) * 100),
    seo:           Math.round((data.categories.seo?.score           ?? 0) * 100),
    bestPractices: Math.round((data.categories['best-practices']?.score ?? 0) * 100),
    timestamp:     new Date().toISOString(),
  };
}

// ─── --write mode ─────────────────────────────────────────────────────────────

function writeScores() {
  const reports = readReports();
  if (!reports.length) {
    console.log('⚠️  Aucun rapport .report.json — skip écriture des scores Lighthouse.');
    process.exit(0);
  }

  const scores = extractScores(path.join(dir, reports[0]));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(scoresFile, JSON.stringify(scores, null, 2));
  console.log('✅ Scores Lighthouse enregistrés → ' + scoresFile);
  console.log('   Performance   : ' + scores.performance);
  console.log('   Accessibilité : ' + scores.accessibility);
  console.log('   SEO           : ' + scores.seo);
  console.log('   Best Practices: ' + scores.bestPractices);
}

// ─── --compare mode ───────────────────────────────────────────────────────────

async function compareScores() {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPOSITORY; // "owner/repo"

  if (!token || !repo) {
    console.log('⚠️  GITHUB_TOKEN ou GITHUB_REPOSITORY non défini — régression guard ignoré.');
    process.exit(0);
  }

  if (!fs.existsSync(scoresFile)) {
    console.log('⚠️  lighthouse-scores.json introuvable — exécuter --write d\'abord.');
    process.exit(0);
  }

  const current = JSON.parse(fs.readFileSync(scoresFile, 'utf8'));
  const headers = {
    Authorization:         `Bearer ${token}`,
    Accept:                'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  let baseline = null;

  try {
    // List artifacts by name, find the latest from the main branch
    const listUrl = `https://api.github.com/repos/${repo}/actions/artifacts?name=${encodeURIComponent(ARTIFACT_NAME)}&per_page=10`;
    const listRes = await fetch(listUrl, { headers });
    if (!listRes.ok) throw new Error(`API list ${listRes.status}: ${await listRes.text()}`);

    const { artifacts } = await listRes.json();
    const artifact = (artifacts || []).find(
      a => !a.expired && a.workflow_run?.head_branch === 'main'
    );

    if (!artifact) {
      console.log(`ℹ️  Aucun artifact "${ARTIFACT_NAME}" sur main — première exécution, skip régression guard.`);
      process.exit(0);
    }

    console.log(`📦 Baseline trouvée : artifact #${artifact.id} (${artifact.created_at})`);

    // Download ZIP
    const dlRes = await fetch(
      `https://api.github.com/repos/${repo}/actions/artifacts/${artifact.id}/zip`,
      { headers }
    );
    if (!dlRes.ok) throw new Error(`Download artifact ${dlRes.status}`);

    const zipPath = '/tmp/lh-baseline.zip';
    fs.writeFileSync(zipPath, Buffer.from(await dlRes.arrayBuffer()));

    // Extract lighthouse-scores.json from ZIP (unzip available on ubuntu-latest)
    const json = execSync(`unzip -p ${zipPath} lighthouse-scores.json`, { encoding: 'utf8' });
    baseline = JSON.parse(json);

    // Save baseline for PR comment script
    fs.writeFileSync(BASELINE_OUT, JSON.stringify(baseline, null, 2));
    console.log(`📊 Baseline URL: ${baseline.url}, date: ${baseline.timestamp?.slice(0, 10) || 'N/A'}`);
  } catch (err) {
    console.warn('⚠️  Impossible de récupérer la baseline : ' + err.message);
    console.log('   → Régression guard ignoré pour ce run.');
    process.exit(0);
  }

  // ── Compare ──
  const metrics = [
    ['performance',   'Performance    '],
    ['accessibility', 'Accessibilité  '],
    ['seo',           'SEO            '],
    ['bestPractices', 'Best Practices '],
  ];

  const sep = '─'.repeat(50);
  console.log('\n📊 Comparaison des scores Lighthouse\n');
  console.log('  ' + sep);
  console.log('  Métrique          Baseline  Actuel  Delta');
  console.log('  ' + sep);

  let failed = false;

  for (const [key, label] of metrics) {
    const prev  = baseline[key] ?? null;
    const curr  = current[key]  ?? 0;
    if (prev === null) continue;

    const delta = curr - prev;
    const sign  = delta >= 0 ? '+' : '';
    const icon  = delta < -THRESHOLD ? '❌' : delta < 0 ? '⚠️ ' : '✅';

    console.log(`  ${icon} ${label}  ${String(prev).padStart(3)}       ${String(curr).padStart(3)}    ${sign}${delta}`);

    if (delta < -THRESHOLD) failed = true;
  }

  console.log('  ' + sep + '\n');

  if (failed) {
    console.error(`❌ Régression Lighthouse détectée : un ou plusieurs scores ont baissé de plus de ${THRESHOLD} points.`);
    process.exit(1);
  }

  console.log(`✅ Aucune régression Lighthouse détectée (seuil : ${THRESHOLD} points).`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

if (mode === '--write') {
  writeScores();
} else if (mode === '--compare') {
  compareScores().catch(err => {
    console.error('❌ Erreur inattendue dans le régression guard :', err.message);
    process.exit(1);
  });
} else {
  console.error('Usage : node lighthouse-guard.mjs --write | --compare');
  process.exit(1);
}
