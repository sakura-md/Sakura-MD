#!/bin/bash
# Install Docker + Wings (kalau belum ada), tulis config node dari panel, lalu start service.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
[ "$(id -u)" = "0" ] || { echo "Harus root"; exit 1; }

if ! command -v docker >/dev/null 2>&1; then
  echo ">> Install Docker"
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

mkdir -p /etc/pterodactyl
if [ ! -x /usr/local/bin/wings ]; then
  echo ">> Download Wings"
  ARCH=$([ "$(uname -m)" = "x86_64" ] && echo amd64 || echo arm64)
  curl -fsSLo /usr/local/bin/wings "https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_${ARCH}"
  chmod u+x /usr/local/bin/wings
fi

echo ">> Tulis config node"
echo '{{CONFIG_B64}}' | base64 -d > /etc/pterodactyl/config.yml
chmod 600 /etc/pterodactyl/config.yml

cat > /etc/systemd/system/wings.service <<'UNIT'
[Unit]
Description=Pterodactyl Wings Daemon
After=docker.service
Requires=docker.service
PartOf=docker.service

[Service]
User=root
WorkingDirectory=/etc/pterodactyl
LimitNOFILE=4096
PIDFile=/var/run/wings/daemon.pid
ExecStart=/usr/local/bin/wings
Restart=on-failure
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now wings
sleep 3
systemctl is-active wings && echo "WINGS_OK" || { journalctl -u wings -n 20 --no-pager; exit 1; }
