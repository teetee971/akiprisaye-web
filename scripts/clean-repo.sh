#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      🧹 NETTOYAGE SÉCURISÉ DU DÉPÔT                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Dossiers à supprimer (patterns)
FORBIDDEN_DIRS=(
  "backup"
  "old"
  "archive"
  "export"
  "extract"
  "test_extract"
  "tmp"
  "temp"
  "final"
  "draft"
  "akiprisaye_web_final_full_*"
  "SentinelQuantumVanguardAIPro"
  "history"
)

# Extensions interdites (hors public/)
FORBIDDEN_EXTS=(
  "psd"
  "ai"
  "fig"
  "sketch"
  "zip"
  "rar"
  "7z"
  "mp4"
  "mov"
)

# Patterns marketing à la racine
MARKETING_PATTERNS=(
  "A_*.png"
  "ChatGPT*.png"
  "*screenshot*.png"
  "*mockup*.png"
)

files_to_remove=()
dirs_to_remove=()

echo "🔍 Analyse du dépôt..."
echo ""

# Scan dossiers interdits
echo "📁 Vérification des dossiers interdits..."
for dir_pattern in "${FORBIDDEN_DIRS[@]}"; do
  # Recherche avec glob pattern
  for dir in $dir_pattern; do
    if [ -d "$dir" ] && git ls-files "$dir" &>/dev/null; then
      echo -e "${RED}  ❌ Trouvé: $dir/${NC}"
      dirs_to_remove+=("$dir")
    fi
  done
done

# Scan extensions interdites
echo ""
echo "📄 Vérification des extensions interdites..."
for ext in "${FORBIDDEN_EXTS[@]}"; do
  files=$(git ls-files "*.$ext" 2>/dev/null || true)
  if [ -n "$files" ]; then
    echo -e "${RED}  ❌ Fichiers .$ext détectés:${NC}"
    while IFS= read -r file; do
      echo "     - $file"
      files_to_remove+=("$file")
    done <<< "$files"
  fi
done

# Scan fichiers marketing à la racine
echo ""
echo "🎨 Vérification des fichiers marketing à la racine..."
for pattern in "${MARKETING_PATTERNS[@]}"; do
  files=$(git ls-files "$pattern" 2>/dev/null | grep -v "^public/" || true)
  if [ -n "$files" ]; then
    echo -e "${RED}  ❌ Marketing/screenshots à la racine:${NC}"
    while IFS= read -r file; do
      echo "     - $file"
      files_to_remove+=("$file")
    done <<< "$files"
  fi
done

# Résumé
total_items=$((${#files_to_remove[@]} + ${#dirs_to_remove[@]}))

echo ""
echo "════════════════════════════════════════════════════════════"
echo "📊 RÉSUMÉ:"
echo "   - Fichiers à supprimer: ${#files_to_remove[@]}"
echo "   - Dossiers à supprimer: ${#dirs_to_remove[@]}"
echo "   - Total: $total_items éléments"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ $total_items -eq 0 ]; then
  echo -e "${GREEN}✅ Dépôt déjà propre — aucun nettoyage nécessaire${NC}"
  exit 0
fi

# Confirmation interactive (sauf si --force)
if [ "$1" != "--force" ]; then
  echo -e "${YELLOW}⚠️  Voulez-vous supprimer ces fichiers/dossiers ? (y/N)${NC}"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Annulé par l'utilisateur"
    exit 0
  fi
fi

echo ""
echo "🗑️  Nettoyage en cours..."

# Suppression des dossiers
for dir in "${dirs_to_remove[@]}"; do
  echo "  Suppression: $dir/"
  git rm -rf "$dir" 2>/dev/null || rm -rf "$dir"
done

# Suppression des fichiers
for file in "${files_to_remove[@]}"; do
  echo "  Suppression: $file"
  git rm -f "$file" 2>/dev/null || rm -f "$file"
done

# Vérification des changements
if git diff --cached --quiet 2>/dev/null; then
  echo ""
  echo -e "${GREEN}✅ Nettoyage terminé (aucun fichier tracké supprimé)${NC}"
else
  echo ""
  echo -e "${GREEN}✅ Nettoyage terminé${NC}"
  echo ""
  echo "📝 Fichiers staged pour commit:"
  git diff --cached --stat
  echo ""
  echo "Pour valider les suppressions:"
  echo "  git commit -m 'chore(repo): nettoyage automatique des fichiers inutiles'"
  echo "  git push"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           NETTOYAGE COMPLÉTÉ AVEC SUCCÈS ✓                ║"
echo "╚════════════════════════════════════════════════════════════╝"
