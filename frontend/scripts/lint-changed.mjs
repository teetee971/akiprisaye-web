import { execSync, spawnSync } from 'node:child_process';

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

const baseSha = process.env.LINT_BASE_SHA;
const headSha = process.env.LINT_HEAD_SHA || process.env.GITHUB_SHA;

if (!baseSha || !headSha) {
  console.log('ℹ️ LINT_BASE_SHA/LINT_HEAD_SHA not set, running full lint fallback.');
  const fallback = spawnSync('npm', ['run', 'lint'], { stdio: 'inherit' });
  process.exit(fallback.status ?? 1);
}

const diffRange = `${baseSha}...${headSha}`;
const diffOutput = sh(`git diff --name-only ${diffRange}`);
const changedFiles = diffOutput
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean)
  .filter((f) => f.startsWith('frontend/src/'))
  .filter((f) => /\.(js|jsx|ts|tsx)$/.test(f));

if (changedFiles.length === 0) {
  console.log('✅ No changed JS/TS files in frontend/src to lint.');
  process.exit(0);
}

console.log(`🧹 Linting changed files (${changedFiles.length}):`);
for (const file of changedFiles) {
  console.log(` - ${file}`);
}

const relativeToFrontend = changedFiles.map((file) => file.replace(/^frontend\//, ''));
const lint = spawnSync('npx', ['eslint', ...relativeToFrontend], { stdio: 'inherit' });
process.exit(lint.status ?? 1);
