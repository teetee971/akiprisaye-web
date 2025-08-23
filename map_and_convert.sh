#!/usr/bin/env bash
set -euo pipefail

SRC="/sdcard/DCIM/Sentinel"
DST="$HOME/sentinel_fusion/sentinel_app/public/img"
mkdir -p "$DST"

# 1) Lister les images du dossier (récentes -> anciennes), robustes aux espaces/() etc.
mapfile -t FILES < <(
  find "$SRC" -maxdepth 1 -type f \
    \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) \
    -printf '%T@ %p\n' | sort -nr | awk '{$1=""; sub(/^ /,""); print}'
)
((${#FILES[@]})) || { echo "Aucune image trouvée dans $SRC"; exit 1; }

# 2) Noms attendus par le site + libellés lisibles
DEST=(
  hero_futur.jpg
  card_alertes.jpg
  card_appels.jpg
  card_osint.jpg
  card_analyste.jpg
  module_pred.jpg
  module_osint.jpg
  module_quantum.jpg
  poster_adblock_en.jpg
  poster_adblock_es.jpg
  poster_protection_avancee.jpg
  poster_forensique.jpg
  poster_agences_gouv.jpg
  poster_reponse_menaces.jpg
  poster_app_cyber.jpg
  poster_personnel.jpg
  poster_gouv_militaire.jpg
)
LABELS=(
  "Image HÉRO (bleu, satellite/terre)"
  "Carte : Centre d’alertes (cloche rouge)"
  "Carte : Blocage & traçage d'appels (combiné bleu)"
  "Carte : Activité OSINT (globe, points bleus)"
  "Carte : Vue analyste des appels (silhouette)"
  "Module : IA Prédictive"
  "Module : Scanner OSINT (opérateur écrans)"
  "Module : Quantum Shield (allée serveurs/bouclier)"
  "Affiche : Quantum Ad-Block (EN, fusée néon)"
  "Affiche : Quantum Ad-Block (ES «Autónomo»)"
  "Affiche : Protection avancée (liste 5 bullets)"
  "Affiche : Forensique (logiciel d’analyse)"
  "Affiche : Agences gouvernementales"
  "Affiche : Réponse numérique aux menaces"
  "Affiche : Application de cybersécurité avancée"
  "Affiche : Sécurité personnelle avancée"
  "Affiche : Application gouvernementale / Sécurité militaire"
)

show_files() {
  echo "Images dispo (récentes d'abord) :"
  for i in "${!FILES[@]}"; do printf "%2d) %s\n" "$i" "$(basename "${FILES[$i]}")"; done
}
show_files

declare -A PICK
used=-1

echo
echo "Commande au prompt :"
echo "  - Entrée : prend automatiquement la suivante (ordre chronologique)"
echo "  - <indice> : choisir l’image par son index"
echo "  - p <indice> : prévisualiser (termux-open)"
echo "  - s : passer"
echo "  - r : relister les fichiers"
echo

for i in "${!DEST[@]}"; do
  name="${DEST[$i]}"
  label="${LABELS[$i]}"
  while :; do
    read -r -p "→ Sélection pour « ${label} » [$name] : " ans || exit 1
    case "${ans:-}" in
      "") ((used++)); idx=$used ;;
      s|S) idx=; break ;;
      r|R) show_files; continue ;;
      p\ *|P\ *) idx="${ans#* }"; termux-open "${FILES[$idx]}" 2>/dev/null || true; continue ;;
      * )
        if [[ "$ans" =~ ^[0-9]+$ ]] && (( ans>=0 && ans<${#FILES[@]} )); then idx="$ans"; else echo "Index invalide."; continue; fi
        ;;
    esac
    [[ -z "${idx:-}" ]] && continue
    PICK["$name"]="${FILES[$idx]}"
    echo "   • $(basename "${FILES[$idx]}")  →  $name"
    break
  done
done

echo
echo "Récapitulatif :"
for k in "${!PICK[@]}"; do printf "  %-28s <- %s\n" "$k" "$(basename "${PICK[$k]}")"; done
read -r -p "Confirmer conversion & export vers $DST ? (o/N) " ok
[[ "${ok,,}" == "o" || "${ok,,}" == "y" ]] || { echo "Annulé."; exit 0; }

for k in "${!PICK[@]}"; do
  src="${PICK[$k]}"
  convert "$src" -auto-orient -strip -resize '1600x1600>' -quality 82 "$DST/$k"
done

echo
echo "Fichiers écrits dans $DST :"
ls -lh "$DST"
