import fs from "fs";

const SITE_URL = "https://teetee971.github.io/akiprisaye-web";

// ── Static pages ──────────────────────────────────────────────────────────────
const staticPages = [
  "",
  "comparateur",
  "scanner",
  "carte",
  "actualites",
  "modules",
  "mentions",
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

sitemap += "</urlset>";

// Write sitemap.xml
fs.writeFileSync("sitemap.xml", sitemap);

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
`;

fs.writeFileSync("robots.txt", robotsTxt);

console.log("✔ sitemap.xml générée avec:");
console.log(`  - ${staticPages.length} pages statiques`);
console.log(`  - ${seoPages.length} pages SEO`);
console.log(`  - ${categories.length} catégories × ${territories.length} territoires = ${categories.length * territories.length} pages catégorie`);
console.log(`  - ${territories.length} hubs territoires`);
console.log(`  Total: ${staticPages.length + seoPages.length + (categories.length * territories.length) + territories.length} URLs`);
console.log("✔ robots.txt généré");
