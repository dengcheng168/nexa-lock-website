#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT/.codespaces-data"
mkdir -p "$DATA_DIR"

pkill -f "tsx watch src/server.ts" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

cd "$ROOT/backend"
nohup env \
  HOST=0.0.0.0 \
  BACKEND_PORT=4000 \
  DATABASE_URL=file:./dev.db \
  JWT_SECRET="${CODESPACE_JWT_SECRET:-$(openssl rand -hex 32)}" \
  CORS_ORIGIN="*" \
  FRONTEND_BASE_URL=http://127.0.0.1:3000 \
  npm run dev > "$DATA_DIR/backend.log" 2>&1 < /dev/null &

cd "$ROOT/frontend"
nohup env \
  INTERNAL_API_BASE_URL=http://127.0.0.1:4000 \
  NEXT_PUBLIC_API_BASE_URL=/api \
  NEXT_PUBLIC_UPLOADS_BASE_URL= \
  NEXT_PUBLIC_SITE_URL="${CODESPACE_NAME:+https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}}" \
  npm run dev -- --hostname 0.0.0.0 > "$DATA_DIR/frontend.log" 2>&1 < /dev/null &

echo "Starting NEXA LOCK preview on port 3000..."
echo "Admin login: /qZzH86tTnyvhqTpk"
echo "Admin credentials: .codespaces-data/admin-password.txt"
