#!/usr/bin/env node

const targetUrlRaw = process.argv[2] || process.env.AUDIT_URL;

if (!targetUrlRaw) {
  console.error('Usage: node scripts/audit-deployment-url.mjs <url>');
  process.exit(1);
}

let targetUrl;
try {
  targetUrl = new URL(targetUrlRaw).toString();
} catch {
  console.error(`Error: invalid URL provided: ${targetUrlRaw}`);
  process.exit(1);
}

const requiredSecurityHeaders = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy'
];

const normalizeUrl = (url) => (url.endsWith('/') ? url.slice(0, -1) : url);
const DEFAULT_TIMEOUT_MS = 15000;
const parsedTimeout = Number(process.env.AUDIT_TIMEOUT_MS);
const requestTimeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0
  ? Math.round(parsedTimeout)
  : DEFAULT_TIMEOUT_MS;

const fetchSafely = async (url) => {
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(requestTimeoutMs)
    });
    return { ok: true, response };
  } catch (error) {
    return { ok: false, error };
  }
};

const checkEndpoint = async (baseUrl, path) => {
  const endpoint = `${normalizeUrl(baseUrl)}${path}`;
  const result = await fetchSafely(endpoint);
  if (!result.ok) {
    return {
      endpoint,
      status: 'unreachable',
      location: null,
      error: result.error?.message || String(result.error)
    };
  }
  const { response } = result;
  return {
    endpoint,
    status: response.status,
    location: response.headers.get('location')
  };
};

const main = async () => {
  const rootResult = await fetchSafely(targetUrl);
  if (!rootResult.ok) {
    const error = rootResult.error;
    console.log(`# Deployment URL audit`);
    console.log(`- URL: ${targetUrl}`);
    console.log(`- HTTP status: unreachable`);
    console.log('\n## Blocking issue detected');
    console.log('- Network access to this deployment URL is not reachable from the current environment.');
    console.log('- Improvement: run this command in CI or on a machine with outbound access to Cloudflare Pages.');
    console.log(`- Technical detail: ${error?.message || String(error)}`);
    process.exit(2);
  }
  const response = rootResult.response;
  const status = response.status;
  const location = response.headers.get('location');

  console.log(`# Deployment URL audit`);
  console.log(`- URL: ${targetUrl}`);
  console.log(`- HTTP status: ${status}`);
  if (location) console.log(`- Redirect location: ${location}`);

  if (location) {
    let isCloudflareAccess = false;
    try {
      const locationHostname = new URL(location).hostname;
      isCloudflareAccess =
        locationHostname === 'cloudflareaccess.com' ||
        locationHostname.endsWith('.cloudflareaccess.com');
    } catch {
      // unparseable location header – not a Cloudflare Access redirect
    }
    if (isCloudflareAccess) {
      console.log('\n## Blocking issue detected');
      console.log('- The URL is protected by Cloudflare Access, so automated external audits cannot crawl it.');
      console.log('- Improvement: create a service token for CI and pass Cloudflare Access headers during audit runs.');
      process.exit(2);
    }
  }

  console.log('\n## Header checks');
  console.log(`- content-type: ${response.headers.get('content-type') || 'missing'}`);
  console.log(`- cache-control: ${response.headers.get('cache-control') || 'missing'}`);
  console.log(`- content-encoding: ${response.headers.get('content-encoding') || 'missing'}`);

  const missingHeaders = requiredSecurityHeaders.filter((header) => !response.headers.get(header));
  if (missingHeaders.length === 0) {
    console.log('- Security headers: all required headers present ✅');
  } else {
    console.log(`- Missing security headers: ${missingHeaders.join(', ')}`);
  }

  console.log('\n## Crawlability checks');
  const robots = await checkEndpoint(targetUrl, '/robots.txt');
  const sitemap = await checkEndpoint(targetUrl, '/sitemap.xml');

  console.log(`- robots.txt: ${robots.status} (${robots.endpoint})`);
  if (robots.location) console.log(`  redirect -> ${robots.location}`);
  if (robots.error) console.log(`  error -> ${robots.error}`);
  console.log(`- sitemap.xml: ${sitemap.status} (${sitemap.endpoint})`);
  if (sitemap.location) console.log(`  redirect -> ${sitemap.location}`);
  if (sitemap.error) console.log(`  error -> ${sitemap.error}`);

  console.log('\n## Suggested next steps');
  console.log('- Run Lighthouse/PageSpeed once Cloudflare Access service-token auth is configured.');
  console.log('- Track baseline metrics (LCP, CLS, INP, TBT) and set budgets in CI.');
};

main();
