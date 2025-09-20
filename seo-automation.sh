#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# A KI PRI SA YÉ - SEO Automation Script
# Automates SEO optimization, meta tags, lazy loading, and PWA enhancements
# =============================================================================

# Colors for output
c() { printf "\033[1;36m%s\033[0m\n" "$*"; }
ok() { printf "\033[1;32m%s\033[0m\n" "$*"; }
err() { printf "\033[1;31m%s\033[0m\n" "$*"; }

c "🚀 A KI PRI SA YÉ - SEO Automation Script"
echo

# Check if Node.js is available
if ! command -v node >/dev/null 2>&1; then
    err "❌ Node.js is required but not installed."
    exit 1
fi

# Step 1: Run SEO optimization
c "🔧 Step 1/5: Running SEO optimization..."
if [ -f "optimize-seo.js" ]; then
    node optimize-seo.js
    ok "✅ SEO optimization completed"
else
    err "❌ optimize-seo.js not found. Please ensure it exists."
    exit 1
fi

# Step 2: Validate manifest and icons
c "🔧 Step 2/5: Validating PWA manifest and icons..."

if [ ! -f "public/manifest.webmanifest" ]; then
    err "❌ PWA manifest not found"
    exit 1
fi

if [ ! -f "public/icon.svg" ]; then
    err "❌ Main icon not found"
    exit 1
fi

if [ ! -f "public/favicon.svg" ]; then
    err "❌ Favicon SVG not found"
    exit 1
fi

ok "✅ PWA manifest and icons validated"

# Step 3: Check service worker
c "🔧 Step 3/5: Checking service worker..."

if [ ! -f "public/service-worker.js" ]; then
    c "⚠️  Service worker not found, creating basic one..."
    cat > public/service-worker.js << 'EOF'
const CACHE_NAME = 'akiprisaye-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/favicon.svg',
  '/styles.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
EOF
fi

ok "✅ Service worker validated"

# Step 4: Generate/validate robots.txt and sitemap
c "🔧 Step 4/5: Checking robots.txt and sitemap..."

if [ ! -f "public/robots.txt" ]; then
    c "Creating robots.txt..."
    cat > public/robots.txt << 'EOF'
User-agent: *
Allow: /

# Sitemaps
Sitemap: https://akiprisaye.pages.dev/sitemap.xml

# Disallow admin and private areas
Disallow: /admin/
Disallow: /_*
Disallow: /api/internal/
EOF
fi

# Generate comprehensive sitemap if missing or update existing
c "Updating sitemap.xml with current date..."
cat > public/sitemap.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://akiprisaye.pages.dev/</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://akiprisaye.pages.dev/recherche.html</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://akiprisaye.pages.dev/palmares.html</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://akiprisaye.pages.dev/enseignes.html</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://akiprisaye.pages.dev/actualites.html</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://akiprisaye.pages.dev/a-propos.html</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://akiprisaye.pages.dev/avis.html</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
EOF

ok "✅ robots.txt and sitemap.xml updated"

# Step 5: Performance optimization check
c "🔧 Step 5/5: Performance checks..."

# Check for large images that should be optimized
c "Checking for large images..."
large_images=$(find public -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | xargs ls -la 2>/dev/null | awk '$5 > 500000' | wc -l || echo "0")

if [ "$large_images" -gt 0 ]; then
    c "⚠️  Found $large_images large images (>500KB). Consider optimizing them."
    find public -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | xargs ls -lh 2>/dev/null | awk '$5 ~ /[0-9]+[MG]/ || ($5 ~ /[5-9][0-9][0-9]K/)' || true
else
    ok "✅ No large images found"
fi

# Check for unoptimized images without lazy loading
unoptimized_images=$(grep -r "<img" public/*.html 2>/dev/null | grep -v 'loading="lazy"' | wc -l || echo "0")
if [ "$unoptimized_images" -gt 0 ]; then
    c "⚠️  Found $unoptimized_images images without lazy loading. Running optimization again..."
    node optimize-seo.js
else
    ok "✅ All images have lazy loading"
fi

echo
ok "🎉 SEO automation completed successfully!"
echo
c "📋 Summary of optimizations:"
echo "   • ✅ Meta tags (SEO, Open Graph, Twitter Cards)"
echo "   • ✅ PWA manifest with proper icons"
echo "   • ✅ Lazy loading for images"
echo "   • ✅ Alt attributes for accessibility"
echo "   • ✅ Service worker for caching"
echo "   • ✅ robots.txt and sitemap.xml"
echo "   • ✅ Performance optimizations"
echo
c "💡 Next steps:"
echo "   • Run 'npm run build:optimized' for production build"
echo "   • Deploy to Cloudflare Pages"
echo "   • Monitor Core Web Vitals in Search Console"
echo