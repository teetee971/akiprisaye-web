#!/bin/bash
set -e

echo "🧪 Testing build output..."

# Check if dist directory exists
if [ ! -d "dist/client" ]; then
  echo "❌ Build directory 'dist/client' does not exist"
  exit 1
fi

# Check if main files exist
if [ ! -f "dist/client/index.html" ]; then
  echo "❌ index.html not found in build output"
  exit 1
fi

# Check if static assets exist
if [ ! -d "dist/client/assets" ]; then
  echo "❌ Assets directory not found in build output"
  exit 1
fi

# Count files in assets directory
asset_count=$(find dist/client/assets -type f | wc -l)
if [ "$asset_count" -eq 0 ]; then
  echo "❌ No assets found in build output"
  exit 1
fi

echo "✅ Build output validation passed!"
echo "✅ Found index.html"
echo "✅ Found assets directory with $asset_count files"

# Test basic file structure
echo "🔍 Build structure:"
ls -la dist/client/
echo ""
echo "📦 Assets:"
ls -la dist/client/assets/ | head -5

echo "✅ All build tests passed!"