#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
say(){ printf "\033[1;96m%s\033[0m\n" "$*"; }
need(){ command -v "$1" >/dev/null 2>&1 || { pkg install -y "$1" >/dev/null; }; }
need curl; need jq; need git

cd "$HOME/sentinel_fusion"
set -a; [ -f ./.env.ci ] && . ./.env.ci; set +a

: "${GH_TOKEN:?GH_TOKEN manquant}"
: "${GH_USER:?GH_USER manquant}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID manquant}"
: "${CF_API_TOKEN:?CF_API_TOKEN manquant}"
: "${CLOUDFLARE_PROJECT_NAME:=sentinel-fusion}"
: "${CLOUDFLARE_PAGES_BRANCH:=main}"

REPO_NAME="${REPO_NAME:-$CLOUDFLARE_PROJECT_NAME}"
REMOTE_URL="https://${GH_TOKEN}@github.com/${GH_USER}/${REPO_NAME}.git"

# Init + commit (idempotent)
[ -d .git ] || git init -q
git config user.name "Sentinel Bot"
git config user.email "bot@sentinel.local"
git checkout -B "$CLOUDFLARE_PAGES_BRANCH"
git add -A
git commit -m "feat: initial push (Fusion PS5 + Futur Cyber)" || true

# Crée le repo si besoin
if ! curl -fsS -H "Authorization: token $GH_TOKEN" \
  "https://api.github.com/repos/${GH_USER}/${REPO_NAME}" >/dev/null 2>&1; then
  say "Créer dépôt ${REPO_NAME}…"
  curl -fsS -H "Authorization: token $GH_TOKEN" -H "Content-Type: application/json" \
    -X POST "https://api.github.com/user/repos" \
    -d "{\"name\":\"$REPO_NAME\",\"private\":false}" >/dev/null
fi

git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"
git push -u origin "$CLOUDFLARE_PAGES_BRANCH" --force

# Workflow Cloudflare Pages
mkdir -p .github/workflows
cat > .github/workflows/deploy-cloudflare.yml <<'YAML'
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [ "main" ]
permissions:
  contents: read
  deployments: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Detect & Build
        id: build
        run: |
          if [ -f package.json ] && jq -e '.scripts.build' package.json >/dev/null 2>&1; then
            npm ci && npm run build && echo "dir=dist" >> $GITHUB_OUTPUT
          else
            echo "dir=." >> $GITHUB_OUTPUT
          fi
      - name: Publish to Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: ${{ secrets.CLOUDFLARE_PROJECT_NAME }}
          directory: ${{ steps.build.outputs.dir }}
          branch: ${{ secrets.CLOUDFLARE_PAGES_BRANCH || 'main' }}
YAML

git add .github/workflows/deploy-cloudflare.yml
git commit -m "chore(ci): add Cloudflare Pages workflow" || true
git push

say "✔ Poussé sur GitHub."
say "➡ Dans GitHub : Settings → Secrets and variables → Actions, ajoute ces 4 secrets :"
printf "   CF_API_TOKEN\n   CLOUDFLARE_ACCOUNT_ID\n   CLOUDFLARE_PROJECT_NAME (= %s)\n   CLOUDFLARE_PAGES_BRANCH (= %s)\n" "$CLOUDFLARE_PROJECT_NAME" "$CLOUDFLARE_PAGES_BRANCH"
say "Puis fais un petit commit/push (ou Actions → Run workflow) pour déclencher le déploiement."
