#!/usr/bin/env bash
# rollback-stable.sh — 30-second recovery to the last verified-good deploy.
# Usage: bash scripts/rollback-stable.sh [version-id]
#   no arg  → rolls back to scripts/.last-good-version (or the sacred baseline)
set -euo pipefail
cd "$(dirname "$0")/.."
TARGET="${1:-$(cat scripts/.last-good-version 2>/dev/null || echo 8bd91ba1-ea58-464b-ab69-1390ff40b0fb)}"
TOKEN=$(tr -d '[:space:]' < "$HOME/Downloads/cftoken.txt")
export CLOUDFLARE_API_TOKEN="$TOKEN" CLOUDFLARE_ACCOUNT_ID="b3a67b6d3b128b1fd003cdfdd41e8cae"
( cd apps/web && npx wrangler rollback "$TARGET" --name chapai-web -y )
echo "Rolled back to $TARGET. Verify: bash -c 'cd tests && npx playwright test smoke --reporter=line'"
