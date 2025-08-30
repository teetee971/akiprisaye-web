#!/usr/bin/env bash
set -euo pipefail

# === CONFIG ===
# Change only if your unzip folder is different
ROOT_WIN="C:/A Ki Pri Sa Yé"
# The script will try these subfolders in order and pick the first that contains a package.json
CANDIDATES=(
  "a-ki-pri-sa-ye-functional"
  "a-ki-pri-sa-ye-darkness-pro-stubs"
  "a-ki-pri-sa-ye-darkness-pro"
  ""
)

echo "🔎 Locating project in: $ROOT_WIN"
FOUND_DIR=""
for c in "${CANDIDATES[@]}"; do
  if [[ -z "$c" ]]; then
    CAND="$ROOT_WIN"
  else
    CAND="$ROOT_WIN/$c"
  fi
  if [[ -f "$CAND/package.json" ]]; then
    FOUND_DIR="$CAND"
    break
  fi
done

if [[ -z "$FOUND_DIR" ]]; then
  echo "❌ package.json not found under: $ROOT_WIN"
  echo "➡️  Make sure you unzipped the project into this folder."
  exit 1
fi

echo "📁 Project: $FOUND_DIR"
cd "$FOUND_DIR"

# === CHECKS ===
if ! command -v firebase >/dev/null 2>&1; then
  echo "❌ Firebase CLI not found. Install with: npm i -g firebase-tools"
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js not found. Install Node 18+."
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "❌ npm not found."
  exit 1
fi

# === ENV ===
if [[ ! -f ".env.local" ]]; then
  cat > .env.local <<'EOF'
# 🔧 Fill with your Firebase web app credentials
VITE_FIREBASE_API_KEY=REPLACE_ME
VITE_FIREBASE_AUTH_DOMAIN=REPLACE_ME.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=a-ki-pri-sa-ye
VITE_FIREBASE_STORAGE_BUCKET=REPLACE_ME.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=REPLACE_ME
VITE_FIREBASE_APP_ID=1:REPLACE_ME:web:REPLACE_ME
EOF
  echo "⚠️  Created .env.local (placeholders). Edit it, then re-run this script."
  exit 1
fi

echo "🧩 Installing dependencies…"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "🏗️ Building…"
npm run build

echo "🚀 Deploying to Firebase Hosting…"
firebase login || true
firebase use a-ki-pri-sa-ye || true
firebase deploy

echo "✅ Done."
echo "ℹ️  If you get a 404 on refresh, check that firebase.json contains SPA rewrites:"
echo '    { "hosting": { "rewrites": [{ "source": "**", "destination": "/index.html" }] } }'
