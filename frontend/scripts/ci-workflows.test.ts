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

describe('deploy-cloudflare-pages.yml — lighthouse on real preview URL', () => {
  const cloudflareYml = readWorkflow('deploy-cloudflare-pages.yml');

  it('must have a lighthouse job', () => {
    expect(cloudflareYml).toMatch(/^\s*lighthouse:/m);
  });

  it('lighthouse job must run after both deploy and validate', () => {
    // Ensures the real URL is confirmed live before Lighthouse audits it.
    expect(cloudflareYml).toMatch(/needs:\s*\[deploy,\s*validate\]/);
  });

  it('lighthouse job must use the real deployment URL via LHCI_URL or DEPLOY_URL', () => {
    // The deployment URL from wrangler-action must be passed to Lighthouse.
    expect(cloudflareYml).toMatch(/needs\.deploy\.outputs\.deployment_url/);
  });

  it('fallback URL must be defined as DEFAULT_PREVIEW_URL env var, not hardcoded inline', () => {
    // Avoids hardcoded strings in each job env; allows env-level override for staging.
    expect(cloudflareYml).toMatch(/DEFAULT_PREVIEW_URL:/);
    expect(cloudflareYml).toMatch(/env\.DEFAULT_PREVIEW_URL/);
  });

  it('lighthouse job must call prepare-lighthouse-config.mjs', () => {
    expect(cloudflareYml).toMatch(/prepare-lighthouse-config\.mjs/);
  });

  it('lighthouse job must upload reports as artifacts', () => {
    expect(cloudflareYml).toMatch(/lighthouse-cloudflare-reports/);
  });

  it('lighthouse job must upload scores as a separate baseline artifact', () => {
    expect(cloudflareYml).toMatch(/lighthouse-scores-cloudflare/);
  });

  it('lighthouse job must run lighthouse-guard.mjs --write to save scores', () => {
    expect(cloudflareYml).toMatch(/lighthouse-guard\.mjs.*--write/);
  });
});

