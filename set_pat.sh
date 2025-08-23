#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
say(){ printf "\033[1;96m%s\033[0m\n" "$*"; }
need(){ command -v "$1" >/dev/null 2>&1 || { say "Installe $1…"; pkg install -y "$1" >/dev/null; }; }
need curl; need jq

cd "$HOME/sentinel_fusion" 2>/dev/null || mkdir -p "$HOME/sentinel_fusion" && cd "$HOME/sentinel_fusion"

# 1) Récupère le PAT depuis le presse-papier si possible, sinon demande (masqué)
RAW=""
if command -v termux-clipboard-get >/dev/null 2>&1; then
  RAW="$(termux-clipboard-get || true)"
fi
if [ -z "${RAW:-}" ]; then
  read -s -p "Colle ton PAT GitHub (ghp_… ou github_pat_…): " RAW; echo
fi

# 2) Nettoie + vérifie la forme
GH_TOKEN="$(printf %s "$RAW" | tr -d '\r\n ')"
case "$GH_TOKEN" in
  ghp_*|github_pat_*) : ;;
  *) echo "✖ PAT invalide (préfixe attendu ghp_ ou github_pat_)"; exit 1;;
esac
[ "$(printf %s "$GH_TOKEN" | wc -c)" -ge 40 ] || { echo "✖ PAT trop court"; exit 1; }

# 3) Test API GitHub (Bearer puis token)
ME="$(curl -fsS -H "Authorization: Bearer $GH_TOKEN" -H "User-Agent: curl" https://api.github.com/user | jq -r .login || true)"
if [ -z "$ME" ] || [ "$ME" = "null" ]; then
  ME="$(curl -fsS -H "Authorization: token $GH_TOKEN" -H "User-Agent: curl" https://api.github.com/user | jq -r .login || true)"
fi
[ -n "$ME" ] && [ "$ME" != "null" ] || { echo "✖ PAT rejeté (401). Vérifie les scopes : classic → repo, workflow ; fine-grained → accès écriture au dépôt (Contents RW) + Actions RW."; exit 1; }
say "✔ Authentifié GitHub : $ME"

# 4) Écrit/MAJ .env.ci (sécurisé) et charge dans la session
ENV_FILE="$HOME/sentinel_fusion/.env.ci"
touch "$ENV_FILE"; chmod 600 "$ENV_FILE"
sed -i '/^GH_TOKEN=/d;/^GH_USER=/d' "$ENV_FILE"
printf 'GH_TOKEN=%s\nGH_USER=%s\n' "$GH_TOKEN" "$ME" >> "$ENV_FILE"
set -a; . "$ENV_FILE"; set +a
say "✔ .env.ci mis à jour et chargé."

say "➡ Tu peux lancer maintenant :  bash ./deploy_github.sh"
