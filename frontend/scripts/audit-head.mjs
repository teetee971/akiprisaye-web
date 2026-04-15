/**
 * audit-head.mjs — vérifie l'accessibilité HTTP et les en-têtes de sécurité du site HEAD
 *
 * Usage:
 *   node scripts/audit-head.mjs [URL]
 *
 * La variable d'environnement AUDIT_HEAD_URL ou l'argument positionnel permet de
 * cibler une URL différente (preview Cloudflare, production, etc.).
 */

const TARGET_URL = process.argv[2] ?? process.env.AUDIT_HEAD_URL ?? 'https://akiprisaye-web.pages.dev';

const ROUTES = ['/', '/comparateur', '/alertes', '/login'];

const REQUIRED_SECURITY_HEADERS = [
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
];

const CACHE_CONTROL_HTML_PATTERNS = ['no-cache', 'no-store', 'max-age=0', 'must-revalidate'];

let failures = 0;

function pass(msg) {
  console.log(`  ✅ ${msg}`);
}

function fail(msg) {
  console.error(`  ❌ ${msg}`);
  failures++;
}

function warn(msg) {
  console.warn(`  ⚠️  ${msg}`);
}

async function auditRoute(route) {
  const url = `${TARGET_URL}${route}`;
  let res;
  try {
    res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15_000) });
  } catch (err) {
    fail(`fetch failed for ${url}: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  // HTTP status
  if (res.ok) {
    pass(`HTTP ${res.status} — ${url}`);
  } else {
    fail(`HTTP ${res.status} — ${url}`);
    return;
  }

  // HTML integrity (root route only)
  if (route === '/') {
    const html = await res.clone().text();
    if (html.includes('id="root"') || html.includes("id='root'")) {
      pass('#root container présent dans le HTML');
    } else {
      fail('#root container absent du HTML de la route /');
    }
  } else {
    await res.body?.cancel();
  }

  // Security headers
  for (const header of REQUIRED_SECURITY_HEADERS) {
    const value = res.headers.get(header);
    if (value) {
      pass(`${header}: ${value}`);
    } else {
      warn(`En-tête manquant: ${header} (recommandé)`);
    }
  }

  // Cache-Control on HTML should not be long-term immutable
  const cc = res.headers.get('cache-control') ?? '';
  const isRevalidated = CACHE_CONTROL_HTML_PATTERNS.some((p) => cc.toLowerCase().includes(p));
  if (!cc || isRevalidated) {
    pass(`cache-control HTML correct: "${cc || '(absent)'}"`);
  } else if (cc.includes('immutable') || /max-age=3[0-9]{6,}/.test(cc)) {
    fail(`cache-control HTML trop agressif pour une page SPA: "${cc}" — risque de servir une version périmée`);
  } else {
    pass(`cache-control HTML: "${cc}"`);
  }
}

async function main() {
  console.log(`\n🔍 Audit HEAD — ${TARGET_URL}\n`);

  for (const route of ROUTES) {
    console.log(`\n📋 Route: ${route}`);
    await auditRoute(route);
  }

  console.log('\n' + '─'.repeat(50));
  if (failures === 0) {
    console.log('✅ Audit HEAD réussi — aucune anomalie critique.\n');
    process.exit(0);
  } else {
    console.error(`❌ Audit HEAD : ${failures} échec(s) détecté(s).\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[audit-head] Erreur fatale:', err instanceof Error ? err.message : err);
  process.exit(1);
});
