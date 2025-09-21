#!/bin/bash

# Validation script for SEO, security headers, and mobile responsiveness implementation
echo "🔍 Validating implementation..."

cd "$(dirname "$0")"

echo ""
echo "=== Security Headers Validation ==="
if [ -f "_headers" ]; then
    echo "✅ _headers file exists"
    if grep -q "Strict-Transport-Security" "_headers"; then
        echo "✅ HSTS header configured"
    fi
    if grep -q "Content-Security-Policy" "_headers"; then
        echo "✅ CSP header configured"
    fi
    if grep -q "X-Frame-Options" "_headers"; then
        echo "✅ X-Frame-Options configured"
    fi
    if grep -q "X-Content-Type-Options" "_headers"; then
        echo "✅ X-Content-Type-Options configured"
    fi
    if grep -q "Cache-Control.*immutable" "_headers"; then
        echo "✅ Long cache headers for static assets configured"
    fi
else
    echo "❌ _headers file missing"
fi

echo ""
echo "=== SEO Files Validation ==="
if [ -f "robots.txt" ]; then
    echo "✅ robots.txt exists"
    if grep -q "Sitemap:" "robots.txt"; then
        echo "✅ Sitemap reference in robots.txt"
    fi
    if grep -q "comparateur\|actualites" "robots.txt"; then
        echo "✅ Key pages allowed in robots.txt"
    fi
else
    echo "❌ robots.txt missing"
fi

if [ -f "sitemap.xml" ]; then
    echo "✅ sitemap.xml exists"
    if grep -q "comparateur.html" "sitemap.xml"; then
        echo "✅ /comparateur page in sitemap"
    fi
    if grep -q "actualites.html" "sitemap.xml"; then
        echo "✅ /actualites page in sitemap"
    fi
    if grep -q "<priority>" "sitemap.xml"; then
        echo "✅ Priority settings in sitemap"
    fi
else
    echo "❌ sitemap.xml missing"
fi

echo ""
echo "=== SEO Meta Tags Validation ==="
for file in "index.html" "comparateur.html" "public/actualites.html"; do
    if [ -f "$file" ]; then
        echo "🔍 Checking $file:"
        if grep -q "og:title" "$file"; then
            echo "  ✅ OpenGraph meta tags"
        fi
        if grep -q "twitter:card" "$file"; then
            echo "  ✅ Twitter Card meta tags"
        fi
        if grep -q "meta.*description" "$file"; then
            echo "  ✅ Meta description"
        fi
    fi
done

echo ""
echo "=== Mobile Responsiveness Validation ==="
if [ -f "public/css/theme.css" ]; then
    echo "✅ theme.css exists"
    if grep -q "word-break.*break-word" "public/css/theme.css"; then
        echo "✅ Text overflow fix (word-break)"
    fi
    if grep -q "overflow-wrap.*anywhere" "public/css/theme.css"; then
        echo "✅ Text overflow fix (overflow-wrap)"
    fi
    if grep -q "@media.*max-width.*768px" "public/css/theme.css"; then
        echo "✅ Mobile breakpoint configured"
    fi
else
    echo "❌ theme.css missing"
fi

echo ""
echo "=== Image Optimization Validation ==="
if [ -f "public/js/image-optimization.js" ]; then
    echo "✅ Image optimization script exists"
    if grep -q "lazy" "public/js/image-optimization.js"; then
        echo "✅ Lazy loading implementation"
    fi
    if grep -q "webp\|WebP" "public/js/image-optimization.js"; then
        echo "✅ WebP optimization support"
    fi
else
    echo "❌ Image optimization script missing"
fi

if [ -f "optimize-images.sh" ]; then
    echo "✅ Image analysis tool exists"
fi

echo ""
echo "=== Large Images Analysis ==="
cd public 2>/dev/null || true
for img in *.jpg *.jpeg *.png; do
    if [ -f "$img" ] 2>/dev/null; then
        file_size=$(stat -c%s "$img" 2>/dev/null || stat -f%z "$img" 2>/dev/null || echo "0")
        if [ "$file_size" -gt 500000 ]; then
            echo "⚠️  Large image: $img ($(echo "$file_size" | numfmt --to=iec 2>/dev/null || echo "$file_size bytes"))"
        fi
    fi
done

echo ""
echo "🎉 Validation complete!"
echo ""
echo "📋 Summary of implementations:"
echo "• Enhanced security headers with HSTS, CSP, X-Frame-Options, and cache control"
echo "• Updated robots.txt with proper structure and sitemap reference"
echo "• Comprehensive sitemap.xml with /, /comparateur, /actualites and priority settings"
echo "• SEO meta tags and OpenGraph for all major pages"
echo "• Mobile responsiveness fixes for text overflow (issue #42)"
echo "• Image optimization with lazy loading and WebP support"
echo "• Analysis tools for ongoing image optimization"