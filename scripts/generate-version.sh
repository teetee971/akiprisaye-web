#!/bin/bash
# Generate version information file
# This script creates a version.json file with build metadata

set -e

OUTPUT_FILE="${1:-frontend/public/version.json}"

# Get Git information
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
GIT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v3.0.1")

# Get timestamp
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Get version from package.json
if [ -f "frontend/package.json" ]; then
  VERSION=$(grep '"version"' frontend/package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
else
  VERSION="3.0.1"
fi

# Create version.json
cat > "$OUTPUT_FILE" <<EOF
{
  "version": "$VERSION",
  "commit": "$GIT_COMMIT",
  "branch": "$GIT_BRANCH",
  "tag": "$GIT_TAG",
  "buildTimestamp": "$BUILD_TIMESTAMP",
  "buildNumber": "${GITHUB_RUN_NUMBER:-0}",
  "buildUrl": "${GITHUB_SERVER_URL:-}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}"
}
EOF

echo "✅ Version file created: $OUTPUT_FILE"
cat "$OUTPUT_FILE"
