/**
 * generate-seo-pages.mjs — SEO page URL generator
 *
 * Generates hundreds of long-tail SEO pages across:
 *   1. Local product price pages  (/prix/<product>-<territory>)
 *   2. Retailer comparison pages  (/comparer/<r1>-vs-<r2>-<territory>)
 *   3. Inflation trend pages      (/inflation/<category>-<territory>-<year>)
 *   4. Cheapest products pages    (/moins-cher/<territory>)
 *
 * Usage:
 *   node scripts/generate-seo-pages.mjs
 *   node scripts/generate-seo-pages.mjs --json      # output JSON manifest
 *   node scripts/generate-seo-pages.mjs --sitemap   # output sitemap entries
 *
 * Output: seo-pages-manifest.json (list of all generated URLs + metadata)
 */

import fs from 'fs';

// ── Site constants ─────────────────────────────────────────────────────────────

const SITE_URL = 'https://teetee971.github.io/akiprisaye-web';

// ── Territories (DROM focus for SEO priority) ─────────────────────────────────

const TERRITORIES = [
  { code: 'GP', name: 'guadeloupe',  label: 'Guadeloupe' },
  { code: 'MQ', name: 'martinique',  label: 'Martinique' },
  { code: 'GF', name: 'guyane',      label: 'Guyane' },
  { code: 'RE', name: 'reunion',     label: 'La Réunion' },
  { code: 'YT', name: 'mayotte',     label: 'Mayotte' },
];

// ── Product catalog (top long-tail products) ──────────────────────────────────

const PRODUCTS = [
  // Boissons
  { slug: 'coca-cola-1-5l',         name: 'Coca-Cola 1,5L',         category: 'boissons' },
  { slug: 'eau-evian-1-5l',         name: 'Eau Évian 1,5L',         category: 'boissons' },
  { slug: 'jus-orange-tropicana',   name: 'Jus Orange Tropicana',   category: 'boissons' },
  { slug: 'biere-lorraine-50cl',    name: 'Bière Lorraine 50cl',    category: 'boissons' },
  { slug: 'rhum-clement-70cl',      name: 'Rhum Clément 70cl',      category: 'boissons' },
  // Produits laitiers
  { slug: 'lait-entier-1l',         name: 'Lait entier 1L',         category: 'produits-laitiers' },
  { slug: 'yaourt-nature-danone',   name: 'Yaourt Nature Danone',   category: 'produits-laitiers' },
  { slug: 'beurre-president-250g',  name: 'Beurre Président 250g',  category: 'produits-laitiers' },
  { slug: 'fromage-emmental-200g',  name: 'Emmental râpé 200g',     category: 'produits-laitiers' },
  // Épicerie
  { slug: 'riz-basmati-1kg',        name: 'Riz Basmati 1kg',        category: 'epicerie' },
  { slug: 'pates-panzani-500g',     name: 'Pâtes Panzani 500g',     category: 'epicerie' },
  { slug: 'huile-tournesol-1l',     name: 'Huile Tournesol 1L',     category: 'epicerie' },
  { slug: 'nutella-400g',           name: 'Nutella 400g',           category: 'epicerie' },
  { slug: 'sucre-blanc-1kg',        name: 'Sucre blanc 1kg',        category: 'epicerie' },
  { slug: 'farine-ble-1kg',         name: 'Farine de blé 1kg',      category: 'epicerie' },
  { slug: 'sauce-tomate-400g',      name: 'Sauce Tomate 400g',      category: 'epicerie' },
  { slug: 'conserve-thon-160g',     name: 'Thon en boîte 160g',     category: 'epicerie' },
  // Viande & Poisson
  { slug: 'poulet-entier-kg',       name: 'Poulet entier /kg',      category: 'viande' },
  { slug: 'steak-hache-400g',       name: 'Steak haché 400g',       category: 'viande' },
  { slug: 'jambon-blanc-4tr',       name: 'Jambon blanc 4 tranches', category: 'viande' },
  // Fruits & Légumes
  { slug: 'banane-kg',              name: 'Banane /kg',             category: 'fruits-legumes' },
  { slug: 'tomate-kg',              name: 'Tomate /kg',             category: 'fruits-legumes' },
  { slug: 'pomme-de-terre-kg',      name: 'Pomme de terre /kg',     category: 'fruits-legumes' },
  // Hygiène & Entretien
  { slug: 'lessive-ariel-30d',      name: 'Lessive Ariel 30 doses', category: 'entretien' },
  { slug: 'shampoing-head-shoulders', name: 'Shampooing Head & Shoulders', category: 'hygiene' },
  { slug: 'dentifrice-colgate-75ml', name: 'Dentifrice Colgate 75ml', category: 'hygiene' },
  // Bébé
  { slug: 'couches-pampers-t3',     name: 'Couches Pampers T3',     category: 'bebe' },
  { slug: 'lait-bebe-guigoz-1',     name: 'Lait bébé Guigoz 1',     category: 'bebe' },
  // Pain
  { slug: 'pain-de-mie-650g',       name: 'Pain de mie 650g',       category: 'pain-patisserie' },
];

