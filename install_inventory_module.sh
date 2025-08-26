#!/usr/bin/env bash
set -euo pipefail

# ── Réglages (adapte si besoin) ────────────────────────────────────────────────
REPO_DIR="${REPO_DIR:-$HOME/akiprisaye-web}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
BRANCH="${BRANCH:-main}"

# Charge tes variables Cloudflare si présentes (~/.env)
[ -f "$HOME/.env" ] && set -a && . "$HOME/.env" && set +a

echo "→ Repo: $REPO_DIR"
mkdir -p "$REPO_DIR"
cd "$REPO_DIR"

# Vérifie que c'est bien un repo git (sinon clone-le avant)
git rev-parse --git-dir >/dev/null 2>&1 || {
  echo "❌ Pas un dépôt git. Fais d'abord:  git clone <URL_REPO> \"$REPO_DIR\""
  exit 1
}

# ── Arborescence ──────────────────────────────────────────────────────────────
mkdir -p functions/api/inventory schema src/modules/inventory

# ── API: POST /api/inventory/ingest (Pages Function) ─────────────────────────
cat > functions/api/inventory/ingest.ts <<'EOF'
export const onRequestPost: PagesFunction<{ DB: D1Database; INVENTORY_SECRET: string }> = async (ctx) => {
  const { request, env } = ctx;
  const secret = request.headers.get("x-inventory-secret") ?? "";
    return J({ ok:false, error:"unauthorized" }, 401);
  }
  let body:any; try { body = await request.json(); } catch { return J({ ok:false, error:"invalid_json"},400); }

  const n = normalize(body);

  const id   = await sha1(
