# Phase 1 Dashboard Audit

Generated: 2026-05-06

## Scope

Audited the `/ops` dashboard added in commit `6be1bf0` against the Phase 1 requirements from `/goal -- CHAPAI SWARM: AUDIT, REPAIR, IDENTIFY, UNIFY`.

Files inspected:

- `apps/web/src/app/ops/page.tsx`
- `apps/web/src/app/api/ops/override/route.ts`
- `apps/web/src/components/dashboard/OpsDashboard.tsx`
- `apps/web/src/components/dashboard/OpsOverridePanel.tsx`
- `apps/web/src/lib/ops-control.ts`
- `apps/web/src/lib/ops-dashboard.ts`

## Findings

| Requirement | Status | Evidence |
| --- | --- | --- |
| Single `/ops` page | PASS | Route exists at `apps/web/src/app/ops/page.tsx` and renders one operator dashboard surface. |
| Operator-only auth | PARTIAL | Uses `getDashboardAccessContext()` and redirects non-operators to `/guild-access?next=%2Fops`. True WebAuthn/passkey credential storage is not present in the repo. |
| Palantir/Linear dark dense UI | PASS | Dashboard uses dark base, warm amber accent, compact cards, tables, and data-first panels. No purple gradients, glassmorphism, or decorative emoji were found in the Phase 1 files. |
| Required panels present | PASS | Agent roster, goals, lanes, memory/skills, Telegram, NCLEX, growth, intel, token economics, and manual overrides are rendered. |
| Real data only | PASS WITH GAPS EXPOSED | Panels read mission-control, guild, content, approval, Telegram health, and override files. Missing analytics/token meters are surfaced as missing rather than invented. |
| Websocket push | GAP | Pusher/soketi is not provisioned. The route uses `MissionControlAutoRefresh` with the existing 30-second refresh loop. |
| Next.js 15 | PASS | `apps/web/package.json` uses `next` `^15.0.0`. |
| tRPC | GAP | No tRPC package or router exists in the repo. Phase 1 uses App Router route handlers instead. |
| Tailwind | PASS | Components use the existing Tailwind stack. |
| shadcn/ui | GAP | `class-variance-authority`, `clsx`, and Tailwind utilities exist, but no local shadcn component registry was found in the dashboard implementation. |
| Manual overrides | PASS | Commands are persisted to `config/ops-overrides.json` and `config/ops-overrides.jsonl`; the API now supports read and write. |

## Improvements Applied After Audit

- Added `GET /api/ops/override` so the watchdog and operator tools can read the durable command bus.
- Expanded override records from queued-only to a status lifecycle: `queued`, `acknowledged`, `completed`, `failed`.
- Added `/heartbeats` for runtime heartbeat ingestion with `CHAPAI_HEARTBEAT_TOKEN` required in production.
- Added `ops-heartbeats.ts` so the dashboard and watchdog read the same heartbeat supervision rules.
- Added a Phase 2 supervision panel to `/ops` showing heartbeat restart-due counts and deploy artifact presence.
- Refreshed the dashboard after override submission so the recent ledger updates without waiting for the 30-second page refresh.

## Remaining Phase 1 Gaps

- Passkey auth is not implemented. The codebase needs WebAuthn credential enrollment and assertion storage before this requirement is complete.
- Websocket transport is not implemented. Current behavior is 30-second server refresh until Pusher or self-hosted soketi is provisioned.
- tRPC and shadcn/ui are not installed as first-class stack pieces. The existing implementation is strict App Router plus Tailwind.

## Verification

Verification was rerun after the improvement patch:

- `npm run type-check --workspace=@chapai/web`
- `npm run build --workspace=@chapai/web`
- `npm run build:worker --workspace=@chapai/web`
- `node scripts/ops/chapai-watchdog.mjs --dry-run`
- `node scripts/ops/chapai-queue.mjs --dry-run`
- `node scripts/ops/chapai-backup.mjs --dry-run`
- `GET http://127.0.0.1:3107/heartbeats`

Browser verification against a restarted dev server at `http://127.0.0.1:3107/ops` confirmed:

- all required dashboard headings present once
- `Phase 2 supervision` visible
- `13` rendered sections
- computed dashboard background `rgb(11, 14, 20)`
- computed dashboard foreground `rgb(244, 238, 229)`
- no browser console errors
