#!/usr/bin/env bash
# deploy-stable.sh — THE ONLY sanctioned path to production.
# Refuses to ship unless every gate passes; auto-rolls-back if post-deploy
# smoke fails. Run from anywhere: bash scripts/deploy-stable.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "── Gate 0: branch + tree ──────────────────────────────"
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "stable" ]; then
  echo "REFUSED: deploys ship only from 'stable' (you are on '$BRANCH')."; exit 1
fi
if git status --porcelain apps/web | grep -qv '^??'; then
  echo "REFUSED: uncommitted changes under apps/web — commit first (one change, one commit)."; exit 1
fi

echo "── Gate 1: typecheck ──────────────────────────────────"
( cd apps/web && npx tsc --noEmit -p tsconfig.typecheck.json )

echo "── Gate 2: fresh build ────────────────────────────────"
( cd apps/web && npm run build:worker )

echo "── Deploy ─────────────────────────────────────────────"
SMOKE_KEY_JSON=$(cd apps/web && env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_ACCOUNT_ID npx wrangler d1 execute chapai-prod --remote --json --command "SELECT code FROM access_keys WHERE status='active' AND type IN ('instructor-pass','demo-pass') AND (expires_at IS NULL OR expires_at > unixepoch()) AND redeem_count < max_redeems ORDER BY CASE type WHEN 'instructor-pass' THEN 0 ELSE 1 END, created_at DESC LIMIT 1") || {
  echo "REFUSED: could not query D1 for an active smoke-test key."; exit 1
}
export CLARITY_SMOKE_ACCESS_KEY=$(printf '%s' "$SMOKE_KEY_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const x=JSON.parse(s);process.stdout.write(x?.[0]?.results?.[0]?.code??"")})')
if [ -z "$CLARITY_SMOKE_ACCESS_KEY" ]; then
  echo "REFUSED: no active D1 demo/instructor key is available for smoke tests."; exit 1
fi
TOKEN=$(tr -d '[:space:]' < "$HOME/Downloads/cftoken.txt")
export CLOUDFLARE_API_TOKEN="$TOKEN" CLOUDFLARE_ACCOUNT_ID="b3a67b6d3b128b1fd003cdfdd41e8cae"
DEPLOY_OUT=$(cd apps/web && npx wrangler deploy --config wrangler.jsonc 2>&1) || { echo "$DEPLOY_OUT"; exit 1; }
echo "$DEPLOY_OUT" | tail -8
VID=$(echo "$DEPLOY_OUT" | grep -oE 'Current Version ID: [a-f0-9-]+' | awk '{print $4}')
echo "Deployed version: ${VID:-unknown}"

echo "── Gate 3: post-deploy smoke (auto-rollback on fail) ──"
# New _next/static/chunks need time to propagate to Cloudflare's edge before the
# smoke browser loads them — an under-8s settle caused recurring transient
# ChunkLoadError/404 flakes (gates 26/28/30). Settle, then warm the key routes to
# prime the edge cache so the very first smoke navigation hits populated PoPs.
sleep 25
for path in "/" "/quiz" "/pricing" "/nclex" "/auth/signup" "/auth/login"; do
  curl -s -o /dev/null "https://claritynclex.com${path}?warm=$(date +%s)" || true
  curl -s "https://claritynclex.com${path}" 2>/dev/null | grep -oE '/_next/static/chunks/[a-zA-Z0-9/_.-]+\.js' | head -6 | while read -r chunk; do
    curl -s -o /dev/null "https://claritynclex.com${chunk}" || true
  done
done
sleep 5
if ( cd tests && npx playwright test smoke --reporter=line ); then
  echo "${VID}" > scripts/.last-good-version
  git rev-parse HEAD > scripts/.last-good-commit
  echo "✅ DEPLOY VERIFIED — ${VID} recorded as last-good."
else
  LAST=$(cat scripts/.last-good-version 2>/dev/null || echo "8bd91ba1-ea58-464b-ab69-1390ff40b0fb")
  echo "❌ SMOKE FAILED — rolling back to ${LAST}"
  ( cd apps/web && npx wrangler rollback "$LAST" --name chapai-web -y )
  echo "Rolled back. Investigate before retrying."; exit 1
fi
