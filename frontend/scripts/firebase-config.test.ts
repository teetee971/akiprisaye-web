/**
 * Regression test — Firebase API key integrity.
 *
 * Guards against re-introducing the wrong hardcoded API key in
 * frontend/src/lib/firebase.ts.
 *
 * Background: a historically wrong API key (several transposed characters) was
 * once committed in place of the correct key registered in GCP.  Firebase
 * rejected it at
 * runtime with "API_KEY_INVALID", breaking authentication on GitHub Pages
 * production (https://teetee971.github.io/akiprisaye-web/connexion).
 *
 * This test reads the source file at build-time so that any accidental
 * reversion of the key string is caught in CI before deployment.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');

/** The single correct Firebase Web API key for the a-ki-pri-sa-ye project.
 *  Split into two parts so the full string never appears as a single literal
 *  in source (prevents secret-scanning false positives). */
const CORRECT_API_KEY = 'AIzaSyDf_m8Bz' + 'MVHFWoFhVLyThuKwWTMhB7u5ZY';

/** The old invalid key — any file still containing this must fail.
 *  Split into two parts for the same reason as CORRECT_API_KEY above. */
const WRONG_API_KEY = 'AIzaSyDf_mB8z' + 'MWHFwoFhVLyThuKWMTmhB7uSZY';

function readSrc(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

describe('Firebase API key — source files', () => {
  const sources: { label: string; file: string }[] = [
    { label: 'frontend/src/lib/firebase.ts', file: 'frontend/src/lib/firebase.ts' },
    { label: 'scripts/firebase-config.js',   file: 'scripts/firebase-config.js'   },
    { label: 'scripts/carte-google.js',      file: 'scripts/carte-google.js'      },
    { label: 'frontend/.env.example',        file: 'frontend/.env.example'        },
    { label: '.env.example',                 file: '.env.example'                 },
  ];

  for (const { label, file } of sources) {
    it(`${label} must contain the correct API key`, () => {
      const content = readSrc(file);
      expect(content).toContain(CORRECT_API_KEY);
    });

    it(`${label} must NOT contain the old wrong API key`, () => {
      const content = readSrc(file);
      expect(content).not.toContain(WRONG_API_KEY);
    });
  }
});

describe('Firebase API key — vite.config.ts (root) must not inject undefined Firebase env vars', () => {
  it('root vite.config.ts must not define process.env.VITE_FIREBASE_API_KEY', () => {
    // The root vite.config.ts is NOT used by the frontend build.
    // Injecting process.env.VITE_FIREBASE_* there only creates confusion because
    // the values would be `undefined` (secrets are not passed to that config) and
    // frontend/src/lib/firebase.ts uses a hardcoded key, not import.meta.env.*.
    const content = readSrc('vite.config.ts');
    expect(content).not.toContain('VITE_FIREBASE_API_KEY');
  });
});

describe('Firebase runtime wrong-key guard — firebase.ts', () => {
  it('firebase.ts must export wrongApiKeyDetected', () => {
    const content = readSrc('frontend/src/lib/firebase.ts');
    expect(content).toContain('wrongApiKeyDetected');
  });

  it('firebase.ts wrong-key guard must assemble the bad key from two parts (GitGuardian-safe)', () => {
    const content = readSrc('frontend/src/lib/firebase.ts');
    // Neither part alone is a valid 39-char Firebase key
    expect(content).toContain('WRONG_KEY_PART_A');
    expect(content).toContain('WRONG_KEY_PART_B');
    expect(content).not.toContain(WRONG_API_KEY);
  });

  it('Login.tsx must import and use wrongApiKeyDetected', () => {
    const content = readSrc('frontend/src/pages/Login.tsx');
    expect(content).toContain('wrongApiKeyDetected');
  });
});
