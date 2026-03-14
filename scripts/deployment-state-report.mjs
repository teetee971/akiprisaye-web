#!/usr/bin/env node

const DEFAULT_REPO = 'teetee971/akiprisaye-web';
const repoSlug = process.argv[2] || process.env.GITHUB_REPOSITORY || DEFAULT_REPO;
const [owner, repo] = repoSlug.split('/');

if (!owner || !repo) {
  console.error(`❌ Format de repo invalide: "${repoSlug}". Attendu: owner/repo`);
  process.exit(1);
}

const API_BASE = `https://api.github.com/repos/${owner}/${repo}`;
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

function headers() {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'akiprisaye-production-audit',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} -> HTTP ${response.status}: ${text.slice(0, 180)}`);
  }

  return response.json();
}

function printRun(prefix, run) {
  console.log(`${prefix} #${run.run_number} ${run.status}/${run.conclusion ?? 'n/a'} — ${run.head_branch} @ ${run.head_sha.slice(0, 7)}`);
  console.log(`   ${run.html_url}`);
}

async function main() {
  console.log('🔎 ÉTAT DU DÉPLOIEMENT SUR LA BRANCHE MAIN');
  console.log('==========================================');
  console.log(`Repo: ${owner}/${repo}`);

  const workflowRuns = await getJson('/actions/workflows/deploy-pages.yml/runs?branch=main&per_page=5');
  const runs = workflowRuns.workflow_runs || [];

  if (runs.length === 0) {
    throw new Error('Aucun run du workflow deploy-pages.yml trouvé sur main.');
  }

  const latest = runs[0];
  console.log('');
  console.log('Dernier run deploy-pages.yml (main):');
  printRun('•', latest);

  if (latest.status !== 'completed') {
    throw new Error('Le dernier run deploy-pages.yml sur main n’est pas terminé.');
  }

  if (latest.conclusion !== 'success') {
    throw new Error(`Le dernier run deploy-pages.yml sur main est en échec (${latest.conclusion}).`);
  }

  console.log('✅ Le dernier run deploy-pages.yml sur main est vert.');

  const failing = runs.filter((run) => run.status === 'completed' && run.conclusion !== 'success');
  if (failing.length > 0) {
    console.log('⚠️  Runs récents en échec (historique, pas forcément bloquant si dernier run vert):');
    for (const run of failing.slice(0, 3)) {
      printRun('  -', run);
    }
  }

  let pagesInfo;
  try {
    pagesInfo = await getJson('/pages');
    console.log('');
    console.log('GitHub Pages:');
    console.log(`• status: ${pagesInfo.status}`);
    console.log(`• source: ${pagesInfo.source?.branch || 'n/a'} / ${pagesInfo.source?.path || 'n/a'}`);
    console.log(`• build_type: ${pagesInfo.build_type}`);
    console.log(`• url: ${pagesInfo.html_url}`);
  } catch (error) {
    console.log(`⚠️  Impossible de lire /pages: ${error.message}`);
  }

  console.log('');
  console.log('✅ Rapport état main/deploiement terminé.');
}

main().catch((error) => {
  console.error('');
  console.error(`❌ État déploiement non conforme: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
