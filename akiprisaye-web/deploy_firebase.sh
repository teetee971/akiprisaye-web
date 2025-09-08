#!/usr/bin/env bash
set -e
echo "▶ Déploiement Firebase (static)"
firebase deploy --only hosting
