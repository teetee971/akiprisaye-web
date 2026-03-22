/**
 * setup-github-pages-spa.mjs
 *
 * Post-build helper: copies dist/index.html → dist/404.html so that GitHub
 * Pages serves the React app shell for any route that doesn't map to a
 * physical file (e.g. /landing accessed directly without a pre-rendered page).
 *
 * GitHub Pages returns dist/404.html for unmatched URLs.  Serving the full app
 * shell there means React Router handles the URL directly — no redirect needed.
 *
 * This script is intentionally a no-op when GITHUB_PAGES !== "true" so that
 * Cloudflare Pages and local builds are unaffected (Cloudflare uses _redirects
 * `/* /index.html 200` instead).
 *
 * Called from the "postbuild" npm script in package.json.
 * The deploy-pages.yml and ci.yml workflows also run `cp dist/index.html
 * dist/404.html` as a belt-and-suspenders step, which is harmless when this
 * script has already written the correct content.
 */

import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

if (!isGitHubPages) {
  console.log('[setup-github-pages-spa] GITHUB_PAGES !== "true" — skipping 404.html copy.');
  process.exit(0);
}

const distDir       = resolve('dist');
const indexPath     = resolve(distDir, 'index.html');
const notFoundPath  = resolve(distDir, '404.html');

if (!existsSync(indexPath)) {
  console.error('[setup-github-pages-spa] ERROR: dist/index.html not found — build must run first.');
  process.exit(1);
}

copyFileSync(indexPath, notFoundPath);
console.log('[setup-github-pages-spa] ✓ dist/404.html ← dist/index.html (GitHub Pages SPA fallback).');
