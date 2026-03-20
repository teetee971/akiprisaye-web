import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = 'scripts/outreach/output';

const LINKABLE_ASSETS = [
  { url: '/guide-prix-alimentaire-dom', title: 'Guide Prix Alimentaire DOM', pageType: 'pillar', internalLinks: 12, pageViews: 180, backlinksCount: 3, outreachStatus: 'won', authorityScore: 79 },
  { url: '/comparateur-supermarches-dom', title: 'Comparateur Supermarchés DOM', pageType: 'comparison', internalLinks: 8, pageViews: 220, backlinksCount: 6, outreachStatus: 'won', authorityScore: 89 },
  { url: '/inflation-alimentaire-dom', title: 'Inflation Alimentaire DOM', pageType: 'pillar', internalLinks: 9, pageViews: 160, backlinksCount: 5, outreachStatus: 'contacted', authorityScore: 75 },
  { url: '/ou-faire-courses-dom', title: 'Où Faire ses Courses DOM', pageType: 'pillar', internalLinks: 7, pageViews: 140, backlinksCount: 2, outreachStatus: 'new', authorityScore: 52 },
  { url: '/prix/coca-cola-1-5l-guadeloupe', title: 'Prix Coca-Cola Guadeloupe', pageType: 'product', internalLinks: 3, pageViews: 120, backlinksCount: 1, outreachStatus: 'new', authorityScore: 41 },
  { url: '/prix/huile-tournesol-martinique', title: 'Prix Huile Tournesol Martinique', pageType: 'product', internalLinks: 2, pageViews: 55, backlinksCount: 0, outreachStatus: 'new', authorityScore: 26 },
  { url: '/comparer/carrefour-vs-leclerc-guadeloupe', title: 'Carrefour vs Leclerc Guadeloupe', pageType: 'comparison', internalLinks: 6, pageViews: 200, backlinksCount: 4, outreachStatus: 'contacted', authorityScore: 82 },
  { url: '/prix/farine-ble-guyane', title: 'Prix Farine Blé Guyane', pageType: 'product', internalLinks: 1, pageViews: 30, backlinksCount: 0, outreachStatus: 'new', authorityScore: 14 },
  { url: '/categorie/produits-laitiers-reunion', title: 'Produits Laitiers Réunion', pageType: 'category', internalLinks: 4, pageViews: 78, backlinksCount: 1, outreachStatus: 'new', authorityScore: 37 },
  { url: '/inflation/alimentation-guadeloupe-2024', title: 'Inflation Alimentation Guadeloupe 2024', pageType: 'inflation', internalLinks: 5, pageViews: 95, backlinksCount: 2, outreachStatus: 'contacted', authorityScore: 50 },
];

function computeAction(asset) {
  if (asset.pageViews > 30 && asset.backlinksCount < 2) {
    return { action: 'OUTREACH_NOW', actionPriority: 'high' };
  }
  if ((asset.pageType === 'pillar' || asset.pageType === 'comparison') && asset.authorityScore > 60) {
    return { action: 'PROMOTE_PAGE', actionPriority: 'high' };
  }
  if (asset.internalLinks < 5 && asset.authorityScore > 40) {
    return { action: 'BOOST_INTERNAL_LINKING', actionPriority: 'medium' };
  }
  return { action: 'STRENGTHEN_CONTENT', actionPriority: 'low' };
}

const assets = LINKABLE_ASSETS.map(asset => ({ ...asset, ...computeAction(asset) }));

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const linkableAssetsOutput = {
  generatedAt: new Date().toISOString(),
  totalAssets: assets.length,
  assets,
};

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'linkable-assets.json'),
  JSON.stringify(linkableAssetsOutput, null, 2),
  'utf-8',
);

const tableRow = (cols) => `| ${cols.join(' | ')} |`;
const tableSep = (n) => `|${Array(n).fill('------').join('|')}|`;

const sortedByScore = [...assets].sort((a, b) => b.authorityScore - a.authorityScore);

const dashboardRows = sortedByScore
  .map(a => tableRow([
    String(a.authorityScore),
    `\`${a.url}\``,
    a.pageType,
    String(a.backlinksCount),
    a.outreachStatus,
    a.action,
  ]))
  .join('\n');

const dashboardTable = [
  tableRow(['Score', 'URL', 'Type', 'Backlinks', 'Statut', 'Action']),
  tableSep(6),
  dashboardRows,
].join('\n');

const actionGroups = {
  OUTREACH_NOW: assets.filter(a => a.action === 'OUTREACH_NOW'),
  PROMOTE_PAGE: assets.filter(a => a.action === 'PROMOTE_PAGE'),
  BOOST_INTERNAL_LINKING: assets.filter(a => a.action === 'BOOST_INTERNAL_LINKING'),
  STRENGTHEN_CONTENT: assets.filter(a => a.action === 'STRENGTHEN_CONTENT'),
};

const formatActionList = (list) =>
  list.length > 0
    ? list.map(a => `- \`${a.url}\` — ${a.title} (score: ${a.authorityScore})`).join('\n')
    : '_Aucun asset dans cette catégorie._';

const markdown = `# Assets Linkables — Classement Autorité

Généré le : ${linkableAssetsOutput.generatedAt}
Total assets : ${assets.length}

## Tableau de Bord

${dashboardTable}

## Actions Recommandées

### ⚡ OUTREACH_NOW
${formatActionList(actionGroups.OUTREACH_NOW)}

### 🚀 PROMOTE_PAGE
${formatActionList(actionGroups.PROMOTE_PAGE)}

### 🔗 BOOST_INTERNAL_LINKING
${formatActionList(actionGroups.BOOST_INTERNAL_LINKING)}

### 📝 STRENGTHEN_CONTENT
${formatActionList(actionGroups.STRENGTHEN_CONTENT)}
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'LINKABLE_ASSETS.md'), markdown, 'utf-8');
console.log(`✅ Assets linkables écrits dans ${OUTPUT_DIR}/linkable-assets.json et LINKABLE_ASSETS.md`);
