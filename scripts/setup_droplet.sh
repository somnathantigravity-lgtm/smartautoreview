#!/usr/bin/env bash
# ====================================================================
# SMARTAUTOREVIEW / APEX QUANT - DIGITALOCEAN DROPLET AUTO-SETUP SCRIPT
# Run this script as root on an Ubuntu 24.04 / 22.04 LTS Droplet
# ====================================================================

set -e

echo "=== [1/7] Updating Ubuntu packages & Installing Dependencies ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y python3 python3-pip python3-venv python3-dev build-essential curl git rsync nginx certbot python3-certbot-nginx

# Install Node.js 20.x if not installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Python version: $(python3 --version)"

# Set destination directory
APP_DIR="/var/www/stock"
mkdir -p "$APP_DIR"

echo "=== [2/7] Checking Codebase at $APP_DIR ==="
if [ ! -f "$APP_DIR/backend/app/main.py" ]; then
    echo "Cloning repository..."
    git clone https://github.com/somnathantigravity-lgtm/smartautoreview.git "$APP_DIR"
else
    echo "Repository already present. Pulling latest main..."
    cd "$APP_DIR"
    git pull origin main || true
fi

echo "=== [3/7] Setting Up Python Virtual Environment ==="
cd "$APP_DIR/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    pip install fastapi uvicorn pydantic requests pyotp websockets python-multipart
fi

echo "=== [4/7] Installing Frontend & Compiling Production Bundle ==="
cd "$APP_DIR/frontend"
npm install --legacy-peer-deps
npm run build

echo "=== [5/7] Installing Systemd Services ==="
cp "$APP_DIR/scripts/smartauto-backend.service" /etc/systemd/system/
cp "$APP_DIR/scripts/smartauto-frontend.service" /etc/systemd/system/
cp "$APP_DIR/scripts/smartauto-portal-router.service" /etc/systemd/system/

systemctl daemon-reload
systemctl enable smartauto-backend.service
systemctl enable smartauto-frontend.service
systemctl enable smartauto-portal-router.service

echo "=== [6/7] Configuring Nginx Reverse Proxy ==="
cp "$APP_DIR/scripts/nginx_smartautoreviews.conf" /etc/nginx/sites-available/smartautoreview
ln -sf /etc/nginx/sites-available/smartautoreview /etc/nginx/sites-enabled/smartautoreview
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "=== [7/7] Starting Services ==="
systemctl restart smartauto-backend.service
systemctl restart smartauto-frontend.service
systemctl restart smartauto-portal-router.service

echo "===================================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Status check:"
systemctl is-active smartauto-backend.service
systemctl is-active smartauto-frontend.service
systemctl is-active smartauto-portal-router.service
echo "===================================================================="
echo "Remember to upload intraday_history.db (20GB) from your Mac to:"
echo "$APP_DIR/backend/app/engine/intraday_history.db"
echo "===================================================================="
