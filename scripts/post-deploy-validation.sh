#!/bin/bash
# Post-Deployment Validation - Mandatory checks after deployment
# Verifies the deployed site is working correctly

set -e  # Exit on any error

URL="${1:-https://akiprisaye-web.pages.dev}"
MAX_RETRIES="${2:-3}"
RETRY_DELAY="${3:-10}"

echo "🔍 POST-DEPLOYMENT VALIDATION"
echo "=============================="
echo "URL: $URL"
echo "Max retries: $MAX_RETRIES"
echo "Retry delay: ${RETRY_DELAY}s"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0
attempt=1

# Function to check URL with retries
check_url() {
  local url=$1
  local expected_content=$2
  local check_name=$3
  local retry_count=1
  
  while [ $retry_count -le $MAX_RETRIES ]; do
    echo "🔍 Attempt $retry_count/$MAX_RETRIES: $check_name"
    
    # Get HTTP status code
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$url" 2>/dev/null || echo "000")
    
    if [ "$STATUS" = "200" ]; then
      echo -e "${GREEN}✅ HTTP 200 OK${NC}"
      
      # Check content if provided
      if [ -n "$expected_content" ]; then
        CONTENT=$(curl -s --connect-timeout 10 "$url" 2>/dev/null || echo "")
        
        if echo "$CONTENT" | grep -q "$expected_content"; then
          echo -e "${GREEN}✅ Expected content found: '$expected_content'${NC}"
          return 0
        else
          echo -e "${RED}❌ Expected content NOT found: '$expected_content'${NC}"
          if [ $retry_count -lt $MAX_RETRIES ]; then
            echo "   Retrying in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
          fi
        fi
      else
        return 0
      fi
    else
      echo -e "${RED}❌ HTTP $STATUS${NC}"
      if [ $retry_count -lt $MAX_RETRIES ]; then
        echo "   Retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
      fi
    fi
    
    retry_count=$((retry_count + 1))
  done
  
  echo -e "${RED}❌ $check_name failed after $MAX_RETRIES attempts${NC}"
  return 1
}

# Test 1: Root page accessibility
echo "📋 Test 1: Root Page Accessibility"
if ! check_url "$URL/" "A KI PRI SA YÉ" "Root page"; then
  FAILED=1
fi
echo ""

# Test 2: React app bootstrap is present
echo "📋 Test 2: React Bootstrap Presence"
HTML=$(curl -s "$URL/" 2>/dev/null || echo "")

if echo "$HTML" | grep -q '<div id="root"'; then
  echo -e "${GREEN}✅ React root container present${NC}"
else
  echo -e "${RED}❌ React root container MISSING${NC}"
  FAILED=1
fi

if echo "$HTML" | grep -q '/assets/index-' || echo "$HTML" | grep -q '/src/main.jsx'; then
  echo -e "${GREEN}✅ React assets referenced (prod or dev)${NC}"
else
  echo -e "${RED}❌ React assets NOT referenced${NC}"
  FAILED=1
fi

if echo "$HTML" | grep -q 'id="loading-fallback"'; then
  echo -e "${GREEN}✅ Static loading fallback present in HTML${NC}"
elif echo "$HTML" | grep -q 'createFallbackElement'; then
  echo -e "${GREEN}✅ Runtime fallback creation logic present${NC}"
else
  echo -e "${YELLOW}⚠️  Loading fallback marker not detected in HTML snapshot${NC}"
fi
echo ""

# Test 3: No default Vite page
echo "📋 Test 3: No Default Vite Page"
if echo "$HTML" | grep -q "Vite + React"; then
  echo -e "${RED}❌ DEFAULT VITE PAGE DETECTED!${NC}"
  FAILED=1
else
  echo -e "${GREEN}✅ Custom app deployed (not default Vite)${NC}"
fi
echo ""

# Test 4: No fallback/error content
echo "📋 Test 4: No Fallback Content"
if echo "$HTML" | grep -qi "Le site est en ligne"; then
  echo -e "${RED}❌ FALLBACK CONTENT DETECTED${NC}"
  FAILED=1
else
  echo -e "${GREEN}✅ No fallback content${NC}"
fi
echo ""

# Test 5: CSP/Head consistency (mobile black-screen regression guard)
echo "📋 Test 5: Head/CSP Consistency"
if echo "$HTML" | grep -qi 'http-equiv="X-Frame-Options"'; then
  echo -e "${RED}❌ Invalid X-Frame-Options meta tag detected${NC}"
  FAILED=1
else
  echo -e "${GREEN}✅ No invalid X-Frame-Options meta tag${NC}"
fi

if echo "$HTML" | grep -qi 'fonts.googleapis.com'; then
  echo -e "${YELLOW}⚠️  External Google Fonts reference detected (may be blocked by CSP)${NC}"
else
  echo -e "${GREEN}✅ No external Google Fonts reference in HTML${NC}"
fi
echo ""

# Test 6: Critical routes accessibility (SPA routing)
echo "📋 Test 6: Critical Routes (SPA Routing)"
CRITICAL_ROUTES=(
  "/comparateur"
  "/scanner"
  "/carte"
  "/alertes"
)

for route in "${CRITICAL_ROUTES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "${URL}${route}" 2>/dev/null || echo "000")
  
  if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✅ ${route} - HTTP 200${NC}"
  else
    echo -e "${RED}❌ ${route} - HTTP ${STATUS}${NC}"
    FAILED=1
  fi
done
echo ""

# Test 7: Service Worker check
echo "📋 Test 7: Service Worker"
SW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${URL}/service-worker.js" 2>/dev/null || echo "000")
if [ "$SW_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Service Worker accessible${NC}"
  
  SW_CONTENT=$(curl -s "${URL}/service-worker.js" 2>/dev/null || echo "")
  if echo "$SW_CONTENT" | grep -q "akiprisaye-smart-cache"; then
    SW_VERSION=$(echo "$SW_CONTENT" | grep -oP 'akiprisaye-smart-cache-v\K\d+' | head -1)
    echo -e "${GREEN}✅ Service Worker v${SW_VERSION} deployed${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Service Worker not found (HTTP ${SW_STATUS})${NC}"
fi
echo ""

# Test 8: Security headers
echo "📋 Test 8: Security Headers"
HEADERS=$(curl -I -s "$URL/" 2>/dev/null || echo "")

SECURITY_HEADERS=(
  "x-frame-options"
  "x-content-type-options"
  "strict-transport-security"
  "content-security-policy"
)

for header in "${SECURITY_HEADERS[@]}"; do
  if echo "$HEADERS" | grep -qi "$header"; then
    echo -e "${GREEN}✅ $header present${NC}"
  else
    echo -e "${YELLOW}⚠️  $header missing${NC}"
  fi
done
echo ""

# Test 9: Check for console errors (if headless browser available)
echo "📋 Test 9: Basic JavaScript Check"
# This is a simplified check - in a real scenario, you'd use Playwright or Puppeteer
if command -v node &> /dev/null; then
  echo -e "${GREEN}✅ Can perform advanced JS checks (Node.js available)${NC}"
else
  echo -e "${YELLOW}⚠️  Node.js not available for advanced JS checks${NC}"
fi
echo ""

# Final result
echo "=============================="
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ POST-DEPLOYMENT VALIDATION PASSED${NC}"
  echo ""
  echo "Deployment is successful and site is operational."
  exit 0
else
  echo -e "${RED}❌ POST-DEPLOYMENT VALIDATION FAILED${NC}"
  echo ""
  echo "Deployment has issues. Rollback may be required."
  exit 1
fi
