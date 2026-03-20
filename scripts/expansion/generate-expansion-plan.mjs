import fs from 'node:fs';
import path from 'node:path';

const GENERATED_PAGES_PATH = 'frontend/src/data/seo/generated-pages.json';
const OUTPUT_DIR = 'scripts/expansion/output';

const TERRITORY_ADJACENCY = {
  GP: ['MQ', 'RE'],
  MQ: ['GP', 'GF'],
  GF: ['MQ', 'YT'],
  RE: ['GP', 'MQ'],
  YT: ['RE', 'GF'],
};

const TERRITORY_NAMES = {
  GP: 'Guadeloupe', MQ: 'Martinique', GF: 'Guyane', RE: 'Réunion', YT: 'Mayotte',
};

const TERRITORY_SLUGS = {
  GP: 'guadeloupe', MQ: 'martinique', GF: 'guyane', RE: 'reunion', YT: 'mayotte',
};

const PAGE_TYPE_PATTERNS = {
  'prix-local': {
    source: '/prix/{product}-{territoire}',
    reason: 'Page prix locale performante — étendre au territoire adjacent',
  },
  'comparaison-enseignes': {
    source: '/comparer/{enseigne1}-vs-{enseigne2}-{territoire}',
    reason: 'Comparaison populaire — reproduire pour territoire voisin',
  },
  'inflation-tendances': {
    source: '/inflation-alimentaire-{territoire}',
    reason: 'Page inflation avec bon engagement — dupliquer vers territoire adjacent',
  },
};

const generatedPages = JSON.parse(fs.readFileSync(GENERATED_PAGES_PATH, 'utf-8'));

const suggestions = [];

for (const [sourceTerritoire, targets] of Object.entries(TERRITORY_ADJACENCY)) {
  for (const targetTerritoire of targets) {
    let suggestionsForPair = 0;

    for (const [pageType, pattern] of Object.entries(PAGE_TYPE_PATTERNS)) {
      if (suggestionsForPair >= 3) break;

      const count = generatedPages.byType?.[pageType] ?? 0;
      if (count === 0) continue;

      const sourceSlug = TERRITORY_SLUGS[sourceTerritoire];
      const targetSlug = TERRITORY_SLUGS[targetTerritoire];

      const priority = count > 500 ? 'high' : count > 100 ? 'medium' : 'low';

      suggestions.push({
        sourcePattern: pattern.source.replace('{territoire}', sourceSlug),
        suggestedPattern: pattern.source.replace('{territoire}', targetSlug),
        sourceTerritoire: TERRITORY_NAMES[sourceTerritoire],
        targetTerritoire: TERRITORY_NAMES[targetTerritoire],
        pageType,
        reason: pattern.reason,
        priority,
      });

      suggestionsForPair++;
    }
  }
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const expansionPlan = {
  generatedAt: new Date().toISOString(),
  sourceData: generatedPages,
  totalSuggestions: suggestions.length,
  suggestions,
};

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'expansion-plan.json'),
  JSON.stringify(expansionPlan, null, 2),
  'utf-8',
);

const tableRow = (cols) => `| ${cols.join(' | ')} |`;
const tableSep = (n) => `|${Array(n).fill('------').join('|')}|`;

const byTypeRows = Object.entries(generatedPages.byType ?? {})
  .map(([type, count]) => tableRow([type, String(count)]))
  .join('\n');

const byTypeTable = [
  tableRow(['Type de page', 'Nombre']),
  tableSep(2),
  byTypeRows,
].join('\n');

const topSuggestions = suggestions.slice(0, 20);
const suggestionsRows = topSuggestions
  .map(s => tableRow([
    `${s.sourceTerritoire} → ${s.targetTerritoire}`,
    s.pageType,
    s.reason,
    s.priority === 'high' ? '🔴 High' : s.priority === 'medium' ? '🟡 Medium' : '🟢 Low',
  ]))
  .join('\n');

const suggestionsTable = [
  tableRow(['Source → Cible', 'Type', 'Raison', 'Priorité']),
  tableSep(4),
  suggestionsRows,
].join('\n');

const markdown = `# Plan d'Expansion Territorial — A KI PRI SA YÉ

Généré le : ${expansionPlan.generatedAt}
Total suggestions : ${suggestions.length}

## Résumé des pages existantes

${byTypeTable}

**Total pages :** ${generatedPages.totalPages}
**Produits :** ${generatedPages.products} | **Territoires :** ${generatedPages.territories} | **Enseignes :** ${generatedPages.retailers} | **Marques :** ${generatedPages.brands}

## Suggestions d'Expansion (top ${topSuggestions.length})

${suggestionsTable}
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'EXPANSION_PLAN.md'), markdown, 'utf-8');
console.log(`✅ Plan d'expansion écrit dans ${OUTPUT_DIR}/expansion-plan.json et EXPANSION_PLAN.md`);
