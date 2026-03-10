/**
 * prerender-routes.mjs
 *
 * Post-build script for GitHub Pages SPA.
 *
 * GitHub Pages serves a 404 status code for any path that doesn't correspond
 * to a physical file — e.g. /observatoire, /comparateurs. This causes Lighthouse
 * SEO audits to fail entirely ("La page renvoie un code d'état HTTP de réussite — Erreur").
 *
 * FIX: Copy dist/index.html into every route subdirectory (dist/observatoire/index.html,
 * dist/comparateurs/index.html, etc.) so GitHub Pages returns HTTP 200 for each route.
 * React Router hydrates the correct component from the URL on the client.
 *
 * Routes are sourced from public/sitemap.xml to stay in sync.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR   = resolve(__dirname, '../dist');
const SITEMAP    = resolve(__dirname, '../public/sitemap.xml');
const BASE       = '/akiprisaye-web/';

/** Extract all route paths from sitemap.xml */
function extractRoutes(xml) {
  const routes = new Set();
  const locRe = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = locRe.exec(xml)) !== null) {
    const url = m[1].trim();
    // Strip base: https://teetee971.github.io/akiprisaye-web/some/path → some/path
    const idx = url.indexOf(BASE);
    if (idx === -1) continue;
    const path = url.slice(idx + BASE.length).replace(/\/$/, ''); // strip trailing slash
    if (path && path !== '' && !path.startsWith('admin')) {
      routes.add(path);
    }
  }
  return [...routes];
}

const indexHtml  = readFileSync(join(DIST_DIR, 'index.html'), 'utf8');
const sitemapXml = readFileSync(SITEMAP, 'utf8');
const routes     = extractRoutes(sitemapXml);

let created = 0;
let skipped = 0;

for (const route of routes) {
  const dir      = join(DIST_DIR, route);
  const filePath = join(dir, 'index.html');

  // Skip if an actual HTML page already exists (e.g. 404.html placed as file)
  if (existsSync(filePath)) {
    skipped++;
    continue;
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, indexHtml, 'utf8');
  created++;
}

console.log(`[prerender-routes] ✓ Created ${created} route pages (${skipped} already existed, ${routes.length} total from sitemap)`);
