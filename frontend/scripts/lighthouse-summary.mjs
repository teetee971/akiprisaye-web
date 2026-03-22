#!/usr/bin/env node
/**
 * lighthouse-summary.mjs
 *
 * Résumé exécutif Lighthouse CI — dashboard compact pour GitHub Actions.
 *
 * Affiche dans les logs CI et dans $GITHUB_STEP_SUMMARY (panneau "Summary") :
 *   — Verdict global + Quality Score
 *   — URL auditée et source
 *   — Tableau métriques (score, seuil absolu, statut)
 *   — Budgets (si disponibles via le verdict)
 *   — Tendance (si historique disponible)
 *   — Diagnostics actionnables
 *   — Note override si label actif
 *   — Note fallback localhost si applicable
 *   — Mention artefacts
 *
 * Ce script ne fait JAMAIS échouer la CI.
 *
 * Usage : node scripts/lighthouse-summary.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { METRIC_CONFIG, VERDICT, QUALITY_SCORE_THRESHOLDS } from './lighthouse-engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir       = path.resolve(process.cwd(), '.lighthouseci');
const sep       = '─'.repeat(70);

// ─── Lecture des données ───────────────────────────────────────────────────────

if (!fs.existsSync(dir)) {
  console.log('Aucun rapport Lighthouse trouvé dans .lighthouseci/');
  process.exit(0);
}

const reports = fs.readdirSync(dir).filter(f => /report\.json$/.test(f));
if (!reports.length) {
  console.log('Aucun fichier .report.json trouvé dans .lighthouseci/');
  process.exit(0);
}

// Verdict complet depuis le moteur (si disponible)
let verdictData = null;
try {
  const verdictPath = '/tmp/lh-verdict.json';
  if (fs.existsSync(verdictPath)) {
    verdictData = JSON.parse(fs.readFileSync(verdictPath, 'utf8'));
  }
} catch { /* non bloquant */ }

// ─── Affichage console ─────────────────────────────────────────────────────────

console.log('\n' + sep);
console.log('  LIGHTHOUSE CI — RÉSUMÉ EXÉCUTIF');
console.log(sep);

const summaryLines = [];

