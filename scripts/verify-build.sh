#!/bin/bash
# Verify Build - Ensure build output is valid
# Checks that all expected files are present in dist/

set -e  # Exit on any error
echo "🔍 BUILD VERIFICATION"
echo "====================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0
DIST_DIR="frontend/dist"

# Test 1: Verify dist directory exists
echo "📋 Test 1: dist/ Directory"
if [ -d "$DIST_DIR" ]; then
  echo -e "${GREEN}✅ $DIST_DIR exists${NC}"
else
  echo -e "${RED}❌ $DIST_DIR is MISSING${NC}"
  echo "Build may have failed. Check build logs."
  exit 1
fi

# Test 2: Verify index.html exists
echo ""
echo "📋 Test 2: index.html"
if [ -f "$DIST_DIR/index.html" ]; then
  echo -e "${GREEN}✅ index.html exists${NC}"
  
  # Check index.html content - allow fallback content inside root div
  if grep -q '<div id="root"' "$DIST_DIR/index.html"; then
    echo -e "${GREEN}✅ index.html contains React root div${NC}"
  else
    echo -e "${RED}❌ index.html missing React root div${NC}"
    FAILED=1
  fi
else
  echo -e "${RED}❌ index.html is MISSING${NC}"
  FAILED=1
fi

# Test 3: Verify assets directory exists
echo ""
echo "📋 Test 3: assets/ Directory"
if [ -d "$DIST_DIR/assets" ]; then
  echo -e "${GREEN}✅ assets/ directory exists${NC}"
  
  # Count files
  JS_COUNT=$(find "$DIST_DIR/assets" -name "*.js" -type f | wc -l)
  CSS_COUNT=$(find "$DIST_DIR/assets" -name "*.css" -type f | wc -l)
  
  echo "   JavaScript files: $JS_COUNT"
  echo "   CSS files: $CSS_COUNT"
  
  if [ $JS_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ JavaScript assets found${NC}"
  else
    echo -e "${RED}❌ No JavaScript assets found${NC}"
    FAILED=1
  fi
  
  if [ $CSS_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ CSS assets found${NC}"
  else
    echo -e "${YELLOW}⚠️  No CSS assets found (may be inlined)${NC}"
  fi
else
  echo -e "${RED}❌ assets/ directory is MISSING${NC}"
  FAILED=1
fi

# Test 4: Verify _redirects file was copied
echo ""
echo "📋 Test 4: _redirects File"
if [ -f "$DIST_DIR/_redirects" ]; then
  echo -e "${GREEN}✅ _redirects file exists in dist/${NC}"
  
  if grep -q "/* */index.html *200" "$DIST_DIR/_redirects"; then
    echo -e "${GREEN}✅ _redirects correctly configured for SPA${NC}"
  else
    echo -e "${RED}❌ _redirects file not properly configured${NC}"
    FAILED=1
  fi
else
  echo -e "${RED}❌ _redirects file is MISSING from dist/${NC}"
  FAILED=1
fi

# Test 5: Check build size
echo ""
echo "📋 Test 5: Build Size Check"
DIST_SIZE=$(du -sh "$DIST_DIR" | cut -f1)
echo "   Total dist/ size: $DIST_SIZE"

# Warning if dist is too large (over 50MB is suspicious)
DIST_SIZE_KB=$(du -sk "$DIST_DIR" | cut -f1)
if [ $DIST_SIZE_KB -gt 51200 ]; then
  echo -e "${YELLOW}⚠️  Build size is large (>50MB). Consider optimization.${NC}"
else
  echo -e "${GREEN}✅ Build size is reasonable${NC}"
fi

# Final result
echo ""
echo "====================="
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ BUILD VERIFICATION PASSED${NC}"
  echo ""
  echo "Build output is valid and ready for deployment."
  exit 0
else
  echo -e "${RED}❌ BUILD VERIFICATION FAILED${NC}"
  echo ""
  echo "Build output has issues. Please review errors above."
  exit 1
fi
