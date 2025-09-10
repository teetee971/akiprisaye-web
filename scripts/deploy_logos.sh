#!/usr/bin/env bash
set -euo pipefail

# --- Réglages ---
ZIP="logos-officiels-domtom.zip"
BRANDS_DIR="public/assets/brands"
BRANDS=(carrefour superu leaderprice tiprix promocash hyperu market)

ok="✅"; warn="⚠️"; err="❌"; info="ℹ️"

echo
echo "——— Déploiement des logos officiels (DOM-TOM) ———"

# 1) Vérifs préalables
if [ ! -f "$ZIP" ]; then
  echo "$err Fichier $ZIP introuvable dans le dossier courant."
  echo "   Place le zip à côté de ce script (ou passe un chemin absolu)."
  exit 1
fi

# 2) Décompression dans un dossier temporaire
TMP=".tmp_logos_$$"
rm -rf "$TMP"
mkdir -p "$TMP"
unzip -q "$ZIP" -d "$TMP"
echo "$ok Zip extrait → $TMP"

# 3) Création de l’arborescence cible
mkdir -p "$BRANDS_DIR"

# 4) Copie des logos (en conservant les noms exacts)
COPIED=0
for b in "${BRANDS[@]}"; do
  SRC_PNG="$TMP/$BRANDS_DIR/$b.png"
  if [ -f "$SRC_PNG" ]; then
    cp "$SRC_PNG" "$BRANDS_DIR/$b.png"
    echo "$ok $b.png copié"
    COPIED=$((COPIED+1))
  else
    echo "$warn $b.png manquant dans le zip (placeholder utilisé si présent)."
  fi
done

# 5) Récapitulatif
echo "—"
echo "$info Logos copiés: $COPIED / ${#BRANDS[@]}"

# 6) Contrôles rapides
FAIL=0
for b in "${BRANDS[@]}"; do
  if [ -s "$BRANDS_DIR/$b.png" ]; then
    echo "$ok Présent: $BRANDS_DIR/$b.png"
  else
    echo "$warn Absent ou vide: $BRANDS_DIR/$b.png"
    FAIL=$((FAIL+1))
  fi
done

# 7) Build local (copie les assets, pas de bundling si le projet est statique)
if grep -q '"build"' package.json 2>/dev/null; then
  echo "—"
  echo "$info Lancement du build NPM…"
  npm run build || { echo "$err Build échoué"; exit 1; }
  echo "$ok Build terminé"
else
  echo "$info Aucun script 'build' dans package.json → on saute l’étape."
fi

# 8) Commit & push (Cloudflare Pages = déploiement automatique via Git)
echo "—"
git add "$BRANDS_DIR" || true
git commit -m "feat(assets): logos officiels enseignes DOM-TOM" || echo "$info Rien à committer"
git push
echo "$ok Push OK"

# 9) Mini check prod (si tes scripts existent)
if [ -x scripts/mega_check.sh ]; then
  echo "—"
  echo "$info Vérifs prod (scripts/mega_check.sh)…"
  scripts/mega_check.sh || echo "$warn Vérifs: certains endpoints peuvent encore être en cache."
fi

# 10) Nettoyage
rm -rf "$TMP"
echo "—"
echo "$ok Terminé. Attends la fin du déploiement Cloudflare Pages (quelques secondes)."
