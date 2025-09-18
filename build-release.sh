#!/data/data/com.termux/files/usr/bin/bash
set -e

# === CONFIG ===
REPO="teetee971/akiprisaye-web"
BRANCH="main"
ZIP_NAME="akiprisaye-web-$(date +%Y%m%d-%H%M).zip"
GITHUB_TOKEN="TON_TOKEN_GITHUB_ICI"  # Mets ton token perso

# === 1. Nettoyage du projet ===
echo "[1/5] Nettoyage..."
git fetch origin
git checkout $BRANCH
git reset --hard origin/$BRANCH
git clean -fdx

# === 2. Installation & Build ===
echo "[2/5] Installation & build..."
npm ci
npm run build

# === 3. Création du ZIP propre ===
echo "[3/5] Création du ZIP..."
rm -f "$ZIP_NAME"
zip -r "$ZIP_NAME" . -x "node_modules/*" ".git/*"

# === 4. Création d’une Release sur GitHub ===
echo "[4/5] Création de la release..."
RELEASE_TAG="release-$(date +%Y%m%d-%H%M)"
RELEASE_ID=$(curl -s -X POST https://api.github.com/repos/$REPO/releases \
  -H "Authorization: token $GITHUB_TOKEN" \
  -d @- <<EOF | jq -r '.id'
{
  "tag_name": "$RELEASE_TAG",
  "target_commitish": "$BRANCH",
  "name": "Build $RELEASE_TAG",
  "body": "Release automatique générée depuis Termux.",
  "draft": false,
  "prerelease": false
}
EOF
)

# === 5. Upload du ZIP vers la Release ===
echo "[5/5] Upload du ZIP..."
UPLOAD_URL="https://uploads.github.com/repos/$REPO/releases/$RELEASE_ID/assets?name=$ZIP_NAME"

curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/zip" \
  --data-binary @"$ZIP_NAME" \
  "$UPLOAD_URL" > /dev/null

echo "✅ Release publiée avec succès : https://github.com/$REPO/releases/tag/$RELEASE_TAG"
