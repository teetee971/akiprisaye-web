import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveBasePath } from '../../scripts/basePath';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// HERE = frontend/src/test
const FRONTEND_ROOT = path.resolve(HERE, '..', '..'); // => frontend
const P = (...p: string[]) => path.resolve(FRONTEND_ROOT, ...p);

describe('Cloudflare SPA routing config', () => {
  test('Cloudflare routing files are present in public/', () => {
    expect(existsSync(P('public/_redirects'))).toBe(true);
    expect(existsSync(P('public/_headers'))).toBe(true);
  });

  test('build script relies on native Cloudflare Pages SPA fallback', () => {
    const packageJsonPath = P('package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.build).toBe('vite build');
  });

  test('frontend build uses explicit BASE_PATH override and otherwise defaults to root', () => {
    expect(resolveBasePath({} as NodeJS.ProcessEnv)).toBe('/');
    expect(resolveBasePath({ BASE_PATH: '/akiprisaye-web/' } as NodeJS.ProcessEnv)).toBe('/akiprisaye-web/');
    expect(resolveBasePath({ BASE_PATH: 'akiprisaye-web' } as NodeJS.ProcessEnv)).toBe('/akiprisaye-web/');
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
        `<Route path="${alias}" element={<Navigate to="${canonicalPath}" replace />} />`,
      );
    }
  });
});
