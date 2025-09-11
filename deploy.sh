#!/bin/bash
set -e
git add -A
git commit -m "🚀 Auto-deploy depuis Replit" || echo "rien à committer"
git push origin main