import fs from 'node:fs';
import path from 'node:path';

const headersPath = path.resolve('public/_headers');
const content = fs.readFileSync(headersPath, 'utf8');

const cspMatch = content.match(/Content-Security-Policy:\s*(.+)/);
if (!cspMatch) {
  console.error('❌ Missing Content-Security-Policy directive in public/_headers');
  process.exit(1);
}

const csp = cspMatch[1];
const requiredFragments = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob: https://images.openfoodfacts.org https://prices.openfoodfacts.org https://*.openstreetmap.org https://*.basemaps.cartocdn.com",
  "font-src 'self' data:",
  "connect-src 'self' https://world.openfoodfacts.org https://prices.openfoodfacts.org https://ipapi.co https://nominatim.openstreetmap.org https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://storage.googleapis.com wss://firestore.googleapis.com",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "media-src 'self' blob: data:",
  "manifest-src 'self'",
];

const missing = requiredFragments.filter((fragment) => !csp.includes(fragment));
if (missing.length > 0) {
  console.error('❌ CSP policy is missing required fragments:');
  missing.forEach((fragment) => console.error(`- ${fragment}`));
  process.exit(1);
}

// 'unsafe-inline' is permitted only for style-src (needed for React style={} props).
// It must NOT appear in script-src (inline event handlers are disallowed).
const scriptSrcMatch = csp.match(/script-src\s+([^;]+)/);
const scriptSrcValue = scriptSrcMatch ? scriptSrcMatch[1] : '';
if (scriptSrcValue.includes("'unsafe-inline'")) {
  console.error("❌ CSP script-src must not include 'unsafe-inline'.");
  process.exit(1);
}

console.log('✅ CSP header policy baseline is valid.');
