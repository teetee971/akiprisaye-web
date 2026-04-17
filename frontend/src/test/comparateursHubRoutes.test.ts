import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(here, '../App.tsx'), 'utf-8');
const hubSource = readFileSync(resolve(here, '../pages/ComparateursHub.tsx'), 'utf-8');

const normalizePath = (rawPath: string) => {
  const [pathname] = rawPath.split(/[?#]/, 1);
  return pathname.replace(/\/+$/, '') || '/';
};

const hubExposedPaths = Array.from(
  new Set(
    [...hubSource.matchAll(/path:\s*'([^']+)'/g), ...hubSource.matchAll(/to="([^"]+)"/g)]
      .map(([, rawPath]) => rawPath)
      .filter((rawPath) => rawPath.startsWith('/'))
      .map(normalizePath)
  )
).sort();

const appRoutes = Array.from(
  new Set(
    [...appSource.matchAll(/<Route path="([^"]+)"/g)].map(([, routePath]) =>
      normalizePath(`/${routePath}`)
    )
  )
).sort();

describe('ComparateursHub full route coverage', () => {
  it('keeps every page exposed by ComparateursHub mapped to a live App.tsx route', () => {
    const missingRoutes = hubExposedPaths.filter((hubPath) => !appRoutes.includes(hubPath));

    expect(missingRoutes).toEqual([]);
  });

  it('still exposes non-comparator sections that must remain routable', () => {
    expect(hubExposedPaths).toEqual(
      expect.arrayContaining([
        '/comprendre-prix',
        '/scanner',
        '/calculateur-batiment',
        '/observatoire',
        '/assistant-ia',
        '/solidarite',
        '/carte-itineraires',
      ])
    );
  });
});
