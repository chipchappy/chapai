# ChapAI Ops Runbook

This runbook covers the Phase 2 deployment path for the ChapAI control plane on the Hetzner VPS.

## Required Host Layout

- Repo: `/opt/chapai`
- Service user: `chapai`
- Shared environment: `/etc/chapai/chapai.env`
- Per-agent command files: `/etc/chapai/agents/<agent_id>.env`
- Local backups: `/opt/chapai/backups/ops`

Every `/etc/chapai/agents/<agent_id>.env` must define `CHAPAI_AGENT_COMMAND`. The `chapai-agent@.service` unit starts that command and runs a heartbeat sidecar for the same agent id.

## Required Secrets

Keep these in Infisical and materialize them to `/etc/chapai/chapai.env` on the VPS. Do not commit them.

- `CHAPAI_HEARTBEAT_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALERT_CHAT_ID`
- `REDIS_URL`
- `POSTGRES_PASSWORD`
- `GRAFANA_ADMIN_PASSWORD`
- `LANGFUSE_OTEL_ENDPOINT`
- `LANGFUSE_OTEL_AUTH`
- `HETZNER_STORAGE_BOX_TARGET`

## Deploy Phase 2 Services

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin chapai
sudo mkdir -p /opt/chapai /etc/chapai/agents
sudo chown -R chapai:chapai /opt/chapai
cd /opt/chapai
npm ci
npm run build --workspace=@chapai/web
docker compose -f infra/hetzner/docker-compose.phase2.yml --env-file /etc/chapai/chapai.env up -d
sudo cp infra/systemd/chapai-*.service infra/systemd/chapai-*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now chapai-dashboard.service chapai-watchdog.service chapai-backup.timer chapai-periodic-agents.timer
```

Start specific agents after their `/etc/chapai/agents/<agent_id>.env` file is present:

```bash
sudo systemctl enable --now chapai-agent@orchestrator.service
sudo systemctl enable --now chapai-agent@content.service
sudo systemctl enable --now chapai-agent@growth-orchestrator.service
```

Start queue consumers by lane:

```bash
sudo systemctl enable --now 'chapai-queue@Architecture.service'
sudo systemctl enable --now 'chapai-queue@Question System.service'
```

## Heartbeat Contract

Agents POST to `/heartbeats` every 30 seconds:

```json
{
  "agentId": "content",
  "state": "running",
  "current": "Reviewing NCLEX batch",
  "latest": "Promoted latest valid batch",
  "blocker": "none",
  "source": "systemd-agent",
  "staleAfterSeconds": 90
}
```

Production requires `Authorization: Bearer $CHAPAI_HEARTBEAT_TOKEN`. The watchdog restarts a supervised agent after 3 missed 30-second intervals and writes Telegram alerts to `config/telegram-alert-outbox.jsonl`; if Telegram credentials are configured it also sends the alert directly.

## Manual Overrides

`/ops` writes commands into `config/ops-overrides.json` and `config/ops-overrides.jsonl`.

The watchdog consumes queued commands:

- `pause-lane`: records the pause in `config/watchdog-state.json`
- `kill-agent`: runs `systemctl stop chapai-agent@<agent>.service`
- `force-rebaseline`: runs `CHAPAI_REBASELINE_COMMAND` or `python3 scripts/export_guild_snapshot.py`
- `drain-queue`: writes `config/queue-drain-requests.jsonl`
- `rollback-memory`: writes `config/memory-steward-queue.jsonl`

## Backups

Nightly backup runs at 03:30 server time. It archives:

- `config`
- `brains`
- `audit`
- `packages/db/drizzle`
- live NCLEX and CCRN banks

If `DATABASE_URL` is set and `pg_dump` is installed, the backup includes `postgres/chapai-memory.sql`. If `HETZNER_STORAGE_BOX_TARGET` is set, it uploads the archive with `rsync`. Local retention is 14 days.

## Verification Commands

```bash
node scripts/ops/chapai-watchdog.mjs --dry-run
node scripts/ops/chapai-queue.mjs --dry-run
node scripts/ops/chapai-backup.mjs --dry-run
curl -fsS -H "Authorization: Bearer $CHAPAI_HEARTBEAT_TOKEN" http://127.0.0.1:3000/heartbeats
systemctl status chapai-watchdog.service
systemctl list-timers 'chapai-*'
```

## Known Non-Production Gaps

- True passkey auth is still open; `/ops` uses existing operator access gating.
- Realtime websocket push is still open; `/ops` currently refreshes every 30 seconds.
- Redis queue is implemented as a dependency-free Redis Stream adapter through `redis-cli`, not BullMQ. It is operational and can be swapped for BullMQ once package-lock churn is acceptable.

## Phase 3 Brains

Initialize and audit per-agent vaults:

```bash
node scripts/ops/initialize-agent-vaults.mjs
node scripts/ops/audit-stage3-state.mjs
node scripts/ops/guard-canonical-brain-writes.mjs
```

Review staged memory candidates and promote only through Memory-Steward:

```bash
node scripts/ops/memory-steward.mjs --dry-run
node scripts/ops/memory-steward.mjs
```

Mirror vault markdown into Qdrant as a rebuildable projection:

```bash
node scripts/ops/sync-qdrant-brains.mjs --dry-run
QDRANT_URL=http://127.0.0.1:6333 node scripts/ops/sync-qdrant-brains.mjs
```

Canonical files remain under `brains/<agent_id>/`; Qdrant collections are projections and can be deleted/rebuilt.