for (const file of reports) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const url  = data.finalUrl || data.requestedUrl || file;
  const perf = Math.round(data.categories.performance.score * 100);
  const a11y = Math.round(data.categories.accessibility.score * 100);
  const bp   = Math.round(data.categories['best-practices'].score * 100);
  const seo  = Math.round(data.categories.seo.score * 100);
  // Statut par rapport au seuil absolu (METRIC_CONFIG.absoluteMin — source unique de vérité).
  // Si absoluteMin est null, pas de seuil absolu → toujours affiché sans icône de statut.
  const okAbsolute = (v, key) => {
    const min = METRIC_CONFIG[key]?.absoluteMin;
    return min !== null && min !== undefined ? (v >= min ? '✅' : '❌') : null;
  };

  // Verdict et Quality Score depuis le moteur ou affichage simple
  const verdict      = verdictData?.verdict ?? null;
  const qualityScore = verdictData?.qualityScore ?? null;
  const urlInfo      = verdictData?.urlInfo ?? {};
  const hasOverride  = verdictData?.hasOverride ?? false;
  const trendInfo    = verdictData?.trendInfo ?? null;
  const diagnostics  = verdictData?.diagnostics ?? [];

  const verdictIcon  = verdict === VERDICT.FAIL ? '❌' : verdict === VERDICT.WARN ? '⚠️ ' : verdict === VERDICT.NO_BASELINE ? 'ℹ️ ' : verdict === VERDICT.PASS ? '✅' : '';

  // Console log
  console.log('');
  if (verdict) console.log(`  ${verdictIcon} Verdict global : ${verdict}`);
  if (qualityScore !== null) console.log(`  📊 Quality Score : ${qualityScore}/100  (≥ ${QUALITY_SCORE_THRESHOLDS.pass} PASS, ≥ ${QUALITY_SCORE_THRESHOLDS.warn} WARN, < ${QUALITY_SCORE_THRESHOLDS.warn} FAIL)`);
  console.log('  URL auditée    : ' + (urlInfo.auditedUrl || url));
  if (urlInfo.urlSource) console.log('  Source         : ' + urlInfo.urlSource);
  if (urlInfo.wasFallback) console.log('  ⚠️  Fallback localhost utilisé');
  if (urlInfo.crossContext) console.log('  ⚠️  Comparaison cross-context');
  if (hasOverride) console.log('  ⚠️  Override label ci:override-lighthouse actif');
  console.log('');
  console.log('  Performance    : ' + (okAbsolute(perf, 'performance')  ?? '·') + '  ' + perf + ' / 100  (seuil absolu : ' + (METRIC_CONFIG.performance.absoluteMin  !== null ? `≥ ${METRIC_CONFIG.performance.absoluteMin}`  : '—') + ')');
  console.log('  Accessibilité  : ' + (okAbsolute(a11y, 'accessibility') ?? '·') + '  ' + a11y + ' / 100  (seuil absolu : ' + (METRIC_CONFIG.accessibility.absoluteMin !== null ? `≥ ${METRIC_CONFIG.accessibility.absoluteMin}` : '—') + ')');
  console.log('  Best Practices : ' + (okAbsolute(bp,   'bestPractices') ?? '·') + '  ' + bp   + ' / 100  (seuil absolu : ' + (METRIC_CONFIG.bestPractices.absoluteMin  !== null ? `≥ ${METRIC_CONFIG.bestPractices.absoluteMin}`  : '—') + ')');
  console.log('  SEO            : ' + (okAbsolute(seo,  'seo')           ?? '·') + '  ' + seo  + ' / 100  (seuil absolu : ' + (METRIC_CONFIG.seo.absoluteMin           !== null ? `≥ ${METRIC_CONFIG.seo.absoluteMin}`           : '—') + ')');

  if (trendInfo?.trends) {
    console.log('');
    console.log('  Tendance :');
    for (const [key, t] of Object.entries(trendInfo.trends)) {
      const cfg = METRIC_CONFIG[key];
      const tIcon = t.trend === 'up' ? '📈' : t.trend === 'down' ? '📉' : '➡️';
      console.log(`    ${tIcon} ${cfg?.label ?? key} : ${t.trend} (pente: ${t.slope})`);
    }
  }

  if (diagnostics.length > 0) {
    console.log('');
    console.log('  Causes :');
    for (const d of diagnostics) console.log(`    — ${d}`);
  }

  // Markdown pour GITHUB_STEP_SUMMARY
  summaryLines.push(
    verdict ? `## ${verdictIcon} Lighthouse CI — ${verdict}` : '## 🔦 Lighthouse CI — Résumé',
    '',
  );

  if (qualityScore !== null || verdict) {
    summaryLines.push(
      '| | |',
      '|---|---|',
    );
    if (verdict)           summaryLines.push(`| **Verdict** | **${verdict}** |`);
    if (qualityScore !== null) summaryLines.push(`| **Quality Score** | **${qualityScore}/100** |`);
    summaryLines.push(
      `| **URL auditée** | \`${urlInfo.auditedUrl || url}\` |`,
      `| **Source** | \`${urlInfo.urlSource || 'N/A'}\` |`,
    );
    if (urlInfo.wasFallback)  summaryLines.push(`| **⚠️ Fallback** | Localhost utilisé (CDN non disponible) |`);
    if (urlInfo.crossContext)  summaryLines.push(`| **⚠️ Cross-context** | Comparaison localhost vs baseline CDN |`);
    if (hasOverride)           summaryLines.push(`| **⚠️ Override** | Label \`ci:override-lighthouse\` actif |`);
    summaryLines.push('');
  }

  summaryLines.push(
    '### Métriques',
    '',
    '| Métrique | Score | Seuil absolu | Statut |',
    '|---|---|---|---|',
    `| **Performance** | ${perf} / 100 | ${METRIC_CONFIG.performance.absoluteMin  !== null ? `≥ ${METRIC_CONFIG.performance.absoluteMin}`  : '—'} | ${okAbsolute(perf, 'performance')  ?? '—'} |`,
    `| **Accessibilité** | ${a11y} / 100 | ${METRIC_CONFIG.accessibility.absoluteMin !== null ? `≥ ${METRIC_CONFIG.accessibility.absoluteMin}` : '—'} | ${okAbsolute(a11y, 'accessibility') ?? '—'} |`,
    `| **Best Practices** | ${bp} / 100 | ${METRIC_CONFIG.bestPractices.absoluteMin  !== null ? `≥ ${METRIC_CONFIG.bestPractices.absoluteMin}`  : '—'} | ${okAbsolute(bp,   'bestPractices') ?? '—'} |`,
    `| **SEO** | ${seo} / 100 | ${METRIC_CONFIG.seo.absoluteMin !== null ? `≥ ${METRIC_CONFIG.seo.absoluteMin}` : '—'} | ${okAbsolute(seo, 'seo') ?? '—'} |`,
    '',
    `**URL testée :** \`${urlInfo.auditedUrl || url}\``,
    '',
  );

  // Budgets
  const budgets = verdictData?.budgets ?? [];
  if (budgets.length > 0) {
    summaryLines.push(
      '### Budgets',
      '',
      '| Ressource | Actuel | Budget | Statut |',
      '|---|---|---|---|',
    );
    for (const b of budgets) {
      const icon = b.exceeded ? (b.level === 'error' ? '❌' : '⚠️') : '✅';
      summaryLines.push(`| **${b.label}** | ${b.actual} ${b.unit} | ${b.budget} ${b.unit} | ${icon} |`);
    }
    summaryLines.push('');
  }

  // Tendance
  if (trendInfo?.trends) {
    summaryLines.push('### Tendance', '');
    for (const [key, t] of Object.entries(trendInfo.trends)) {
      const cfg  = METRIC_CONFIG[key];
      const tIcon = t.trend === 'up' ? '📈' : t.trend === 'down' ? '📉' : '➡️';
      summaryLines.push(`- **${cfg?.label ?? key}** : ${tIcon} ${t.trend} (pente: ${t.slope})`);
    }
    summaryLines.push('');
  }

  // Diagnostics
  if (diagnostics.length > 0) {
    summaryLines.push('### Causes détectées', '');
    for (const d of diagnostics) summaryLines.push(`- ${d}`);
    summaryLines.push('');
  }

  summaryLines.push('> 📦 Rapports JSON + HTML disponibles dans les **Artifacts** du job CI (`lighthouse-reports`).');

  if (hasOverride) {
    summaryLines.push('', '> ⚠️ **Override actif** : label `ci:override-lighthouse` présent — un FAIL a été converti en WARN.');
  }
}

console.log('\n' + sep + '\n');

// ─── Écriture GITHUB_STEP_SUMMARY ─────────────────────────────────────────────

const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) {
  try {
    fs.appendFileSync(summaryFile, summaryLines.join('\n') + '\n');
    console.log('✅ Résumé Lighthouse écrit dans le job summary GitHub Actions.');
  } catch (err) {
    console.warn('⚠️  Impossible d\'écrire dans GITHUB_STEP_SUMMARY :', err.message);
  }
}
