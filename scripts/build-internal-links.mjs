/**
 * build-internal-links.mjs — Generates internal links map for SEO pages
 *
 * Output: frontend/src/data/seo/internal-links-map.json
 *
 * For each product page, generates 8-12 related links:
 *   - 4 other territory variants
 *   - 3 same-category products in same territory
 *   - 2 retailer comparison pages
 *   - 2 inflation pages
 *   - 1 guide page for same product
 *   - 1 pillar page
 */

import fs from 'fs';

const SITE_URL = 'https://teetee971.github.io/akiprisaye-web';

const TERRITORIES = [
  { code: 'GP', slug: 'guadeloupe', label: 'Guadeloupe' },
  { code: 'MQ', slug: 'martinique', label: 'Martinique' },
  { code: 'GF', slug: 'guyane', label: 'Guyane' },
  { code: 'RE', slug: 'reunion', label: 'La Réunion' },
  { code: 'YT', slug: 'mayotte', label: 'Mayotte' },
];

// Top 50 products for the link map
const TOP_50_PRODUCTS = [
  { slug: 'coca-cola-1-5l', name: 'Coca-Cola 1,5L', category: 'boissons' },
  { slug: 'lait-entier-1l', name: 'Lait Entier 1L', category: 'produits-laitiers' },
  { slug: 'riz-basmati-1kg', name: 'Riz Basmati 1kg', category: 'epicerie' },
  { slug: 'nutella-400g', name: 'Nutella 400g', category: 'epicerie' },
  { slug: 'poulet-entier', name: 'Poulet Entier', category: 'viande' },
  { slug: 'banane-kg', name: 'Banane au kg', category: 'fruits-legumes' },
  { slug: 'beurre-president-250g', name: 'Beurre Président 250g', category: 'produits-laitiers' },
  { slug: 'lessive-ariel-30d', name: 'Lessive Ariel 30 doses', category: 'entretien' },
  { slug: 'eau-evian-1-5l', name: 'Eau Évian 1,5L', category: 'boissons' },
  { slug: 'pates-panzani-500g', name: 'Pâtes Panzani 500g', category: 'epicerie' },
  { slug: 'couches-pampers-t3', name: 'Couches Pampers T3', category: 'bebe' },
  { slug: 'jambon-blanc-4tr', name: 'Jambon Blanc 4 tranches', category: 'viande' },
  { slug: 'yaourt-nature-pack8', name: 'Yaourt Nature ×8', category: 'produits-laitiers' },
  { slug: 'huile-tournesol-1l', name: 'Huile Tournesol 1L', category: 'epicerie' },
  { slug: 'sucre-blanc-1kg', name: 'Sucre Blanc 1kg', category: 'epicerie' },
  { slug: 'farine-ble-1kg', name: 'Farine de Blé 1kg', category: 'epicerie' },
  { slug: 'fromage-emmental-200g', name: 'Emmental 200g', category: 'produits-laitiers' },
  { slug: 'steak-hache-5pc', name: 'Steak Haché ×5', category: 'viande' },
  { slug: 'tomate-kg', name: 'Tomate au kg', category: 'fruits-legumes' },
  { slug: 'eau-crystal-1-5l', name: 'Eau Crystal 1,5L', category: 'boissons' },
  { slug: 'jus-orange-tropicana-1l', name: 'Jus Orange Tropicana 1L', category: 'boissons' },
  { slug: 'cafe-nescafe-200g', name: 'Café Nescafé 200g', category: 'epicerie' },
  { slug: 'chocolat-milka-100g', name: 'Chocolat Milka 100g', category: 'epicerie' },
  { slug: 'shampooing-elseve-250ml', name: 'Shampooing Elseve 250ml', category: 'hygiene' },
  { slug: 'gel-douche-sanex-500ml', name: 'Gel Douche Sanex 500ml', category: 'hygiene' },
  { slug: 'liquide-vaisselle-fairy-500ml', name: 'Liquide Vaisselle Fairy 500ml', category: 'entretien' },
  { slug: 'papier-toilette-12rouleaux', name: 'Papier Toilette ×12', category: 'entretien' },
  { slug: 'ananas-piece', name: 'Ananas la pièce', category: 'fruits-legumes' },
  { slug: 'avocat-piece', name: 'Avocat la pièce', category: 'fruits-legumes' },
  { slug: 'pizza-reine-400g', name: 'Pizza Reine 400g', category: 'surgeles' },
  { slug: 'frites-mc-cain-750g', name: 'Frites McCain 750g', category: 'surgeles' },
  { slug: 'glaces-magnum-pack4', name: 'Magnum ×4', category: 'surgeles' },
  { slug: 'lait-infantile-800g', name: 'Lait Infantile 800g', category: 'bebe' },
  { slug: 'saucisses-knacki-6pc', name: 'Saucisses Knacki ×6', category: 'viande' },
  { slug: 'creme-fraiche-20cl', name: 'Crème fraîche 20cl', category: 'produits-laitiers' },
  { slug: 'miel-500g', name: 'Miel 500g', category: 'epicerie' },
  { slug: 'rhum-agricole-blanc-70cl', name: 'Rhum Agricole Blanc 70cl', category: 'boissons' },
  { slug: 'biere-heineken-33cl', name: 'Bière Heineken 33cl', category: 'boissons' },
  { slug: 'orangina-1-5l', name: 'Orangina 1,5L', category: 'boissons' },
  { slug: 'creme-dessert-4pack', name: 'Crème Dessert ×4', category: 'produits-laitiers' },
  { slug: 'igname-kg', name: 'Igname au kg', category: 'fruits-legumes' },
  { slug: 'mangue-piece', name: 'Mangue la pièce', category: 'fruits-legumes' },
  { slug: 'dentifrice-colgate-75ml', name: 'Dentifrice Colgate 75ml', category: 'hygiene' },
  { slug: 'deodorant-narta-200ml', name: 'Déodorant Narta 200ml', category: 'hygiene' },
  { slug: 'lardons-fumes-200g', name: 'Lardons Fumés 200g', category: 'viande' },
  { slug: 'riz-long-grain-1kg', name: 'Riz Long Grain 1kg', category: 'epicerie' },
  { slug: 'essuie-tout-6rouleaux', name: 'Essuie-tout ×6', category: 'entretien' },
  { slug: 'biscuits-lu-200g', name: 'Biscuits LU 200g', category: 'epicerie' },
  { slug: 'legumes-surgeles-1kg', name: 'Légumes Surgelés 1kg', category: 'surgeles' },
  { slug: 'savon-dove-100g', name: 'Savon Dove 100g', category: 'hygiene' },
];

