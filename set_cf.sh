#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
say(){ printf "\033[1;96m%s\033[0m\n" "$*"; }
need(){ command -v "$1" >/dev/null 2>&1 || { pkg install -y "$1" >/dev/null; }; }
need curl; need jq

cd "$HOME/sentinel_fusion"

# 1) Token CF depuis presse-papier si possible, sinon demande masquée
RAW=${1:-}
if [ -z "${RAW:-}" ] && command -v termux-clipboard-get >/dev/null 2>&1; then
  RAW="$(termux-clipboard-get || true)"
fi
[ -n "${RAW:-}" ] || { read -s -p "Colle ton Cloudflare API Token (Pages:Edit): " RAW; echo; }

CF_API_TOKEN="$(printf %s "$RAW" | tr -d '\r\n ')"

# 2) Vérifie le token
st="$(curl -fsS -H "Authorization: Bearer $CF_API_TOKEN" \
  https://api.cloudflare.com/client/v4/user/tokens/verify | jq -r '.result.status')"
[ "$st" = "active" ] || { echo "✖ Token Cloudflare invalide ou sans droits"; exit 1; }

# 3) Liste et choix de l'account
acc_json="$(curl -fsS -H "Authorization: Bearer $CF_API_TOKEN" \
  https://api.cloudflare.com/client/v4/accounts)"
acc_count="$(echo "$acc_json" | jq '.result|length')"
[ "$acc_count" -gt 0 ] || { echo "✖ Aucun compte Cloudflare accessible"; exit 1; }
echo "$acc_json" | jq -r '.result|to_entries[]|"\(.key)) \(.value.name) — \(.value.id)"'
read -p "Indice du compte : " idx
ACCOUNT_ID="$(echo "$acc_json" | jq -r ".result[$idx].id")"

# 4) Nom de projet + branche (par défaut)
PROJECT_NAME="${2:-sentinel-fusion}"
PAGES_BRANCH="${3:-main}"

# 5) Écrit/charge .env.ci
ENV_FILE="$HOME/sentinel_fusion/.env.ci"
touch "$ENV_FILE"; chmod 600 "$ENV_FILE"
sed -i '/^CF_API_TOKEN=/d;/^CLOUDFLARE_ACCOUNT_ID=/d;/^CLOUDFLARE_PROJECT_NAME=/d;/^CLOUDFLARE_PAGES_BRANCH=/d' "$ENV_FILE"
printf 'CF_API_TOKEN=%s\nCLOUDFLARE_ACCOUNT_ID=%s\nCLOUDFLARE_PROJECT_NAME=%s\nCLOUDFLARE_PAGES_BRANCH=%s\n' \
  "$CF_API_TOKEN" "$ACCOUNT_ID" "$PROJECT_NAME" "$PAGES_BRANCH" >> "$ENV_FILE"
set -a; . "$ENV_FILE"; set +a
say "✔ Cloudflare OK — account=$ACCOUNT_ID, project=$PROJECT_NAME, branch=$PAGES_BRANCH"