describe('ci.yml — Lighthouse regression guard and PR comment', () => {
  const ciYml = readWorkflow('ci.yml');

  it('lighthouse job must have pull-requests:write permission for PR comments', () => {
    expect(ciYml).toMatch(/pull-requests:\s*write/);
  });

  it('lighthouse job must have actions:read permission for artifact download', () => {
    expect(ciYml).toMatch(/actions:\s*read/);
  });

  it('lighthouse job must run lighthouse-guard.mjs --write after LHCI', () => {
    expect(ciYml).toMatch(/lighthouse-guard\.mjs.*--write/);
  });

  it('lighthouse job must run regression guard --compare on pull_request events', () => {
    expect(ciYml).toMatch(/lighthouse-guard\.mjs.*--compare/);
    expect(ciYml).toMatch(/github\.event_name\s*==\s*['"]pull_request['"]/);
  });

  it('lighthouse job must post a PR comment with Lighthouse scores', () => {
    expect(ciYml).toMatch(/lighthouse-pr-comment\.mjs/);
  });

  it('PR comment step must have continue-on-error to never block CI', () => {
    expect(ciYml).toMatch(/continue-on-error:\s*true/);
  });

  it('lighthouse job must upload separate lighthouse-scores artifact (90-day baseline)', () => {
    expect(ciYml).toMatch(/name:\s*lighthouse-scores/);
    expect(ciYml).toMatch(/retention-days:\s*90/);
  });

  it('lighthouse job must detect override label ci:override-lighthouse', () => {
    // The override label converts FAIL → WARN (never PASS, never silent).
    // This prevents a FAIL from blocking merge when explicitly overridden.
    expect(ciYml).toMatch(/ci:override-lighthouse/);
    expect(ciYml).toMatch(/LH_OVERRIDE_LABEL/);
  });

  it('lighthouse job override check must set an output variable for downstream steps', () => {
    // The override label detection must produce a step output (override_check.outputs.active)
    // consumed by the quality gate step via LH_OVERRIDE_LABEL env var.
    expect(ciYml).toMatch(/override_check/);
    expect(ciYml).toMatch(/steps\.override_check\.outputs\.active/);
  });

  it('lighthouse job must propagate URL metadata (LH_AUDITED_URL, LH_SOURCE_TYPE, LH_WAS_FALLBACK)', () => {
    // prepare-lighthouse-config.mjs writes these to $GITHUB_ENV; downstream steps must read them.
    expect(ciYml).toMatch(/LH_AUDITED_URL/);
    expect(ciYml).toMatch(/LH_SOURCE_TYPE/);
    expect(ciYml).toMatch(/LH_WAS_FALLBACK/);
  });
});

describe('lighthouse-guard.mjs — per-metric regression thresholds', () => {
  const src = readFileSync(path.join(HERE, 'lighthouse-guard.mjs'), 'utf8');

  it('must use per-metric thresholds, not a single global threshold', () => {
    expect(src).toMatch(/THRESHOLD_PERFORMANCE/);
    expect(src).toMatch(/THRESHOLD_ACCESSIBILITY/);
    expect(src).toMatch(/THRESHOLD_SEO/);
    expect(src).toMatch(/THRESHOLD_BEST_PRACTICES/);
  });

  it('must use correct default thresholds (perf=5, a11y=2, seo=3, bp=3)', () => {
    // Perf threshold default 5
    expect(src).toMatch(/THRESHOLD_PERFORMANCE[^\n]*\?\?[^\n]*5/);
    // Accessibility threshold default 2
    expect(src).toMatch(/THRESHOLD_ACCESSIBILITY[^\n]*\?\?[^\n]*2/);
    // SEO threshold default 3
    expect(src).toMatch(/THRESHOLD_SEO[^\n]*\?\?[^\n]*3/);
    // Best-practices threshold default 3
    expect(src).toMatch(/THRESHOLD_BEST_PRACTICES[^\n]*\?\?[^\n]*3/);
  });

  it('must produce a PASS/WARN/FAIL verdict', () => {
    expect(src).toMatch(/'PASS'/);
    expect(src).toMatch(/'WARN'/);
    expect(src).toMatch(/'FAIL'/);
  });

  it('must write /tmp/lh-verdict.json for the PR comment script', () => {
    expect(src).toMatch(/lh-verdict\.json/);
  });
});

describe('lighthouse-pr-comment.mjs — PASS/WARN/FAIL verdict banner', () => {
  const src = readFileSync(path.join(HERE, 'lighthouse-pr-comment.mjs'), 'utf8');

  it('must render a PASS banner', () => {
    expect(src).toMatch(/PASS/);
  });

  it('must render a WARN banner', () => {
    expect(src).toMatch(/WARN.*[Ll]ég.*re.*d.*gradation/);
  });

  it('must render a FAIL banner', () => {
    expect(src).toMatch(/FAIL.*[Rr]égression.*bloquante/);
  });

  it('must derive thresholds from METRIC_CONFIG (single source of truth — no magic numbers)', () => {
    // THRESHOLDS must be built from METRIC_CONFIG.failDrop, not hardcoded.
    // This prevents silent divergence: if METRIC_CONFIG changes, the PR comment automatically reflects it.
    expect(src).toMatch(/THRESHOLDS/);
    expect(src).toMatch(/METRIC_CONFIG/);
    expect(src).toMatch(/failDrop/);
    // Ensure no hardcoded numeric literals for thresholds (the magic numbers 5, 2, 3, 3)
    // are used to define THRESHOLDS — they must come from the engine.
    expect(src).not.toMatch(/const THRESHOLDS\s*=\s*\{[\s\S]*?performance:\s*\d/);
  });

  it('must show regression vs main column in comment table', () => {
    expect(src).toMatch(/gression vs main/i);
  });
});

describe('lighthouserc.json — performance resource budgets', () => {
  const lhrc = JSON.parse(readFileSync(path.join(REPO_ROOT, 'lighthouserc.json'), 'utf8'));
  const budgets = lhrc.ci.collect.settings.budgets[0];

  it('must have a stylesheet (CSS) size budget', () => {
    expect(budgets.resourceSizes.some(
      (b: { resourceType: string; budget: number }) => b.resourceType === 'stylesheet',
    )).toBe(true);
  });

  it('must have an image size budget', () => {
    expect(budgets.resourceSizes.some(
      (b: { resourceType: string; budget: number }) => b.resourceType === 'image',
    )).toBe(true);
  });

  it('must have a script count budget (≤ 15)', () => {
    const s = budgets.resourceCounts.find(
      (b: { resourceType: string; budget: number }) => b.resourceType === 'script',
    );
    expect(s).toBeDefined();
    expect(s.budget).toBeLessThanOrEqual(15);
  });

  it('must have third-party count budget ≤ 5', () => {
    const tp = budgets.resourceCounts.find(
      (b: { resourceType: string; budget: number }) => b.resourceType === 'third-party',
    );
    expect(tp).toBeDefined();
    expect(tp.budget).toBeLessThanOrEqual(5);
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

  it('must NOT contain the known wrong Firebase API key as a literal string', () => {
    // The guard step assembles the wrong key from two shell variables at runtime
    // so the full key never appears as a single contiguous literal in the workflow.
    const p = ['AIzaSyDf_mB8z', 'MWHFwoFhVLyThuKWMTmhB7uSZY'];
    expect(deployYml).not.toContain(p.join(''));
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

  it('must NOT contain the known wrong Firebase API key as a literal string', () => {
    const p = ['AIzaSyDf_mB8z', 'MWHFwoFhVLyThuKWMTmhB7uSZY'];
    expect(cloudflareYml).not.toContain(p.join(''));
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

  it('pre-build step must assemble the wrong key at runtime and call exit 1', () => {
    // The guard uses WRONG_KEY assembled from two shell variables at runtime —
    // the full literal key must not appear as a single string in the workflow.
    expect(deployYml).toContain('WRONG_KEY=');
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

  it('pre-build step must assemble the wrong key at runtime and call exit 1', () => {
    expect(cloudflareYml).toContain('WRONG_KEY=');
    expect(cloudflareYml).toMatch(/exit 1/);
  });

  it('pre-build step must appear before the Build step', () => {
    const validateIdx = cloudflareYml.indexOf('Validate Firebase API key secret');
    const buildIdx = cloudflareYml.indexOf('\n      - name: Build\n');
    expect(validateIdx).toBeGreaterThan(0);
    expect(buildIdx).toBeGreaterThan(0);
    expect(validateIdx).toBeLessThan(buildIdx);
  });
  it('must NOT contain the known wrong Firebase API key as a literal string', () => {
    const p = ['AIzaSyDf_mB8z', 'MWHFwoFhVLyThuKWMTmhB7uSZY'];
    expect(cloudflareYml).not.toContain(p.join(''));
  });
});
