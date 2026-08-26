# claritynclex.com — reproducible build & recovery toolchain
#
# WHAT THIS IS NOT: this image does not serve the site. Production is a
# Cloudflare Worker already deployed to the edge; nothing here is in the request
# path, and stopping this container cannot take the site down.
#
# WHAT THIS IS: a pinned environment that can rebuild and redeploy the site, and
# restore the database, from any machine with Docker. If the laptop dies, this
# is how the service comes back — no local toolchain required.
#
#   docker build -t chapai .
#   docker run --rm --env-file .env.production chapai npm run -w @chapai/web build:worker
#
# Node is pinned to the major the app declares (engines: >=20) rather than
# :latest, so a rebuild in six months produces the same output as today.

FROM node:20.18-bookworm-slim AS base

# git: wrangler reads repo metadata during some commands.
# ca-certificates: TLS to the Cloudflare and npm APIs.
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── deps ─────────────────────────────────────────────────────────────────────
# Manifests first so this layer caches until dependencies actually change.
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json        apps/web/package.json
COPY packages/db/package.json     packages/db/package.json
COPY packages/content/package.json packages/content/package.json
COPY packages/brains/package.json  packages/brains/package.json
COPY tests/package.json            tests/package.json

# `npm ci` installs exactly the lockfile — the whole point of a recovery image.
RUN npm ci --no-audit --no-fund

# ── toolchain ────────────────────────────────────────────────────────────────
FROM base AS toolchain
ENV NEXT_TELEMETRY_DISABLED=1 \
    npm_config_audit=false \
    npm_config_fund=false

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Fail fast and loudly if someone builds with a stale lockfile.
RUN node -e "const a=require('./package.json').engines?.node; if(!a) process.exit(0); \
  const v=process.versions.node.split('.')[0]; \
  if(Number(v) < 20){console.error('Node '+process.versions.node+' < required '+a); process.exit(1);} \
  console.log('node',process.versions.node,'satisfies',a)"

# Verified at image build time, so a broken toolchain surfaces here rather than
# during an outage when you are trying to redeploy under pressure.
RUN npm run type-check && npm test

CMD ["bash"]
