#!/bin/bash
set -e

echo "⚡ PRELOAD OPTIMIZATION SCRIPT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backup index.html
if [ -f "index.html" ]; then
  cp index.html index.html.bak
  echo "✅ Backup created:  index.html. bak"
else
  echo "❌ index.html not found!"
  exit 1
fi

# Check if preload already exists
if grep -q 'rel="modulepreload"' index.html; then
  echo "✅ Preload hints already exist"
  exit 0
fi

echo ""
echo "🔧 Adding preload hints..."

# Add preload hints after <head> tag
perl -i -pe 's|(<head>)|$1\n    <!-- ⚡ Performance:  Preload Critical Resources -->\n    <link rel="modulepreload" href="/src/main.tsx" />\n    \n    <!-- 🌐 Preconnect to External Domains -->\n    <link rel="preconnect" href="https://fonts.googleapis.com" />\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n    \n    <!-- 🔍 DNS Prefetch for CDNs -->\n    <link rel="dns-prefetch" href="https://unpkg.com" />|' index.html

echo "✅ Preload hints added!"
echo ""

# Show changes
echo "📊 Changes made:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -A 10 "Preload Critical" index.html || echo "Check index.html manually"

echo ""
echo "✅ DONE! Now rebuild:"
echo "   npm run build"
echo ""
