import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveBasePath } from '../../scripts/basePath';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// HERE = frontend/src/test
const FRONTEND_ROOT = path.resolve(HERE, '..', '..'); // => frontend
const P = (...p: string[]) => path.resolve(FRONTEND_ROOT, ...p);

describe('static hosting SPA routing config', () => {
  test('static hosting routing files are present in public/', () => {
    expect(existsSync(P('public/_redirects'))).toBe(true);
    expect(existsSync(P('public/_headers'))).toBe(true);
    expect(existsSync(P('public/404.html'))).toBe(true);
  });

  test('GitHub Pages fallback redirects deep links back to the SPA shell', () => {
    const githubPages404 = readFileSync(P('public/404.html'), 'utf8');

    expect(githubPages404).toContain('/?p=');
    expect(githubPages404).toContain('Redirection en cours');
    expect(githubPages404).toContain('https://teetee971.github.io/akiprisaye-web/');
  });

  test('frontend build uses explicit BASE_PATH override and otherwise defaults to root', () => {
    expect(resolveBasePath({} as NodeJS.ProcessEnv)).toBe('/');
    expect(resolveBasePath({ BASE_PATH: '/akiprisaye-web/' } as NodeJS.ProcessEnv)).toBe(
      '/akiprisaye-web/'
    );
    expect(resolveBasePath({ BASE_PATH: 'akiprisaye-web' } as NodeJS.ProcessEnv)).toBe(
      '/akiprisaye-web/'
    );
    expect(resolveBasePath({ GITHUB_PAGES: 'true' } as NodeJS.ProcessEnv)).toBe('/');
  });

  test('redirects keep API/assets passthrough before SPA fallback', () => {
    const redirectsPath = P('public/_redirects');
    const redirects = readFileSync(redirectsPath, 'utf8')
      .split('\n')
      .map((line: string) => line.trim())
      .filter(Boolean)
      // rend le test tolérant aux espaces multiples
      .map((line) => line.replace(/\s+/g, ' '));

    expect(redirects).toEqual([
      'http://akiprisaye-web.pages.dev/* https://akiprisaye-web.pages.dev/:splat 301',
      '/api/* /api/:splat 200',
      '/assets/* /assets/:splat 200',
      '/* /index.html 200',
    ]);
  });

  test('route aliases redirect deep-link variants to canonical auth/account routes', () => {
    const appPath = P('src/App.tsx');
    const appSource = readFileSync(appPath, 'utf8');

    const expectedAliases: Array<[string, string]> = [
      ['Login', '/login'],
      ['auth/login', '/login'],
      ['signin', '/login'],
      ['auth/register', '/inscription'],
      ['signup', '/inscription'],
      ['auth/reset-password', '/reset-password'],
      ['forgot-password', '/reset-password'],
      ['moncompte', '/mon-compte'],
      ['account', '/mon-compte'],
    ];

    for (const [alias, canonicalPath] of expectedAliases) {
      // Important: le test cherche une ligne EXACTE avec ce format
      expect(appSource).toContain(
        `<Route path="${alias}" element={<Navigate to="${canonicalPath}" replace />} />`
      );
    }
  });

  test('building pro signup account link resolves to a live route', () => {
    const appSource = readFileSync(P('src/App.tsx'), 'utf8');
    const inscriptionProBatimentSource = readFileSync(
      P('src/pages/InscriptionProBatiment.tsx'),
      'utf8'
    );

    expect(inscriptionProBatimentSource).toContain('<Link to="/espace-pro-batiment"');
    expect(appSource).toContain(
      '<Route path="espace-pro-batiment" element={<Navigate to="/espace-pro" replace />} />'
    );
  });

  test('/landing route is registered in App.tsx and accessible via direct URL', () => {
    const appSource = readFileSync(P('src/App.tsx'), 'utf8');

    // The /landing route must be registered so React Router renders LandingPage
    // when the URL is /landing (after BrowserRouter strips the base path).
    expect(appSource).toContain('<Route path="landing" element={<LandingPage />} />');

    // LandingPage must be lazy-imported so it is included in the bundle
    expect(appSource).toContain("import('./pages/LandingPage')");
  });

  test('index.html contains the ?p= SPA path-restore handler for GitHub Pages deep links', () => {
    const indexHtml = readFileSync(P('index.html'), 'utf8');

    // The inline script in index.html reads the ?p= query param set by public/404.html
    // and calls history.replaceState to restore the original deep-link URL before
    // React Router boots, so /landing (and every other SPA route) works when accessed
    // directly on GitHub Pages without an active service worker.
    expect(indexHtml).toContain("search[1] === 'p'");
    expect(indexHtml).toContain('window.history.replaceState');
    expect(indexHtml).toContain('decodeURIComponent');
  });
});
