#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$HOME/akiprisaye-web}"
cd "$ROOT"

FILE="frontend/vite.config.ts"
if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE introuvable"
  exit 1
fi

# Inject "const BASE = ..." + set vite base: BASE
# Strategy:
# - If vite config already has "base:", replace its value by BASE
# - Else insert base: BASE right after defineConfig({
#
# BASE picks:
# - import.meta.env.BASE_URL is already used at runtime by Vite, but it's generated from vite "base"
# - we set vite "base" from env var VITE_BASE, else '/'
#
perl -0777 -i -pe '
  my $s = $_;

  # Ensure BASE const exists near top (after imports)
  if ($s !~ /const\s+BASE\s*=/) {
    $s =~ s/(^import[^\n]*\n(?:import[^\n]*\n)*)/$1\nconst BASE = process.env.VITE_BASE ?? "\/";\n/s;
  }

  # Replace existing base: ... with base: BASE
  if ($s =~ /base\s*:\s*[^,\n}]+/) {
    $s =~ s/base\s*:\s*[^,\n}]+/base: BASE/g;
  } else {
    # Insert base: BASE inside defineConfig object
    $s =~ s/defineConfig\(\s*\{\s*/defineConfig({\n  base: BASE,\n/s;
  }

  $_ = $s;
' "$FILE"

echo "Patched: $FILE"
echo "---- Preview (lines with base/BASE) ----"
grep -nE 'const BASE|base:' -n "$FILE" || true
