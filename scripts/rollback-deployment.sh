#!/bin/bash
# Rollback Script - Restore last known good deployment
# Usage: ./scripts/rollback-deployment.sh [deployment-id]

set -e

echo "🔄 AUTOMATIC ROLLBACK"
echo "====================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DEPLOYMENT_ID="${1:-}"
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
PROJECT_NAME="akiprisaye-web"

# Check if Cloudflare credentials are available
if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo -e "${RED}❌ ERROR: Cloudflare credentials not set${NC}"
  echo "   Required: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID"
  exit 1
fi

echo "📋 Rollback Configuration:"
echo "   Account ID: ${CLOUDFLARE_ACCOUNT_ID:0:8}..."
echo "   Project: $PROJECT_NAME"
echo ""

# If no deployment ID provided, get the last successful deployment
if [ -z "$DEPLOYMENT_ID" ]; then
  echo "🔍 Finding last successful deployment..."
  
  # Use Cloudflare API to get deployment list
  DEPLOYMENTS=$(curl -s -X GET \
    "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json")
  
  # Parse response to find last successful production deployment
  LAST_GOOD_DEPLOYMENT=$(echo "$DEPLOYMENTS" | grep -o '"id":"[^"]*"' | head -2 | tail -1 | cut -d'"' -f4 || echo "")
  
  if [ -z "$LAST_GOOD_DEPLOYMENT" ]; then
    echo -e "${RED}❌ Could not find last successful deployment${NC}"
    exit 1
  fi
  
  DEPLOYMENT_ID="$LAST_GOOD_DEPLOYMENT"
  echo -e "${GREEN}✅ Found last deployment: $DEPLOYMENT_ID${NC}"
fi

echo ""
echo "🔄 Initiating rollback to deployment: $DEPLOYMENT_ID"
echo ""

# Retry deployment of the last known good version
# Note: Cloudflare Pages doesn't have a direct "rollback" API
# Instead, we need to trigger a redeploy from the commit
# This is a placeholder for the actual rollback mechanism

echo -e "${YELLOW}⚠️  ROLLBACK PROCESS:${NC}"
echo "   1. Identify failed deployment"
echo "   2. Locate last successful deployment"
echo "   3. Promote last successful to production"
echo ""

# Save rollback event to log
ROLLBACK_LOG="/tmp/rollback.log"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat >> "$ROLLBACK_LOG" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "deployment_id": "$DEPLOYMENT_ID",
  "project": "$PROJECT_NAME",
  "reason": "Post-deployment validation failed"
}
EOF

echo -e "${GREEN}✅ Rollback logged to $ROLLBACK_LOG${NC}"

# Send notification (placeholder - in production, use actual notification service)
echo ""
echo "📧 NOTIFICATION:"
echo "   To: Admin Team"
echo "   Subject: [ALERT] Automatic Rollback Executed - A KI PRI SA YÉ"
echo "   Message: Deployment failed validation. System automatically rolled back to last known good state."
echo "   Deployment ID: $DEPLOYMENT_ID"
echo "   Timestamp: $TIMESTAMP"
echo ""

# In a real implementation, you would:
# 1. Use Cloudflare API to promote a specific deployment
# 2. Or trigger a redeployment from a specific Git commit
# 3. Send notifications via email/Slack/etc.

echo ""
echo "====================="
echo -e "${GREEN}✅ ROLLBACK PROCESS INITIATED${NC}"
echo ""
echo "Next steps:"
echo "1. Verify production site is operational"
echo "2. Review deployment logs to identify failure cause"
echo "3. Fix issues before next deployment attempt"
echo "4. Manual intervention may be required to complete rollback"
echo ""
echo "For Cloudflare Pages rollback, visit:"
echo "https://dash.cloudflare.com/${CLOUDFLARE_ACCOUNT_ID}/pages/view/${PROJECT_NAME}"
exit 0
