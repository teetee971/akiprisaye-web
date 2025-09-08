#!/usr/bin/env bash
set -euo pipefail

# Petites vérifs
command -v jq >/dev/null 2>&1 || { echo "❌ jq manquant"; exit 1; }

# Fichiers source → si les .extra.json n'existent pas, on crée des tableaux vides
[[ -f public/data/partners.extra.json    ]] || echo "[]" > public/data/partners.extra.json
[[ -f public/data/territories.extra.json ]] || echo "[]" > public/data/territories.extra.json

echo "▶ Fusion partners…"
jq -s '
  # concatène, nettoie noms, dédoublonne par nom (insensible à la casse),
  # puis trie par name
  [.[][]]
  | map( .name |= (tostring|gsub("\\s+";" ")|trim) )
  | unique_by(.name | ascii_downcase)
  | sort_by(.name | ascii_downcase)
' public/data/partners.json public/data/partners.extra.json \
  > public/data/partners.merged.json

mv public/data/partners.merged.json public/data/partners.json
jq -e . public/data/partners.json >/dev/null
echo "✅ partners.json OK ($(jq 'length' public/data/partners.json) items)"

echo "▶ Fusion territories…"
jq -s '
  # concatène, dédoublonne par code, puis trie par code
  [.[][]]
  | unique_by(.code)
  | sort_by(.code)
' public/data/territories.json public/data/territories.extra.json \
  > public/data/territories.merged.json

mv public/data/territories.merged.json public/data/territories.json
jq -e . public/data/territories.json >/dev/null
echo "✅ territories.json OK ($(jq 'length' public/data/territories.json) items)"

echo "🎉 Fusions terminées."
