import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  containsLegacyFallback,
  extractInternalAssetPaths,
  extractServiceWorkerVersion,
  hasReactShell,
  inferAssetBasePath,
  normalizeBaseUrl,
} from '../../scripts/validate-deployment.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');

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

  it('keeps root, backend, frontend, and README version references aligned', () => {
    const rootPackage = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')) as { version: string };
    const backendPackage = JSON.parse(readFileSync(path.join(REPO_ROOT, 'backend/package.json'), 'utf8')) as { version: string };
    const frontendPackage = JSON.parse(readFileSync(path.join(REPO_ROOT, 'frontend/package.json'), 'utf8')) as { version: string };
    const readme = readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');

    expect(rootPackage.version).toBe(frontendPackage.version);
    expect(backendPackage.version).toBe(frontendPackage.version);
    expect(readme).toContain(`badge/version-${frontendPackage.version}-blue`);
  });
});
