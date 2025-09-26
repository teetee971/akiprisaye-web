#!/bin/bash
# Vérifie le statut du site Cloudflare Pages après déploiement
SITE_URL="https://akiprisaye-web.pages.dev"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL")
if [ "$RESPONSE" -eq 200 ]; then
  echo "✅ Le site est en ligne : $SITE_URL"
else
  echo "❌ Le site n'est pas accessible (code HTTP: $RESPONSE) : $SITE_URL"
fi
