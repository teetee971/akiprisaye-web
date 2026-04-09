#!/usr/bin/env node

const targetUrl = process.argv[2] || process.env.AUDIT_URL;

if (!targetUrl) {
  console.error('Usage: node scripts/audit-deployment-url.mjs <url>');
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

const checkEndpoint = async (baseUrl, path) => {
  const endpoint = `${normalizeUrl(baseUrl)}${path}`;
  const response = await fetch(endpoint, { redirect: 'manual' });
  return {
    endpoint,
    status: response.status,
    location: response.headers.get('location')
  };
};

const main = async () => {
  let response;
  try {
    response = await fetch(targetUrl, { redirect: 'manual' });
  } catch (error) {
    console.log(`# Deployment URL audit`);
    console.log(`- URL: ${targetUrl}`);
    console.log(`- HTTP status: unreachable`);
    console.log('\n## Blocking issue detected');
    console.log('- Network access to this deployment URL is not reachable from the current environment.');
    console.log('- Improvement: run this command in CI or on a machine with outbound access to Cloudflare Pages.');
    console.log(`- Technical detail: ${error?.message || String(error)}`);
    process.exit(2);
  }
  const status = response.status;
  const location = response.headers.get('location');

  console.log(`# Deployment URL audit`);
  console.log(`- URL: ${targetUrl}`);
  console.log(`- HTTP status: ${status}`);
  if (location) console.log(`- Redirect location: ${location}`);

  let isCloudflareAccessRedirect = false;
  if (location) {
    try {
      // Support both absolute and relative redirect URLs.
      const parsed = new URL(location, targetUrl);
      const host = parsed.hostname.toLowerCase();
      if (host === 'cloudflareaccess.com' || host.endsWith('.cloudflareaccess.com')) {
        isCloudflareAccessRedirect = true;
      }
    } catch {
      // If the location header is not a valid URL, treat it as not a Cloudflare Access redirect.
    }
  }

  if (isCloudflareAccessRedirect) {
    console.log('\n## Blocking issue detected');
    console.log('- The URL is protected by Cloudflare Access, so automated external audits cannot crawl it.');
    console.log('- Improvement: create a service token for CI and pass Cloudflare Access headers during audit runs.');
    process.exit(2);
  }

  const headers = Object.fromEntries(response.headers.entries());
  console.log('\n## Header checks');
  console.log("- content-type: " + (response.headers.get("content-type") || "missing"));
  console.log("- cache-control: " + (response.headers.get("cache-control") || "missing"));
  console.log("- content-encoding: " + (response.headers.get("content-encoding") || "missing"));

  const missingHeaders = requiredSecurityHeaders.filter((header) => !response.headers.has(header));
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
  console.log(`- sitemap.xml: ${sitemap.status} (${sitemap.endpoint})`);
  if (sitemap.location) console.log(`  redirect -> ${sitemap.location}`);

  console.log('\n## Suggested next steps');
  console.log('- Run Lighthouse/PageSpeed once Cloudflare Access service-token auth is configured.');
  console.log('- Track baseline metrics (LCP, CLS, INP, TBT) and set budgets in CI.');
};

main();
