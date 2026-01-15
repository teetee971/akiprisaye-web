#!/bin/bash

# Script to generate Android release keystore for A KI PRI SA YÉ
# This keystore is used for signing the Android app before uploading to Google Play Store
# Google Play App Signing will then re-sign the app with their own key

set -e

# Configuration
KEYSTORE_FILE="release.jks"
ALIAS="release"
KEY_ALG="RSA"
KEY_SIZE="2048"
VALIDITY="10000"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Android Release Keystore Generator${NC}"
echo -e "${GREEN}A KI PRI SA YÉ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if keystore already exists
if [ -f "$KEYSTORE_FILE" ]; then
    echo -e "${RED}ERROR: Keystore file '$KEYSTORE_FILE' already exists!${NC}"
    echo -e "${YELLOW}If you want to create a new keystore, please delete the existing one first.${NC}"
    echo -e "${YELLOW}WARNING: Deleting the keystore will prevent you from updating existing apps!${NC}"
    exit 1
fi

# Check if keytool is available
if ! command -v keytool >/dev/null 2>&1; then
    echo -e "${RED}ERROR: keytool command not found!${NC}"
    echo -e "${YELLOW}Please ensure Java JDK is installed.${NC}"
    exit 1
fi

echo -e "${YELLOW}IMPORTANT INFORMATION:${NC}"
echo "1. You will be prompted to enter a password for the keystore"
echo "2. You will be prompted to enter information for the certificate"
echo "3. Keep this keystore file SECURE and BACKED UP"
echo "4. NEVER commit this keystore to version control"
echo "5. Store the password in a secure password manager"
echo ""
echo -e "${YELLOW}Press Enter to continue or Ctrl+C to cancel...${NC}"
read -r

echo ""
echo -e "${GREEN}Generating release keystore...${NC}"
echo ""

# Generate the keystore
if keytool -genkeypair \
  -keystore "$KEYSTORE_FILE" \
  -alias "$ALIAS" \
  -keyalg "$KEY_ALG" \
  -keysize "$KEY_SIZE" \
  -validity "$VALIDITY"; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Keystore generated successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Keystore file: $KEYSTORE_FILE"
    echo "Alias: $ALIAS"
    echo "Algorithm: $KEY_ALG"
    echo "Key size: $KEY_SIZE bits"
    echo "Validity: $VALIDITY days (~27 years)"
    echo ""
    echo -e "${YELLOW}NEXT STEPS:${NC}"
    echo "1. Store the keystore file in a secure location"
    echo "2. Back up the keystore file (you cannot recover it if lost!)"
    echo "3. Save the keystore password in a secure password manager"
    echo "4. Update your build.gradle with signing configuration (see ANDROID_SETUP.md)"
    echo ""
    echo -e "${RED}⚠️  CRITICAL: Never commit this keystore to Git!${NC}"
    echo -e "${YELLOW}The .gitignore is configured to exclude *.jks files.${NC}"
else
    echo -e "${RED}ERROR: Failed to generate keystore!${NC}"
    exit 1
fi
