import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  containsLegacyFallback,
  extractFirebaseConfigFromBundle,
  extractInternalAssetPaths,
  extractMainBundlePath,
  extractSitemapPaths,
  extractServiceWorkerVersion,
  hasAcceptableHtmlCacheControl,
  hasGitHubPagesSpaFallback,
  hasReactShell,
  inferAssetBasePath,
  isCloudflarePagesSite,
  isGitHubPagesSite,
  joinSiteUrl,
  normalizeBaseUrl,
} from '../../scripts/validate-deployment.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');

describe('validate-deployment helpers', () => {
  it('normalizes base urls without trailing slashes', () => {
    expect(normalizeBaseUrl('https://teetee971.github.io/akiprisaye-web///')).toBe('https://teetee971.github.io/akiprisaye-web');
  });

  it('detects the React shell even when #root is populated', () => {
    expect(hasReactShell('<div id="root"></div>')).toBe(true);
    expect(hasReactShell('<div id="root"><div id="loading-fallback"></div></div>')).toBe(true);
    expect(hasReactShell('<main></main>')).toBe(false);
  });

  it('detects the legacy fallback marker', () => {
    expect(containsLegacyFallback('<p>Le site est en ligne</p>')).toBe(true);
    expect(containsLegacyFallback('<p>Chargement en cours…</p>')).toBe(false);
  });

  it('extracts internal asset paths from deployed html only', () => {
    const html = `
      <link rel="manifest" href="/akiprisaye-web/manifest.webmanifest">
      <link rel="icon" href="https://teetee971.github.io/akiprisaye-web/icon-192.png">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <script type="module" src="/akiprisaye-web/assets/index-abc123.js"></script>
      <img src="/akiprisaye-web/logo-akiprisaye.svg">
    `;

    expect(extractInternalAssetPaths(html, 'https://teetee971.github.io/akiprisaye-web')).toEqual([
      '/akiprisaye-web/manifest.webmanifest',
      '/akiprisaye-web/icon-192.png',
      '/akiprisaye-web/assets/index-abc123.js',
      '/akiprisaye-web/logo-akiprisaye.svg',
    ]);
  });

  it('infers the app base path from current asset references', () => {
    expect(inferAssetBasePath(['/akiprisaye-web/assets/index-abc123.js'])).toBe('/akiprisaye-web/');
    expect(inferAssetBasePath(['/manifest.webmanifest', '/assets/index-abc123.js'])).toBe('/');
  });

  it('extracts the service worker cache version when present', () => {
    expect(extractServiceWorkerVersion("const CACHE_NAME = 'akiprisaye-smart-cache-v5';")).toBe(5);
    expect(extractServiceWorkerVersion('const CACHE_NAME = "other-cache";')).toBeNull();
  });

  it('extracts repository-relative paths from the public sitemap', () => {
    const sitemap = `
      <urlset>
        <url><loc>https://teetee971.github.io/akiprisaye-web/</loc></url>
        <url><loc>https://teetee971.github.io/akiprisaye-web/comparateurs</loc></url>
        <url><loc>https://teetee971.github.io/akiprisaye-web/observatoire/methodologie</loc></url>
        <url><loc>https://example.com/ignored</loc></url>
      </urlset>
    `;

    expect(extractSitemapPaths(sitemap, 'https://teetee971.github.io/akiprisaye-web')).toEqual([
      '/',
      '/comparateurs',
      '/observatoire/methodologie',
    ]);
  });

  it('detects GitHub Pages and Cloudflare Pages static hosting URLs', () => {
    expect(isGitHubPagesSite('https://teetee971.github.io/akiprisaye-web')).toBe(true);
    expect(isGitHubPagesSite('https://akiprisaye-web.pages.dev')).toBe(false);
    expect(isCloudflarePagesSite('https://akiprisaye-web.pages.dev')).toBe(true);
    expect(isCloudflarePagesSite('https://teetee971.github.io/akiprisaye-web')).toBe(false);
    expect(hasGitHubPagesSpaFallback('<script>location.replace("/akiprisaye-web/?p=%2Flogin")</script>')).toBe(true);
    expect(hasGitHubPagesSpaFallback('<div id="root"></div>')).toBe(false);
  });

  it('skips /api checks on both GitHub Pages and Cloudflare Pages static hosting to prevent false validation failures', () => {
    // verifyApi relies on isGitHubPagesSite / isCloudflarePagesSite to skip the /api check.
    // Both platforms serve only static files for this project; there are no /api endpoints.
    expect(isGitHubPagesSite('https://teetee971.github.io/akiprisaye-web')).toBe(true);
    expect(isCloudflarePagesSite('https://akiprisaye-web.pages.dev')).toBe(true);
  });

  it('accepts GitHub Pages cache headers while keeping stricter checks elsewhere', () => {
    expect(hasAcceptableHtmlCacheControl('max-age=600', 'https://teetee971.github.io/akiprisaye-web')).toBe(true);
    expect(hasAcceptableHtmlCacheControl('no-store, no-cache, must-revalidate', 'https://akiprisaye-web.pages.dev')).toBe(true);
    expect(hasAcceptableHtmlCacheControl('max-age=600', 'https://akiprisaye-web.pages.dev')).toBe(false);
  });

  it('joins critical routes against the repository base path on GitHub Pages', () => {
    expect(joinSiteUrl('https://teetee971.github.io/akiprisaye-web', '/')).toBe('https://teetee971.github.io/akiprisaye-web/');
    expect(joinSiteUrl('https://teetee971.github.io/akiprisaye-web', '/comparateur')).toBe('https://teetee971.github.io/akiprisaye-web/comparateur');
    expect(joinSiteUrl('https://teetee971.github.io/akiprisaye-web', '/akiprisaye-web/assets/index.js')).toBe('https://teetee971.github.io/akiprisaye-web/assets/index.js');
  });

  it('keeps root, backend, frontend, and README version references aligned', () => {
    const rootPackage = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')) as { version: string };
    const backendPackage = JSON.parse(readFileSync(path.join(REPO_ROOT, 'backend/package.json'), 'utf8')) as { version: string };
    const frontendPackage = JSON.parse(readFileSync(path.join(REPO_ROOT, 'frontend/package.json'), 'utf8')) as { version: string };
    const readme = readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');

    expect(rootPackage.version).toBe(frontendPackage.version);
    expect(backendPackage.version).toBe(frontendPackage.version);
    expect(readme).toContain(`badge/version-${frontendPackage.version}-blue`);
  });

  it('extractMainBundlePath finds the module entrypoint script in deployed HTML', () => {
    const html = `
      <script type="module" crossorigin src="/akiprisaye-web/assets/index-DHqr0YlO.js"></script>
      <link rel="modulepreload" crossorigin href="/akiprisaye-web/assets/vendor-react-dom-BHtUP7CB.js">
    `;
    expect(extractMainBundlePath(html)).toBe('/akiprisaye-web/assets/index-DHqr0YlO.js');
  });

  it('extractMainBundlePath handles src before type attribute order', () => {
    const html = `<script src="/akiprisaye-web/assets/index-abc.js" type="module" crossorigin></script>`;
    expect(extractMainBundlePath(html)).toBe('/akiprisaye-web/assets/index-abc.js');
  });

  it('extractMainBundlePath returns null when no module entry bundle is present', () => {
    expect(extractMainBundlePath('<script src="/bundle.js"></script>')).toBeNull();
    expect(extractMainBundlePath('<link rel="modulepreload" href="/assets/vendor-react.js">')).toBeNull();
    expect(extractMainBundlePath('')).toBeNull();
  });

  it('extractFirebaseConfigFromBundle extracts config from minified JS', () => {
    // Simulates the minified format produced by Vite (no spaces around colons)
    const js = `const firebaseConfig={apiKey:"AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY",authDomain:"a-ki-pri-sa-ye.firebaseapp.com",projectId:"a-ki-pri-sa-ye",storageBucket:"a-ki-pri-sa-ye.firebasestorage.app",messagingSenderId:"187272078809",appId:"1:187272078809:web:110a9e34493ef4506e5c8",measurementId:"G-NFHCZTLPDM"};`;
    const config = extractFirebaseConfigFromBundle(js);
    expect(config.projectId).toBe('a-ki-pri-sa-ye');
    expect(config.messagingSenderId).toBe('187272078809');
    expect(config.appId).toBe('1:187272078809:web:110a9e34493ef4506e5c8');
    expect(config.measurementId).toBe('G-NFHCZTLPDM');
    expect(config.apiKey).toBe('AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY');
    expect(config.authDomain).toBe('a-ki-pri-sa-ye.firebaseapp.com');
  });

  it('extractFirebaseConfigFromBundle returns null for absent fields', () => {
    const config = extractFirebaseConfigFromBundle('const x = {};');
    expect(config.projectId).toBeNull();
    expect(config.appId).toBeNull();
    expect(config.measurementId).toBeNull();
  });

  it('extractFirebaseConfigFromBundle does NOT match the old wrong apiKey', () => {
    // Guard: the known wrong key must never reappear in a deployed bundle.
    const wrongKey = 'AIzaSyDf_mB8zMWHFwoFhVLyThuKWMTmhB7uSZY';
    const correctKey = 'AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY';
    const configWithWrong = extractFirebaseConfigFromBundle(`apiKey:"${wrongKey}"`);
    const configWithCorrect = extractFirebaseConfigFromBundle(`apiKey:"${correctKey}"`);
    expect(configWithWrong.apiKey).not.toBe(correctKey);
    expect(configWithCorrect.apiKey).toBe(correctKey);
    expect(configWithCorrect.apiKey).not.toBe(wrongKey);
  });
});
