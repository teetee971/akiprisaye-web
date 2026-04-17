/**
 * monitoringBootstrap.test.ts
 *
 * Regression guards for the monitoring bootstrap pattern introduced in the
 * Lighthouse 57→85+ optimisation (PR #1514).
 *
 * Three concerns are validated (per the post-optimisation review):
 *
 *  1. installRuntimeCrashProbe() and initErrorTracker() must remain
 *     statically imported and called synchronously — BEFORE bootstrap().
 *     They are lightweight event-listener installs that must catch
 *     boot-time crashes, so they cannot be deferred.
 *
 *  2. Sentry (@sentry/react) and web-vitals must NOT be statically
 *     imported from main.tsx. They are deferred via a dynamic import
 *     inside requestIdleCallback (scheduleIdle) after React renders.
 *     A static import would pull their bundles into the critical path
 *     and increase Total Blocking Time (TBT).
 *
 *  3. a11y.css must NOT be directly imported from main.tsx (duplicate
 *     removed). It is always loaded via the synchronous chain:
 *     Layout.jsx → SkipLinks.tsx → a11y.css
 *     Guarding this chain prevents an accidental re-addition of the
 *     import to main.tsx and a future breakage of that assumption.
 */

// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(process.cwd());

function readSrc(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, 'src', relativePath), 'utf8');
}

// ---------------------------------------------------------------------------
// Concern 1 — crash probes are statically imported and called synchronously
// ---------------------------------------------------------------------------
describe('monitoring bootstrap — concern 1: early crash probes', () => {
  it('installRuntimeCrashProbe is statically imported in main.tsx', () => {
    const src = readSrc('main.tsx');
    // Must appear as a static (top-level) import, not a dynamic import()
    expect(src).toMatch(
      /^import\s+\{[^}]*installRuntimeCrashProbe[^}]*\}\s+from\s+['"]\.\/monitoring\/runtimeCrashProbe['"]/m
    );
  });

  it('initErrorTracker is statically imported in main.tsx', () => {
    const src = readSrc('main.tsx');
    expect(src).toMatch(
      /^import\s+\{[^}]*initErrorTracker[^}]*\}\s+from\s+['"]\.\/monitoring\/errorTracker['"]/m
    );
  });

  it('installRuntimeCrashProbe() is called at module level (before bootstrap)', () => {
    const src = readSrc('main.tsx');
    // Called synchronously at top-level (outside any function definition)
    expect(src).toContain('installRuntimeCrashProbe()');
    // Must appear BEFORE the async function bootstrap() definition
    const crashProbeIdx = src.indexOf('installRuntimeCrashProbe()');
    const bootstrapFnIdx = src.indexOf('async function bootstrap()');
    expect(crashProbeIdx).toBeGreaterThan(-1);
    expect(bootstrapFnIdx).toBeGreaterThan(-1);
    expect(crashProbeIdx).toBeLessThan(bootstrapFnIdx);
  });

  it('initErrorTracker() is called at module level (before bootstrap)', () => {
    const src = readSrc('main.tsx');
    const trackerIdx = src.indexOf('initErrorTracker()');
    const bootstrapFnIdx = src.indexOf('async function bootstrap()');
    expect(trackerIdx).toBeGreaterThan(-1);
    expect(bootstrapFnIdx).toBeGreaterThan(-1);
    expect(trackerIdx).toBeLessThan(bootstrapFnIdx);
  });
});

// ---------------------------------------------------------------------------
// Concern 2 — Sentry and web-vitals are NOT on the critical path
// ---------------------------------------------------------------------------
describe('monitoring bootstrap — concern 2: deferred Sentry + web-vitals', () => {
  it('monitoring/sentry is NOT statically imported in main.tsx', () => {
    const src = readSrc('main.tsx');
    // Allow dynamic import() but forbid top-level `import … from './monitoring/sentry'`
    expect(src).not.toMatch(/^import\s+.*from\s+['"]\.\/monitoring\/sentry['"]/m);
  });

  it('monitoring/webVitals is NOT statically imported in main.tsx', () => {
    const src = readSrc('main.tsx');
    expect(src).not.toMatch(/^import\s+.*from\s+['"]\.\/monitoring\/webVitals['"]/m);
  });

  it('monitoring/sentry is lazily imported (dynamic import) in main.tsx', () => {
    const src = readSrc('main.tsx');
    expect(src).toContain("import('./monitoring/sentry')");
  });

  it('monitoring/webVitals is lazily imported (dynamic import) in main.tsx', () => {
    const src = readSrc('main.tsx');
    expect(src).toContain("import('./monitoring/webVitals')");
  });

  it('lazy monitoring imports appear inside bootstrap() (after React renders)', () => {
    const src = readSrc('main.tsx');
    const bootstrapFnIdx = src.indexOf('async function bootstrap()');
    const sentrylIdx = src.indexOf("import('./monitoring/sentry')");
    expect(bootstrapFnIdx).toBeGreaterThan(-1);
    expect(sentrylIdx).toBeGreaterThan(-1);
    // Both dynamic imports must be AFTER the bootstrap function definition
    expect(sentrylIdx).toBeGreaterThan(bootstrapFnIdx);
  });
});

// ---------------------------------------------------------------------------
// Concern 3 — a11y.css not duplicated in main.tsx; Layout chain intact
// ---------------------------------------------------------------------------
describe('monitoring bootstrap — concern 3: a11y.css load chain', () => {
  it('main.tsx does NOT directly import a11y.css', () => {
    const src = readSrc('main.tsx');
    // The comment explaining why a11y.css was removed is allowed,
    // but an actual import statement must not be present.
    expect(src).not.toMatch(/^import\s+['"].*a11y\.css['"]/m);
  });

  it('SkipLinks.tsx imports a11y.css', () => {
    const src = readSrc('components/a11y/SkipLinks.tsx');
    expect(src).toContain('a11y.css');
  });

  it('Layout.jsx imports SkipLinks synchronously (not lazily)', () => {
    const src = readSrc('components/Layout.jsx');
    // Must be a static import, NOT `lazy(() => import('./a11y/SkipLinks'))`
    expect(src).toMatch(/^import\s+SkipLinks\s+from\s+['"]\.\/a11y\/SkipLinks['"]/m);
    // Confirm it is NOT wrapped in lazy()
    expect(src).not.toMatch(
      /lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*['"]\.\/a11y\/SkipLinks['"]\s*\)/
    );
  });

  it('SkipLinks is rendered inside Layout.jsx (not behind a condition)', () => {
    const src = readSrc('components/Layout.jsx');
    expect(src).toContain('<SkipLinks');
  });
});
