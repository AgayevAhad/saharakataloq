#!/bin/bash
# Sahara Electronics Saytı - Production Server Başlatma Skripti (site/ daxilində)
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

echo "=========================================================="
echo "  🌐 SAHARA ELECTRONICS SAYTI — PROD SERVER               "
echo "=========================================================="
echo "📌 Aktiv Branch          : $CURRENT_BRANCH"
echo "📁 Qovluq                : $SITE_DIR"
echo ""
if [ "$RESOLVED_PORT" != "$REQUESTED_PORT" ]; then
  echo "⚠️  $REQUESTED_PORT portu istifadədədir; server $RESOLVED_PORT portunda başladılacaq."
  echo ""
fi
echo "💻 Kompüterdə açmaq üçün : http://localhost:$RESOLVED_PORT"
echo "📱 Telefonda açmaq üçün  : http://$LOCAL_IP:$RESOLVED_PORT"
echo "🔐 Admin İdarəetmə Paneli: http://$LOCAL_IP:$RESOLVED_PORT/AdministratorNT"
echo ""
echo "Dayandırmaq üçün terminalda CTRL + C basın."
echo "=========================================================="
echo ""

npm run build
exec node --env-file-if-exists=.env server.mjs
