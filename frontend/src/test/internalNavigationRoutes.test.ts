import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(HERE, '..', '..');
const SRC_ROOT = path.resolve(FRONTEND_ROOT, 'src');
const APP_PATH = path.resolve(SRC_ROOT, 'App.tsx');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const INTERNAL_REFERENCE_PATTERN = /(?:to|href|path)\s*[:=]\s*["'`]([^"'`]+)["'`]/g;
const DYNAMIC_SEGMENT_PATTERN = /:[^/]+/g;
const ASSET_OR_NON_ROUTE_PATTERN = /\.(?:avif|gif|ico|jpeg|jpg|json|png|svg|txt|webmanifest|webp|xml)$/i;

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (['src_old', 'test', '__tests__'].includes(entry)) {
        return [];
      }

      return listSourceFiles(fullPath);
    }

    return SOURCE_EXTENSIONS.has(path.extname(entry)) ? [fullPath] : [];
  });
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toRouteRegex(routePath: string): RegExp {
  const normalizedRoute = routePath.startsWith('/') ? routePath : `/${routePath}`;
  const escapedRoute = escapeForRegex(normalizedRoute)
    .replace(DYNAMIC_SEGMENT_PATTERN, '[^/]+')
    .replace(/\\\*/g, '.*');

  return new RegExp(`^${escapedRoute}$`);
}

function normalizeReference(rawValue: string): string | null {
  if (!rawValue.startsWith('/')) {
    return null;
  }

  const [pathname] = rawValue.split(/[?#]/, 1);

  if (!pathname || pathname === '/') {
    return pathname || '/';
  }

  if (
    pathname.startsWith('/api/')
    || pathname.startsWith('/assets/')
    || pathname.startsWith('/data/')
    || ASSET_OR_NON_ROUTE_PATTERN.test(pathname)
  ) {
    return null;
  }

  return pathname.replace(/\/+$/, '') || '/';
}

const appSource = readFileSync(APP_PATH, 'utf8');
const appRouteRegexes = Array.from(
  new Set(
    [...appSource.matchAll(/<Route path="([^"]+)"/g)]
      .map(([, routePath]) => routePath),
  ),
).map(toRouteRegex);

const navigationReferences = Array.from(
  new Set(
    listSourceFiles(SRC_ROOT)
      .filter((filePath) => filePath !== APP_PATH)
      .flatMap((filePath) => {
        const source = readFileSync(filePath, 'utf8');

        return [...source.matchAll(INTERNAL_REFERENCE_PATTERN)]
          .map(([, rawValue]) => normalizeReference(rawValue))
          .filter((value): value is string => value !== null)
          .map((pathname) => ({
            filePath: path.relative(FRONTEND_ROOT, filePath),
            pathname,
          }));
      })
      .map(({ filePath, pathname }) => `${pathname} <- ${filePath}`),
  ),
)
  .map((entry) => {
    const [pathname, filePath] = entry.split(' <- ');
    return { pathname, filePath };
  })
  .sort((left, right) => left.pathname.localeCompare(right.pathname) || left.filePath.localeCompare(right.filePath));

describe('internal navigation references', () => {
  test('every literal internal route reference resolves to a live App.tsx route', () => {
    const missingReferences = navigationReferences.filter(({ pathname }) => (
      !appRouteRegexes.some((routeRegex) => routeRegex.test(pathname))
    ));

    expect(missingReferences).toEqual([]);
  });
});
