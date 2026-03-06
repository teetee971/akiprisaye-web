#!/usr/bin/env bash
set -euo pipefail

# Prefer ripgrep if available, otherwise fallback to grep.
rg_cmd() {
  if command -v rg >/dev/null 2>&1; then
    rg "$@"
  else
    grep -R --line-number --binary-files=without-match --color=never "$@"
  fi
}


MODE="${1:---strict}"
STRICT=true
if [[ "$MODE" == "--warn-only" ]]; then
  STRICT=false
fi

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

failures=0
warnings=0

pass() { echo "✅ $1"; }
warn() { echo "⚠️  $1"; warnings=$((warnings+1)); }
fail() { echo "❌ $1"; failures=$((failures+1)); }

check_conflicts() {
  if git grep -nE '^(<<<<<<< |>>>>>>> )' -- . >/dev/null 2>&1; then
    fail "Conflict markers detected in tracked files."
  else
    pass "No git conflict markers found."
  fi
}

check_lfs() {
  if git grep -nE '^oid sha256:[0-9a-f]{64}$' -- . >/dev/null 2>&1; then
    fail "Git LFS pointer signatures detected."
  else
    pass "No Git LFS pointer signature detected."
  fi

  if [[ -f .gitattributes ]] && rg -n 'filter=lfs' .gitattributes >/dev/null 2>&1; then
    fail ".gitattributes still contains LFS rules."
  else
    pass ".gitattributes does not declare Git LFS filters."
  fi
}

check_forbidden_files() {
  local forbidden
  forbidden="$(git ls-files | rg '\\.(psd|ai|fig|sketch|xd|mp4|mov|avi|mkv|webm|zip|rar|7z)$|^(dist|build|coverage)/' || true)"
  if [[ -n "$forbidden" ]]; then
    fail "Forbidden tracked files/directories found:\n$forbidden"
  else
    pass "No forbidden binary/archive artifacts are tracked."
  fi
}

check_spa_redirects() {
  local file="frontend/public/_redirects"
  if [[ ! -f "$file" ]]; then
    fail "Missing $file"
    return
  fi

  if LC_ALL=C head -c 3 "$file" | od -An -tx1 | tr -d ' \n' | rg -q '^efbbbf$'; then
    fail "_redirects contains UTF-8 BOM."
  fi

  if rg -n $'\r' "$file" >/dev/null 2>&1; then
    fail "_redirects uses CRLF line endings."
  fi

  if rg -n ' +$' "$file" >/dev/null 2>&1; then
    fail "_redirects contains trailing spaces."
  fi

  local line_count
  line_count="$(wc -l < "$file" | tr -d ' ')"
  if [[ "$line_count" != "1" ]]; then
    fail "_redirects must contain exactly one line; found $line_count."
  fi

  local line
  line="$(cat "$file")"
  if [[ "$line" == '/* /index.html 200' || "$line" == '/* /app.html 200' ]]; then
    pass "Cloudflare SPA redirect rule is strict and valid."
  else
    fail "_redirects line is invalid: '$line'"
  fi
}

check_secrets() {
  local hits
  hits="$(rg -n --hidden --glob '!.git' --glob '!node_modules/**' \
    -e 'AKIA[0-9A-Z]{16}' \
    -e 'AIza[0-9A-Za-z_\-]{35}' \
    -e '-----BEGIN (RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----' \
    -e 'Bearer [A-Za-z0-9\-_=\.]{20,}' \
    -e '(?i)(token|secret|password|api[_-]?key)\s*[:=]\s*["\x27][^"\x27]{12,}["\x27]' . || true)"

  if [[ -n "$hits" ]]; then
    warn "Potential secrets detected (report only):\n$hits"
  else
    pass "No obvious plaintext secret patterns detected."
  fi
}

check_conflicts
check_lfs
check_forbidden_files
check_spa_redirects
check_secrets

echo "---"
echo "Audit summary: failures=$failures warnings=$warnings mode=$MODE"

if [[ "$STRICT" == true && "$failures" -gt 0 ]]; then
  exit 1
fi

exit 0
