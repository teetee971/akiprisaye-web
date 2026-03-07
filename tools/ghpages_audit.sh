#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$HOME/akiprisaye-web}"
cd "$ROOT"
echo "== Branch =="; git branch --show-current; echo
echo "== Suspicious absolute /data paths in frontend/src ==" 
git grep -nE '["'\'']/data/' frontend/src || true
echo
echo "== Router basename checks ==" 
git grep -nE 'BrowserRouter|createBrowserRouter|basename' frontend/src || true
echo
echo "== Vite base config ==" 
[ -f frontend/vite.config.ts ] && sed -n '1,220p' frontend/vite.config.ts || echo "no vite.config.ts"
