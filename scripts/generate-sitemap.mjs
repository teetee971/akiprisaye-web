import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SITE_URL = process.env.SITE_URL || "https://teetee971.github.io/akiprisaye-web";

// ── Static pages ──────────────────────────────────────────────────────────────
const staticPages = [
  "",
  "comparateur",
  "scanner",
  "carte",
  "actualites",
  "civic-modules",
  "mentions-legales",
  "faq",
  "contact",
  "a-propos",
  "pricing",
  "methodologie",
  "donnees-publiques",
  "contribuer",
];

// ── SEO entry pages ───────────────────────────────────────────────────────────
// Note: stats-dashboard is excluded (private user page, blocked in robots.txt)
const seoPages = [
  "top-economies",
  "tendances",
  "populaires",
];

// ── Category pages ────────────────────────────────────────────────────────────
const categories = [
  "boissons",
  "produits-laitiers",
  "viande",
  "poisson",
  "fruits-legumes",
  "pain-patisserie",
  "epicerie",
  "hygiene",
  "entretien",
  "bebe",
  "surgeles",
];

// ── Territories ───────────────────────────────────────────────────────────────
const territories = ["GP", "MQ", "GF", "RE", "YT"];

// ── Build sitemap ─────────────────────────────────────────────────────────────
// ── Long-tail SEO product/territory combinations ──────────────────────────────
// Top products for /prix/<product>-<territory> pages
const topProducts = [
  "coca-cola-1-5l", "lait-entier-1l", "riz-basmati-1kg", "nutella-400g",
  "poulet-entier", "banane-kg", "beurre-president-250g", "lessive-ariel-30d",
  "eau-evian-1-5l", "pates-panzani-500g", "couches-pampers-t3", "jambon-blanc-4tr",
];

const territorySlugMap = {
  GP: "guadeloupe", MQ: "martinique", GF: "guyane", RE: "reunion", YT: "mayotte",
};

// Top retailer pairs for /comparer/<r1>-vs-<r2>-<territory> pages
const retailerPairs = [
  ["carrefour", "leclerc"],
  ["carrefour", "super-u"],
  ["leclerc", "intermarche"],
  ["leader-price", "super-u"],
];

// Categories for /inflation/<cat>-<territory>-<year> pages
const inflationCategories = ["alimentaire", "boissons", "epicerie", "produits-laitiers"];
const inflationYears      = ["2025", "2026"];

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

// Add static pages
staticPages.forEach(page => {
  sitemap += `  <url>
    <loc>${SITE_URL}/${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>
`;
});

// Add SEO entry pages
seoPages.forEach(page => {
  sitemap += `  <url>
    <loc>${SITE_URL}/${page}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;
});

// Add category pages for each territory
categories.forEach(category => {
  territories.forEach(territory => {
    sitemap += `  <url>
    <loc>${SITE_URL}/categorie/${category}?territory=${territory}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
  });
});

// Add territory hub pages
territories.forEach(territory => {
  sitemap += `  <url>
    <loc>${SITE_URL}/territoire/${territory}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
});

// ── NEW: Long-tail SEO pages ───────────────────────────────────────────────────

// /prix/<product>-<territory> — local price pages
territories.forEach(territory => {
  const tSlug = territorySlugMap[territory];
  topProducts.forEach(product => {
    sitemap += `  <url>
    <loc>${SITE_URL}/prix/${product}-${tSlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;
  });
});

// /comparer/<r1>-vs-<r2>-<territory> — retailer comparison pages
territories.forEach(territory => {
  const tSlug = territorySlugMap[territory];
  retailerPairs.forEach(([r1, r2]) => {
    sitemap += `  <url>
    <loc>${SITE_URL}/comparer/${r1}-vs-${r2}-${tSlug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });
});

// /inflation/<category>-<territory>-<year> — inflation trend pages
territories.forEach(territory => {
  const tSlug = territorySlugMap[territory];
  inflationCategories.forEach(category => {
    inflationYears.forEach(year => {
      sitemap += `  <url>
    <loc>${SITE_URL}/inflation/${category}-${tSlug}-${year}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });
  });
});

// /moins-cher/<territory> — cheapest products intent pages
territories.forEach(territory => {
  const tSlug = territorySlugMap[territory];
  sitemap += `  <url>
    <loc>${SITE_URL}/moins-cher/${tSlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;
});

// ── Guide pages (/guide-prix/<product>-<territory>) ───────────────────────────
territories.forEach(territory => {
  const tSlug = territorySlugMap[territory];
  topProducts.forEach(product => {
    sitemap += `  <url>
    <loc>${SITE_URL}/guide-prix/${product}-${tSlug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });
});

