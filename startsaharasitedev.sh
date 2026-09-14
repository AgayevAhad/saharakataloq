#!/bin/bash
# Sahara Electronics Saytı - DEV (Canlı İnkişaf və HMR Test) Serverini Başlatma Skripti
set -euo pipefail

RUNTIME_BIN="/home/oni10/Desktop/Bazaucunprogram/.runtime/node/bin"
if ! command -v node >/dev/null 2>&1 && [ -d "$RUNTIME_BIN" ]; then
  export PATH="$RUNTIME_BIN:$PATH"
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Xəta: Node.js və npm tapılmadı."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_DIR="$SCRIPT_DIR/site"

if [ ! -d "$SITE_DIR" ]; then
  echo "Xəta: site/ qovluğu tapılmadı."
  exit 1
fi

export VITE_APP_MODE="site"
export APP_MODE="site"

# Cari Git branch yoxlanışı
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "bilinmir")

# Şəbəkə IP ünvanını tapırıq
LOCAL_IP=$(ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | grep -vE '^172\.(1[6-9]|2[0-9]|3[0-1])\.' | head -n 1 || true)
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="localhost"
fi

cd "$SITE_DIR"

# Backend üçün port (3004 və ya boş port)
BACKEND_PORT=3004
export PORT="$BACKEND_PORT"

# Clean up any background backend on exit
cleanup() {
  echo ""
  echo "DEV Serverlər dayandırılır..."
  if [ -n "${BACKEND_PID:-}" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Backend serverini arxa planda işə salırıq
node --env-file-if-exists=.env server.mjs >/dev/null 2>&1 &
BACKEND_PID=$!
sleep 1

echo "=========================================================="
echo "  ⚡ SAHARA ELECTRONICS SAYTI — DEV (CANLI İNKİŞAF)       "
echo "=========================================================="
echo "📌 Aktiv Branch          : $CURRENT_BRANCH"
echo "📁 Qovluq                : $SITE_DIR"
echo "🔥 Hot Module Reloading aktivdir (kod dəyişəndə dərhal yenilənir)"
echo ""
echo "💻 DEV Sayt (Kompüter)   : http://localhost:5174"
echo "📱 DEV Sayt (Telefon)    : http://$LOCAL_IP:5174"
echo "🔐 DEV Admin Paneli      : http://localhost:5174/AdministratorNT"
echo ""
echo "Dayandırmaq üçün terminalda CTRL + C basın."
echo "=========================================================="
echo ""

# Vite development serverini ön planda başladırıq
exec npx vite --host 0.0.0.0 --port 5174
