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
    ...[...appSource.matchAll(/<Route path="([^"]+)"/g)].map(([, routePath]) =>
      normalizePath(`/${routePath}`)
    ),
  ])
).sort();

/**
 * Convert an App.tsx route pattern (which may contain :param segments)
 * into a RegExp that matches concrete sitemap paths.
 * e.g. "categorie/:slug" → /^\/categorie\/[^/]+$/
 */
function routePatternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape regex special chars
    .replace(/:[^/]+/g, '[^/]+'); // replace :param with wildcard
  return new RegExp(`^${escaped}$`);
}

const appRouteRegexes = appRoutes.map((r) => routePatternToRegex(r));

/** Return true if the sitemap path matches at least one App.tsx route (literal or dynamic). */
function isRouted(sitemapPath: string): boolean {
  if (appRoutes.includes(sitemapPath)) return true;
  return appRouteRegexes.some((re) => re.test(sitemapPath));
}

const sitemapPaths = Array.from(
  new Set(
    [...sitemapSource.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map(
        ([, absoluteUrl]) =>
          new URL(absoluteUrl).pathname.replace(/^\/akiprisaye-web(?=\/|$)/, '') || '/'
      )
      .map(normalizePath)
  )
).sort();

describe('public sitemap route coverage', () => {
  it('keeps every indexed sitemap url mapped to a live App.tsx route', () => {
    const missingRoutes = sitemapPaths.filter((sitemapPath) => !isRouted(sitemapPath));

    expect(missingRoutes).toEqual([]);
  });

  it('still indexes the current public routes for the Ultra release', () => {
    expect(sitemapPaths).toEqual(expect.arrayContaining(['/', '/comparateur']));
  });
});
