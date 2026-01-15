#!/bin/bash

# Script to encode Android release keystore to Base64 for GitHub Actions
# This creates a Base64-encoded version of release.jks for use as a GitHub secret

set -e

# Configuration
KEYSTORE_FILE="release.jks"
OUTPUT_FILE="release.jks.base64"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Base64 Keystore Encoder${NC}"
echo -e "${GREEN}A KI PRI SA YÉ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if keystore exists
if [ ! -f "$KEYSTORE_FILE" ]; then
    echo -e "${RED}ERROR: Keystore file '$KEYSTORE_FILE' not found!${NC}"
    echo -e "${YELLOW}Generate it first:${NC}"
    echo "  ./generate-release-keystore.sh"
    exit 1
fi

# Check if output file already exists
if [ -f "$OUTPUT_FILE" ]; then
    echo -e "${YELLOW}WARNING: '$OUTPUT_FILE' already exists!${NC}"
    echo -e "${YELLOW}Press Enter to overwrite, or Ctrl+C to cancel...${NC}"
    read -r
fi

echo -e "${GREEN}Encoding keystore to Base64...${NC}"
echo ""

# Encode to Base64
# Try standard base64 command first, then macOS variant
if base64 "$KEYSTORE_FILE" > "$OUTPUT_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ Successfully encoded with base64${NC}"
elif base64 -i "$KEYSTORE_FILE" -o "$OUTPUT_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ Successfully encoded with base64 (macOS)${NC}"
else
    echo -e "${RED}ERROR: Failed to encode keystore${NC}"
    rm -f "$OUTPUT_FILE"
    exit 1
fi

# Verify output file was created
if [ ! -f "$OUTPUT_FILE" ]; then
    echo -e "${RED}ERROR: Output file was not created${NC}"
    exit 1
fi

# Get file size
KEYSTORE_SIZE=$(du -h "$KEYSTORE_FILE" | cut -f1)
BASE64_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Base64 encoding complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Input file:  $KEYSTORE_FILE ($KEYSTORE_SIZE)"
echo "Output file: $OUTPUT_FILE ($BASE64_SIZE)"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo ""
echo "1. Copy the Base64 content to GitHub:"
echo "   ${GREEN}cat $OUTPUT_FILE${NC}"
echo ""
echo "2. Go to GitHub repository:"
echo "   Settings → Secrets and variables → Actions → New repository secret"
echo ""
echo "3. Create secret with:"
echo "   Name:  ${GREEN}ANDROID_KEYSTORE_BASE64${NC}"
echo "   Value: [paste the content from step 1]"
echo ""
echo "4. Also add these secrets:"
echo "   - ${GREEN}ANDROID_KEYSTORE_PASSWORD${NC} (your keystore password)"
echo "   - ${GREEN}ANDROID_KEY_ALIAS${NC} (usually 'release')"
echo "   - ${GREEN}ANDROID_KEY_PASSWORD${NC} (your key password)"
echo ""
echo -e "${RED}⚠️  SECURITY:${NC}"
echo "   - Delete $OUTPUT_FILE after copying: ${GREEN}rm $OUTPUT_FILE${NC}"
echo "   - Never commit $KEYSTORE_FILE or $OUTPUT_FILE to Git"
echo "   - The .gitignore is configured to exclude these files"
echo ""

# Option to display content
echo -e "${YELLOW}Display Base64 content now? (y/N)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Base64 Content (copy this):${NC}"
    echo -e "${GREEN}========================================${NC}"
    cat "$OUTPUT_FILE"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo ""
fi

echo -e "${YELLOW}Delete $OUTPUT_FILE now? (y/N)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    rm "$OUTPUT_FILE"
    echo -e "${GREEN}✓ Temporary file deleted${NC}"
else
    echo -e "${YELLOW}⚠️  Remember to delete $OUTPUT_FILE after use!${NC}"
fi

echo ""
echo -e "${GREEN}Done!${NC}"
