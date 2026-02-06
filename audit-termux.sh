#!/data/data/com.termux/files/usr/bin/bash
# ============================================
# AUDIT FRONTEND COMPLET - Termux
# Projet: A KI PRI SA YÉ
# Stack: React / Vite / Cloudflare Pages
# ============================================

set -e

REPORT="audit-report.txt"
PROJECT_ROOT="$(pwd)"

echo "============================================" > "$REPORT"
echo "AUDIT FRONTEND – A KI PRI SA YÉ" >> "$REPORT"
echo "Date : $(date)" >> "$REPORT"
echo "Répertoire : $PROJECT_ROOT" >> "$REPORT"
echo "============================================" >> "$REPORT"
echo "" >> "$REPORT"

# ------------------------------------------------
# 1. Vérification structure projet
# ------------------------------------------------
echo "== 1. STRUCTURE DU PROJET ==" >> "$REPORT"

for dir in src public package.json vite.config.*; do
  if [ -e "$dir" ]; then
    echo "[OK] $dir trouvé" >> "$REPORT"
  else
    echo "[WARN] $dir manquant" >> "$REPORT"
  fi
done

echo "" >> "$REPORT"

# ------------------------------------------------
# 2. Recherche appels backend interdits (/api)
# ------------------------------------------------
echo "== 2. APPELS BACKEND INTERDITS (/api) ==" >> "$REPORT"

API_CALLS=$(grep -R "fetch(['\"]\/api" src || true)

if [ -z "$API_CALLS" ]; then
  echo "[OK] Aucun appel /api détecté" >> "$REPORT"
else
  echo "[ERREUR] Appels /api détectés :" >> "$REPORT"
  echo "$API_CALLS" >> "$REPORT"
fi

echo "" >> "$REPORT"

# ------------------------------------------------
# 3. Vérification fetch sans gestion d’erreur
# ------------------------------------------------
echo "== 3. FETCH SANS CATCH / TRY-CATCH ==" >> "$REPORT"

FETCH_LINES=$(grep -R "fetch(" src || true)
BAD_FETCHES=""

while IFS= read -r line; do
  FILE=$(echo "$line" | cut -d: -f1)
  if ! grep -q "catch(" "$FILE" && ! grep -q "try" "$FILE"; then
    BAD_FETCHES="$BAD_FETCHES\n$line"
  fi
done <<< "$FETCH_LINES"

if [ -z "$BAD_FETCHES" ]; then
  echo "[OK] Tous les fetch ont une gestion d’erreur" >> "$REPORT"
else
  echo "[WARN] Fetch sans gestion d’erreur :" >> "$REPORT"
  echo -e "$BAD_FETCHES" >> "$REPORT"
fi

echo "" >> "$REPORT"

# ------------------------------------------------
# 4. Loading bloqué (useState(true) sans set false)
# ------------------------------------------------
echo "== 4. LOADING POTENTIELLEMENT BLOQUÉ ==" >> "$REPORT"

LOADING_STATES=$(grep -R "useState(true)" src || true)

if [ -z "$LOADING_STATES" ]; then
  echo "[OK] Aucun loading initial bloquant détecté" >> "$REPORT"
else
  echo "[INFO] loadings initialisés à true :" >> "$REPORT"
  echo "$LOADING_STATES" >> "$REPORT"
fi

echo "" >> "$REPORT"

# ------------------------------------------------
# 5. useEffect sans cleanup ou dépendances
# ------------------------------------------------
echo "== 5. useEffect À RISQUE ==" >> "$REPORT"

USE_EFFECTS=$(grep -R "useEffect(() =>" src || true)

if [ -z "$USE_EFFECTS" ]; then
  echo "[OK] Aucun useEffect détecté (surprenant)" >> "$REPORT"
else
  echo "[INFO] useEffect détectés (à vérifier manuellement) :" >> "$REPORT"
  echo "$USE_EFFECTS" >> "$REPORT"
fi

echo "" >> "$REPORT"

# ------------------------------------------------
# 6. Axios (interdit)
# ------------------------------------------------
echo "== 6. AXIOS (INTERDIT) ==" >> "$REPORT"

AXIOS=$(grep -R "axios" src || true)

if [ -z "$AXIOS" ]; then
  echo "[OK] Axios non utilisé" >> "$REPORT"
else
  echo "[ERREUR] Axios détecté :" >> "$REPORT"
  echo "$AXIOS" >> "$REPORT"
fi

echo "" >> "$REPORT"

# ------------------------------------------------
# 7. npm audit (si node_modules existe)
# ------------------------------------------------
echo "== 7. SÉCURITÉ npm ==" >> "$REPORT"

if [ -d "node_modules" ]; then
  npm audit --omit=dev >> "$REPORT" || echo "[WARN] Vulnérabilités détectées" >> "$REPORT"
else
  echo "[INFO] node_modules absent – npm audit ignoré" >> "$REPORT"
fi

echo "" >> "$REPORT"

# ------------------------------------------------
# FIN
# ------------------------------------------------
echo "============================================" >> "$REPORT"
echo "AUDIT TERMINÉ" >> "$REPORT"
echo "Rapport : $REPORT" >> "$REPORT"

echo ""
echo "✅ Audit terminé."
echo "📄 Rapport généré : $REPORT"
