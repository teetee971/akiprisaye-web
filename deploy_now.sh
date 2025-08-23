#!/usr/bin/env bash
set -euo pipefail
git add -A || true
git commit -m "chore: deploy" || true
git push origin main
echo "→ Push effectué. Surveille GitHub Actions, puis Cloudflare Pages."
