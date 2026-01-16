#!/bin/bash
set -e

echo "⚡ PRELOAD OPTIMIZATION SCRIPT (v2 - No Perl)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backup index.html
if [ -f "index.html" ]; then
  cp index.html index.html. bak
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

# Create temp file with preload hints
cat > /tmp/preload-hints.txt << 'PRELOAD'
    <!-- ⚡ Performance:  Preload Critical Resources -->
    <link rel="modulepreload" href="/src/main.tsx" />
    
    <!-- 🌐 Preconnect to External Domains -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    
    <!-- 🔍 DNS Prefetch for CDNs -->
    <link rel="dns-prefetch" href="https://unpkg.com" />
PRELOAD

# Insert after <head> using sed
sed -i '/<head>/r /tmp/preload-hints. txt' index.html

echo "✅ Preload hints added!"
echo ""

# Show changes
echo "📊 Verification:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -A 10 "Preload Critical" index. html || echo "Check index.html manually"

echo ""
echo "✅ DONE! Now rebuild:"
echo "   npm run build"
echo ""
