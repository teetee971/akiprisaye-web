#!/usr/bin/env bash
set -euo pipefail

FILE_PATH="${1:-frontend/public/_redirects}"

if [[ ! -f "$FILE_PATH" ]]; then
  echo "❌ Missing redirects file: $FILE_PATH"
  exit 1
fi

echo "🔍 Checking redirects file: $FILE_PATH"

if ! grep -Eq '^/app\s+/app\.html\s+200$' "$FILE_PATH"; then
  echo "❌ Missing required rewrite: /app  /app.html  200"
  exit 1
fi

if ! grep -Eq '^/app/\*\s+/app\.html\s+200$' "$FILE_PATH"; then
  echo "❌ Missing required rewrite: /app/*  /app.html  200"
  exit 1
fi

if ! grep -Eq '^/\*\s+/app\.html\s+200$' "$FILE_PATH"; then
  echo "❌ Missing required wildcard rewrite: /*  /app.html  200"
  exit 1
fi

if grep -E '^(\/app(\/\*|\.html)?|/\*)\s+\S+\s+30[12]$' "$FILE_PATH"; then
  echo "❌ Found forbidden redirect status 301/302 for /app, /app/*, /app.html or /*"
  exit 1
fi

echo "✅ Redirect rules are rewrite-only for /app and wildcard patterns"
