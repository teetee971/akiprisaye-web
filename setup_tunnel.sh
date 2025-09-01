#!/usr/bin/env bash
set -e

PORT="${1:-5175}"
TARGET_URL="http://127.0.0.1:${PORT}"

echo "🔎 Vérification Vite sur ${TARGET_URL}…"
# Démarre vite en arrière-plan si besoin
if ! (curl -sSf ${TARGET_URL} >/dev/null 2>&1); then
  if [ -f package.json ] && grep -q '"dev"' package.json; then
    echo "🚀 Lancement Vite en arrière-plan…"
    (pnpm dev --host 0.0.0.0 --port "${PORT}" >/dev/null 2>&1 &) || true
    # petit délai pour que Vite démarre
    for i in {1..25}; do
      sleep 0.4
      curl -sSf ${TARGET_URL} >/dev/null 2>&1 && break
    done
  fi
fi

echo "🌐 Préparation du tunnel vers ${TARGET_URL}"

start_cloudflared() {
  echo "☁️  Tentative via Cloudflared…"
  cloudflared tunnel --url "${TARGET_URL}" --no-autoupdate --loglevel info
}

start_ngrok() {
  echo "🕳  Tentative via Ngrok…"
  if [ -z "${NGROK_AUTHTOKEN}" ]; then
    echo "❗ NGROK_AUTHTOKEN non défini. Ex: export NGROK_AUTHTOKEN=xxxxxxxx"
    return 1
  fi
  ngrok http "${PORT}"
}

start_localhost_run() {
  echo "🔁 Tentative via reverse SSH (localhost.run)…"
  echo "ℹ️  L'URL sera affichée après connexion (format https://xxxxx.lhr.life)."
  ssh -o StrictHostKeyChecking=no -R 80:localhost:${PORT} nokey@localhost.run -N
}

if command -v cloudflared >/dev/null 2>&1; then
  start_cloudflared
elif command -v ngrok >/dev/null 2>&1; then
  start_ngrok
elif command -v ssh >/dev/null 2>&1; then
  start_localhost_run
else
  echo "❌ Aucun outil de tunnel trouvé."
  echo "Installez l'un des trois puis relancez:"
  echo "  pkg install cloudflared    # recommandé sous Termux"
  echo "  npm i -g ngrok && export NGROK_AUTHTOKEN=…"
  echo "  pkg install openssh         # pour localhost.run"
  exit 1
fi
