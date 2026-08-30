#!/bin/bash
# Sahara Electronic Kataloq - DEV (Canlı İnkişaf və Test) Serverini Başlatma Skripti
set -euo pipefail

RUNTIME_BIN="/home/oni10/Desktop/Bazaucunprogram/.runtime/node/bin"
if ! command -v node >/dev/null 2>&1 && [ -d "$RUNTIME_BIN" ]; then
  export PATH="$RUNTIME_BIN:$PATH"
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Xəta: Node.js və npm tapılmadı."
  exit 1
fi

# Şəbəkə IP ünvanını tapırıq
LOCAL_IP=$(ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | grep -vE '^172\.(1[6-9]|2[0-9]|3[0-1])\.' | head -n 1 || true)
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="localhost"
fi

# Backend üçün port (3002 və ya boş port)
BACKEND_PORT=3002
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
echo "  ⚡ SAHARA ELECTRONIC - DEV (CANLI İNKİŞAF VƏ TEST)      "
echo "=========================================================="
echo ""
echo "🔥 Hot Module Reloading aktivdir (kod dəyişəndə dərhal yenilənir)"
echo ""
echo "💻 DEV Kataloq (Kompüter) : http://localhost:5173"
echo "📱 DEV Kataloq (Telefon)  : http://$LOCAL_IP:5173"
echo "🔐 DEV Admin Paneli       : http://localhost:5173/AdministratorNT"
echo ""
echo "Dayandırmaq üçün terminalda CTRL + C basın."
echo "=========================================================="
echo ""

# Vite development serverini ön planda başladırıq
exec npx vite --host 0.0.0.0 --port 5173
