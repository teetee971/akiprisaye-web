#!/data/data/com.termux/files/usr/bin/bash
set -e
export PROJECT_ID=akiprisaye-local
# firebase.json minimal
cat > firebase.json <<'JSON'
{
  "hosting": { "public":"public", "ignore": ["firebase.json","**/.*","**/node_modules/**"] },
  "functions": { "source": "functions" }
}
JSON
# Dossiers
mkdir -p public functions
# Lancer les émulateurs
firebase emulators:start --only hosting,functions --project "$PROJECT_ID"
