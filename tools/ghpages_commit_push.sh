#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$HOME/akiprisaye-web}"
cd "$ROOT"

BR="fix/gh-pages-baseurl"
git checkout -b "$BR" 2>/dev/null || git checkout "$BR"

if git diff --quiet; then
  echo "No changes to commit."
  exit 0
fi

git add -A
git commit -m "fix(gh-pages): use BASE_URL for data paths and router basename"
git push -u origin "$BR"
echo "Pushed branch: $BR"
