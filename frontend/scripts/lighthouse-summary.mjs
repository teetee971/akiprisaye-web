#!/usr/bin/env node
/**
 * lighthouse-summary.mjs
 *
 * Affiche un résumé lisible des rapports Lighthouse CI dans les logs CI.
 * Lit les fichiers *.report.json produits par @lhci/cli (target: filesystem)
 * depuis le répertoire .lighthouseci/ (relatif au cwd courant).
 *
 * Écrit également un résumé Markdown dans $GITHUB_STEP_SUMMARY si disponible
 * (visible dans le panneau "Summary" de GitHub Actions).
 *
 * Usage : node scripts/lighthouse-summary.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir       = path.resolve(process.cwd(), '.lighthouseci');
const sep       = '─'.repeat(60);

if (!fs.existsSync(dir)) {
  console.log('Aucun rapport Lighthouse trouvé dans .lighthouseci/');
  process.exit(0);
}

const reports = fs.readdirSync(dir).filter(f => /report\.json$/.test(f));

if (!reports.length) {
  console.log('Aucun fichier .report.json trouvé dans .lighthouseci/');
  process.exit(0);
}

console.log('\n' + sep);
console.log('  LIGHTHOUSE CI — RÉSUMÉ');
console.log(sep);

const summaryLines = [
  '## 🔦 Lighthouse CI — Résumé\n',
  '| Métrique | Score | Seuil | Statut |',
  '|---|---|---|---|',
];

for (const file of reports) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const url  = data.finalUrl || data.requestedUrl || file;
  const perf = Math.round(data.categories.performance.score * 100);
  const a11y = Math.round(data.categories.accessibility.score * 100);
  const bp   = Math.round(data.categories['best-practices'].score * 100);
  const seo  = Math.round(data.categories.seo.score * 100);
  const ok   = (v, t) => v >= t ? '✅' : '❌';

  // Console log
  console.log('\n  URL            : ' + url);
  console.log('  Performance    : ' + ok(perf, 80) + '  ' + perf + ' / 100  (seuil ≥ 80, warn)');
  console.log('  Accessibilité  : ' + ok(a11y, 90) + '  ' + a11y + ' / 100  (seuil ≥ 90, error)');
  console.log('  Best Practices : ' + bp + ' / 100');
  console.log('  SEO            : ' + ok(seo, 80) + '  ' + seo + ' / 100  (seuil ≥ 80, warn)');

  // Markdown for GitHub Actions step summary
  summaryLines.push(`| **Performance** | ${perf} / 100 | ≥ 80 | ${ok(perf, 80)} warn |`);
  summaryLines.push(`| **Accessibilité** | ${a11y} / 100 | ≥ 90 | ${ok(a11y, 90)} error |`);
  summaryLines.push(`| **Best Practices** | ${bp} / 100 | — | — |`);
  summaryLines.push(`| **SEO** | ${seo} / 100 | ≥ 80 | ${ok(seo, 80)} warn |`);
  summaryLines.push('');
  summaryLines.push(`**URL testée :** \`${url}\``);
  summaryLines.push('');
  summaryLines.push('> 📦 Rapports JSON + HTML disponibles dans les **Artifacts** du job CI (`lighthouse-reports`).');
}

console.log('\n' + sep + '\n');

// Write to GitHub Actions step summary if available
const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) {
  try {
    fs.appendFileSync(summaryFile, summaryLines.join('\n') + '\n');
    console.log('✅ Résumé Lighthouse écrit dans le job summary GitHub Actions.');
  } catch (err) {
    console.warn('⚠️  Impossible d\'écrire dans GITHUB_STEP_SUMMARY :', err.message);
  }
}
