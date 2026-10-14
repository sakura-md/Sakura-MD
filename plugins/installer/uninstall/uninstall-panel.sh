#!/bin/bash
# Hapus Pterodactyl Panel + Wings (data panel, database, config). Tidak menyentuh container Docker lain.
export DEBIAN_FRONTEND=noninteractive
echo ">> Stop service"
systemctl disable --now pteroq.service 2>/dev/null
systemctl disable --now wings.service 2>/dev/null
rm -f /etc/systemd/system/pteroq.service /etc/systemd/system/wings.service
systemctl daemon-reload

echo ">> Hapus file"
rm -rf /var/www/pterodactyl /etc/pterodactyl /var/lib/pterodactyl /var/log/pterodactyl
rm -f /usr/local/bin/wings
rm -f /etc/nginx/sites-enabled/pterodactyl.conf /etc/nginx/sites-available/pterodactyl.conf
(crontab -l 2>/dev/null | grep -v 'pterodactyl/artisan schedule:run') | crontab - 2>/dev/null

echo ">> Hapus database"
mysql -u root -e "DROP DATABASE IF EXISTS panel; DROP USER IF EXISTS 'pterodactyl'@'127.0.0.1'; FLUSH PRIVILEGES;" 2>/dev/null

nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null
echo "UNINSTALL_OK"
