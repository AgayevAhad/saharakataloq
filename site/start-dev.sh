#!/bin/bash
# Sahara Electronics Saytı - Development Server Başlatma Skripti (site/ daxilində)
set -euo pipefail

# Dynamic Node / NPM resolution via standard PATH, NVM or FNM
if ! command -v node >/dev/null 2>&1; then
  for candidate in "$HOME/.nvm/versions/node"/*"/bin" "$HOME/.fnm/current/bin" "/usr/local/bin" "/usr/bin"; do
    if [ -x "$candidate/node" ]; then
      export PATH="$candidate:$PATH"
      break
    fi
  done
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "❌ Xəta: Node.js və ya npm sistemdə tapılmadı."
  exit 1
fi

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SITE_DIR"

# Strict Sahara Site Branch Guard
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "bilinmir")
if [ "$CURRENT_BRANCH" != "saharasitedev" ]; then
  echo "❌ XƏTA: Saytın işə salınması yalnız 'saharasitedev' branchında icazəlidir!"
  echo "   Hazırkı aktiv branch: '$CURRENT_BRANCH'"
  exit 1
fi

export VITE_APP_MODE="site"
export APP_MODE="site"

LOCAL_IP=$(ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | grep -vE '^172\.(1[6-9]|2[0-9]|3[0-1])\.' | head -n 1 || true)
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="localhost"
fi

if [ -n "${PORT:-}" ]; then
  REQUESTED_PORT="$PORT"
else
  REQUESTED_PORT=$(node --env-file-if-exists=.env -p "process.env.PORT || '3004'")
fi
RESOLVED_PORT=$(node backend/resolvePort.mjs "$REQUESTED_PORT")
export PORT="$RESOLVED_PORT"
export VITE_API_URL="http://localhost:$RESOLVED_PORT"

REQUESTED_FRONTEND_PORT=5174
RESOLVED_FRONTEND_PORT=$(node backend/resolvePort.mjs "$REQUESTED_FRONTEND_PORT")

echo "=========================================================="
echo "  🚀 SAHARA ELECTRONICS SAYTI — DEV SERVER (HMR)          "
echo "=========================================================="
echo "📌 Aktiv Branch          : $CURRENT_BRANCH"
echo "📁 Qovluq                : $SITE_DIR"
echo ""
if [ "$RESOLVED_FRONTEND_PORT" != "$REQUESTED_FRONTEND_PORT" ]; then
  echo "⚠️  $REQUESTED_FRONTEND_PORT portu istifadədədir; Vite dev server $RESOLVED_FRONTEND_PORT portunda başladılacaq."
  echo ""
fi
echo "💻 Frontend (Vite Dev)   : http://localhost:$RESOLVED_FRONTEND_PORT"
echo "📱 Telefonda açmaq üçün  : http://$LOCAL_IP:$RESOLVED_FRONTEND_PORT"
echo "🔌 Backend API Portu     : http://localhost:$RESOLVED_PORT"
echo "🔐 Admin İdarəetmə Paneli: http://$LOCAL_IP:$RESOLVED_FRONTEND_PORT/AdministratorNT"
echo ""
echo "Dayandırmaq üçün terminalda CTRL + C basın."
echo "=========================================================="
echo ""

cleanup() {
  echo ""
  echo "🛑 Sayt serverləri dayandırılır..."
  kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT INT TERM

node --env-file-if-exists=.env server.mjs &
npx vite --host 0.0.0.0 --port "$RESOLVED_FRONTEND_PORT"
