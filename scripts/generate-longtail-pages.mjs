/**
 * generate-longtail-pages.mjs
 *
 * Generates long-tail SEO page specifications for all product × territory
 * combinations.  Each spec describes a page that can be rendered by the
 * existing SEO route system (/comparateur/:slug etc.).
 *
 * Reads:   frontend/public/data/prices.json  (falls back to seed list)
 * Writes:  longtail-pages.json               (or --output=<path>)
 *
 * Usage:
 *   node scripts/generate-longtail-pages.mjs
 *   node scripts/generate-longtail-pages.mjs --output=./out.json --format=markdown
 *
 * Output per page spec:
 *   { slug, route, type, product, territory, h1, metaTitle, metaDescription }
 *
 * Page types generated:
 *   comparateur  — /comparateur/{product}-{territory}
 *   prix         — /prix-{product}-{retailer}-{territory}   (per retailer)
 *   meilleur-prix — /meilleur-prix-{product}-{territory}
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => a.slice(2).split('=')),
);

const OUTPUT = args.output ?? resolve(process.cwd(), 'longtail-pages.json');
const FORMAT = args.format ?? 'json';   // 'json' | 'markdown' | 'slugs'

// ── Territories ───────────────────────────────────────────────────────────────

const TERRITORIES = {
  guadeloupe: { code: 'gp', label: 'Guadeloupe' },
  martinique:  { code: 'mq', label: 'Martinique' },
  guyane:      { code: 'gf', label: 'Guyane'     },
  reunion:     { code: 're', label: 'Réunion'     },
};

// ── Load product list from prices.json, fall back to seed ────────────────────

const DATA_PATHS = [
  args.data,
  resolve(ROOT, 'frontend/public/data/prices.json'),
  resolve(ROOT, 'frontend/public/data/expanded-prices.json'),
  resolve(ROOT, 'public/data/prices.json'),
].filter(Boolean).map((p) => resolve(p));

const SEED_PRODUCTS = [
  'riz', 'lait', 'coca-cola', 'huile', 'sucre', 'farine',
  'beurre', 'yaourt', 'poulet', 'jambon', 'eau', 'jus-orange',
];

const SEED_RETAILERS = ['Carrefour', 'E.Leclerc', 'Super U'];

let products  = [...SEED_PRODUCTS];
let retailers = [...SEED_RETAILERS];

for (const p of DATA_PATHS) {
  if (!existsSync(p)) continue;
  try {
    const parsed = JSON.parse(readFileSync(p, 'utf8'));
    const items  = Array.isArray(parsed) ? parsed : Object.values(parsed).flat();
    if (items.length < 2) continue;

    const labels = [...new Set(
      items.map((i) => slugify(i.productLabel ?? i.productId ?? '')).filter(Boolean),
    )];
    const stores = [...new Set(
      items.map((i) => i.storeName).filter(Boolean),
    )];
    if (labels.length > 0) products  = labels;
    if (stores.length > 0) retailers = stores;
    break;
  } catch { /* try next */ }
}

// ── Slug helpers ──────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Page spec builders ────────────────────────────────────────────────────────

function comparateurPage(productSlug, territory, territoryMeta) {
  const slug  = `${productSlug}-${territory}`;
  const label = productSlug.replace(/-/g, ' ');
  const terr  = territoryMeta.label;
  return {
    type:            'comparateur',
    slug,
    route:           `/comparateur/${slug}`,
    product:         label,
    territory:       terr,
    territoryCode:   territoryMeta.code,
    h1:              `Prix ${label} en ${terr} — comparaison enseignes`,
    metaTitle:       `${label} prix ${terr} (comparateur) — A KI PRI SA YÉ`,
    metaDescription: `Comparez le prix de ${label} entre Carrefour, E.Leclerc et Super U en ${terr}. Trouvez le moins cher en 10 secondes.`,
  };
}

function meilleurPrixPage(productSlug, territory, territoryMeta) {
  const slug  = `${productSlug}-${territory}`;
  const label = productSlug.replace(/-/g, ' ');
  const terr  = territoryMeta.label;
  return {
    type:            'meilleur-prix',
    slug,
    route:           `/meilleur-prix-${slug}`,
    product:         label,
    territory:       terr,
    territoryCode:   territoryMeta.code,
    h1:              `Meilleur prix ${label} en ${terr} aujourd'hui`,
    metaTitle:       `Meilleur prix ${label} ${terr} — A KI PRI SA YÉ`,
    metaDescription: `Quel magasin vend ${label} le moins cher en ${terr} ? Réponse en 10 secondes.`,
  };
}

