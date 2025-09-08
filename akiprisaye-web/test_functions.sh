#!/bin/bash
# ==========================
# Script de test des Cloud Functions A KI PRI SA YÉ
# ==========================

# Variables
REGION="us-central1"
PROJECT="a-ki-pri-sa-ye"
BASE_URL="https://${REGION}-${PROJECT}.cloudfunctions.net"

# Clé secrète
SECRET="${AKIPRI_SECRET:-$2}"

if [ -z "$SECRET" ]; then
  echo "❌ Erreur : clé secrète manquante (export AKIPRI_SECRET=... ou --secret ...)"
  exit 1
fi

# Fonctions utilitaires
function rank_all() {
  curl -s "${BASE_URL}/getRanking" | jq .
}

function rank_zone() {
  zone=$1
  curl -s "${BASE_URL}/getRanking?zone=${zone}" | jq .
}

function recompute_all() {
  curl -s "${BASE_URL}/recomputeNow?key=${SECRET}" | jq .
}

function recompute_zone() {
  zone=$1
  curl -s "${BASE_URL}/recomputeNow?zone=${zone}&key=${SECRET}" | jq .
}

# Dispatcher
case "$1" in
  rank-all)
    rank_all
    ;;
  rank)
    rank_zone "$2"
    ;;
  recompute-all)
    recompute_all
    ;;
  recompute)
    recompute_zone "$2"
    ;;
  *)
    echo "Usage:"
    echo "  ./test_functions.sh rank-all"
    echo "  ./test_functions.sh rank martinique"
    echo "  ./test_functions.sh recompute-all"
    echo "  ./test_functions.sh recompute guadeloupe"
    ;;
esac
