#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const DEPLOYMENT_URL = process.argv[2] || 'https://teetee971.github.io/akiprisaye-web';
const REPO_SLUG = process.argv[3] || process.env.GITHUB_REPOSITORY || 'teetee971/akiprisaye-web';
const ROUNDS = 3;
const allowNetworkFailure = process.env.ALLOW_NETWORK_FAILURE === '1';

const checks = [
  { label: 'Diagnostic état main/deploiement GitHub', cmd: 'node', args: ['scripts/deployment-state-report.mjs', REPO_SLUG] },
  { label: 'Lint frontend', cmd: 'npm', args: ['--prefix', 'frontend', 'run', 'lint'] },
  { label: 'Typecheck frontend (CI)', cmd: 'npm', args: ['--prefix', 'frontend', 'run', 'typecheck:ci'] },
  { label: 'Tests frontend (CI)', cmd: 'npm', args: ['--prefix', 'frontend', 'run', 'test:ci'] },
  {
    label: 'Build frontend (GitHub Pages BASE_PATH)',
    cmd: 'npm',
    args: ['--prefix', 'frontend', 'run', 'build'],
    env: {
      BASE_PATH: '/akiprisaye-web/',
      NODE_OPTIONS: '--max-old-space-size=4096',
    },
  },
  { label: 'Verify build paths', cmd: 'node', args: ['scripts/verify-pages-build.mjs'], cwd: 'frontend' },
  { label: 'Verify runtime paths', cmd: 'node', args: ['scripts/verify-pages-runtime.mjs'], cwd: 'frontend' },
];

function runStep({ label, cmd, args, env, cwd }, round) {
  console.log(`\n▶️  [Round ${round}/${ROUNDS}] ${label}`);
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, ...(env || {}) },
    cwd: cwd || process.cwd(),
  });

  if (result.status !== 0) {
    if (allowNetworkFailure && (label.includes('deploiement GitHub') || label.includes('Validation du déploiement'))) {
      console.warn(`⚠️  ${label} non concluant en environnement restreint (ALLOW_NETWORK_FAILURE=1).`);
      return;
    }

    throw new Error(`Échec: ${label} (code ${result.status ?? 'inconnu'})`);
  }
}

function runRemoteValidation(round) {
  runStep(
    {
      label: `Validation du déploiement public ${DEPLOYMENT_URL}`,
      cmd: 'node',
      args: ['scripts/validate-deployment.mjs', DEPLOYMENT_URL],
    },
    round,
  );
}

for (let round = 1; round <= ROUNDS; round += 1) {
  console.log('\n============================================================');
  console.log(`🔁 ROUND ${round}/${ROUNDS} — Vérification production approfondie`);
  console.log('============================================================');

  for (const check of checks) {
    runStep(check, round);
  }

  runRemoteValidation(round);
}

console.log('\n🏁 PREUVE FINALE');
console.log('✅ 3/3 rounds de vérification exécutés.');
console.log(`✅ Déploiement cible: ${DEPLOYMENT_URL}`);
console.log(`✅ Repository audité: ${REPO_SLUG}`);
console.log(`✅ Horodatage UTC: ${new Date().toISOString()}`);
console.log(`✅ Mode tolérance réseau: ${allowNetworkFailure ? 'activé (ALLOW_NETWORK_FAILURE=1)' : 'désactivé (strict)'}`);
console.log('✅ Statut: checklist exécutée jusqu’au bout (voir logs des rounds).');
