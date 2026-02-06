#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

REPORT="useeffect-risk.txt"
SRC_DIR="src"

# Reset report
{
  echo "AUDIT useEffect dangereux"
  echo "========================="
  echo "Date : $(date)"
  echo "Répertoire : $(pwd)"
  echo
  echo "Règle : lignes contenant useEffect + (setState|setLoading|fetch|setTimeout|setInterval)"
  echo
} > "$REPORT"

# Vérifs minimales
if [ ! -d "$SRC_DIR" ]; then
  echo "[ERREUR] Dossier '$SRC_DIR' introuvable." | tee -a "$REPORT"
  exit 1
fi

# Extraction (sans warnings grep)
# -R : récursif
# -n : numéros de ligne
# -- : fin des options (évite les soucis si un chemin commence par -)
# 2>/dev/null : masque les messages parasites de permission éventuels
grep -R -n -- "useEffect" "$SRC_DIR" 2>/dev/null \
  | grep -E -- "(setState|setLoading|fetch|setTimeout|setInterval)" \
  >> "$REPORT" || true

# Résumé
COUNT="$(grep -c -E -- "useEffect" "$REPORT" 2>/dev/null || true)"
{
  echo
  echo "-------------------------"
  echo "Total lignes détectées : ${COUNT:-0}"
  echo "Rapport généré : $REPORT"
} >> "$REPORT"

echo "✅ Rapport généré : $REPORT (lignes détectées : ${COUNT:-0})"

