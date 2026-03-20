import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = 'scripts/seo-loop/output';
const ACTIONS_REPORT_PATH = path.join(OUTPUT_DIR, 'actions-report.json');

const mockData = {
  generatedAt: new Date().toISOString(),
  metricsCount: 10,
  actions: [
    { type: 'IMPROVE_TITLE', priority: 'high', url: '/prix/coca-cola-1-5l-guadeloupe', reason: 'CTR 0.67% trop bas malgré 1200 impressions' },
    { type: 'DUPLICATE_PAGE', priority: 'high', url: '/comparer/carrefour-vs-leclerc-guadeloupe', reason: 'CTR 6.9% excellent — dupliquer vers martinique', suggestedTarget: '/comparer/carrefour-vs-leclerc-martinique' },
    { type: 'BOOST_LINKING', priority: 'medium', url: '/guide-prix-alimentaire-dom', reason: 'Renforcer maillage interne' },
    { type: 'BOOST_CTA', priority: 'high', url: '/comparateur-supermarches-dom', reason: '220 vues mais seulement 5 clics affiliés' },
    { type: 'ENRICH_CONTENT', priority: 'medium', url: '/categorie/produits-laitiers-reunion', reason: 'Page category avec seulement 8 vues' },
    { type: 'DEPRIORITIZE', priority: 'low', url: '/prix/sucre-roux-mayotte', reason: 'Page sans trafic (40 impressions, 0 clics)' },
    { type: 'IMPROVE_TITLE', priority: 'high', url: '/inflation/alimentation-guadeloupe-2024', reason: 'CTR 2.2% sous le seuil' },
    { type: 'BOOST_LINKING', priority: 'low', url: '/prix/farine-ble-guyane', reason: 'Renforcer visibilité interne' },
    { type: 'DUPLICATE_PAGE', priority: 'high', url: '/inflation-alimentaire-dom', reason: 'Score élevé — étendre à autres territoires', suggestedTarget: '/inflation-alimentaire-martinique' },
    { type: 'BOOST_CTA', priority: 'high', url: '/prix/huile-tournesol-martinique', reason: '55 vues mais 0 clics affiliés' },
  ],
};

const data = fs.existsSync(ACTIONS_REPORT_PATH)
  ? JSON.parse(fs.readFileSync(ACTIONS_REPORT_PATH, 'utf-8'))
  : mockData;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const { generatedAt, metricsCount, actions } = data;

const highActions = actions.filter(a => a.priority === 'high');
const mediumActions = actions.filter(a => a.priority === 'medium');
const lowActions = actions.filter(a => a.priority === 'low');
const duplicateActions = actions.filter(a => a.type === 'DUPLICATE_PAGE');
const deprioritizeActions = actions.filter(a => a.type === 'DEPRIORITIZE');
const topHighActions = highActions.slice(0, 20);

const tableRow = (cols) => `| ${cols.join(' | ')} |`;
const tableSep = (n) => `|${Array(n).fill('------').join('|')}|`;

const highTable = [
  tableRow(['URL', 'Type', 'Raison']),
  tableSep(3),
  ...topHighActions.map(a => tableRow([`\`${a.url}\``, a.type, a.reason])),
].join('\n');

const dupTable = duplicateActions.length > 0
  ? [
      tableRow(['URL Source', 'URL Suggérée', 'Raison']),
      tableSep(3),
      ...duplicateActions.map(a => tableRow([`\`${a.url}\``, a.suggestedTarget ? `\`${a.suggestedTarget}\`` : '—', a.reason])),
    ].join('\n')
  : '_Aucune opportunité de duplication détectée._';

const deprioritizeList = deprioritizeActions.length > 0
  ? deprioritizeActions.map(a => `- \`${a.url}\` — ${a.reason}`).join('\n')
  : '_Aucune page à déprioritiser._';

const markdown = `# Plan d'Action SEO — A KI PRI SA YÉ

Généré le : ${generatedAt}
Métriques analysées : ${metricsCount}

## Résumé

| Priorité | Nombre d'actions |
|----------|-----------------|
| 🔴 High  | ${highActions.length}         |
| 🟡 Medium| ${mediumActions.length}         |
| 🟢 Low   | ${lowActions.length}         |

## ⚡ Actions Haute Priorité (Top 20)

${highTable}

## 🔁 Opportunités de Duplication

${dupTable}

## ⬇️ Pages à Déprioritiser

${deprioritizeList}
`;

const outputPath = path.join(OUTPUT_DIR, 'SEO_ACTION_PLAN.md');
fs.writeFileSync(outputPath, markdown, 'utf-8');
console.log(`✅ Plan d'action SEO écrit dans ${outputPath}`);
