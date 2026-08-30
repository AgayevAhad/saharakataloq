#!/bin/bash
# Sahara Electronic Kataloq - production serverini başlatma skripti
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
LOCAL_IP=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | grep -vE '^172\.(1[6-9]|2[0-9]|3[0-1])\.' | head -n 1 || true)

if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="localhost"
fi

if [ -n "${PORT:-}" ]; then
  REQUESTED_PORT="$PORT"
else
  REQUESTED_PORT=$(node --env-file-if-exists=.env -p "process.env.PORT || '3000'")
fi
RESOLVED_PORT=$(node backend/resolvePort.mjs "$REQUESTED_PORT")
export PORT="$RESOLVED_PORT"

echo "=========================================================="
echo "  🚀 SAHARA ELECTRONIC - PROD (STABİL İSTEHSALAT) SERVER  "
echo "=========================================================="
echo ""
if [ "$RESOLVED_PORT" != "$REQUESTED_PORT" ]; then
  echo "⚠️  $REQUESTED_PORT portu istifadədədir; server $RESOLVED_PORT portunda başladılacaq."
  echo ""
fi
echo "💻 Kompüterdə açmaq üçün : http://localhost:$RESOLVED_PORT"
echo "📱 Telefonda açmaq üçün  : http://$LOCAL_IP:$RESOLVED_PORT"
echo "🔐 Admin (yalnız lokal)  : http://$LOCAL_IP:$RESOLVED_PORT/AdministratorNT"
echo ""
echo "Dayandırmaq üçün terminalda CTRL + C basın."
echo "=========================================================="
echo ""

# Frontendi build edib API və statik fayl serverini başladırıq.
npm run build
exec node --env-file-if-exists=.env server.mjs
