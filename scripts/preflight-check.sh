#!/bin/bash
# Preflight Check - Blocking pre-build validation
# Ensures all prerequisites are met before building

set -e  # Exit on any error

echo "🔍 PREFLIGHT CHECK - Pipeline Validation"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Test 1: Node.js version check
echo "📋 Test 1: Node.js Version"
REQUIRED_NODE_VERSION="20.19.0"
CURRENT_NODE_VERSION=$(node --version | sed 's/v//')
MAJOR_VERSION=$(echo $CURRENT_NODE_VERSION | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -ge "20" ]; then
  echo -e "${GREEN}✅ Node.js version OK: $CURRENT_NODE_VERSION (required: >=$REQUIRED_NODE_VERSION)${NC}"
else
  echo -e "${RED}❌ Node.js version mismatch: $CURRENT_NODE_VERSION (required: >=$REQUIRED_NODE_VERSION)${NC}"
  FAILED=1
fi

# Test 2: Required environment variables / secrets
echo ""
echo "📋 Test 2: Required Secrets/Environment Variables"
REQUIRED_SECRETS=(
  "CLOUDFLARE_API_TOKEN"
  "CLOUDFLARE_ACCOUNT_ID"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
  if [ -n "${!secret}" ]; then
    echo -e "${GREEN}✅ $secret is set${NC}"
  else
    echo -e "${RED}❌ $secret is NOT set${NC}"
    FAILED=1
  fi
done

# Test 3: Project structure integrity
echo ""
echo "📋 Test 3: Project Structure Integrity"
REQUIRED_PATHS=(
  "frontend/package.json"
  "frontend/package-lock.json"
  "frontend/src"
  "frontend/public"
  "frontend/vite.config.ts"
  "frontend/index.html"
  ".node-version"
)

for path in "${REQUIRED_PATHS[@]}"; do
  if [ -e "$path" ]; then
    echo -e "${GREEN}✅ $path exists${NC}"
  else
    echo -e "${RED}❌ $path is MISSING${NC}"
    FAILED=1
  fi
done

# Test 4: Verify _redirects file for SPA routing
echo ""
echo "📋 Test 4: SPA Routing Configuration"
if [ -f "frontend/public/_redirects" ]; then
  if grep -q "/* */index.html *200" frontend/public/_redirects; then
    echo -e "${GREEN}✅ _redirects file is correctly configured${NC}"
  else
    echo -e "${RED}❌ _redirects file exists but is not properly configured${NC}"
    FAILED=1
  fi
else
  echo -e "${RED}❌ _redirects file is MISSING${NC}"
  FAILED=1
fi

# Test 5: Check for common issues
echo ""
echo "📋 Test 5: Common Issues Check"

# Check for Git LFS pointers
if git grep -I -n -E '^version https://git-lfs.github.com/spec/v1$' -- . | grep -vE '^(\.github/workflows/|\.circleci/|scripts/|.*\.md:)' >/dev/null 2>/dev/null; then
  echo -e "${RED}❌ Git LFS signature detected in repository${NC}"
  FAILED=1
else
  echo -e "${GREEN}✅ No Git LFS signature detected${NC}"
fi

if git grep -I -n -E '^oid sha256:[0-9a-f]{64}$' -- . | grep -vE '^(\.github/workflows/|\.circleci/|scripts/|.*\.md:)' >/dev/null 2>/dev/null; then
  echo -e "${RED}❌ Probable Git LFS pointer (oid) detected in repository${NC}"
  FAILED=1
else
  echo -e "${GREEN}✅ No Git LFS oid pointer detected${NC}"
fi

# Check for node_modules in git
if git ls-files | grep -q "node_modules"; then
  echo -e "${RED}❌ node_modules directory is tracked in git${NC}"
  FAILED=1
else
  echo -e "${GREEN}✅ node_modules not tracked in git${NC}"
fi

# Final result
echo ""
echo "=========================================="
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ PREFLIGHT CHECK PASSED${NC}"
  echo ""
  echo "All prerequisites verified. Ready to build."
  exit 0
else
  echo -e "${RED}❌ PREFLIGHT CHECK FAILED${NC}"
  echo ""
  echo "Please fix the errors above before continuing."
  exit 1
fi
