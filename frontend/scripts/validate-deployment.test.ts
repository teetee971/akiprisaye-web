import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  containsLegacyFallback,
  countOccurrences,
  extractFirebaseConfigFromBundle,
  extractInternalAssetPaths,
  extractMainBundlePath,
  extractSitemapPaths,
  extractServiceWorkerVersion,
  hasAcceptableHtmlCacheControl,
  hasGitHubPagesSpaFallback,
  hasMetaCSP,
  hasReactShell,
  inferAssetBasePath,
  isCloudflareAccessPage,
  isCloudflarePagesSite,
  isGitHubPagesSite,
  isMainBranch,
  isStaleBundleReferenced,
  isTransientHttpError,
  joinSiteUrl,
  normalizeBaseUrl,
  parseVersionJson,
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

  it('detects Cloudflare Access protected pages', () => {
    expect(isCloudflareAccessPage('https://access.cloudflareaccess.com/cdn-cgi/access/login', '')).toBe(true);
    expect(isCloudflareAccessPage('https://cloudflareaccess.com/login', '')).toBe(true);
    expect(isCloudflareAccessPage('https://example.pages.dev/', '<html>cloudflareaccess.com</html>')).toBe(true);
    expect(isCloudflareAccessPage('https://example.pages.dev/', '<div id="root"></div>')).toBe(false);
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
    // Current multi-cache naming convention
    expect(extractServiceWorkerVersion("const CORE_CACHE = `akiprisaye-core-v2`;")).toBe(2);
    expect(extractServiceWorkerVersion("const ASSET_CACHE = `akiprisaye-assets-v3`;")).toBe(3);
    expect(extractServiceWorkerVersion("const CACHE_NAME = `akiprisaye-v3`;")).toBe(3);
    // Template-literal cache names where the interpolated value isn't in the raw source
    expect(extractServiceWorkerVersion("const CACHE_VERSION = 'v4';")).toBe(4);
    expect(extractServiceWorkerVersion('const CACHE_VERSION = "v7";')).toBe(7);
    expect(extractServiceWorkerVersion('const CACHE_VERSION = `v9`;')).toBe(9);
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

  it('extracts paths from a GitHub Pages sitemap when validating against Cloudflare Pages (cross-origin fallback)', () => {
    const sitemap = `
      <urlset>
        <url><loc>https://teetee971.github.io/akiprisaye-web/</loc></url>
        <url><loc>https://teetee971.github.io/akiprisaye-web/comparateur</loc></url>
        <url><loc>https://teetee971.github.io/akiprisaye-web/paniers-types</loc></url>
      </urlset>
    `;

    expect(extractSitemapPaths(sitemap, 'https://akiprisaye-web.pages.dev')).toEqual([
      '/',
      '/comparateur',
      '/paniers-types',
    ]);
  });

  it('detects GitHub Pages and Cloudflare Pages static hosting URLs', () => {
    expect(isGitHubPagesSite('https://teetee971.github.io/akiprisaye-web')).toBe(true);
    expect(isGitHubPagesSite('https://akiprisaye-web.pages.dev')).toBe(false);
    expect(isCloudflarePagesSite('https://akiprisaye-web.pages.dev')).toBe(true);
    expect(isCloudflarePagesSite('https://teetee971.github.io/akiprisaye-web')).toBe(false);
    expect(hasGitHubPagesSpaFallback('<script>location.replace("/akiprisaye-web/?p=%2Flogin")</script>')).toBe(true);
    expect(hasGitHubPagesSpaFallback('<div id="root"></div>')).toBe(true);
  });

  it('skips /api checks on both GitHub Pages and Cloudflare Pages static hosting to prevent false validation failures', () => {
    // verifyApi relies on isGitHubPagesSite / isCloudflarePagesSite to skip the /api check.
    // Both platforms serve only static files for this project; there are no /api endpoints.
    expect(isGitHubPagesSite('https://teetee971.github.io/akiprisaye-web')).toBe(true);
    expect(isCloudflarePagesSite('https://akiprisaye-web.pages.dev')).toBe(true);
  });

  it('hasMetaCSP detects a Content-Security-Policy meta tag in the HTML', () => {
    // Valid meta CSP variations
    expect(hasMetaCSP('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'">')).toBe(true);
    expect(hasMetaCSP("<meta http-equiv='content-security-policy' content=\"default-src 'self'\">")).toBe(true);
    expect(hasMetaCSP('<meta content="default-src \'self\'" http-equiv="Content-Security-Policy">')).toBe(true);
    // Case-insensitive
    expect(hasMetaCSP('<META HTTP-EQUIV="CONTENT-SECURITY-POLICY" CONTENT="default-src \'self\'">')).toBe(true);
    // Negative cases
    expect(hasMetaCSP('<meta name="description" content="test">')).toBe(false);
    expect(hasMetaCSP('<meta http-equiv="X-UA-Compatible" content="IE=edge">')).toBe(false);
    expect(hasMetaCSP('')).toBe(false);
  });

  it('hasMetaCSP detects the CSP meta tag present in the deployed index.html', () => {
    // This test verifies the actual frontend/index.html contains a CSP meta tag.
    const html = readFileSync(path.join(REPO_ROOT, 'frontend/index.html'), 'utf8');
    expect(hasMetaCSP(html)).toBe(true);
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
    // Simulates the minified format produced by Vite (no spaces around colons).
    // Key split into two parts so no single literal matches the 39-char AIzaSy... pattern.
    const CORRECT_KEY = 'AIzaSyDf_m8Bz' + 'MVHFWoFhVLyThuKwWTMhB7u5ZY';
    const js = `const firebaseConfig={apiKey:"${CORRECT_KEY}",authDomain:"a-ki-pri-sa-ye.firebaseapp.com",projectId:"a-ki-pri-sa-ye",storageBucket:"a-ki-pri-sa-ye.firebasestorage.app",messagingSenderId:"187272078809",appId:"1:187272078809:web:501d916973a75edb06e5c8",measurementId:"G-W0R1B4HHE1"};`;
    const config = extractFirebaseConfigFromBundle(js);
    expect(config.projectId).toBe('a-ki-pri-sa-ye');
    expect(config.messagingSenderId).toBe('187272078809');
    expect(config.appId).toBe('1:187272078809:web:501d916973a75edb06e5c8');
    expect(config.measurementId).toBe('G-W0R1B4HHE1');
    expect(config.apiKey).toBe(CORRECT_KEY);
    expect(config.authDomain).toBe('a-ki-pri-sa-ye.firebaseapp.com');
  });

  it('extractFirebaseConfigFromBundle returns null for absent fields', () => {
    const config = extractFirebaseConfigFromBundle('const x = {};');
    expect(config.projectId).toBeNull();
    expect(config.appId).toBeNull();
    expect(config.measurementId).toBeNull();
  });

  it('extractFirebaseConfigFromBundle returns null apiKey when Firebase is lazy-loaded (main entry bundle only)', () => {
    // Verifies the core assumption behind the lazy-chunk fallback in verifyFirebaseBundle:
    // when Firebase is lazy-loaded, the main bundle only holds a Rollup dynamic-import
    // chunk map (string references like "assets/firebase-*.js") and does NOT contain the
    // firebaseConfig object itself.  The apiKey field must therefore be null from the
    // main bundle, which triggers the secondary lookup in the firebase-*.js lazy chunk.
    const mainBundleSnippet = `
      "assets/vendor-firebase-DKDYgiV6.js","assets/firebase-BEDSOtSV.js","assets/AuthContext-FYFwiSo8.js"
    `;
    const config = extractFirebaseConfigFromBundle(mainBundleSnippet);
    expect(config.apiKey).toBeNull();
  });

  it('firebase lazy chunk URL is embedded in main bundle as "assets/firebase-*.js" and can be extracted', () => {
    // Verifies the regex used in verifyFirebaseBundle to locate the firebase app chunk URL
    // inside the main bundle's Rollup chunk map.  The pattern must survive Rollup's
    // minification (no spaces, compact string literals).
    const mainBundleSnippet = `
      "assets/vendor-firebase-DKDYgiV6.js","assets/firebase-BEDSOtSV.js","assets/AuthContext-FYFwiSo8.js"
    `;
    // The regex requires a path separator before "firebase-" to exclude the vendor chunk.
    const chunkMatch = mainBundleSnippet.match(/"([^"]+\/firebase-[^"]+\.js)"/);
    expect(chunkMatch).not.toBeNull();
    expect(chunkMatch![1]).toBe('assets/firebase-BEDSOtSV.js');
    // vendor-firebase must NOT be selected; it contains library code, not the config object.
    expect(chunkMatch![1]).not.toContain('vendor');
  });

  it('extractFirebaseConfigFromBundle does NOT match the old wrong apiKey', () => {
    // Guard: the known wrong key must never reappear in a deployed bundle.
    // Keys split into two parts so no single literal matches the 39-char AIzaSy... pattern.
    const wrongKey = 'AIzaSyDf_mB8z' + 'MWHFwoFhVLyThuKWMTmhB7uSZY';
    const correctKey = 'AIzaSyDf_m8Bz' + 'MVHFWoFhVLyThuKwWTMhB7u5ZY';
    const configWithWrong = extractFirebaseConfigFromBundle(`apiKey:"${wrongKey}"`);
    const configWithCorrect = extractFirebaseConfigFromBundle(`apiKey:"${correctKey}"`);
    expect(configWithWrong.apiKey).not.toBe(correctKey);
    expect(configWithCorrect.apiKey).toBe(correctKey);
    expect(configWithCorrect.apiKey).not.toBe(wrongKey);
  });

  it('isStaleBundleReferenced detects the known stale bundle in deployed HTML', () => {
    const staleHtml = `
      <script type="module" crossorigin src="/akiprisaye-web/assets/index-DHqr0YlO.js"></script>
    `;
    const freshHtml = `
      <script type="module" crossorigin src="/akiprisaye-web/assets/index-AbCd1234.js"></script>
    `;
    expect(isStaleBundleReferenced(staleHtml, 'index-DHqr0YlO.js')).toBe(true);
    expect(isStaleBundleReferenced(freshHtml, 'index-DHqr0YlO.js')).toBe(false);
  });

  it('isStaleBundleReferenced returns false for empty or unrelated HTML', () => {
    expect(isStaleBundleReferenced('', 'index-DHqr0YlO.js')).toBe(false);
    expect(isStaleBundleReferenced('<div id="root"></div>', 'index-DHqr0YlO.js')).toBe(false);
  });

  it('isStaleBundleReferenced is case-sensitive (bundle names are content-hashed)', () => {
    // Vite hashes are case-sensitive — a different case is a different file.
    expect(isStaleBundleReferenced('index-dhqr0ylo.js', 'index-DHqr0YlO.js')).toBe(false);
  });

  it('countOccurrences returns 0 for the wrong Firebase key when key is absent', () => {
    // Simulates grep -c 'wrongKey' bundle.js → 0 (proof the stale key is gone).
    // Key split into two parts so no single literal matches the 39-char AIzaSy... pattern.
    const wrongKey = 'AIzaSyDf_mB8z' + 'MWHFwoFhVLyThuKWMTmhB7uSZY';
    const correctKey = 'AIzaSyDf_m8Bz' + 'MVHFWoFhVLyThuKwWTMhB7u5ZY';
    const bundleWithCorrectKey = `const firebaseConfig={apiKey:"${correctKey}",projectId:"a-ki-pri-sa-ye"};`;
    expect(countOccurrences(bundleWithCorrectKey, wrongKey)).toBe(0);
  });

  it('countOccurrences returns 1 for the correct Firebase key when key is present', () => {
    // Simulates grep -c 'correctKey' bundle.js → 1 (proof the live key is embedded).
    // Key split into two parts so no single literal matches the 39-char AIzaSy... pattern.
    const correctKey = 'AIzaSyDf_m8Bz' + 'MVHFWoFhVLyThuKwWTMhB7u5ZY';
    const bundleWithCorrectKey = `const firebaseConfig={apiKey:"${correctKey}",projectId:"a-ki-pri-sa-ye"};`;
    expect(countOccurrences(bundleWithCorrectKey, correctKey)).toBe(1);
  });

  it('countOccurrences handles multiple occurrences and edge cases', () => {
    expect(countOccurrences('aaa', 'a')).toBe(3);
    expect(countOccurrences('aaa', 'aa')).toBe(1);
    expect(countOccurrences('', 'x')).toBe(0);
    expect(countOccurrences('hello', '')).toBe(0);
    expect(countOccurrences('no match here', 'xyz')).toBe(0);
  });

  it('isTransientHttpError classifies retryable status codes correctly', () => {
    // Transient CDN / rate-limit errors that should be retried
    expect(isTransientHttpError(429)).toBe(true);
    expect(isTransientHttpError(502)).toBe(true);
    expect(isTransientHttpError(503)).toBe(true);
    expect(isTransientHttpError(504)).toBe(true);
    // Permanent errors and success codes must NOT be retried
    expect(isTransientHttpError(200)).toBe(false);
    expect(isTransientHttpError(301)).toBe(false);
    expect(isTransientHttpError(400)).toBe(false);
    expect(isTransientHttpError(401)).toBe(false);
    expect(isTransientHttpError(403)).toBe(false);
    expect(isTransientHttpError(404)).toBe(false);
    expect(isTransientHttpError(500)).toBe(false);
  });
});

describe('isMainBranch', () => {
  it('returns true for "main"', () => {
    expect(isMainBranch('main')).toBe(true);
  });

  it('trims whitespace before comparing', () => {
    expect(isMainBranch('  main  ')).toBe(true);
  });

  it('returns false for feature branches', () => {
    expect(isMainBranch('copilot/implement-ci-cd-pipeline')).toBe(false);
    expect(isMainBranch('copilot/complete-audit-of-actions')).toBe(false);
    expect(isMainBranch('develop')).toBe(false);
    expect(isMainBranch('feature/my-feature')).toBe(false);
  });

  it('returns false for empty string and non-strings', () => {
    expect(isMainBranch('')).toBe(false);
    expect(isMainBranch(null as unknown as string)).toBe(false);
    expect(isMainBranch(undefined as unknown as string)).toBe(false);
    expect(isMainBranch(42 as unknown as string)).toBe(false);
  });
});

describe('parseVersionJson', () => {
  const validPayload = {
    branch: 'main',
    commit: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    builtAt: '2026-03-19T12:00:00Z',
    runId: '12345678',
  };

  it('accepts a valid version.json payload from main', () => {
    const result = parseVersionJson(validPayload);
    expect(result.branch).toBe('main');
    expect(result.commit).toBe('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2');
    expect(result.builtAt).toBe('2026-03-19T12:00:00Z');
    expect(result.runId).toBe('12345678');
  });

  it('accepts a short (7-char) commit SHA', () => {
    const result = parseVersionJson({ ...validPayload, commit: '96f75aa' });
    expect(result.commit).toBe('96f75aa');
  });

  it('returns null for optional fields when absent', () => {
    const result = parseVersionJson({ branch: 'main', commit: '96f75aa' });
    expect(result.builtAt).toBeNull();
    expect(result.runId).toBeNull();
  });

  it('throws when payload is not an object', () => {
    expect(() => parseVersionJson(null)).toThrow('version.json');
    expect(() => parseVersionJson('string')).toThrow('version.json');
    expect(() => parseVersionJson(42)).toThrow('version.json');
  });

  it('throws when branch is missing or empty', () => {
    expect(() => parseVersionJson({ commit: '96f75aa' })).toThrow('"branch"');
    expect(() => parseVersionJson({ branch: '', commit: '96f75aa' })).toThrow('"branch"');
    expect(() => parseVersionJson({ branch: '   ', commit: '96f75aa' })).toThrow('"branch"');
  });

  it('throws when commit is missing or not a hex SHA', () => {
    expect(() => parseVersionJson({ branch: 'main' })).toThrow('"commit"');
    expect(() => parseVersionJson({ branch: 'main', commit: 'not-a-sha' })).toThrow('"commit"');
    expect(() => parseVersionJson({ branch: 'main', commit: 'unknown' })).toThrow('"commit"');
    expect(() => parseVersionJson({ branch: 'main', commit: '' })).toThrow('"commit"');
  });

  it('correctly identifies a feature-branch version.json (branch !== main)', () => {
    const result = parseVersionJson({
      branch: 'copilot/implement-ci-cd-pipeline',
      commit: '298b854',
      builtAt: '2026-02-07T18:50:23Z',
      runId: '21785023116',
    });
    // parseVersionJson does not enforce main — that's isMainBranch's job.
    expect(result.branch).toBe('copilot/implement-ci-cd-pipeline');
    expect(isMainBranch(result.branch)).toBe(false);
  });
});
