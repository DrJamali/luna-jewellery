#!/usr/bin/env bash
# =========================================================
# LUNA — deploy to the DigitalOcean box (bare IP, HTTP, port 8082)
# Replaces the old nginx-only "luna-web" container with the Node app.
# NEVER touches trustline (/opt/trustline, ports 80/443).
#
# Secrets are read from your local env and written ONCE to a 0600
# env file on the server, then reused on every restart/redeploy:
#   ADMIN_PASSWORD=...  SESSION_SECRET=...  ./deploy-server.sh
# =========================================================
set -euo pipefail

SERVER="root@209.38.248.88"
REMOTE="/opt/luna"
IMAGE="luna-web:latest"
CONTAINER="luna-web"
PORT="8082"

echo "› building site…"
npm run build

echo "› packaging…"
tar --exclude=node_modules --exclude=.git --exclude=server/data \
  -czf luna-deploy.tgz server dist package.json package-lock.json Dockerfile .dockerignore

echo "› shipping to $SERVER:$REMOTE …"
ssh "$SERVER" "mkdir -p $REMOTE/data"

# Write/refresh the secrets env file only if values were provided locally.
if [ -n "${ADMIN_PASSWORD:-}" ] && [ -n "${SESSION_SECRET:-}" ]; then
  ssh "$SERVER" "umask 077; cat > $REMOTE/luna.env" <<EOF
ADMIN_PASSWORD=${ADMIN_PASSWORD}
SESSION_SECRET=${SESSION_SECRET}
EOF
  echo "  · wrote $REMOTE/luna.env (0600)"
fi

scp luna-deploy.tgz "$SERVER:$REMOTE/"

echo "› building image + (re)starting container on :$PORT …"
ssh "$SERVER" bash -s <<EOF
  set -euo pipefail
  cd $REMOTE
  tar -xzf luna-deploy.tgz
  rm -f luna-deploy.tgz
  docker build -t $IMAGE .
  docker rm -f $CONTAINER 2>/dev/null || true
  docker run -d --name $CONTAINER --restart unless-stopped \
    -p $PORT:8082 \
    -v $REMOTE/data:/app/server/data \
    --env-file $REMOTE/luna.env \
    $IMAGE
  docker image prune -f >/dev/null 2>&1 || true
  echo "  · container:" \$(docker ps --filter name=$CONTAINER --format '{{.Status}} {{.Ports}}')
EOF

rm -f luna-deploy.tgz
echo "✓ deployed → http://209.38.248.88:$PORT/  (admin: /admin.html)"
