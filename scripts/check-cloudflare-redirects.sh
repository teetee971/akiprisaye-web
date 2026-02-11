#!/usr/bin/env bash
set -euo pipefail

REDIRECTS_FILE="frontend/dist/_redirects"
EXPECTED='/*  /index.html  200'

if [[ ! -f "$REDIRECTS_FILE" ]]; then
  echo "❌ Missing $REDIRECTS_FILE"
  exit 1
fi

# Normalize line endings and trim trailing spaces for strict single-rule check
mapfile -t lines < <(sed 's/\r$//' "$REDIRECTS_FILE" | sed 's/[[:space:]]\+$//' | sed '/^[[:space:]]*$/d')

if [[ ${#lines[@]} -ne 1 ]]; then
  echo "❌ $REDIRECTS_FILE must contain exactly one non-empty rule line"
  printf 'Found %d lines:\n' "${#lines[@]}"
  printf ' - %s\n' "${lines[@]}"
  exit 1
fi

if [[ "${lines[0]}" != "$EXPECTED" ]]; then
  echo "❌ Invalid redirect rule"
  echo "Expected: $EXPECTED"
  echo "Found:    ${lines[0]}"
  exit 1
fi

echo "✅ Cloudflare SPA fallback rule is valid and unique"
