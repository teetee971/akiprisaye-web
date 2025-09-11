#!/bin/bash
set -e
git add -A
git commit -m "auto: push depuis Replit $(date +'%Y-%m-%d %H:%M:%S')" || echo "rien à committer"
git push origin main