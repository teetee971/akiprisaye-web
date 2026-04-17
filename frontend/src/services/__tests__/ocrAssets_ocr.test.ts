import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assets = ['worker.min.js', 'tesseract-core.wasm', 'fra.traineddata.gz'];
const isCI = process.env.CI === 'true' || process.env.SKIP_OCR_TESTS === 'true';
const describeOcr = isCI ? describe.skip : describe;

describeOcr('OCR static assets', () => {
  const publicRoot = path.resolve(__dirname, '../../../public/ocr');
  const frontendPublicRoot = path.resolve(__dirname, '../../../frontend/public/ocr');
  const distRoot = path.resolve(__dirname, '../../../dist/ocr');

  it('exist in public for dev usage', () => {
    assets.forEach((file) => {
      const target = path.join(publicRoot, file);
      expect(existsSync(target)).toBe(true);
      expect(statSync(target).size).toBeGreaterThan(1024);
    });
  });

  it('are shipped in build output when dist is present', () => {
    if (!existsSync(path.resolve(__dirname, '../../../dist'))) {
      console.warn(
        '[OCR TEST] dist directory not found - build step not executed, skipping dist check'
      );
      return;
    }

    assets.forEach((file) => {
      const target = path.join(distRoot, file);
      expect(existsSync(target)).toBe(true);
      expect(statSync(target).size).toBeGreaterThan(1024);
    });
  });

  it('are mirrored for legacy frontend path', () => {
    assets.forEach((file) => {
      const target = path.join(frontendPublicRoot, file);
      expect(existsSync(target)).toBe(true);
      expect(statSync(target).size).toBeGreaterThan(1024);
    });
  });
});
