#!/usr/bin/env node
/**
 * lighthouse-guard.mjs
 *
 * Régression guard Lighthouse CI.
 *
 * Modes :
 *   --write   Lit .lighthouseci/*.report.json → écrit .lighthouseci/lighthouse-scores.json
 *   --compare Télécharge l'artifact "lighthouse-scores" du dernier run main réussi via
 *             l'API GitHub, compare avec les scores actuels selon des seuils par métrique,
 *             échoue (FAIL) si une régression dépasse le seuil autorisé.
 *             Écrit également la baseline dans /tmp/lh-baseline.json pour le script de
 *             commentaire PR (lighthouse-pr-comment.mjs).
 *
 * Seuils de régression (points) :
 *   performance   : > 5 pts → FAIL
 *   accessibility : > 2 pts → FAIL
 *   seo           : > 3 pts → FAIL
 *   best-practices: > 3 pts → FAIL
 *   Tout avertissement : WARN
 *   Aucun écart : PASS
 *
 * Variables d'environnement :
 *   GITHUB_TOKEN               — token GitHub (requis pour --compare)
 *   GITHUB_REPOSITORY          — "owner/repo" (automatique en GitHub Actions)
 *   THRESHOLD_PERFORMANCE      — seuil max baisse Performance   (défaut : 5)
 *   THRESHOLD_ACCESSIBILITY    — seuil max baisse Accessibilité (défaut : 2)
 *   THRESHOLD_SEO              — seuil max baisse SEO           (défaut : 3)
 *   THRESHOLD_BEST_PRACTICES   — seuil max baisse Best Practices(défaut : 3)
 *   LH_ARTIFACT_NAME           — nom de l'artifact baseline (défaut : lighthouse-scores)
 *   LHCI_DIR                   — répertoire des rapports (défaut : .lighthouseci)
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
const ARTIFACT_NAME  = process.env.LH_ARTIFACT_NAME || 'lighthouse-scores';
const BASELINE_OUT   = '/tmp/lh-baseline.json';

// Per-metric regression thresholds (points allowed to drop before FAIL).
const THRESHOLDS = {
  performance:   Number(process.env.THRESHOLD_PERFORMANCE    ?? 5),
  accessibility: Number(process.env.THRESHOLD_ACCESSIBILITY  ?? 2),
  seo:           Number(process.env.THRESHOLD_SEO            ?? 3),
  bestPractices: Number(process.env.THRESHOLD_BEST_PRACTICES ?? 3),
};

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
    performance:   Math.round((data.categories.performance?.score         ?? 0) * 100),
    accessibility: Math.round((data.categories.accessibility?.score       ?? 0) * 100),
    seo:           Math.round((data.categories.seo?.score                 ?? 0) * 100),
    bestPractices: Math.round((data.categories['best-practices']?.score   ?? 0) * 100),
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
    Authorization:          `Bearer ${token}`,
    Accept:                 'application/vnd.github+json',
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

  // ── Per-metric comparison ─────────────────────────────────────────────────

  const metricDefs = [
    { key: 'performance',   label: 'Performance    ', threshold: THRESHOLDS.performance   },
    { key: 'accessibility', label: 'Accessibilité  ', threshold: THRESHOLDS.accessibility },
    { key: 'seo',           label: 'SEO            ', threshold: THRESHOLDS.seo           },
    { key: 'bestPractices', label: 'Best Practices ', threshold: THRESHOLDS.bestPractices },
  ];

  const sep = '─'.repeat(60);
  console.log('\n📊 Comparaison des scores Lighthouse (régression guard)\n');
  console.log('  ' + sep);
  console.log('  Métrique          Seuil  Baseline  Actuel  Delta   Verdict');
  console.log('  ' + sep);

  let hasFail = false;
  let hasWarn = false;
  const results = [];

  for (const { key, label, threshold } of metricDefs) {
    const prev  = baseline[key] ?? null;
    const curr  = current[key]  ?? 0;
    if (prev === null) continue;

    const delta   = curr - prev;
    const sign    = delta >= 0 ? '+' : '';
    let verdict, icon;

    if (delta < -threshold) {
      verdict = 'FAIL'; icon = '❌'; hasFail = true;
    } else if (delta < 0) {
      verdict = 'WARN'; icon = '⚠️ '; hasWarn = true;
    } else {
      verdict = 'PASS'; icon = '✅';
    }

    results.push({ key, label, prev, curr, delta, threshold, verdict });
    console.log(
      `  ${icon} ${label}  -${String(threshold).padEnd(2)}   ${String(prev).padStart(3)}       ${String(curr).padStart(3)}    ${(sign + delta).padStart(3)}   ${verdict}`
    );
  }

  console.log('  ' + sep + '\n');

  // ── Overall verdict ───────────────────────────────────────────────────────

  const overallVerdict = hasFail ? 'FAIL' : hasWarn ? 'WARN' : 'PASS';
  const overallIcon    = hasFail ? '❌'   : hasWarn  ? '⚠️ '  : '✅';

  console.log(`${overallIcon} Verdict global : ${overallVerdict}`);
  if (hasFail) {
    console.log('   Seuils dépassés :');
    for (const r of results.filter(r => r.verdict === 'FAIL')) {
      console.log(`   - ${r.label.trim()} : baseline ${r.prev} → actuel ${r.curr} (delta ${r.delta}, seuil -${r.threshold})`);
    }
  }

  // Write verdict for PR comment script to pick up
  const verdictOut = {
    verdict:   overallVerdict,
    thresholds: THRESHOLDS,
    baseline,
    current,
    results,
  };
  fs.writeFileSync('/tmp/lh-verdict.json', JSON.stringify(verdictOut, null, 2));

  // ── GitHub Actions step summary ───────────────────────────────────────────

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    const summaryLines = [
      `## 📊 Lighthouse Régression Guard — ${overallIcon} ${overallVerdict}`,
      '',
      `**Baseline :** \`${baseline.url}\` (${baseline.timestamp?.slice(0, 10) || 'N/A'})`,
      '',
      '| Métrique | Seuil | Baseline | Actuel | Delta | Verdict |',
      '|---|---|---|---|---|---|',
    ];
    for (const r of results) {
      const sign = r.delta >= 0 ? '+' : '';
      const vIcon = r.verdict === 'FAIL' ? '❌ FAIL' : r.verdict === 'WARN' ? '⚠️ WARN' : '✅ PASS';
      summaryLines.push(`| **${r.label.trim()}** | ≤ -${r.threshold} | ${r.prev} | ${r.curr} | ${sign}${r.delta} | ${vIcon} |`);
    }
    summaryLines.push('');
    summaryLines.push(`> Verdict final : **${overallVerdict}**`);
    try {
      fs.appendFileSync(summaryFile, summaryLines.join('\n') + '\n');
    } catch { /* ignore */ }
  }

  if (hasFail) {
    console.error('\n❌ Régression Lighthouse détectée : CI bloquée.');
    process.exit(1);
  }

  console.log(`\n${overallIcon} Aucune régression bloquante (seuils : perf -${THRESHOLDS.performance}, a11y -${THRESHOLDS.accessibility}, seo -${THRESHOLDS.seo}, bp -${THRESHOLDS.bestPractices}).`);
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
