#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

BLOCKING_ERRORS=0
WARNINGS=0

log_section() {
  echo
  echo "========================================"
  echo "$1"
  echo "========================================"
}

blocking_fail() {
  echo "❌ $1"
  BLOCKING_ERRORS=$((BLOCKING_ERRORS + 1))
}

warn_issue() {
  echo "⚠️  $1"
  WARNINGS=$((WARNINGS + 1))
}

pass_msg() {
  echo "✅ $1"
}

log_section "Repository structural audit"

log_section "1) Git LFS pointer check"
if git grep -I -n -E '^version https://git-lfs.github.com/spec/v1$' -- . >/dev/null; then
  blocking_fail "Git LFS pointer header detected in tracked files."
else
  pass_msg "No Git LFS pointer header found."
fi

if git grep -I -n -E '^oid sha256:[0-9a-f]{64}$' -- . >/dev/null; then
  blocking_fail "Potential Git LFS oid pointer detected in tracked files."
else
  pass_msg "No Git LFS oid pointer found."
fi

log_section "2) Secret leakage scan"
HIGH_RISK_SECRET_MATCHES="$(git grep -I -n -E '(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|-----BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY-----)' -- . || true)"
if [ -n "${HIGH_RISK_SECRET_MATCHES}" ]; then
  echo "${HIGH_RISK_SECRET_MATCHES}"
  blocking_fail "High-risk secret patterns detected in tracked files."
else
  pass_msg "No high-risk secret patterns found."
fi

GOOGLE_API_KEY_MATCHES="$(git grep -I -n -E 'AIza[0-9A-Za-z\-_]{35}' -- . || true)"
if [ -n "${GOOGLE_API_KEY_MATCHES}" ]; then
  echo "${GOOGLE_API_KEY_MATCHES}"
  warn_issue "Google API key-like patterns found. Confirm these are restricted public keys."
else
  pass_msg "No Google API key-like patterns found."
fi

log_section "3) Forbidden tracked paths"
FORBIDDEN_PATHS=("dist/" "build/" "coverage/")
for path in "${FORBIDDEN_PATHS[@]}"; do
  if git ls-files | rg -q "^${path}"; then
    blocking_fail "Forbidden tracked path detected: ${path}"
  else
    pass_msg "Path not tracked: ${path}"
  fi
done

log_section "4) Large tracked files (> 5 MB warning, > 20 MB blocking)"
LARGE_WARNING_THRESHOLD=$((5 * 1024 * 1024))
LARGE_BLOCK_THRESHOLD=$((20 * 1024 * 1024))

while IFS= read -r file; do
  [ -f "$file" ] || continue
  size_bytes="$(wc -c < "$file")"
  if [ "${size_bytes}" -gt "${LARGE_BLOCK_THRESHOLD}" ]; then
    blocking_fail "Very large tracked file: ${file} ($(numfmt --to=iec-i --suffix=B "${size_bytes}"))"
  elif [ "${size_bytes}" -gt "${LARGE_WARNING_THRESHOLD}" ]; then
    warn_issue "Large tracked file: ${file} ($(numfmt --to=iec-i --suffix=B "${size_bytes}"))"
  fi
done < <(git ls-files)
pass_msg "Large file scan completed."

log_section "5) SPA routing check (_redirects)"
if [ -f "frontend/public/_redirects" ]; then
  if rg -q '^/\*\s+/index\.html\s+200$' frontend/public/_redirects; then
    pass_msg "SPA fallback rule found in frontend/public/_redirects"
  else
    blocking_fail "Missing SPA fallback '/* /index.html 200' rule in frontend/public/_redirects"
  fi
elif [ -f "public/_redirects" ]; then
  if rg -q '^/\*\s+/index\.html\s+200$' public/_redirects; then
    pass_msg "SPA fallback rule found in public/_redirects"
  else
    blocking_fail "Missing SPA fallback '/* /index.html 200' rule in public/_redirects"
  fi
else
  blocking_fail "No _redirects file found (checked frontend/public and public)."
fi

log_section "6) Required workflows check"
REQUIRED_WORKFLOWS=(
  ".github/workflows/ci-strict.yml"
  ".github/workflows/ci-cd-industrial.yml"
)
for workflow in "${REQUIRED_WORKFLOWS[@]}"; do
  if [ -f "${workflow}" ]; then
    pass_msg "Workflow present: ${workflow}"
  else
    blocking_fail "Missing required workflow: ${workflow}"
  fi
done

log_section "7) npm audit (non-blocking signal)"
if [ -d "frontend" ] && [ -f "frontend/package-lock.json" ]; then
  set +e
  (cd frontend && npm audit --audit-level=high --omit=dev >/tmp/npm-audit.log 2>&1)
  npm_audit_exit=$?
  set -e

  if [ "${npm_audit_exit}" -ne 0 ]; then
    warn_issue "npm audit reported vulnerabilities (non-blocking). See /tmp/npm-audit.log"
  else
    pass_msg "npm audit did not report high vulnerabilities."
  fi
else
  warn_issue "frontend/package-lock.json not found; npm audit skipped."
fi

log_section "Audit summary"
echo "Blocking errors : ${BLOCKING_ERRORS}"
echo "Warnings       : ${WARNINGS}"

if [ "${BLOCKING_ERRORS}" -gt 0 ]; then
  echo "❌ Repository audit failed (blocking)."
  exit 1
fi

echo "✅ Repository audit passed (warnings allowed)."
