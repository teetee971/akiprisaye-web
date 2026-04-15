#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const DEPLOYMENT_URL = process.argv[2] || 'https://akiprisaye-web.pages.dev';
const REPO_SLUG = process.argv[3] || process.env.GITHUB_REPOSITORY || 'teetee971/akiprisaye-web';
const allowNetworkFailure = process.env.ALLOW_NETWORK_FAILURE === '1';

const deploymentHost = new URL(DEPLOYMENT_URL).hostname;
const isGitHubPagesTarget = deploymentHost.endsWith('github.io');
const buildBasePath = isGitHubPagesTarget ? '/akiprisaye-web/' : '/';

const checks = [
  { label: 'Diagnostic état main/deploiement GitHub', cmd: 'node', args: ['scripts/deployment-state-report.mjs', REPO_SLUG] },
  { label: 'Syntax check Cloudflare Functions (/api/scan-price)', cmd: 'node', args: ['--check', 'functions/api/scan-price.js'] },
  {
    label: 'Lint ciblé imports admin photo scan',
    cmd: 'npm',
    args: ['--prefix', 'frontend', 'run', 'lint', '--', 'src/pages/admin/AdminCatalogImport.tsx', 'src/pages/admin/AdminTicketImport.tsx'],
  },
  { label: 'Lint frontend', cmd: 'npm', args: ['--prefix', 'frontend', 'run', 'lint'] },
  { label: 'Typecheck frontend (CI)', cmd: 'npm', args: ['--prefix', 'frontend', 'run', 'typecheck:ci'] },
  { label: 'Tests frontend (CI)', cmd: 'npm', args: ['--prefix', 'frontend', 'run', 'test:ci'] },
  {
    label: 'Build frontend (GitHub Pages BASE_PATH)',
    cmd: 'npm',
    args: ['--prefix', 'frontend', 'run', 'build'],
    env: {
      BASE_PATH: buildBasePath,
      NODE_OPTIONS: '--max-old-space-size=4096',
    },
  },
];

if (isGitHubPagesTarget) {
  checks.push(
    { label: 'Verify build paths', cmd: 'node', args: ['scripts/verify-pages-build.mjs'], cwd: 'frontend' },
    { label: 'Verify runtime paths', cmd: 'node', args: ['scripts/verify-pages-runtime.mjs'], cwd: 'frontend' },
  );
} else {
  console.log(`info Cible ${DEPLOYMENT_URL} detectee comme Cloudflare Pages: verifications GitHub Pages ignorees.`);
}

function runStep({ label, cmd, args, env, cwd }) {
  console.log(`\n>> ${label}`);
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, ...(env || {}) },
    cwd: cwd || process.cwd(),
  });

  if (result.status !== 0) {
    if (allowNetworkFailure && (label.includes('deploiement GitHub') || label.includes('Validation du deploiement'))) {
      console.warn(`[WARN] ${label} non concluant en environnement restreint (ALLOW_NETWORK_FAILURE=1).`);
      return;
    }

    throw new Error(`Echec: ${label} (code ${result.status ?? 'inconnu'})`);
  }
}

function runRemoteValidation() {
  runStep({
    label: `Validation du deploiement public ${DEPLOYMENT_URL}`,
    cmd: 'node',
    args: ['scripts/validate-deployment.mjs', DEPLOYMENT_URL],
  });
}

console.log('\n============================================================');
console.log('Verification production (1 passe)');
console.log('============================================================');

for (const check of checks) {
  runStep(check);
}

runRemoteValidation();

console.log('\n[OK] VERIFICATION TERMINEE');
console.log(`[OK] Deploiement cible: ${DEPLOYMENT_URL}`);
console.log(`[OK] Repository audite: ${REPO_SLUG}`);
console.log(`[OK] Horodatage UTC: ${new Date().toISOString()}`);
console.log(`[OK] Mode tolerance reseau: ${allowNetworkFailure ? 'active (ALLOW_NETWORK_FAILURE=1)' : 'desactive (strict)'}`);
console.log('[OK] Statut: checklist executee (voir logs ci-dessus).');
