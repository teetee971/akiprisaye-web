/**
 * ciRegression.test.ts
 *
 * Regression guards for past CI failures — prevents them from silently
 * reappearing:
 *
 *  1. eslint.config.cjs must be parseable as CommonJS (no SyntaxError from
 *     a `*\/` glob pattern inside a block comment that prematurely ends the
 *     comment).
 *
 *  2. vite.config.ts must NOT declare `minify: 'terser'` unless `terser` is
 *     listed as a devDependency in package.json. Omitting the installation
 *     crashes the Vite build with "[vite:terser] terser not found".
 */

// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(process.cwd());

describe('CI regression — eslint.config.cjs', () => {
  it('loads without SyntaxError (no premature block-comment termination via glob pattern)', () => {
    const filePath = path.join(ROOT, 'eslint.config.cjs');
    const source = fs.readFileSync(filePath, 'utf8');

    expect(() => {
      new vm.Script(source, { filename: filePath });
    }).not.toThrow();
  });
});

describe('CI regression — vite.config.ts + package.json', () => {
  it('terser is installed when vite.config.ts uses minify:"terser"', () => {
    const viteConfig = fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf8');
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

    const usesTerser = /minify\s*:\s*['"]terser['"]/.test(viteConfig);
    if (usesTerser) {
      const hasTerser =
        Boolean(pkg.devDependencies?.terser) || Boolean(pkg.dependencies?.terser);
      expect(hasTerser).toBe(true);
    }
  });

  it('package.json devDependencies includes terser (required by vite.config.ts)', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.devDependencies).toHaveProperty('terser');
  });
});
