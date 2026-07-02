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
TOKEN=$(tr -d '[:space:]' < "$HOME/Downloads/cftoken.txt")
export CLOUDFLARE_API_TOKEN="$TOKEN" CLOUDFLARE_ACCOUNT_ID="b3a67b6d3b128b1fd003cdfdd41e8cae"
DEPLOY_OUT=$(cd apps/web && npx wrangler deploy --config wrangler.jsonc 2>&1) || { echo "$DEPLOY_OUT"; exit 1; }
echo "$DEPLOY_OUT" | tail -8
VID=$(echo "$DEPLOY_OUT" | grep -oE 'Current Version ID: [a-f0-9-]+' | awk '{print $4}')
echo "Deployed version: ${VID:-unknown}"

echo "── Gate 3: post-deploy smoke (auto-rollback on fail) ──"
sleep 8
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
