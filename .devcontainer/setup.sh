#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT/.codespaces-data"
PASSWORD_FILE="$DATA_DIR/admin-password.txt"
DB_FILE="$ROOT/backend/prisma/dev.db"

mkdir -p "$DATA_DIR" "$ROOT/backend/uploads/originals" "$ROOT/backend/uploads/webp" "$ROOT/backend/uploads/thumbnails"

cd "$ROOT/backend"
npm ci
npx prisma generate
npx prisma migrate deploy

if [[ ! -s "$PASSWORD_FILE" ]]; then
  ADMIN_PASSWORD="Nexa-$(openssl rand -hex 10)!"
  printf '%s\n' "$ADMIN_PASSWORD" > "$PASSWORD_FILE"
  chmod 600 "$PASSWORD_FILE"
else
  ADMIN_PASSWORD="$(cat "$PASSWORD_FILE")"
fi

# Seed is idempotent for the demo catalog. The create-admin command refuses to overwrite an
# existing account, so restarting a Codespace never changes an established password.
npm run seed
ADMIN_INIT_EMAIL="admin@example.com" ADMIN_INIT_PASSWORD="$ADMIN_PASSWORD" npm run create-admin

cd "$ROOT/frontend"
npm ci

cat <<EOF

NEXA LOCK preview is ready to start.
Admin login path: /qZzH86tTnyvhqTpk
Admin email: admin@example.com
Admin password: $ADMIN_PASSWORD
The password is also stored in .codespaces-data/admin-password.txt (not committed to Git).
EOF
