#!/usr/bin/env bash
set -e
echo "▶ Déploiement GitHub Pages (branche gh-pages)"
BRANCH=gh-pages
BUILD_DIR=.
git checkout -B $BRANCH
git add -A
git commit -m "Pages build"
git push -f origin $BRANCH
echo "✅ Poussé sur $BRANCH"
