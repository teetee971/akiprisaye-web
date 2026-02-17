import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFileDir = path.dirname(fileURLToPath(import.meta.url));
const resolveFromFrontend = (...segments: string[]) => path.resolve(currentFileDir, '..', '..', ...segments);

describe('service worker cache strategy', () => {
  it('does not precache index.html', () => {
    const serviceWorker = readFileSync(resolveFromFrontend('public', 'service-worker.js'), 'utf-8');

    expect(serviceWorker).not.toContain('index.html');
  });

  it('uses no-store for HTML document fetches', () => {
    const serviceWorker = readFileSync(resolveFromFrontend('public', 'service-worker.js'), 'utf-8');

    expect(serviceWorker).toContain("fetch(request, { cache: 'no-store' })");
  });

  it('applies build version guard before mount', () => {
    const mainFile = readFileSync(resolveFromFrontend('src', 'main.jsx'), 'utf-8');
    const guardFile = readFileSync(resolveFromFrontend('src', 'utils', 'buildVersionGuard.ts'), 'utf-8');

    expect(mainFile).toContain('await applyBuildVersionGuard()');
    expect(guardFile).toContain('akiprisaye-build-id');
    expect(guardFile).toContain('registration.waiting.postMessage');
  });
});
