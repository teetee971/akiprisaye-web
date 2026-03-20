/**
 * export-pr-plan.mjs — Export human-readable review plan and PR metadata.
 * Reads recommendations.json + patch-plan.json.
 * Writes AUTO_SEO_PLAN.md, pr-title.txt, pr-body.md.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'output');

const recs = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'recommendations.json'), 'utf-8'));
const patches = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'patch-plan.json'), 'utf-8'));

const now = new Date().toISOString();
const high = recs.filter((r) => r.priority === 'high');
const dups = recs.filter((r) => r.type === 'DUPLICATE_PAGE');
const ctas = recs.filter((r) => r.type === 'BOOST_CTA');
const deprioritize = recs.filter((r) => r.type === 'DEPRIORITIZE');

function truncate(str, n = 50) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

const tableHeader = '| URL | Action | Reason | Expected Impact |\n|-----|--------|--------|-----------------|';
const highTable = high.slice(0, 20).map((r) =>
  `| ${truncate(r.url, 45)} | ${r.type} | ${truncate(r.reason, 60)} | ${r.expectedImpact ?? '—'} |`
).join('\n');

const dupSection = dups.length > 0
  ? dups.map((r) => `- **${r.url}** → \`${r.suggestedTarget ?? 'TBD'}\` — ${r.reason}`).join('\n')
  : '_Aucune opportunité de duplication détectée._';

const ctaSection = ctas.length > 0
  ? ctas.map((r) => `- **${r.url}** — ${r.reason}`).join('\n')
  : '_Aucune page à booster en CTA._';

const depSection = deprioritize.length > 0
  ? deprioritize.map((r) => `- **${r.url}** — ${r.reason}`).join('\n')
  : '_Aucune page à déprioritiser._';

const patchedFiles = [...new Set(patches.map((p) => p.file))];
const filesSection = patchedFiles.map((f) => {
  const count = patches.filter((p) => p.file === f).length;
  return `- \`${f}\` — ${count} modification(s)`;
}).join('\n');

const plan = `# Auto SEO Optimization Plan

> **REVIEW ONLY** — Ce plan est généré automatiquement. Aucune modification n'est appliquée sans validation humaine.

## Summary

- **Généré le :** ${now}
- **Total de recommandations :** ${recs.length}
- **Haute priorité :** ${high.length} (plafonnées à 20)
- **Opportunités de duplication :** ${dups.length}
- **Pages CTA à booster :** ${ctas.length}
- **Pages à déprioritiser :** ${deprioritize.length}
- **Fichiers impactés :** ${patchedFiles.length}

## High Priority Actions

${tableHeader}
${highTable || '| — | — | — | — |'}

## Duplication Opportunities

${dupSection}

## CTA Boost Opportunities

${ctaSection}

## Pages to Deprioritize

${depSection}

## Files to Patch

${filesSection || '_Aucun fichier à patcher._'}

---
_Généré par scripts/auto-seo/export-pr-plan.mjs_
`;

const title = `auto-seo: weekly SEO optimization — ${recs.length} actions`;

const body = `## 🤖 Auto SEO Weekly Optimization

> **REVIEW ONLY** — Ce PR est généré automatiquement à titre de revue. Il doit être validé par un humain avant tout merge.

### Résumé

Ce plan d'optimisation SEO automatique a été généré le **${now}**.

| Métrique | Valeur |
|----------|--------|
| Total recommandations | ${recs.length} |
| Haute priorité | ${high.length} |
| Duplications suggérées | ${dups.length} |
| CTA à booster | ${ctas.length} |
| Pages à déprioritiser | ${deprioritize.length} |

### Fichiers concernés

${patchedFiles.map((f) => `- \`${f}\``).join('\n')}

### Guardrails appliqués

- ✅ Maximum 20 actions haute priorité
- ✅ Maximum 10 duplications
- ✅ Fichiers cibles limités à la whitelist
- ✅ Toutes les recommandations ont une raison documentée

### Revue requise

Consulter \`AUTO_SEO_PLAN.md\` pour le détail complet des actions.

---
_Généré automatiquement — ne pas merger sans revue humaine_
`;

fs.writeFileSync(path.join(OUT_DIR, 'AUTO_SEO_PLAN.md'), plan);
fs.writeFileSync(path.join(OUT_DIR, 'pr-title.txt'), title);
fs.writeFileSync(path.join(OUT_DIR, 'pr-body.md'), body);

console.log(`[export-pr-plan] ✅ AUTO_SEO_PLAN.md written (${recs.length} recs, ${patchedFiles.length} files)`);
console.log(`[export-pr-plan] ✅ pr-title.txt: "${title}"`);
console.log(`[export-pr-plan] ✅ pr-body.md written`);
