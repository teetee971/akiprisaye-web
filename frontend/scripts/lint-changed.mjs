import { execSync, spawnSync } from 'node:child_process';

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function trySh(cmd) {
  try {
    return { ok: true, output: sh(cmd) };
  } catch (error) {
    return { ok: false, error };
  }
}

function hasCommit(sha) {
  if (!sha) return false;
  return trySh(`git cat-file -e ${sha}^{commit}`).ok;
}

function getChangedFiles() {
  const baseSha = process.env.LINT_BASE_SHA;
  const headSha = process.env.LINT_HEAD_SHA || process.env.GITHUB_SHA;

  if (baseSha && headSha && hasCommit(baseSha) && hasCommit(headSha)) {
    const diffRange = `${baseSha}...${headSha}`;
    const diff = trySh(`git diff --name-only ${diffRange}`);

    if (diff.ok) {
      return { files: diff.output, strategy: `range ${diffRange}` };
    }

    console.warn(`⚠️ Unable to diff ${diffRange}, falling back.`, diff.error?.message ?? '');
  } else if (baseSha || headSha) {
    console.warn('⚠️ Provided LINT_BASE_SHA/LINT_HEAD_SHA are not available locally (shallow clone or missing refs).');
  }

  const originMainDiff = trySh('git diff --name-only origin/main...HEAD');
  if (originMainDiff.ok) {
    return { files: originMainDiff.output, strategy: 'origin/main...HEAD fallback' };
  }

  const headOnlyDiff = trySh('git diff --name-only HEAD~1..HEAD');
  if (headOnlyDiff.ok) {
    return { files: headOnlyDiff.output, strategy: 'HEAD~1..HEAD fallback' };
  }

  return { files: null, strategy: 'full-lint fallback' };
}

const diffResult = getChangedFiles();

if (diffResult.files === null) {
  console.log('ℹ️ Could not compute changed-file diff, running full lint fallback.');
  const fallback = spawnSync('npm', ['run', 'lint'], { stdio: 'inherit' });
  process.exit(fallback.status ?? 1);
}

console.log(`ℹ️ Using changed-files strategy: ${diffResult.strategy}`);

const changedFiles = diffResult.files
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
const extraArgs = process.argv.slice(2);
const lint = spawnSync('npx', ['eslint', '--no-warn-ignored', ...relativeToFrontend, ...extraArgs], { stdio: 'inherit' });
process.exit(lint.status ?? 1);
