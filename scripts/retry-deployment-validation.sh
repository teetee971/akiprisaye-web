#!/usr/bin/env bash
set -euo pipefail

SITE_URL="${1:-}"
LABEL="${2:-Validation}"
MODE="${3:-blocking}"
ATTEMPTS="${4:-6}"
DELAY_SECONDS="${5:-15}"

if [[ -z "$SITE_URL" ]]; then
  echo "❌ Missing SITE_URL argument."
  exit 2
fi

echo "🔎 ${LABEL} — démarrage sur ${SITE_URL}"

for attempt in $(seq 1 "$ATTEMPTS"); do
  echo "Tentative ${attempt}/${ATTEMPTS}..."
  
  # On vérifie si la page répond
  if curl -fsS --max-time 10 "$SITE_URL" >/dev/null 2>&1; then
    echo "✅ ${LABEL} réussie."
    exit 0
  fi

  if [[ "$attempt" -lt "$ATTEMPTS" ]]; then
    echo "⏳ Cible non prête, attente de ${DELAY_SECONDS}s..."
    sleep "$DELAY_SECONDS"
  fi
done

if [[ "$MODE" == "non-blocking" ]]; then
  echo "⚠️ ${LABEL} échouée mais ignorée (mode non-bloquant)."
  exit 0
fi

echo "❌ ${LABEL} échouée après ${ATTEMPTS} tentatives."
exit 1
