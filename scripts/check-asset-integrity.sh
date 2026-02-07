#!/bin/bash
# Asset Integrity Check - Critical validation
# Parses index.html and verifies all referenced assets exist

set -e  # Exit on any error

echo "🔍 ASSET INTEGRITY CHECK"
echo "========================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0
DIST_DIR="frontend/dist"
INDEX_HTML="$DIST_DIR/index.html"

# Check if index.html exists
if [ ! -f "$INDEX_HTML" ]; then
  echo -e "${RED}❌ ERROR: $INDEX_HTML not found${NC}"
  exit 1
fi

echo "📋 Parsing index.html for asset references..."
echo ""

# Extract script sources
echo "🔍 Checking JavaScript files..."
SCRIPT_MISSING=0
while IFS= read -r line; do
  # Extract src attribute from script tags
  SRC=$(echo "$line" | grep -oP 'src="\K[^"]+' || echo "")
  
  if [ -n "$SRC" ]; then
    # Remove leading slash if present
    CLEAN_SRC="${SRC#/}"
    ASSET_PATH="$DIST_DIR/$CLEAN_SRC"
    
    if [ -f "$ASSET_PATH" ]; then
      echo -e "${GREEN}✅ $SRC${NC}"
    else
      echo -e "${RED}❌ MISSING: $SRC${NC}"
      echo "   Expected at: $ASSET_PATH"
      SCRIPT_MISSING=1
      FAILED=1
    fi
  fi
done < <(grep -o '<script[^>]*src="[^"]*"' "$INDEX_HTML")

if [ $SCRIPT_MISSING -eq 0 ]; then
  echo -e "${GREEN}✅ All script files exist${NC}"
fi

echo ""

# Extract link href (stylesheets)
echo "🔍 Checking CSS files..."
CSS_MISSING=0
while IFS= read -r line; do
  # Extract href attribute from link tags
  HREF=$(echo "$line" | grep -oP 'href="\K[^"]+' || echo "")
  
  if [ -n "$HREF" ]; then
    # Skip external URLs and data URIs
    if [[ "$HREF" =~ ^https?:// ]] || [[ "$HREF" =~ ^data: ]]; then
      continue
    fi
    
    # Remove leading slash if present
    CLEAN_HREF="${HREF#/}"
    ASSET_PATH="$DIST_DIR/$CLEAN_HREF"
    
    if [ -f "$ASSET_PATH" ]; then
      echo -e "${GREEN}✅ $HREF${NC}"
    else
      echo -e "${RED}❌ MISSING: $HREF${NC}"
      echo "   Expected at: $ASSET_PATH"
      CSS_MISSING=1
      FAILED=1
    fi
  fi
done < <(grep -o '<link[^>]*href="[^"]*"' "$INDEX_HTML")

if [ $CSS_MISSING -eq 0 ]; then
  echo -e "${GREEN}✅ All CSS files exist${NC}"
fi

echo ""

# Check for common casing issues
echo "🔍 Checking for casing issues..."
CASING_ISSUES=0

# Check if there are any files with uppercase 'Assets' instead of 'assets'
if [ -d "$DIST_DIR/Assets" ]; then
  echo -e "${RED}❌ Found 'Assets/' directory (should be 'assets/')${NC}"
  CASING_ISSUES=1
  FAILED=1
fi

# Check index.html references
if grep -q '/Assets/' "$INDEX_HTML"; then
  echo -e "${RED}❌ index.html references '/Assets/' (should be '/assets/')${NC}"
  CASING_ISSUES=1
  FAILED=1
fi

if [ $CASING_ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ No casing issues detected${NC}"
fi

echo ""

# Check for absolute paths that might not work
echo "🔍 Checking for absolute paths..."
if grep -qE '<script[^>]*src="https?://' "$INDEX_HTML"; then
  echo -e "${YELLOW}⚠️  External script references found${NC}"
  grep -oE '<script[^>]*src="https?://[^"]*"' "$INDEX_HTML" | while read -r line; do
    echo "   $line"
  done
fi

# Verify no localhost references
if grep -qi 'localhost' "$INDEX_HTML"; then
  echo -e "${RED}❌ localhost references found in index.html${NC}"
  FAILED=1
else
  echo -e "${GREEN}✅ No localhost references${NC}"
fi

echo ""

# Check for Vite default page indicators
echo "🔍 Checking for Vite default page..."
if grep -q "Vite + React" "$INDEX_HTML"; then
  echo -e "${RED}❌ Default Vite page detected!${NC}"
  FAILED=1
else
  echo -e "${GREEN}✅ No default Vite page detected${NC}"
fi

# Final result
echo ""
echo "========================="
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ASSET INTEGRITY CHECK PASSED${NC}"
  echo ""
  echo "All assets are present and correctly referenced."
  exit 0
else
  echo -e "${RED}❌ ASSET INTEGRITY CHECK FAILED${NC}"
  echo ""
  echo "Asset integrity issues detected. Build cannot be deployed."
  exit 1
fi
