#!/bin/bash
# Instalasi Pterodactyl Panel non-interaktif (Ubuntu 22.04/24.04, Debian 12) — jalankan sebagai root.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
export COMPOSER_ALLOW_SUPERUSER=1
PANEL_DIR=/var/www/pterodactyl

[ "$(id -u)" = "0" ] || { echo "Harus root"; exit 1; }
. /etc/os-release
echo ">> OS: $PRETTY_NAME"
case "$ID" in
  ubuntu|debian) ;;
  *) echo "OS tidak didukung ($ID). Pakai Ubuntu 22.04/24.04 atau Debian 12."; exit 1 ;;
esac

echo ">> [1/9] Paket dasar"
apt-get update -y
apt-get install -y curl ca-certificates gnupg lsb-release software-properties-common apt-transport-https tar unzip git cron

echo ">> [2/9] PHP 8.3, MariaDB, Nginx"
if [ "$ID" = "ubuntu" ]; then
  add-apt-repository -y ppa:ondrej/php
else
  curl -fsSLo /usr/share/keyrings/deb.sury.org-php.gpg https://packages.sury.org/php/apt.gpg
  echo "deb [signed-by=/usr/share/keyrings/deb.sury.org-php.gpg] https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list
fi
apt-get update -y
apt-get install -y php8.3 php8.3-{cli,gd,mysql,mbstring,bcmath,xml,fpm,curl,zip,intl} mariadb-server nginx certbot python3-certbot-nginx
curl -fsSL https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

echo ">> [3/9] Database"
systemctl enable --now mariadb
mysql -u root <<SQL
CREATE USER IF NOT EXISTS 'pterodactyl'@'127.0.0.1' IDENTIFIED BY '{{DB_PASS}}';
ALTER USER 'pterodactyl'@'127.0.0.1' IDENTIFIED BY '{{DB_PASS}}';
CREATE DATABASE IF NOT EXISTS panel;
GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SQL

echo ">> [4/9] Download panel"
mkdir -p $PANEL_DIR
cd $PANEL_DIR
curl -fsSLo panel.tar.gz https://github.com/pterodactyl/panel/releases/latest/download/panel.tar.gz
tar -xzf panel.tar.gz
rm -f panel.tar.gz
chmod -R 755 storage/* bootstrap/cache/
cp -n .env.example .env

echo ">> [5/9] Composer"
composer install --no-dev --optimize-autoloader --no-interaction
php artisan key:generate --force

echo ">> [6/9] Setup environment & migrasi"
php artisan p:environment:setup --author="{{ADMIN_EMAIL}}" --url="https://{{FQDN}}" --timezone=Asia/Jakarta --cache=file --session=database --queue=database --settings-ui=true --no-interaction
php artisan p:environment:database --host=127.0.0.1 --port=3306 --database=panel --username=pterodactyl --password="{{DB_PASS}}" --no-interaction
php artisan migrate --seed --force
php artisan p:user:make --email="{{ADMIN_EMAIL}}" --username="{{ADMIN_USER}}" --name-first=Admin --name-last=Panel --password="{{ADMIN_PASS}}" --admin=1 --no-interaction
chown -R www-data:www-data $PANEL_DIR/*

echo ">> [7/9] Cron & queue worker"
( crontab -l 2>/dev/null | grep -v 'pterodactyl/artisan schedule:run' || true; echo "* * * * * php $PANEL_DIR/artisan schedule:run >> /dev/null 2>&1" ) | crontab -
cat > /etc/systemd/system/pteroq.service <<'UNIT'
[Unit]
Description=Pterodactyl Queue Worker
After=mariadb.service

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/pterodactyl/artisan queue:work --queue=high,standard,low --sleep=3 --tries=3
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now pteroq.service

echo ">> [8/9] Nginx"
cat > /etc/nginx/sites-available/pterodactyl.conf <<'NGINX'
server {
    listen 80;
    server_name {{FQDN}};
    root /var/www/pterodactyl/public;
    index index.html index.htm index.php;
    charset utf-8;

    location / { try_files $uri $uri/ /index.php?$query_string; }
    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    access_log off;
    error_log  /var/log/nginx/pterodactyl.app-error.log error;
    client_max_body_size 100m;
    client_body_timeout 120s;
    sendfile off;

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        include /etc/nginx/fastcgi_params;
        fastcgi_param PHP_VALUE "upload_max_filesize = 100M \n post_max_size=100M";
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param HTTP_PROXY "";
        fastcgi_intercept_errors off;
        fastcgi_buffer_size 16k;
        fastcgi_buffers 4 16k;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 300;
    }

    location ~ /\.ht { deny all; }
}
NGINX
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf
systemctl enable --now php8.3-fpm
nginx -t
systemctl enable nginx
systemctl restart nginx

echo ">> [9/9] SSL (Let's Encrypt)"
SCHEME=https
if ! certbot --nginx -d {{FQDN}} --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
  echo "!! SSL gagal (pastikan DNS {{FQDN}} sudah mengarah ke IP VPS). Panel jalan lewat HTTP dulu."
  SCHEME=http
  sed -i "s|^APP_URL=.*|APP_URL=http://{{FQDN}}|" $PANEL_DIR/.env
  php $PANEL_DIR/artisan config:clear || true
fi

echo "INSTALL_OK ${SCHEME}://{{FQDN}}"
