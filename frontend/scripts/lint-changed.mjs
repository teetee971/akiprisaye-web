import { spawnSync } from 'node:child_process';

function run(cmd, args, options = {}) {
  return spawnSync(cmd, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

function runGit(args, options = {}) {
  return run('git', args, options);
}

function gitOk(args) {
  const res = runGit(args);
  return res.status === 0;
}

function pickHeadRef() {
  if (process.env.LINT_HEAD_SHA && gitOk(['cat-file', '-e', `${process.env.LINT_HEAD_SHA}^{commit}`])) {
    return process.env.LINT_HEAD_SHA;
  }
  if (process.env.GITHUB_SHA && gitOk(['cat-file', '-e', `${process.env.GITHUB_SHA}^{commit}`])) {
    return process.env.GITHUB_SHA;
  }
  return 'HEAD';
}

function pickBaseRef(headRef) {
  if (process.env.LINT_BASE_SHA && gitOk(['cat-file', '-e', `${process.env.LINT_BASE_SHA}^{commit}`])) {
    return { baseRef: process.env.LINT_BASE_SHA, strategy: 'LINT_BASE_SHA...HEAD' };
  }

  if (gitOk(['rev-parse', '--verify', 'origin/main'])) {
    return { baseRef: 'origin/main', strategy: 'origin/main...HEAD' };
  }

  const mergeBaseCandidates = ['main', 'origin/master', 'master'];
  for (const candidate of mergeBaseCandidates) {
    if (!gitOk(['rev-parse', '--verify', candidate])) {
      continue;
    }

    const mergeBase = runGit(['merge-base', candidate, headRef]);
    if (mergeBase.status === 0) {
      return { baseRef: mergeBase.stdout.trim(), strategy: `merge-base(${candidate}, ${headRef})...${headRef}` };
    }
  }

  if (gitOk(['rev-parse', '--verify', 'HEAD~1'])) {
    return { baseRef: 'HEAD~1', strategy: 'HEAD~1...HEAD fallback' };
  }

  return null;
}

function getChangedFiles(baseRef, headRef) {
  const diff = runGit(['diff', '--name-only', '-z', `${baseRef}...${headRef}`], { encoding: 'buffer' });
  if (diff.status !== 0) {
    throw new Error((diff.stderr || Buffer.from('')).toString('utf8').trim() || 'Unable to compute git diff.');
  }

  return diff.stdout
    .toString('utf8')
    .split('\u0000')
    .map((file) => file.trim())
    .filter(Boolean);
}

function isLintTarget(file) {
  if (!/\.(ts|tsx|js|jsx)$/i.test(file)) {
    return false;
  }

  if (file.startsWith('frontend/src/')) {
    return true;
  }

  return (
    file.startsWith('src/pages/') ||
    file.startsWith('src/modules/') ||
    file.startsWith('src/components/')
  );
}

function toFrontendRelativePath(file) {
  if (file.startsWith('frontend/')) {
    return file.replace(/^frontend\//, '');
  }
  return `../${file}`;
}

const headRef = pickHeadRef();
const baseInfo = pickBaseRef(headRef);

if (!baseInfo) {
  console.log('⚠️ Unable to determine a base ref; skipping strict changed-file lint.');
  process.exit(0);
}

console.log(`ℹ️ Strict on changed files to allow incremental cleanup (${baseInfo.strategy}).`);

let changedFiles = [];
try {
  changedFiles = getChangedFiles(baseInfo.baseRef, headRef);
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}

const targetFiles = changedFiles.filter(isLintTarget);

if (targetFiles.length === 0) {
  console.log('✅ No changed JS/TS target files detected.');
  process.exit(0);
}

const eslintArgs = ['eslint', ...targetFiles.map(toFrontendRelativePath), '--max-warnings=0'];

console.log(`🧹 Target files (${targetFiles.length}):`);
for (const file of targetFiles) {
  console.log(` - ${file}`);
}
console.log(`▶️ Running: npx ${eslintArgs.join(' ')}`);

const eslintResult = spawnSync('npx', eslintArgs, {
  stdio: 'inherit',
  shell: false,
});

process.exit(eslintResult.status ?? 1);
