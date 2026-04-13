/**
 * setup-github-pages-spa.mjs
 *
 * Post-build helper that configures the dist/ directory for the target host:
 *
 * GitHub Pages (GITHUB_PAGES=true):
 *   Copies dist/index.html → dist/404.html so that GitHub Pages serves the
 *   React app shell for any route that doesn't map to a physical file.
 *   GitHub Pages returns dist/404.html for unmatched URLs.
 *
 * Cloudflare Pages / other hosts (GITHUB_PAGES != "true"):
 *   Removes dist/404.html if it exists.  Vite copies public/404.html (the
 *   legacy GitHub Pages redirect script) into dist/ during the build, but
 *   Cloudflare Pages serves that file (with a 404 status code) for every
 *   unmatched route, which prevents the _redirects `/* /index.html 200`
 *   catch-all from ever running.  Deleting dist/404.html lets Cloudflare
 *   fall through to _redirects and return HTTP 200 for SPA routes such as
 *   /scanner, /alertes, /connexion, /observatoire.
 *
 * Called from the "postbuild" npm script in package.json.
 * The deploy-pages.yml and ci.yml workflows also run `cp dist/index.html
 * dist/404.html` as a belt-and-suspenders step, which is harmless when this
 * script has already written the correct content.
 */

import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

if (!isGitHubPages) {
  // Remove the legacy GitHub Pages redirect script from dist/ so that
  // Cloudflare Pages does not serve it as a 404 fallback.  Without this,
  // the _redirects `/* /index.html 200` rule is never reached and SPA routes
  // like /scanner return HTTP 404.
  const notFoundDist = resolve('dist', '404.html');
  if (existsSync(notFoundDist)) {
    rmSync(notFoundDist);
    console.log('[setup-github-pages-spa] ✓ Removed dist/404.html — Cloudflare Pages will use _redirects for SPA routing.');
  } else {
    console.log('[setup-github-pages-spa] dist/404.html not present — nothing to remove.');
  }
  process.exit(0);
}

const distDir       = resolve('dist');
const indexPath     = resolve(distDir, 'index.html');
const notFoundPath  = resolve(distDir, '404.html');
const ghPagesDir    = resolve(distDir, 'akiprisaye-web');

if (!existsSync(indexPath)) {
  console.error('[setup-github-pages-spa] ERROR: dist/index.html not found — build must run first.');
  process.exit(1);
}

copyFileSync(indexPath, notFoundPath);
console.log('[setup-github-pages-spa] ✓ dist/404.html ← dist/index.html (GitHub Pages SPA fallback).');

// Vite preview (used by verify-pages-runtime.mjs) serves files from dist root.
// The runtime check fetches /akiprisaye-web/<asset>, so mirror critical public
// assets under dist/akiprisaye-web/ to match GitHub Pages URL semantics.
mkdirSync(ghPagesDir, { recursive: true });
const mirroredFiles = [
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'logo-akiprisaye.svg',
  'service-worker.js',
  'sw.js',
];
for (const name of mirroredFiles) {
  const src = resolve(distDir, name);
  const dst = resolve(ghPagesDir, name);
  if (existsSync(src)) {
    copyFileSync(src, dst);
  }
}
console.log('[setup-github-pages-spa] ✓ mirrored critical public assets under dist/akiprisaye-web/.');
