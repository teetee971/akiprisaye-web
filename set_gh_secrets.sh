#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
say(){ printf "\033[1;96m%s\033[0m\n" "$*"; }
need(){ command -v "$1" >/dev/null 2>&1 || { pkg install -y "$1" >/dev/null; }; }

need curl; need jq; need python; command -v pip >/dev/null 2>&1 || pkg install -y python-pip >/dev/null
python - <<'PY' >/dev/null 2>&1 || pip install --user pynacl >/dev/null
try:
    import nacl  # type: ignore
except Exception:
    raise SystemExit(1)
PY

cd "$HOME/sentinel_fusion"
set -a; [ -f ./.env.ci ] && . ./.env.ci; set +a

: "${GH_TOKEN:?GH_TOKEN manquant (.env.ci)}"
: "${GH_USER:?GH_USER manquant (.env.ci)}"
REPO_NAME="${REPO_NAME:-${CLOUDFLARE_PROJECT_NAME:-sentinel-fusion}}"

# Clés Cloudflare attendues dans .env.ci :
: "${CF_API_TOKEN:?CF_API_TOKEN manquant (.env.ci)}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID manquant (.env.ci)}"
: "${CLOUDFLARE_PROJECT_NAME:?CLOUDFLARE_PROJECT_NAME manquant (.env.ci)}"
: "${CLOUDFLARE_PAGES_BRANCH:?CLOUDFLARE_PAGES_BRANCH manquant (.env.ci)}"

# 1) Récupère la clé publique des secrets du repo
PUB_JSON="$(curl -fsS -H "Authorization: token $GH_TOKEN" \
  "https://api.github.com/repos/${GH_USER}/${REPO_NAME}/actions/secrets/public-key")"
KEY_ID="$(echo "$PUB_JSON" | jq -r .key_id)"
PUBKEY="$(echo "$PUB_JSON" | jq -r .key)"
[ -n "$KEY_ID" ] && [ -n "$PUBKEY" ] || { echo "✖ Impossible d'obtenir la clé publique du dépôt"; exit 1; }

encrypt() {
python - <<PY
import base64, sys
from nacl import public, encoding
key_b64 = sys.argv[1]
plaintext = sys.stdin.read().encode()
pk = public.PublicKey(key_b64.encode(), encoding.Base64Encoder())
sealed = public.SealedBox(pk).encrypt(plaintext)
print(base64.b64encode(sealed).decode())
PY
}

put_secret () {
  local NAME="$1" VAL="$2"
  local EV
  EV="$(printf %s "$VAL" | encrypt "$PUBKEY")"
  curl -fsS -X PUT -H "Authorization: token $GH_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.github
cat > ~/set_gh_secrets.sh <<'SH'
#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
say(){ printf "\033[1;96m%s\033[0m\n" "$*"; }
need(){ command -v "$1" >/dev/null 2>&1 || pkg install -y "$1" >/dev/null; }

need curl; need jq
command -v python >/dev/null 2>&1 || pkg install -y python >/dev/null
command -v pip >/dev/null 2>&1 || pkg install -y python-pip >/dev/null

# Assure pynacl (chiffrement pour secrets GitHub)
python - <<'PY' >/dev/null 2>&1 || pip install --user pynacl >/dev/null
try:
    import nacl  # type: ignore
except Exception:
    raise SystemExit(1)
PY

cd "$HOME/sentinel_fusion"
set -a; [ -f ./.env.ci ] && . ./.env.ci; set +a

: "${GH_TOKEN:?GH_TOKEN manquant (.env.ci)}"
: "${GH_USER:?GH_USER manquant (.env.ci)}"
REPO_NAME="${REPO_NAME:-${CLOUDFLARE_PROJECT_NAME:-sentinel-fusion}}"

: "${CF_API_TOKEN:?CF_API_TOKEN manquant (.env.ci)}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID manquant (.env.ci)}"
: "${CLOUDFLARE_PROJECT_NAME:?CLOUDFLARE_PROJECT_NAME manquant (.env.ci)}"
: "${CLOUDFLARE_PAGES_BRANCH:?CLOUDFLARE_PAGES_BRANCH manquant (.env.ci)}"

# 1) clé publique des secrets du repo
PUB_JSON="$(curl -fsS -H "Authorization: token $GH_TOKEN" \
  "https://api.github.com/repos/${GH_USER}/${REPO_NAME}/actions/secrets/public-key")"
KEY_ID="$(echo "$PUB_JSON" | jq -r .key_id)"
PUBKEY="$(echo "$PUB_JSON" | jq -r .key)"
[ -n "$KEY_ID" ] && [ -n "$PUBKEY" ] || { echo "✖ Impossible d'obtenir la clé publique"; exit 1; }

# 2) fonction de chiffrement
encrypt() {
python - "$PUBKEY" <<'PY'
import base64, sys
from nacl import public, encoding
key_b64 = sys.argv[1]
data = sys.stdin.read().encode()
pk = public.PublicKey(key_b64.encode(), encoding.Base64Encoder())
sealed = public.SealedBox(pk).encrypt(data)
print(base64.b64encode(sealed).decode())
PY
}

put_secret () {
  local NAME="$1" VAL="$2"
  local EV; EV="$(printf %s "$VAL" | encrypt)"
  curl -fsS -X PUT \
    -H "Authorization: token $GH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"encrypted_value\":\"$EV\",\"key_id\":\"$KEY_ID\"}" \
    "https://api.github.com/repos/${GH_USER}/${REPO_NAME}/actions/secrets/${NAME}" >/dev/null
  say "✔ Secret ${NAME} mis à jour"
}

put_secret CF_API_TOKEN "$CF_API_TOKEN"
put_secret CLOUDFLARE_ACCOUNT_ID "$CLOUDFLARE_ACCOUNT_ID"
put_secret CLOUDFLARE_PROJECT_NAME "$CLOUDFLARE_PROJECT_NAME"
put_secret CLOUDFLARE_PAGES_BRANCH "$CLOUDFLARE_PAGES_BRANCH"

say "✅ Tous les secrets sont en place pour ${GH_USER}/${REPO_NAME}"
