// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = process.cwd();

const FILES_TO_CHECK = [
  'src/domain/shoppingList/types.ts',
  'src/hooks/useContinuousBarcodeScanner.ts',
  'src/pages/ListePage.tsx',
  'src/store/useShoppingListStore.ts',
  'vitest.config.ts',
];

describe('merge conflict hygiene', () => {
  it.each(FILES_TO_CHECK)('contains no git conflict markers: %s', (relativePath) => {
    const fullPath = path.resolve(ROOT_DIR, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');

    expect(content).not.toMatch(/^<<<<<<< /m);
    expect(content).not.toMatch(/^=======$/m);
    expect(content).not.toMatch(/^>>>>>>> /m);
  });
});
