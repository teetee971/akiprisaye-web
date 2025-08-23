#!/usr/bin/env bash
# À lancer sur le VPS (Debian/Ubuntu)
set -euo pipefail
KEY="${HOOK_KEY:-${1:-TaCleUltraSecrete}}"; PORT="${PORT:-8787}"; WG_IF="${WG_IF:-wg0}"; WG_CONF="${WG_CONF:-/etc/wireguard/wg0.conf}"
sudo apt-get update -y
sudo apt-get install -y nodejs wireguard-tools
command -v node >/dev/null 2>&1 || { command -v nodejs >/dev/null 2>&1 && sudo ln -sf /usr/bin/nodejs /usr/bin/node; }
sudo install -d -m 755 /opt/vnpd
sudo cp -f server/app.js /opt/vnpd/app.js
sudo cp -f server/wg-provisioner.sh /opt/vnpd/wg-provisioner.sh
sudo chmod +x /opt/vnpd/wg-provisioner.sh
cat <<EOF | sudo tee /etc/systemd/system/vnpd.service >/dev/null
[Unit]
Description=Sentinel VNP Provisioning Hook
After=network.target

[Service]
Environment=HOOK_KEY=$KEY
Environment=PORT=$PORT
Environment=WG_IF=$WG_IF
Environment=WG_CONF=$WG_CONF
ExecStart=/usr/bin/node /opt/vnpd/app.js
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now vnpd
echo "OK: vnpd actif sur port ${PORT}. URL: http://<ip>:${PORT}/hook/vnp  (header x-hook-key: ${KEY})"
