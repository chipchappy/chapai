# Phase 4 Data Layer Audit

Generated: 2026-05-07

## Current State Before This Pass

- Phase 3 remains intact: canonical brain guard passes, 15/15 registered vaults exist, and Qdrant projection dry-run sees 16 collections.
- `mission-control.ts` has a large pre-existing dirty diff, so this pass avoided it.
- No repo-level `CONNECTORS.md` existed.
- No first-party `connectors/` namespace or normalized connector event stream existed.
- Existing JSONL ledgers were separate operational files, not one ChapAi data-layer contract.
- `/ops` did not consume a normalized connector stream.

## Work Applied

- Added `CONNECTORS.md` with the source contract, ToS boundaries, taint policy, and credential-gated connector limits.
- Added `scripts/connectors/chapai-data-layer.mjs`.
- Emitted normalized JSONL events to:
  - `connectors/local-fs/file_indexed.jsonl`
  - `connectors/hetzner-vps/metric_sample.jsonl`
- Added `apps/web/src/lib/unified-events.ts` as the dashboard-side stream reader.
- Wired `/ops` to show the ChapAi data layer panel with event count, source count, schema health, taint class, and recent events.

## Proof

Commands:

```bash
node scripts/connectors/chapai-data-layer.mjs --source=all --max-files=40 --run-id=phase4-audit-2026-05-07
node scripts/connectors/chapai-data-layer.mjs --validate
npm run type-check --workspace=@chapai/web
npm run build --workspace=@chapai/web
npm run build:worker --workspace=@chapai/web
```

Observed:

- Connector run produced 41 events.
- Validation found 2 JSONL files, 41 valid events, 0 failures.
- `/ops` authenticated render contains `ChapAi data layer`, `local-fs`, `hetzner-vps`, and `normalized connector stream`.
- Type-check, Next build, and OpenNext worker build passed.

## Remaining Gaps

- Google Drive, Reddit, Telegram bidirectional message ledger, and production Hetzner metrics are still credential-gated or runtime-host-gated.
- The current `hetzner-vps` event is a local validation sample until run on Hetzner with `HETZNER_SERVER_ID`.
- `/ops` now consumes the normalized stream, but Mission Control remains flat/legacy because its file was intentionally left untouched.
