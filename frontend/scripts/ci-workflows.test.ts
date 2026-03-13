/**
 * Regression tests for the CI/CD pipeline configuration.
 *
 * These tests guard against re-introducing the race condition where
 * a `pull_request` trigger on deploy-pages.yml would cancel the
 * legitimate `push:main` deployment via `cancel-in-progress: true`.
 *
 * Background: The race condition was introduced by a `pull_request: types: [closed]`
 * trigger on deploy-pages.yml, which caused the PR-closed deployment to cancel the
 * main-push deployment (they shared the same concurrency group "pages").
 * Fixed by PR #1283. These tests prevent that regression from ever happening again.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const WORKFLOWS_DIR = path.join(REPO_ROOT, '.github', 'workflows');

function readWorkflow(filename: string): string {
  return readFileSync(path.join(WORKFLOWS_DIR, filename), 'utf8');
}

describe('deploy-pages.yml — race condition guard', () => {
  const deployYml = readWorkflow('deploy-pages.yml');

  it('must NOT have a pull_request trigger (prevents cancel-in-progress race condition)', () => {
    // The deploy workflow uses concurrency: cancel-in-progress: true.
    // If a pull_request trigger were present, the PR-event run would cancel
    // the legitimate push:main run, leaving the site undeployed.
    const lines = deployYml
      .split('\n')
      .map((l, i) => ({ line: l, num: i + 1 }))
      .filter(({ line }) => /^\s*pull_request\s*:/.test(line));

    expect(lines).toEqual([]);
  });

  it('must have push:main as a trigger', () => {
    expect(deployYml).toMatch(/push:/);
    expect(deployYml).toMatch(/branches:\s*\[main\]/);
  });

  it('must have workflow_dispatch as a fallback trigger', () => {
    expect(deployYml).toMatch(/workflow_dispatch/);
  });

  it('must have a validate job that runs after deploy', () => {
    expect(deployYml).toMatch(/validate:/);
    expect(deployYml).toMatch(/needs:\s*deploy/);
  });

  it('must keep cancel-in-progress: true to drop stale push runs', () => {
    expect(deployYml).toMatch(/cancel-in-progress:\s*true/);
  });
});

describe('ci.yml — CI trigger guard', () => {
  const ciYml = readWorkflow('ci.yml');

  it('must NOT have pull_request:closed trigger', () => {
    // A closed PR trigger would cause duplicate CI runs on each merge,
    // consuming extra runner minutes and potentially conflicting with auto-merge.
    expect(ciYml).not.toMatch(/types:.*closed/);
    expect(ciYml).not.toMatch(/closed.*pull_request/);
  });

  it('must trigger on push:main', () => {
    expect(ciYml).toMatch(/push:/);
    expect(ciYml).toMatch(/branches:\s*\[main\]/);
  });

  it('must trigger on pull_request opened/synchronize/reopened only', () => {
    expect(ciYml).toMatch(/opened/);
    expect(ciYml).toMatch(/synchronize/);
    expect(ciYml).toMatch(/reopened/);
  });
});
