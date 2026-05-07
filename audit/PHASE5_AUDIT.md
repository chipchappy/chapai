# Phase 5 Telegram Control Audit

Generated: 2026-05-07

## Current State

- One-way watchdog alerts already existed through `scripts/ops/chapai-watchdog.mjs`.
- Dashboard overrides already existed through `/api/ops/override`, but Telegram had no inbound parser or durable command ledger.
- `/ops` reported the Telegram ledger gap before this pass.

## Implemented Slice

- Added `scripts/ops/telegram-control.mjs` for reproducible offline command ingestion.
- Added `POST /api/telegram/webhook` with chat allowlist and optional Telegram secret-token validation.
- Added `apps/web/src/lib/telegram-control.ts` for parsing, event persistence, and `/ops` summary reads.
- Added normalized Telegram event streams under `connectors/telegram/`.
- Wired `/ops` to show Telegram command count, queued replies, pending approval intents, and confirmation-required controls.

## Guardrails

- No Telegram API sends are performed by this bridge.
- Outbound responses are recorded as `queued_only`.
- Raw Telegram chat IDs and user IDs are hashed before persistence.
- `/kill` is recorded as `confirmation_required`; it is not executed by the Telegram bridge.
- `/reply` is recorded as approval-required intent, not as an outbound message.

## Proof

Command:

```bash
node scripts/ops/telegram-control.mjs --input=audit/proofs/phase5-telegram-commands.jsonl --run-id=phase5-audit-2026-05-07 --reset --proof=audit/proofs/phase5-telegram-run.json
```

Result:

- Input records: 5
- Events written: 18
- Commands accepted: 5
- Queued replies: 5
- Control intents: 3
- Pending approval: 1
- Confirmation required: 1
- Validation failures: 0

Proof artifact: `audit/proofs/phase5-telegram-run.json`.
