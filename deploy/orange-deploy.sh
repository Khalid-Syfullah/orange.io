#!/usr/bin/env bash
# Installed on the server at /usr/local/bin/orange-deploy.
# Usage: orange-deploy <git-ref-or-sha>   (run as the ubuntu user)
#
# Builds the ref into a fresh release directory, switches the `current`
# symlink, restarts the app with pm2, health-checks it, and rolls back to the
# previous release if the check fails.
set -euo pipefail

REPO_URL="https://github.com/Khalid-Syfullah/orange.io.git"
APP=/var/www/orange
REF="${1:-main}"
KEEP=5
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=1536"

cd "$APP"
REL="$APP/releases/$(date +%Y%m%d%H%M%S)"
PREV="$(readlink -f current 2>/dev/null || true)"
trap 'rc=$?; if [ $rc -ne 0 ]; then echo "Deploy failed (exit $rc)"; rm -rf "$REL"; fi' EXIT

echo "==> Fetching $REF"
git init -q "$REL"
cd "$REL"
git remote add origin "$REPO_URL"
git fetch -q --depth 1 origin "$REF"
git checkout -q FETCH_HEAD
SHA="$(git rev-parse --short HEAD)"

echo "==> Building $SHA"
[ -f "$APP/shared/.env" ] && ln -sf "$APP/shared/.env" "$REL/.env.production.local"
npm ci --no-audit --no-fund --fetch-retries=6 --fetch-retry-mintimeout=15000 --fetch-retry-maxtimeout=120000 --maxsockets=4
npm run build

echo "==> Activating"
ln -sfn "$REL" "$APP/current.tmp"
mv -Tf "$APP/current.tmp" "$APP/current"
cd "$APP"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save >/dev/null

echo "==> Health check"
ok=0
code=000
for _ in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ || true)"
  if [ "$code" -ge 200 ] && [ "$code" -lt 400 ]; then ok=1; break; fi
  sleep 1
done
if [ "$ok" -ne 1 ]; then
  echo "Health check failed (last status $code); rolling back"
  if [ -n "$PREV" ] && [ -d "$PREV" ]; then
    ln -sfn "$PREV" "$APP/current.tmp"
    mv -Tf "$APP/current.tmp" "$APP/current"
    pm2 startOrReload ecosystem.config.cjs --update-env
  fi
  exit 1
fi

echo "==> Pruning old releases"
ls -1dt "$APP"/releases/* | tail -n +$((KEEP + 1)) | xargs -r rm -rf
trap - EXIT
echo "Deployed $SHA OK"
