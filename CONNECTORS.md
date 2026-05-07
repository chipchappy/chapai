# ChapAi Connectors

Generated: 2026-05-07

ChapAi connectors emit normalized JSONL events into `connectors/<source>/<event_type>.jsonl`. Agents should consume these event streams through the ChapAi namespace instead of reaching directly into raw sources.

## Event Contract

Required fields:

- `event_id`
- `schema_version`
- `source`
- `event_type`
- `emitted_at`
- `observed_at`
- `connector_run_id`
- `taint`
- `allowed_uses`
- `provenance`
- `payload`

External human text must remain tainted until a lane-specific validator approves it for policy decisions or execution. Current local connectors emit metadata only, not private file contents.

## Operational Connectors

### `local-fs`

Command:

```bash
node scripts/connectors/chapai-data-layer.mjs --source=local-fs --max-files=80
```

Emits tracked-file metadata to `connectors/local-fs/file_indexed.jsonl`: relative path, extension, byte count, modified time, and content hash. It excludes common secret, cookie, token, credential, env, build, and dependency paths.

### `hetzner-vps`

Command:

```bash
node scripts/connectors/chapai-data-layer.mjs --source=hetzner-vps
```

Emits host capacity metrics to `connectors/hetzner-vps/metric_sample.jsonl`. On the Windows workstation this is a local validation sample. On the Hetzner box, set `HETZNER_SERVER_ID` before running so events identify the source as the production VPS class without storing hostnames.

## Credential-Gated Connectors

These are intentionally not active until credentials are present in Infisical or the platform-approved credential path:

- Google Drive: official Google APIs, read-only first.
- Dropbox: official Dropbox API, read-only first.
- iCloud: user-export/sync-folder ingestion only unless an official approved API path is provided.
- Reddit: official Reddit API only.
- X: official API where quota permits; RSS/fallback readers only for public web content and only where ToS allows.
- Discord: bot in operator-owned servers only.
- Instagram/Facebook: Meta Graph API only; no scraping.
- Telegram: bot API for approved bidirectional operator control.

No connector should scrape private accounts, bypass platform protections, or send outbound human messages without the approval gate.

## Dashboard Consumption

`apps/web/src/lib/unified-events.ts` reads the normalized JSONL streams and `/ops` surfaces source counts, recent events, taint class, and schema health in the ChapAi data layer panel. This keeps the dashboard wired to the connector namespace without touching `mission-control.ts`.
