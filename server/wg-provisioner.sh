#!/usr/bin/env bash
set -euo pipefail
WG_IF="${WG_IF:-wg0}"; WG_CONF="${WG_CONF:-/etc/wireguard/wg0.conf}"
PUB="$1"; IP="$2"
sudo wg set "$WG_IF" peer "$PUB" allowed-ips "$IP"
if ! grep -q "$PUB" "$WG_CONF"; then
  cat <<EOF | sudo tee -a "$WG_CONF" >/dev/null
[Peer]
PublicKey = $PUB
AllowedIPs = $IP
EOF
else
  sudo sed -i "0,/\[Peer\]/{:a; n; /PublicKey = $PUB/!ba; n; s#^AllowedIPs = .*#AllowedIPs = $IP#}" "$WG_CONF"
fi
echo OK
