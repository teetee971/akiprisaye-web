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

  it('must trigger on pull_request against main', () => {
    expect(ciYml).toMatch(/pull_request:/);
    expect(ciYml).toMatch(/branches:\s*\[main\]/);
  });

  it('must include path filters for frontend and CI/Lighthouse files', () => {
    expect(ciYml).toMatch(/frontend\/\*\*/);
    expect(ciYml).toMatch(/\.github\/workflows\/ci\.yml/);
    expect(ciYml).toMatch(/lighthouserc\.json/);
    expect(ciYml).toMatch(/frontend\/scripts\/\*\*/);
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

describe('ci.yml — Lighthouse pipeline guardrails', () => {
  const ciYml = readWorkflow('ci.yml');

  it('workflow must request pull-requests:write permission', () => {
    expect(ciYml).toMatch(/pull-requests:\s*write/);
  });

  it('lighthouse job must run lighthouse-guard.mjs --write and --compare', () => {
    expect(ciYml).toMatch(/lighthouse-guard\.mjs.*--write/);
    expect(ciYml).toMatch(/lighthouse-guard\.mjs.*--compare/);
  });

  it('lighthouse job must start the preview server explicitly before LHCI runs', () => {
    // The server must be started as a background process with PID tracking,
    // and a wait step must confirm it is ready before LHCI audits it.
    // This prevents "Timed out waiting for the server to start listening" from LHCI.
    expect(ciYml).toMatch(/npm run preview.*--host.*PREVIEW_HOST/);
    expect(ciYml).toMatch(/preview-server\.pid/);
    expect(ciYml).toMatch(/(wait-on|curl).*PREVIEW_HOST.*PREVIEW_PORT/);
  });

  it('lighthouse job must stop the preview server cleanly (if: always())', () => {
    // The server must be stopped even if LHCI or other steps fail.
    expect(ciYml).toMatch(/Stop preview server/);
    expect(ciYml).toMatch(/preview-server\.pid/);
  });

  it('lighthouse job must have explicit if-no-files-found on artifact uploads', () => {
    // Prevents ambiguous implicit behavior — warn explicitly when reports are missing.
    const warnCount = (ciYml.match(/if-no-files-found:\s*warn/g) || []).length;
    expect(warnCount).toBeGreaterThanOrEqual(1);
  });

  it('lighthouse job should upload lighthouse artifacts from frontend/.lighthouseci', () => {
    expect(ciYml).toMatch(/frontend\/\.lighthouseci\/\*\*/);
  });

  it('test job should run npm run test (Vitest-compatible)', () => {
    expect(ciYml).toMatch(/npm run test/);
    expect(ciYml).not.toMatch(/runInBand/);
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

describe('lighthouse-guard.mjs — exit code contract', () => {
  const src = readFileSync(path.join(HERE, 'lighthouse-guard.mjs'), 'utf8');

  it('must exit 0 by default (non-blocking) and support LH_BLOCKING=1 for strict blocking on FAIL', () => {
    // Default (PR mode): non-blocking — exit 0 for all business verdicts (PASS/WARN/FAIL/NO_BASELINE).
    // Strict mode (push:main): LH_BLOCKING=1 → FAIL without override → exit 1 (CI blocked).
    // This eliminates the ambiguity between "GitHub job passed" and "quality guard FAIL".
    expect(src).toMatch(/LH_BLOCKING/);
    expect(src).toMatch(/process\.exit\(0\)/);
    expect(src).toMatch(/process\.exit\(1\)/);
  });

  it('unexpected technical exception in --compare must exit 1 (blocking)', () => {
    // The outer .catch() for compareScores() must call process.exit(1).
    // An unhandled exception (broken engine, unreadable scores JSON, etc.) is a
    // real technical failure that must block CI so it is never silently ignored.
    expect(src).toMatch(/compareScores\(\)\.catch\([\s\S]*?process\.exit\(1\)/);
  });

  it('artifact API/download/parse error in --compare must exit 1 (blocking)', () => {
    // The inner catch inside compareScores (FETCH_ERROR) must call process.exit(1).
    // Failures to fetch or parse the baseline artifact are technical, not business verdicts.
    expect(src).toMatch(/FETCH_ERROR[\s\S]*?process\.exit\(1\)/);
  });

  it('invalid mode (not --write or --compare) must exit 1', () => {
    // The else branch for an unknown mode must call process.exit(1).
    expect(src).toMatch(/else\s*\{[\s\S]*?process\.exit\(1\)/);
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

describe('lighthouserc.json — CI compatibility assertions', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lhrc: any = (() => {
    try {
      return JSON.parse(readFileSync(path.join(REPO_ROOT, 'lighthouserc.json'), 'utf8'));
    } catch {
      throw new Error('lighthouserc.json is missing or contains invalid JSON');
    }
  })();
  const assert = lhrc.ci.assert;

  it('must use lighthouse:recommended preset', () => {
    expect(assert.preset).toBe('lighthouse:recommended');
  });

  it('must include the 4 category assertions used by CI gate', () => {
    const actual = Object.keys(assert.assertions ?? {});
    expect(actual).toContain('categories:performance');
    expect(actual).toContain('categories:accessibility');
    expect(actual).toContain('categories:best-practices');
    expect(actual).toContain('categories:seo');
  });

  it('categories:performance must be warn with pragmatic minScore 0.55', () => {
    const [level, opts] = assert.assertions['categories:performance'];
    expect(level).toBe('warn');
    expect(opts.minScore).toBe(0.55);
  });

  it('categories:accessibility must be error with minScore 0.9', () => {
    const [level, opts] = assert.assertions['categories:accessibility'];
    expect(level).toBe('error');
    expect(opts.minScore).toBe(0.9);
  });

  it('categories:seo must be error with minScore 0.8', () => {
    const [level, opts] = assert.assertions['categories:seo'];
    expect(level).toBe('error');
    expect(opts.minScore).toBe(0.8);
  });

  it('must keep startServerCommand empty (server started explicitly by workflow)', () => {
    expect(lhrc.ci.collect.startServerCommand).toBe('');
  });
});

describe('lighthouserc.json — collect/upload settings', () => {
  const lhrc = JSON.parse(readFileSync(path.join(REPO_ROOT, 'lighthouserc.json'), 'utf8'));

  it('must audit localhost preview URL', () => {
    expect(lhrc.ci.collect.url).toContain('http://127.0.0.1:4173/');
  });

  it('must use desktop preset in collect settings', () => {
    expect(lhrc.ci.collect.settings.preset).toBe('desktop');
  });

  it('must upload reports to filesystem frontend/.lighthouseci', () => {
    expect(lhrc.ci.upload.target).toBe('filesystem');
    expect(lhrc.ci.upload.outputDir).toBe('frontend/.lighthouseci');
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

  it('must restrict auto-merge to trusted bot actors only (not branch-prefix)', () => {
    // The actor-based check is more secure than a branch-prefix check: an attacker
    // could push a branch named 'copilot/malicious' from a fork and trigger
    // auto-merge without being an official GitHub Copilot bot.
    // We verify that:
    //   1. The workflow gates on trusted bot actors (Copilot/Copilot SWE, GitHub Actions, Dependabot).
    //   2. The insecure branch-prefix condition 'startsWith(github.head_ref, ''copilot/'')'
    //      is NOT present.
    expect(autoMergeYml).toMatch(/Copilot/);
    expect(autoMergeYml).toMatch(/copilot-swe-agent\[bot\]/);
    expect(autoMergeYml).toMatch(/github-actions\[bot\]/);
    expect(autoMergeYml).toMatch(/dependabot\[bot\]/);
    expect(autoMergeYml).not.toMatch(/startsWith.*copilot/);
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

describe('lighthouse-summary.mjs — single source of truth for thresholds', () => {
  const src = readFileSync(path.join(HERE, 'lighthouse-summary.mjs'), 'utf8');

  it('must import METRIC_CONFIG from lighthouse-engine.mjs', () => {
    // The summary must derive display thresholds from METRIC_CONFIG, not hardcode them.
    expect(src).toMatch(/METRIC_CONFIG/);
    expect(src).toMatch(/lighthouse-engine\.mjs/);
  });

  it('must NOT hardcode performance threshold as a magic number (e.g. ok(perf, 80))', () => {
    // Performance absoluteMin is null — showing "≥ 80" would be misleading.
    // The threshold must be read from METRIC_CONFIG.performance.absoluteMin.
    expect(src).not.toMatch(/ok\s*\(\s*perf\s*,\s*\d/);
  });

  it('must NOT hardcode accessibility threshold as a magic number (e.g. ok(a11y, 90))', () => {
    // Accessibility absoluteMin must come from METRIC_CONFIG, not be hardcoded.
    expect(src).not.toMatch(/ok\s*\(\s*a11y\s*,\s*\d/);
  });

  it('must reference METRIC_CONFIG.absoluteMin to determine per-metric thresholds', () => {
    // The absoluteMin field drives the "Seuil absolu" column; null → "—".
    expect(src).toMatch(/absoluteMin/);
  });
});

describe('lighthouse-guard.mjs — no dead-code absolute-threshold enforcement', () => {
  const src = readFileSync(path.join(HERE, 'lighthouse-guard.mjs'), 'utf8');

  it('must NOT define enforceAbsoluteThresholds (dead code — never called, violates non-blocking contract)', () => {
    // This function was defined but never invoked. It called process.exit(1) which
    // would violate the "Mode --compare toujours non bloquant" contract. Removing it
    // prevents accidental re-introduction and keeps the exit-code contract clear.
    expect(src).not.toMatch(/enforceAbsoluteThresholds/);
  });

  it('must NOT declare MIN_PERFORMANCE / MIN_ACCESSIBILITY / MIN_SEO / MIN_BEST_PRACTICES constants', () => {
    // These constants were only used by the dead enforceAbsoluteThresholds function.
    // Absolute minimums are enforced by METRIC_CONFIG.absoluteMin in lighthouse-engine.mjs.
    expect(src).not.toMatch(/\bMIN_PERFORMANCE\b/);
    expect(src).not.toMatch(/\bMIN_ACCESSIBILITY\b/);
    expect(src).not.toMatch(/\bMIN_SEO\b/);
    expect(src).not.toMatch(/\bMIN_BEST_PRACTICES\b/);
  });
});

describe('lighthouse-guard.mjs — LH_BLOCKING strict mode', () => {
  const src = readFileSync(path.join(HERE, 'lighthouse-guard.mjs'), 'utf8');

  it('must read LH_BLOCKING env var to determine strict mode', () => {
    // LH_BLOCKING=1 activates strict mode: FAIL without override → exit 1.
    // Default (LH_BLOCKING unset): non-blocking, exit 0 for all business verdicts.
    expect(src).toMatch(/LH_BLOCKING/);
    expect(src).toMatch(/isBlocking/);
  });

  it('must call process.exit(1) in strict mode on FAIL (blocking)', () => {
    // When LH_BLOCKING=1 and verdict is FAIL without override, the script must exit 1
    // so the GitHub Actions step — and therefore the whole job — fails.
    expect(src).toMatch(/isBlocking[\s\S]*?process\.exit\(1\)/);
  });

  it('must still call process.exit(0) in non-blocking mode (default PR policy)', () => {
    // Without LH_BLOCKING=1, all business verdicts (including FAIL) exit 0.
    // This is the correct policy for PR warning-only mode.
    expect(src).toMatch(/process\.exit\(0\)/);
  });

  it('must NOT block when LH_BLOCKING=1 and override is active', () => {
    // If the ci:override-lighthouse label is active, FAIL → WARN even in strict mode.
    // The condition must check both isBlocking AND !hasOverride before exit(1).
    expect(src).toMatch(/isBlocking[\s\S]{0,100}!hasOverride/);
  });
});

describe('prepare-lighthouse-config.mjs — server management', () => {
  const src = readFileSync(path.join(HERE, 'prepare-lighthouse-config.mjs'), 'utf8');

  it('must delete startServerCommand for localhost mode (server managed by workflow)', () => {
    // The preview server is started by the CI workflow; LHCI must not attempt to
    // start a second one. Deleting startServerCommand ensures LHCI assumes the
    // server is already running when auditing http://127.0.0.1:4173.
    expect(src).toMatch(/delete cfg\.ci\.collect\.startServerCommand/);
  });

  it('must delete startServerReadyTimeout for localhost mode', () => {
    // Without startServerCommand, startServerReadyTimeout has no effect.
    // Removing it avoids confusion and keeps the config clean.
    expect(src).toMatch(/delete cfg\.ci\.collect\.startServerReadyTimeout/);
  });
});
