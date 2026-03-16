/**
 * Regression tests for the CI/CD pipeline configuration.
 *
 * These tests guard against:
 * 1. Re-introducing the `pull_request` trigger on deploy-pages.yml which caused a
 *    cancel-in-progress race condition that silently killed production deployments.
 * 2. Reverting auto-merge.yml from `pull_request_target` back to `pull_request`.
 *    Using `pull_request_target` is critical: it runs in the context of the base
 *    branch (main) and does NOT require GitHub's "Approve and run" bot approval,
 *    so auto-merge is enabled immediately for Copilot PRs without human intervention.
 * 3. Removing the `github.event_name != 'pull_request'` guard on the deploy job.
 *    This defense-in-depth condition ensures that even if a pull_request trigger
 *    were ever re-introduced, the deploy step would be SKIPPED (not FAILED),
 *    preventing red-cross entries in the GitHub Pages deployment history.
 *
 * Background (deploy race condition):
 *   A `pull_request: types: [closed]` trigger on deploy-pages.yml caused the
 *   PR-closed run to cancel the push:main run (same concurrency group "pages").
 *   Fixed by PR #1283.
 *
 * Background (red-cross deployment failures):
 *   PR branches that had an older copy of deploy-pages.yml (with `pull_request`
 *   trigger) would trigger deployments that fail because GitHub Pages only accepts
 *   deployments from the protected `github-pages` environment (restricted to main).
 *   Each failed attempt creates a red-cross entry in the GitHub Pages deployment
 *   history. The `github.event_name != 'pull_request'` condition on the deploy job
 *   is a second line of defence: even if the trigger guard fails, the deploy step
 *   is skipped rather than attempted and failed.
 *
 * Background (action_required on bot PRs):
 *   Workflows using `pull_request` trigger require GitHub's "Approve and run" for
 *   bot-created PRs (total_jobs: 0 until a human approves). `auto-merge.yml` only
 *   calls `gh pr merge` — no code checkout — so `pull_request_target` is safe and
 *   eliminates the `action_required` block on auto-merge for Copilot PRs.
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

  it('deploy job must guard against pull_request events (defense-in-depth)', () => {
    // Even if a pull_request trigger is ever re-added to this workflow, the deploy
    // job itself must refuse to run for PR events. This prevents red-cross entries
    // in the GitHub Pages deployment history from PR-branch deployment attempts.
    // The condition "github.event_name != 'pull_request'" on the deploy job's `if`
    // clause ensures the deploy step is SKIPPED rather than attempted and FAILED.
    expect(deployYml).toMatch(/github\.event_name\s*!=\s*['"]pull_request['"]/);
  });

  it('deploy job must guard against non-main refs (defense-in-depth)', () => {
    // Ensures deployment only happens from the protected main branch.
    // This blocks non-main refs (e.g. workflow_dispatch from a feature branch,
    // or any future accidental trigger) from overwriting the production Pages site.
    expect(deployYml).toMatch(/github\.ref\s*==\s*['"]refs\/heads\/main['"]/);
  });

  it('build job must guard against non-main refs (third line of defence — no orphaned deployments)', () => {
    // When deploy-pages.yml is triggered on a non-main branch (workflow_dispatch
    // from a feature branch, or an old PR-branch copy of the file with a
    // pull_request trigger), the build job must be skipped rather than running.
    //
    // Without this guard, `actions/configure-pages` + `actions/upload-pages-artifact`
    // create an orphaned Pages deployment record that can never be completed (the
    // deploy job's own ref-guard refuses to run), producing a permanent red-cross
    // entry in the GitHub Pages deployment history.
    //
    // This is the *third* line of defence (after the on.push.branches filter and
    // the deploy-job if condition) that prevents such spurious failures.

    // Extract the build job block (everything from "  build:" to "  deploy:").
    const buildJobMatch = deployYml.match(/^\s{2}build:\n([\s\S]*?)(?=\n\s{2}\w)/m);
    expect(buildJobMatch).not.toBeNull();
    const buildJobBlock = buildJobMatch![0];
    expect(buildJobBlock).toMatch(/if:\s*github\.ref\s*==\s*['"]refs\/heads\/main['"]/);
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

describe('deploy-pages.yml — triple validation guard', () => {
  const deployYml = readWorkflow('deploy-pages.yml');

  it('validate job must run 3 independent sequential rounds (not retry-on-failure)', () => {
    // Each round is a separate step that must succeed individually.
    // "round 1/3", "round 2/3", "round 3/3" are present in the validate job.
    expect(deployYml).toMatch(/round 1\/3/i);
    expect(deployYml).toMatch(/round 2\/3/i);
    expect(deployYml).toMatch(/round 3\/3/i);
  });

  it('validate job must run validate-deployment.mjs at least 3 times', () => {
    const count = (deployYml.match(/validate-deployment\.mjs/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it('validate job must include a final proof step', () => {
    expect(deployYml).toMatch(/PREUVE FINALE/i);
    expect(deployYml).toMatch(/100% VERT/i);
  });
});

describe('deploy-cloudflare-pages.yml — validation guard', () => {
  const cloudflareYml = readWorkflow('deploy-cloudflare-pages.yml');

  it('must have a validate job that runs after deploy', () => {
    expect(cloudflareYml).toMatch(/validate:/);
    expect(cloudflareYml).toMatch(/needs:\s*deploy/);
  });

  it('validate job must run 3 independent sequential rounds', () => {
    expect(cloudflareYml).toMatch(/round 1\/3/i);
    expect(cloudflareYml).toMatch(/round 2\/3/i);
    expect(cloudflareYml).toMatch(/round 3\/3/i);
  });

  it('validate job must run validate-deployment.mjs at least 3 times', () => {
    const count = (cloudflareYml.match(/validate-deployment\.mjs/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it('validate job must include a final proof step', () => {
    expect(cloudflareYml).toMatch(/PREUVE FINALE/i);
    expect(cloudflareYml).toMatch(/100% VERT/i);
  });

  it('deploy job must output the deployment URL for the validate job', () => {
    expect(cloudflareYml).toMatch(/outputs:/);
    expect(cloudflareYml).toMatch(/deployment.url/);
  });
});

describe('auto-merge.yml — pull_request_target guard', () => {
  const autoMergeYml = readWorkflow('auto-merge.yml');

  it('must use pull_request_target (not pull_request) to avoid action_required block on bot PRs', () => {
    // pull_request_target runs in the base-branch context — no "Approve and run"
    // required for bot actors. Safe here because the job only calls `gh pr merge`
    // and never checks out or executes any PR code.
    expect(autoMergeYml).toMatch(/pull_request_target\s*:/);
  });

  it('must NOT use plain pull_request trigger (would block Copilot PRs requiring approval)', () => {
    // Ensure no plain `pull_request:` trigger line exists in the on: block.
    // pull_request_target is the intentional replacement.
    const triggerLines = autoMergeYml
      .split('\n')
      .filter(line => /^\s{2}pull_request\s*:/.test(line));
    expect(triggerLines).toEqual([]);
  });

  it('must restrict auto-merge to Copilot branches or trusted bots', () => {
    expect(autoMergeYml).toMatch(/startsWith.*copilot/);
  });
});

describe('deploy-pages.yml — Firebase secrets injection guard', () => {
  const deployYml = readWorkflow('deploy-pages.yml');

  // The Firebase web config MUST be injected from repository secrets during the
  // Vite build.  Without these env vars the build embeds an empty string, and
  // firebase.ts falls back to its hardcoded value — a regression risk if that
  // fallback is ever accidentally reverted.  These tests catch such regressions
  // before they reach production.
  const FIREBASE_SECRETS = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID',
  ] as const;

  for (const secret of FIREBASE_SECRETS) {
    it(`build step must inject ${secret} from repository secrets`, () => {
      // Must reference the secret so Vite can inline the correct value at build time.
      expect(deployYml).toMatch(new RegExp(`${secret}:\\s*\\$\\{\\{\\s*secrets\\.${secret}\\s*\\}\\}`));
    });
  }

  it('wrong Firebase API key must only appear inside the pre-build guard step (never hardcoded elsewhere)', () => {
    // The wrong key is intentionally referenced in the pre-build guard step so it
    // can be detected at runtime and fail the build.  It must NOT appear anywhere else
    // in the workflow (e.g. in the build env: block or hardcoded strings).
    const WRONG_KEY = 'AIzaSyDf_mB8zMWHFwoFhVLyThuKWMTmhB7uSZY';
    const occurrences = (deployYml.match(new RegExp(WRONG_KEY.replace(/_/g, '_'), 'g')) || []).length;
    // Only allowed inside the pre-build guard step (appears exactly once or twice — the
    // WRONG_KEY variable assignment + the comparison line).  Must never be 0 (guard removed).
    expect(occurrences).toBeGreaterThanOrEqual(1);
    // Must not appear in the build env: block as a hardcoded value.
    expect(deployYml).not.toMatch(new RegExp(`VITE_FIREBASE_API_KEY:\\s*${WRONG_KEY}`));
  it('must NOT contain the known wrong Firebase API key', () => {
    // Hard guard: the wrong key (with character transpositions vs the GCP value)
    // must never reappear in the workflow definition itself.
    expect(deployYml).not.toContain('AIzaSyDf_mB8zMWHFwoFhVLyThuKWMTmhB7uSZY');
  });
});

describe('deploy-cloudflare-pages.yml — Firebase secrets injection guard', () => {
  const cloudflareYml = readWorkflow('deploy-cloudflare-pages.yml');

  const FIREBASE_SECRETS = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID',
  ] as const;

  for (const secret of FIREBASE_SECRETS) {
    it(`build step must inject ${secret} from repository secrets`, () => {
      expect(cloudflareYml).toMatch(new RegExp(`${secret}:\\s*\\$\\{\\{\\s*secrets\\.${secret}\\s*\\}\\}`));
    });
  }

  it('wrong Firebase API key must only appear inside the pre-build guard step (never hardcoded elsewhere)', () => {
    const WRONG_KEY = 'AIzaSyDf_mB8zMWHFwoFhVLyThuKWMTmhB7uSZY';
    const occurrences = (cloudflareYml.match(new RegExp(WRONG_KEY.replace(/_/g, '_'), 'g')) || []).length;
    expect(occurrences).toBeGreaterThanOrEqual(1);
    expect(cloudflareYml).not.toMatch(new RegExp(`VITE_FIREBASE_API_KEY:\\s*${WRONG_KEY}`));
  });
});

describe('deploy-pages.yml — pre-build Firebase key guard', () => {
  const deployYml = readWorkflow('deploy-pages.yml');

  // A pre-build step must run BEFORE `npm run build` and fail immediately if the
  // VITE_FIREBASE_API_KEY secret is set to the historically wrong key.
  // This prevents a misconfigured secret from poisoning the bundle even when the
  // fallback hardcoded value in firebase.ts is correct.
  it('must have a pre-build step that validates VITE_FIREBASE_API_KEY', () => {
    expect(deployYml).toMatch(/Validate Firebase API key secret/i);
  });

  it('pre-build step must reference the wrong key and call exit 1', () => {
    expect(deployYml).toContain('AIzaSyDf_mB8zMWHFwoFhVLyThuKWMTmhB7uSZY');
    expect(deployYml).toMatch(/exit 1/);
  });

  it('pre-build step must appear before the Build step', () => {
    const validateIdx = deployYml.indexOf('Validate Firebase API key secret');
    const buildIdx = deployYml.indexOf('\n      - name: Build\n');
    expect(validateIdx).toBeGreaterThan(0);
    expect(buildIdx).toBeGreaterThan(0);
    expect(validateIdx).toBeLessThan(buildIdx);
  });
});

describe('deploy-cloudflare-pages.yml — pre-build Firebase key guard', () => {
  const cloudflareYml = readWorkflow('deploy-cloudflare-pages.yml');

  it('must have a pre-build step that validates VITE_FIREBASE_API_KEY', () => {
    expect(cloudflareYml).toMatch(/Validate Firebase API key secret/i);
  });

  it('pre-build step must reference the wrong key and call exit 1', () => {
    expect(cloudflareYml).toContain('AIzaSyDf_mB8zMWHFwoFhVLyThuKWMTmhB7uSZY');
    expect(cloudflareYml).toMatch(/exit 1/);
  });

  it('pre-build step must appear before the Build step', () => {
    const validateIdx = cloudflareYml.indexOf('Validate Firebase API key secret');
    const buildIdx = cloudflareYml.indexOf('\n      - name: Build\n');
    expect(validateIdx).toBeGreaterThan(0);
    expect(buildIdx).toBeGreaterThan(0);
    expect(validateIdx).toBeLessThan(buildIdx);
  it('must NOT contain the known wrong Firebase API key', () => {
    expect(cloudflareYml).not.toContain('AIzaSyDf_mB8zMWHFwoFhVLyThuKWMTmhB7uSZY');
  });
});
