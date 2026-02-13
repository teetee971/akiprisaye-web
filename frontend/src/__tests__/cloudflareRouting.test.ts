import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

describe('Cloudflare SPA routing config', () => {
  test('no custom Cloudflare routing rules are shipped from public/', () => {
    expect(existsSync(path.resolve('public/_redirects'))).toBe(false);
    expect(existsSync(path.resolve('public/_headers'))).toBe(false);
  });

  test('build script relies on native Cloudflare Pages SPA fallback', () => {
    const packageJsonPath = path.resolve('package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.build).toBe('vite build');
  });
});
