#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-https://akiprisaye.pages.dev}"
API_T="${BASE}/api/territories"
API_P="${BASE}/api/prices?territory=guadeloupe&limit=3"

echo "🩺 Vérification PROD: ${BASE}"
for i in $(seq 1 24); do
  echo "⏳ Tentative ${i}/24…"
  TERR=$(curl -fsS -m 15 "${API_T}" 2>/dev/null || true)
  PRIC=$(curl -fsS -m 15 "${API_P}" 2>/dev/null || true)

  OK_T=0; OK_P=0
  [ -n "$TERR" ] && echo "$TERR" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{JSON.parse(s);process.exit(0)}catch{process.exit(1)}})' && OK_T=1 || true
  [ -n "$PRIC" ] && echo "$PRIC" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{JSON.parse(s);process.exit(0)}catch{process.exit(1)}})' && OK_P=1 || true

  if [ "$OK_T" = "1" ] && [ "$OK_P" = "1" ]; then
    echo "✅ /api/territories OK"
    echo "✅ /api/prices OK"
    exit 0
  fi
  sleep 10
done

echo "❌ Échec des vérifications après 4 min. Réessaie plus tard."
exit 1