// Retailer pairs for comparison links
const RETAILER_PAIRS = [
  { r1: 'carrefour', r2: 'leclerc', label: 'Carrefour vs E.Leclerc' },
  { r1: 'leclerc', r2: 'super-u', label: 'E.Leclerc vs Super U' },
  { r1: 'carrefour', r2: 'super-u', label: 'Carrefour vs Super U' },
];

// Pillar pages
const PILLAR_PAGES = [
  { path: '/guide-prix-alimentaire-dom', label: 'Guide prix alimentaires DOM' },
  { path: '/comparateur-supermarches-dom', label: 'Comparateur supermarchés DOM' },
  { path: '/inflation-alimentaire-dom', label: 'Analyse inflation DOM' },
  { path: '/ou-faire-courses-dom', label: 'Où faire ses courses dans les DOM ?' },
];

// Get products from same category (excluding current)
function getSameCategoryProducts(currentSlug, category) {
  return TOP_50_PRODUCTS
    .filter(p => p.category === category && p.slug !== currentSlug)
    .slice(0, 3);
}

// Build internal links map
const linksMap = {};

for (const product of TOP_50_PRODUCTS) {
  for (const territory of TERRITORIES) {
    const pageKey = `/prix/${product.slug}-${territory.slug}`;
    const links = [];

    // 1. Other territory variants (4)
    TERRITORIES
      .filter(t => t.code !== territory.code)
      .forEach(t => {
        links.push({
          path: `/prix/${product.slug}-${t.slug}`,
          label: `Prix ${product.name} en ${t.label}`,
          type: 'territory',
        });
      });

    // 2. Same-category products in same territory (3)
    getSameCategoryProducts(product.slug, product.category).forEach(p => {
      links.push({
        path: `/prix/${p.slug}-${territory.slug}`,
        label: `Prix ${p.name} en ${territory.label}`,
        type: 'similar',
      });
    });

    // 3. Retailer comparison pages (2)
    RETAILER_PAIRS.slice(0, 2).forEach(({ r1, r2, label }) => {
      links.push({
        path: `/comparer/${r1}-vs-${r2}-${territory.slug}`,
        label: `${label} en ${territory.label}`,
        type: 'comparison',
      });
    });

    // 4. Inflation pages (2)
    links.push({
      path: `/inflation/alimentaire-${territory.slug}-2026`,
      label: `Inflation alimentaire ${territory.label} 2026`,
      type: 'inflation',
    });
    links.push({
      path: `/inflation/${product.category}-${territory.slug}-2026`,
      label: `Inflation ${product.category} ${territory.label} 2026`,
      type: 'inflation',
    });

    // 5. Guide page (1)
    links.push({
      path: `/guide-prix/${product.slug}-${territory.slug}`,
      label: `Guide prix ${product.name} ${territory.label}`,
      type: 'guide',
    });

    // 6. Pillar page (1) — rotate based on product index
    const pillarIdx = TOP_50_PRODUCTS.indexOf(product) % PILLAR_PAGES.length;
    links.push({
      path: PILLAR_PAGES[pillarIdx].path,
      label: PILLAR_PAGES[pillarIdx].label,
      type: 'pillar',
    });

    linksMap[pageKey] = links;
  }
}

// Write output
const outputDir = 'frontend/src/data/seo';
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  `${outputDir}/internal-links-map.json`,
  JSON.stringify(linksMap, null, 2),
);

const pageCount   = Object.keys(linksMap).length;
const avgLinks    = pageCount > 0
  ? Math.round(Object.values(linksMap).reduce((s, l) => s + l.length, 0) / pageCount)
  : 0;

console.log('🔗 A KI PRI SA YÉ — Générateur de liens internes');
console.log('──────────────────────────────────────────────────');
console.log(`📄 Pages couvertes   : ${pageCount}`);
console.log(`🔗 Liens par page    : ${avgLinks} (moyenne)`);
console.log(`📁 Fichier généré    : ${outputDir}/internal-links-map.json`);
console.log('✔ Terminé');
