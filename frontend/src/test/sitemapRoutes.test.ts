import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(here, '../App.tsx'), 'utf-8');
const sitemapSource = readFileSync(resolve(here, '../../public/sitemap.xml'), 'utf-8');

const normalizePath = (rawPath: string) => {
  const [pathname] = rawPath.split(/[?#]/, 1);
  return pathname.replace(/\/+$/, '') || '/';
};

const appRoutes = Array.from(
  new Set([
    '/',
    ...[...appSource.matchAll(/<Route path="([^"]+)"/g)]
      .map(([, routePath]) => normalizePath(`/${routePath}`)),
  ]),
).sort();

const sitemapPaths = Array.from(
  new Set(
    [...sitemapSource.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map(([, absoluteUrl]) => new URL(absoluteUrl).pathname.replace(/^\/akiprisaye-web(?=\/|$)/, '') || '/')
      .map(normalizePath),
  ),
).sort();

describe('public sitemap route coverage', () => {
  it('keeps every indexed sitemap url mapped to a live App.tsx route', () => {
    const missingRoutes = sitemapPaths.filter((sitemapPath) => !appRoutes.includes(sitemapPath));

    expect(missingRoutes).toEqual([]);
  });

  it('still indexes the main public hubs and audit pages', () => {
    expect(sitemapPaths).toEqual(
      expect.arrayContaining([
        '/',
        '/comparateurs',
        '/observatoire',
        '/scanner',
        '/roadmap',
        '/module-audit',
      ]),
    );
  });
});