// ── Retailers (main DOM-TOM supermarkets) ─────────────────────────────────────

const RETAILERS = [
  { slug: 'carrefour',    name: 'Carrefour' },
  { slug: 'leclerc',      name: 'E.Leclerc' },
  { slug: 'super-u',      name: 'Super U' },
  { slug: 'leader-price', name: 'Leader Price' },
  { slug: 'intermarche',  name: 'Intermarché' },
  { slug: 'simply-market', name: 'Simply Market' },
];

// ── Categories ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: 'alimentaire',      name: 'Alimentaire' },
  { slug: 'boissons',         name: 'Boissons' },
  { slug: 'produits-laitiers', name: 'Produits Laitiers' },
  { slug: 'viande',           name: 'Viande' },
  { slug: 'epicerie',         name: 'Épicerie' },
  { slug: 'hygiene-entretien', name: 'Hygiène & Entretien' },
  { slug: 'fruits-legumes',   name: 'Fruits & Légumes' },
  { slug: 'bebe',             name: 'Bébé' },
];

// ── Years (current + last 2 years) ───────────────────────────────────────────

const YEARS = ['2024', '2025', '2026'];

// ── Slug helper ────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Page generators ────────────────────────────────────────────────────────────

/**
 * 1. Local product price pages — /prix/<product-slug>-<territory-name>
 *    Ex: /prix/coca-cola-1-5l-guadeloupe
 *    Target: "prix coca cola guadeloupe", "prix nutella martinique"
 */
function generatePrixPages() {
  const pages = [];
  for (const product of PRODUCTS) {
    for (const territory of TERRITORIES) {
      const slug = `${product.slug}-${territory.name}`;
      pages.push({
        type: 'prix-local',
        url: `${SITE_URL}/prix/${slug}`,
        path: `/prix/${slug}`,
        priority: '0.9',
        changefreq: 'daily',
        meta: {
          title: `Prix ${product.name} en ${territory.label} — Comparateur`,
          description: `Comparez le prix de ${product.name} en ${territory.label}. Trouvez le meilleur prix dans les supermarchés locaux.`,
          territory: territory.code,
          product: product.slug,
          category: product.category,
        },
      });
    }
  }
  return pages;
}

/**
 * 2. Retailer comparison pages — /comparer/<r1>-vs-<r2>-<territory>
 *    Ex: /comparer/carrefour-vs-leclerc-guadeloupe
 *    Target: "carrefour vs leclerc guadeloupe prix"
 */
function generateComparaisonPages() {
  const pages = [];
  for (let i = 0; i < RETAILERS.length; i++) {
    for (let j = i + 1; j < RETAILERS.length; j++) {
      for (const territory of TERRITORIES) {
        const slug = `${RETAILERS[i].slug}-vs-${RETAILERS[j].slug}-${territory.name}`;
        pages.push({
          type: 'comparaison-enseignes',
          url: `${SITE_URL}/comparer/${slug}`,
          path: `/comparer/${slug}`,
          priority: '0.8',
          changefreq: 'weekly',
          meta: {
            title: `${RETAILERS[i].name} vs ${RETAILERS[j].name} ${territory.label} — Qui est le moins cher ?`,
            description: `Comparez les prix ${RETAILERS[i].name} et ${RETAILERS[j].name} en ${territory.label}. Trouvez le supermarché le moins cher pour vos courses.`,
            territory: territory.code,
            retailer1: RETAILERS[i].slug,
            retailer2: RETAILERS[j].slug,
          },
        });
      }
    }
  }
  return pages;
}

/**
 * 3. Inflation trend pages — /inflation/<category-slug>-<territory>-<year>
 *    Ex: /inflation/alimentaire-guadeloupe-2026
 *    Target: "inflation alimentaire guadeloupe 2026"
 */