// ── Brand pages (/marque/<brand>-<territory>) ─────────────────────────────────
const brands = [
  'coca-cola', 'nutella', 'nestle', 'president', 'panzani',
  'evian', 'ariel', 'pampers', 'barilla', 'danone',
  'kiri', 'lu', 'maggi', 'bonduelle', 'william-saurin',
  'clipper', 'tropicana', 'heineken', 'gillette', 'dove',
];
brands.forEach(brand => {
  territories.forEach(territory => {
    const tSlug = territorySlugMap[territory];
    sitemap += `  <url>
    <loc>${SITE_URL}/marque/${brand}-${tSlug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  });
});

// ── Retailer pages (/prix-enseigne/<retailer>/<territory>) ────────────────────
const retailers = ['carrefour', 'leclerc', 'super-u', 'leader-price', 'intermarche', 'simply-market'];
retailers.forEach(retailer => {
  territories.forEach(territory => {
    const tSlug = territorySlugMap[territory];
    sitemap += `  <url>
    <loc>${SITE_URL}/prix-enseigne/${retailer}/${tSlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });
});

// ── Pillar pages ──────────────────────────────────────────────────────────────
['guide-prix-alimentaire-dom', 'comparateur-supermarches-dom', 'inflation-alimentaire-dom', 'ou-faire-courses-dom'].forEach(pillar => {
  sitemap += `  <url>
    <loc>${SITE_URL}/${pillar}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
`;
});

sitemap += "</urlset>";

// ── Write sitemap.xml ─────────────────────────────────────────────────────────

// Collect real EANs from data files
function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn(`[sitemap] Warning: could not parse ${filePath}:`, err.message);
    return null;
  }
}
function isValidEan(ean) {
  return typeof ean === 'string' && /^\d{8,14}$/.test(ean);
}
const eans = new Set();
// enhanced-prices.json
const enhanced = readJson(path.join(ROOT, 'frontend/public/data/enhanced-prices.json'));
if (enhanced?.products) {
  for (const p of enhanced.products) { if (isValidEan(p.ean)) eans.add(p.ean); }
}
// observatoire JSON files
const obsDir = path.join(ROOT, 'data/observatoire');
if (fs.existsSync(obsDir)) {
  for (const file of fs.readdirSync(obsDir)) {
    if (!file.endsWith('.json')) continue;
    const data = readJson(path.join(obsDir, file));
    if (data?.donnees) {
      for (const entry of data.donnees) { if (isValidEan(entry.ean)) eans.add(entry.ean); }
    }
  }
}
// catalogue.json
const catalogue = readJson(path.join(ROOT, 'frontend/public/data/catalogue.json'));
if (Array.isArray(catalogue)) {
  for (const p of catalogue) { if (isValidEan(p.ean)) eans.add(p.ean); }
}
if (eans.size > 0) {
  const lastModDate = new Date().toISOString().slice(0, 10);
  sitemap = sitemap.replace("</urlset>", "");
  for (const ean of Array.from(eans).sort()) {
    sitemap += `  <url>
    <loc>${SITE_URL}/produit/${ean}</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }
  sitemap += "</urlset>";
  console.log(`  - ${eans.size} fiches produits EAN (/produit/<ean>)`);
}

// Write sitemap.xml (root + frontend/public/)
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);
const frontendSitemap = path.join(ROOT, 'frontend/public/sitemap.xml');
fs.writeFileSync(frontendSitemap, sitemap);
console.log(`✔ sitemap.xml écrit → sitemap.xml + frontend/public/sitemap.xml`);

// Generate robots.txt with sitemap reference
const robotsTxt = `# A KI PRI SA YÉ — Comparateur de prix Outre-mer
# https://teetee971.github.io/akiprisaye-web

User-agent: *
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Block admin pages
Disallow: /admin/
Disallow: /mon-compte
Disallow: /stats-dashboard
Disallow: /seo-monitoring
Disallow: /outreach
Disallow: /cro-dashboard
Disallow: /seo-loop-dashboard
Disallow: /revenue-dashboard
Disallow: /expansion-dashboard
Disallow: /authority-dashboard
Disallow: /global-dashboard
`;

fs.writeFileSync("robots.txt", robotsTxt);

console.log("✔ sitemap.xml générée avec:");
console.log(`  - ${staticPages.length} pages statiques`);
console.log(`  - ${seoPages.length} pages SEO`);
console.log(`  - ${categories.length} catégories × ${territories.length} territoires = ${categories.length * territories.length} pages catégorie`);
console.log(`  - ${territories.length} hubs territoires`);
// Long-tail pages
const prixCount       = topProducts.length * territories.length;
const comparerCount   = retailerPairs.length * territories.length;
const inflationCount  = inflationCategories.length * territories.length * inflationYears.length;
const moinsChersCount = territories.length;
const guidePrixCount  = topProducts.length * territories.length;
const marqueCount     = brands.length * territories.length;
const enseigneCount   = retailers.length * territories.length;
const longTailTotal   = prixCount + comparerCount + inflationCount + moinsChersCount + guidePrixCount + marqueCount + enseigneCount + 4;
console.log(`  - ${prixCount} pages prix locaux (/prix/...)`);
console.log(`  - ${comparerCount} pages comparaison enseignes (/comparer/...)`);
console.log(`  - ${inflationCount} pages inflation/tendances (/inflation/...)`);
console.log(`  - ${moinsChersCount} pages produits moins chers (/moins-cher/...)`);
console.log(`  - ${guidePrixCount} pages guide prix (/guide-prix/...)`);
console.log(`  - ${marqueCount} pages marques (/marque/...)`);
console.log(`  - ${enseigneCount} pages enseignes (/prix-enseigne/...)`);
console.log(`  - 4 pages piliers`);
const total = staticPages.length + seoPages.length + (categories.length * territories.length) + territories.length + longTailTotal;
console.log(`  Total: ${total} URLs (dont ${longTailTotal} longue traîne)`);
console.log("✔ robots.txt généré");
