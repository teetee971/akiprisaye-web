#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$HOME/akiprisaye-web}"
cd "$ROOT"

WF=".github/workflows/pages.yml"
if [ ! -f "$WF" ]; then
  echo "ERROR: $WF introuvable"
  exit 1
fi

# Add env: VITE_BASE: /akiprisaye-web/ to the build step(s).
# We try to patch the step that runs "npm run build" (frontend).
# If not found, we patch the whole job env at top-level.

repo="$(basename "$(git rev-parse --show-toplevel)")"
base="/$repo/"

perl -0777 -i -pe '
  my $base = $ENV{VITE_BASE_PATCH};
  my $s = $_;

  # First try: add env to the step containing "npm run build"
  if ($s =~ /- name:\s*Build[\s\S]*?run:\s*npm\s+run\s+build/s) {
    $s =~ s/(- name:\s*Build[\s\S]*?run:\s*npm\s+run\s+build[ \t]*\n)/$1        env:\n          VITE_BASE: "$base"\n/s
      unless $s =~ /VITE_BASE/;
  } elsif ($s =~ /run:\s*npm\s+run\s+build/s) {
    # Generic "run: npm run build" step
    $s =~ s/(run:\s*npm\s+run\s+build[ \t]*\n)/$1        env:\n          VITE_BASE: "$base"\n/s
      unless $s =~ /VITE_BASE/;
  } else {
    # Fallback: set job-level env
    if ($s !~ /env:\s*\n\s*VITE_BASE:/) {
      $s =~ s/(jobs:\s*\n\s*[^:\n]+:\s*\n)/$1    env:\n      VITE_BASE: "$base"\n/s;
    }
  }

  $_ = $s;
' "$WF"
