#!/usr/bin/env bash
set -euo pipefail

# ------------ Réglages par défaut ------------
ROOT="${ROOT:-"$(pwd)"}"
DOMAIN="${DOMAIN:-"https://akiprisaye.pages.dev"}"
DEFAULT_LIMIT="${LIMIT:-5}"

# ------------ Table des territoires ------------
# code|slug|nom lisible
TERRS=(
  "BL|saint-barthelemy|Saint-Barthélemy"
  "GF|guyane|Guyane"
  "GP|guadeloupe|Guadeloupe"
  "MF|saint-martin|Saint-Martin"
  "MQ|martinique|Martinique"
  "NC|nouvelle-caledonie|Nouvelle-Calédonie"
  "PF|polynesie-francaise|Polynésie française"
  "PM|saint-pierre-et-miquelon|Saint-Pierre-et-Miquelon"
  "RE|reunion|Réunion"
  "WF|wallis-et-futuna|Wallis-et-Futuna"
  "YT|mayotte|Mayotte"
)

# ------------ Menu territoires ------------
echo "🌍  Choisis un territoire (numéro, code ou slug) :"
i=1
for t in "${TERRS[@]}"; do
  IFS='|' read -r code slug label <<<"$t"
  printf " %2d) %-2s → %-20s  %s\n" "$i" "$code" "$slug" "$label"
  i=$((i+1))
done
echo

read -rp "Numéro (1-${#TERRS[@]}) ou code/slug [défaut GP]: " choice
choice="${choice:-GP}"

# Résolution choix → slug
resolve_slug() {
  local c="$1"
  local idx re='^[0-9]+$'
  if [[ "$c" =~ $re ]]; then
    idx="$c"
    if (( idx < 1 || idx > ${#TERRS[@]} )); then return 1; fi
    IFS='|' read -r _ slug _ <<<"${TERRS[$((idx-1))]}"
    echo "$slug"; return 0
  else
    # comparer code ou slug
    for t in "${TERRS[@]}"; do
      IFS='|' read -r code slug _ <<<"$t"
      if [[ "${c,,}" == "${code,,}" || "${c,,}" == "${slug,,}" ]]; then
        echo "$slug"; return 0
      fi
    done
    return 1
  fi
}

if ! TERRITORY="$(resolve_slug "$choice")"; then
  echo "❌ Choix invalide : $choice"; exit 1
fi

# ------------ Limite items ------------
read -rp "Nombre d'items pour /prices (Enter pour ${DEFAULT_LIMIT}) : " LIMIT_IN
LIMIT="${LIMIT_IN:-$DEFAULT_LIMIT}"
if ! [[ "$LIMIT" =~ ^[0-9]+$ ]]; then
  echo "❌ LIMIT doit être numérique."; exit 1
fi

# ------------ Résumé ------------
cat <<EOF

──────────────── Récapitulatif ────────────────
ROOT       = $ROOT
DOMAIN     = $DOMAIN
TERRITORY  = $TERRITORY
LIMIT      = $LIMIT
───────────────────────────────────────────────
EOF

# ------------ Pré-checks ------------
if [[ ! -x "./launch.sh" ]]; then
  if [[ -f "./launch.sh" ]]; then
    chmod +x ./launch.sh
  else
    echo "❌ launch.sh introuvable dans $(pwd)"; exit 1
  fi
fi

# ------------ Lancement ------------
echo "🚀 Lancement…"
ROOT="$ROOT" DOMAIN="$DOMAIN" TERRITORY="$TERRITORY" LIMIT="$LIMIT" ./launch.sh
