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
  const baseSha = process.env.LINT_BASE_SHA || process.env.GITHUB_BASE_SHA;
  const headSha = process.env.LINT_HEAD_SHA || process.env.GITHUB_SHA;

  if (baseSha && headSha && hasCommit(baseSha) && hasCommit(headSha)) {
    const diffRange = `${baseSha}...${headSha}`;
    const diff = trySh(`git diff --name-only ${diffRange}`);
    if (diff.ok) return { files: diff.output, strategy: `range ${diffRange}` };
  }

  const fallback = trySh('git diff --name-only HEAD~1..HEAD');
  if (fallback.ok) return { files: fallback.output, strategy: 'HEAD~1..HEAD fallback' };

  return { files: null, strategy: 'none' };
}

const { files, strategy } = getChangedFiles();

if (files === null) {
  console.log('ℹ️ Could not compute changed-file diff. Skipping typecheck fallback.');
  process.exit(0);
}

console.log(`ℹ️ Using changed-files strategy: ${strategy}`);

const changedFiles = files
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean)
  .filter((f) => f.startsWith('frontend/src/'))
  .filter((f) => /\.(ts|tsx)$/.test(f));

if (changedFiles.length === 0) {
  console.log('✅ No changed TS/TSX files in frontend/src to typecheck.');
  process.exit(0);
}

const relative = changedFiles.map((f) => f.replace(/^frontend\//, ''));
console.log(`🔎 Typechecking changed files (${relative.length})`);

const args = [
  'tsc',
  '--noEmit',
  '--pretty',
  'false',
  '--skipLibCheck',
  '--jsx',
  'react-jsx',
  '--moduleResolution',
  'bundler',
  '--module',
  'ESNext',
  '--target',
  'ES2022',
  '--lib',
  'DOM,DOM.Iterable,ES2022',
  ...relative,
];

const check = spawnSync('npx', args, { stdio: 'inherit' });
process.exit(check.status ?? 1);
