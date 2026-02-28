// @ts-nocheck
import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

function resolveFirstExisting(paths: string[]) {
  for (const p of paths) {
    const abs = path.resolve(p);
    if (existsSync(abs)) return abs;
  }
  return null;
}

describe('Service worker cache strategy', () => {
  test('does not precache index.html and uses no-store network-first for documents', () => {
    const swPath = resolveFirstExisting([
      'public/service-worker.js',
      'public/sw.js',
      'public/serviceWorker.js',
    ]);

    expect(swPath).not.toBeNull();
    const swSource = readFileSync(swPath!, 'utf8');

    // Ne pas precacher index.html (SPA fallback CF)
    expect(swSource).not.toContain('/index.html');

    // API: bypass cache navigateur (tolère plusieurs variantes)
    expect(swSource).toMatch(/cache:\s*['"]no-store['"]/);

    // Navigation/documents: au moins la détection de navigation
    expect(swSource).toContain("event.request.mode === 'navigate'");

    // On ne force PAS request.destination === 'document' (pas fiable selon implémentation)
  });

  test('keeps skipWaiting and clients.claim lifecycle protections', () => {
    const swPath = resolveFirstExisting([
      'public/service-worker.js',
      'public/sw.js',
      'public/serviceWorker.js',
    ]);

    expect(swPath).not.toBeNull();
    const swSource = readFileSync(swPath!, 'utf8');

    expect(swSource).toContain('self.skipWaiting()');
    expect(swSource).toContain('self.clients.claim()');
  });

  test('bootstraps build-id mismatch guard and SW registration in app entrypoint', () => {
    const mainPath = resolveFirstExisting([
      'src/main.tsx',
      'src/main.jsx',
      'src/main.ts',
      'src/main.js',
    ]);

    expect(mainPath).not.toBeNull();
    const mainSource = readFileSync(mainPath!, 'utf8');

    expect(mainSource).toContain('enforceBuildVersionSync');
    expect(mainSource).toContain('registerAppServiceWorker');
    expect(mainSource).toContain('VITE_APP_BUILD_ID');
  });
});