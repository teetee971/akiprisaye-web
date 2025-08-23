#!/data/data/com.termux/files/usr/bin/bash
set -e
PORT="${1:-5520}"
cd "$HOME/sentinel_fusion"
kill $(cat .http.pid 2>/dev/null) 2>/dev/null || true
nohup python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$PWD" > .http.log 2>&1 &
echo $! > .http.pid
echo "Ouvert: http://127.0.0.1:$PORT/"