function retailerPrixPage(productSlug, retailer, territory, territoryMeta) {
  const retailerSlug = slugify(retailer);
  const slug         = `${productSlug}-${retailerSlug}-${territory}`;
  const label        = productSlug.replace(/-/g, ' ');
  const terr         = territoryMeta.label;
  return {
    type:            'prix-enseigne',
    slug,
    route:           `/prix-${slug}`,
    product:         label,
    retailer,
    territory:       terr,
    territoryCode:   territoryMeta.code,
    h1:              `Prix ${label} chez ${retailer} en ${terr}`,
    metaTitle:       `${label} prix ${retailer} ${terr} — A KI PRI SA YÉ`,
    metaDescription: `Prix actuel de ${label} chez ${retailer} en ${terr} comparé aux autres enseignes.`,
  };
}

// ── Generate all specs ────────────────────────────────────────────────────────

const pages = [];
const seenRoutes = new Set();
let duplicateCount = 0;

function pushPage(spec) {
  const key = spec.route ?? spec.slug;
  if (seenRoutes.has(key)) {
    duplicateCount++;
    console.error(`[generate-longtail-pages] ⚠️  Duplicate route skipped: ${key}`);
    return;
  }
  seenRoutes.add(key);
  pages.push(spec);
}

for (const product of products) {
  const productSlug = slugify(product);
  if (!productSlug) continue;

  for (const [territory, meta] of Object.entries(TERRITORIES)) {
    // Type A: comparateur page (1 per product × territory)
    pushPage(comparateurPage(productSlug, territory, meta));

    // Type B: meilleur-prix page (1 per product × territory)
    pushPage(meilleurPrixPage(productSlug, territory, meta));

    // Type C: per-retailer price page (1 per product × retailer × territory)
    for (const retailer of retailers) {
      pushPage(retailerPrixPage(productSlug, retailer, territory, meta));
    }
  }
}

if (duplicateCount > 0) {
  console.error(`[generate-longtail-pages] ❌ ${duplicateCount} duplicate route(s) detected and skipped.`);
  console.error('  Fix duplicate product names or retailer aliases before deploying.');
  // Non-fatal: continue with unique pages — validator will also report this.
}

// ── Output ────────────────────────────────────────────────────────────────────

if (FORMAT === 'slugs') {
  const text = pages.map((p) => p.route).join('\n');
  writeFileSync(OUTPUT.replace('.json', '.txt'), text, 'utf8');
  console.log(`[generate-longtail-pages] ✅ ${pages.length} slugs → ${OUTPUT.replace('.json', '.txt')}`);

} else if (FORMAT === 'markdown') {
  const lines = [
    `# Long-tail SEO Pages — ${new Date().toISOString().slice(0, 10)}`,
    '',
    `Total: **${pages.length} pages** across ${Object.keys(TERRITORIES).length} territories`,
    '',
    '| Route | H1 | Type |',
    '|-------|----|------|',
    ...pages.slice(0, 100).map((p) => `| \`${p.route}\` | ${p.h1} | ${p.type} |`),
    pages.length > 100 ? `| … | _${pages.length - 100} more_ | |` : '',
  ];
  writeFileSync(OUTPUT.replace('.json', '.md'), lines.join('\n'), 'utf8');
  console.log(`[generate-longtail-pages] ✅ ${pages.length} pages → ${OUTPUT.replace('.json', '.md')}`);

} else {
  const out = {
    generatedAt: new Date().toISOString(),
    total:       pages.length,
    territories: Object.keys(TERRITORIES),
    products:    products.length,
    retailers:   retailers.length,
    pages,
  };
  writeFileSync(OUTPUT, JSON.stringify(out, null, 2), 'utf8');
  console.log(`[generate-longtail-pages] ✅ ${pages.length} pages → ${OUTPUT}`);
}

// Summary breakdown
const byType = pages.reduce((acc, p) => {
  acc[p.type] = (acc[p.type] ?? 0) + 1;
  return acc;
}, {});
for (const [type, count] of Object.entries(byType)) {
  console.log(`  ${type}: ${count} pages`);
}
