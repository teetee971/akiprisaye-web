#!/usr/bin/env bash
# scripts/setup-hooks.sh
# Installs local git hooks for the akiprisaye-web repository.
#
# Usage (run once after cloning):
#   bash scripts/setup-hooks.sh
#
# What it installs:
#   .git/hooks/pre-push  — runs `npm run check:firebase` before every push
#                          to catch a wrong Firebase API key before it reaches CI.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "❌ Dossier .git/hooks introuvable. Assurez-vous d'être dans un dépôt git."
  exit 1
fi

# ── pre-push ──────────────────────────────────────────────────────────────────
PRE_PUSH="$HOOKS_DIR/pre-push"

cat > "$PRE_PUSH" <<'HOOK'
#!/usr/bin/env bash
# pre-push hook — vérifie la clé API Firebase avant chaque push.
# Installé par scripts/setup-hooks.sh
set -euo pipefail
REPO_ROOT="$(cd "$(git rev-parse --show-toplevel)" && pwd)"
cd "$REPO_ROOT"
echo "🔑 pre-push: vérification clé Firebase..."
npm run check:firebase
HOOK

chmod +x "$PRE_PUSH"
echo "✅ Hook pre-push installé : $PRE_PUSH"
echo "   → \`npm run check:firebase\` sera exécuté avant chaque git push."
