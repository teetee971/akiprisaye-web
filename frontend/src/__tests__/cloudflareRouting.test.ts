import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Cloudflare SPA routing config', () => {
  test('_redirects uses app.html fallback to avoid infinite loop', () => {
    const redirectsPath = path.resolve('public/_redirects');
    const content = readFileSync(redirectsPath, 'utf8');

    expect(content).toContain('/*  /app.html  200');
    expect(content).not.toContain('/*  /index.html  200');
  });

  test('build script runs postbuild step that creates app.html', () => {
    const packageJsonPath = path.resolve('package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.build).toContain('postbuild-cloudflare.mjs');
  });
});
