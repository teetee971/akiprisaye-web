import { describe, expect, it } from 'vitest';
import {
  containsLegacyFallback,
  extractInternalAssetPaths,
  extractServiceWorkerVersion,
  hasReactShell,
  inferAssetBasePath,
  normalizeBaseUrl,
} from '../../scripts/validate-deployment.mjs';

describe('validate-deployment helpers', () => {
  it('normalizes base urls without trailing slashes', () => {
    expect(normalizeBaseUrl('https://akiprisaye-web.pages.dev///')).toBe('https://akiprisaye-web.pages.dev');
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
      <link rel="icon" href="https://akiprisaye-web.pages.dev/akiprisaye-web/icon-192.png">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <script type="module" src="/akiprisaye-web/assets/index-abc123.js"></script>
      <img src="/akiprisaye-web/logo-akiprisaye.svg">
    `;

    expect(extractInternalAssetPaths(html, 'https://akiprisaye-web.pages.dev')).toEqual([
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
});
