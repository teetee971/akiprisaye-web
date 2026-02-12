#!/usr/bin/env bash
set -euo pipefail

python3 - <<'PY'
import fnmatch
import pathlib
import re
import subprocess
import sys

EXCLUDES = [
    '.github/workflows/*',
    'docs/*',
    'scripts/*',
    'fixtures/*',
    '*.md',
    '*.snap',
]

L1 = 'version https://git-lfs.github.com/spec/v1'
OID_RE = re.compile(r'^oid sha256:[0-9a-f]{64}$')
SIZE_RE = re.compile(r'^size [0-9]+$')

files = subprocess.check_output(['git', 'ls-files', '-z'])
paths = [p for p in files.decode('utf-8', 'replace').split('\x00') if p]

bad = []
for rel in paths:
    if any(fnmatch.fnmatch(rel, pattern) for pattern in EXCLUDES):
        continue
    path = pathlib.Path(rel)
    if not path.is_file():
        continue
    try:
        data = path.read_bytes()
    except Exception:
        continue
    if len(data) > 512:
        continue

    lines = data.splitlines()[:3]
    if len(lines) < 3:
        continue

    l1 = lines[0].decode('utf-8', 'ignore').strip('\r\n')
    l2 = lines[1].decode('utf-8', 'ignore').strip('\r\n')
    l3 = lines[2].decode('utf-8', 'ignore').strip('\r\n')

    if l1 == L1 and OID_RE.match(l2) and SIZE_RE.match(l3):
        bad.append((rel, [l1, l2, l3]))

if bad:
    print('❌ Real Git LFS pointer file(s) detected:')
    for rel, lines in bad:
        print(f'- {rel}')
        for line in lines:
            print(f'    {line}')
    sys.exit(1)

print('✅ OK: no LFS pointers found')
PY
