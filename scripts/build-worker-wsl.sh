#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="/mnt/c/Users/Chapman/Desktop/ai/chapai"
TARGET_DIR="${HOME}/chapai-deploy"
NODE_BIN="${NODE_BIN:-/home/chapman/.nvm/versions/node/v22.22.1/bin/node}"
NPM_BIN="${NPM_BIN:-/home/chapman/.nvm/versions/node/v22.22.1/bin/npm}"

echo "[chapai] syncing repo into ${TARGET_DIR}"
mkdir -p "${TARGET_DIR}"
rsync -a --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .open-next \
  --exclude .turbo \
  --exclude .local-state \
  "${SOURCE_DIR}/" "${TARGET_DIR}/"

cd "${TARGET_DIR}"

echo "[chapai] using node: ${NODE_BIN}"
echo "[chapai] using npm: ${NPM_BIN}"
"${NODE_BIN}" -v
"${NPM_BIN}" -v

echo "[chapai] installing linux dependencies"
"${NPM_BIN}" install --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

echo "[chapai] building cloudflare worker bundle"
"${NPM_BIN}" run build:worker --workspace=@chapai/web