function generateInflationPages() {
  const pages = [];
  for (const category of CATEGORIES) {
    for (const territory of TERRITORIES) {
      for (const year of YEARS) {
        const slug = `${category.slug}-${territory.name}-${year}`;
        pages.push({
          type: 'inflation-tendances',
          url: `${SITE_URL}/inflation/${slug}`,
          path: `/inflation/${slug}`,
          priority: '0.8',
          changefreq: 'monthly',
          meta: {
            title: `Inflation ${category.name} en ${territory.label} ${year} — Évolution des prix`,
            description: `Suivez l'évolution des prix ${category.name.toLowerCase()} en ${territory.label} en ${year}. Données officielles et tendances inflation.`,
            territory: territory.code,
            category: category.slug,
            year,
          },
        });
      }
    }
  }
  return pages;
}

/**
 * 4. Cheapest products intent pages — /moins-cher/<territory>
 *    Ex: /moins-cher/guadeloupe
 *    Target: "produits moins chers guadeloupe", "où faire ses courses moins cher"
 */
function generateMoinsChersPages() {
  const pages = [];
  for (const territory of TERRITORIES) {
    pages.push({
      type: 'moins-chers',
      url: `${SITE_URL}/moins-cher/${territory.name}`,
      path: `/moins-cher/${territory.name}`,
      priority: '0.9',
      changefreq: 'daily',
      meta: {
        title: `Produits les moins chers en ${territory.label} — Top offres du jour`,
        description: `Découvrez les produits les moins chers en ${territory.label} aujourd'hui. Comparez toutes les enseignes et économisez sur vos courses.`,
        territory: territory.code,
      },
    });
    // Also add category-specific cheapest pages
    for (const category of CATEGORIES.slice(0, 4)) { // Top 4 categories
      pages.push({
        type: 'moins-chers-categorie',
        url: `${SITE_URL}/moins-cher/${territory.name}/${category.slug}`,
        path: `/moins-cher/${territory.name}/${category.slug}`,
        priority: '0.8',
        changefreq: 'daily',
        meta: {
          title: `${category.name} moins chers en ${territory.label} — Comparateur`,
          description: `Les meilleurs prix ${category.name.toLowerCase()} en ${territory.label}. Économisez sur vos courses avec notre comparateur.`,
          territory: territory.code,
          category: category.slug,
        },
      });
    }
  }
  return pages;
}

// ── Main execution ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const outputJson    = args.includes('--json');
const outputSitemap = args.includes('--sitemap');

const prixPages         = generatePrixPages();
const comparaisonPages  = generateComparaisonPages();
const inflationPages    = generateInflationPages();
const moinsChersPages   = generateMoinsChersPages();

const allPages = [
  ...prixPages,
  ...comparaisonPages,
  ...inflationPages,
  ...moinsChersPages,
];

// ── Stats summary ──────────────────────────────────────────────────────────────

console.log('🚀 A KI PRI SA YÉ — Générateur de pages SEO longue traîne');
console.log('──────────────────────────────────────────────────────────');
console.log(`📄 Pages prix locaux         : ${prixPages.length}`);
console.log(`🏪 Pages comparaison enseignes: ${comparaisonPages.length}`);
console.log(`📈 Pages inflation/tendances  : ${inflationPages.length}`);
console.log(`💰 Pages produits moins chers : ${moinsChersPages.length}`);
console.log(`──────────────────────────────────────────────────────────`);
console.log(`🎯 TOTAL pages générées       : ${allPages.length}`);
console.log('');

// ── JSON output ────────────────────────────────────────────────────────────────

if (outputJson || !outputSitemap) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    siteUrl: SITE_URL,
    totalPages: allPages.length,
    byType: {
      'prix-local':            prixPages.length,
      'comparaison-enseignes': comparaisonPages.length,
      'inflation-tendances':   inflationPages.length,
      'moins-chers':           moinsChersPages.length,
    },
    products:   PRODUCTS.length,
    territories: TERRITORIES.length,
    retailers:  RETAILERS.length,
    pages: allPages,
  };

  fs.writeFileSync('seo-pages-manifest.json', JSON.stringify(manifest, null, 2));
  console.log('✔ seo-pages-manifest.json written');
}

// ── Sitemap fragment output ────────────────────────────────────────────────────

if (outputSitemap) {
  let sitemapFragment = '';
  for (const page of allPages) {
    sitemapFragment += `  <url>
    <loc>${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }
  fs.writeFileSync('seo-pages-sitemap-fragment.xml', sitemapFragment);
  console.log('✔ seo-pages-sitemap-fragment.xml written');
}
