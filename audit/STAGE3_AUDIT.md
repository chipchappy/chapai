# Stage 3 Brain Audit

Generated: 2026-05-07

## Current State Before Stage 3 Work

- 15 registered employees exist in `config/employee-registry.json`.
- 15 matching flat JSON brains exist in `brains/agents/*.json`.
- The current flat brain schema is valid and mission-control loadable, but it mixes identity, active context, durable memory, skills, and events in one file per agent.
- Memory-Steward existed only as rollback queue intent; there was no canonical memory promotion worker.
- Qdrant existed only as Phase 2 infrastructure in `infra/hetzner/docker-compose.phase2.yml`; there was no vector projection script or collection contract.
- `/ops` showed memory and skills, but not per-agent vault or index readiness.

## Stage 3 Work Applied

- Created per-agent Obsidian-style vaults under `brains/<agent_id>/`.
- Created a `brains/memory-steward/` vault and `brains/_steward/` control directories.
- Added canonical seed fact and seed skill entries for every registered agent.
- Added lifecycle/provenance types to `@chapai/brains`.
- Added `scripts/ops/memory-steward.mjs` as the canonical promotion gate.
- Added `scripts/ops/sync-qdrant-brains.mjs` to mirror vault markdown into one Qdrant collection per agent.
- Added `scripts/ops/audit-stage3-state.mjs` for repeatable vault acceptance checks.
- Extended `/ops` memory panel with vault, canonical, staging, rejected, and index status.

## Proof Commands

```bash
node scripts/ops/initialize-agent-vaults.mjs
node scripts/ops/audit-stage3-state.mjs
node scripts/ops/memory-steward.mjs --dry-run
node scripts/ops/sync-qdrant-brains.mjs --dry-run
```

Observed proof:

- `registryAgents`: 15
- `vaultsPresent`: 15
- `agentsWithCanonicalEntry`: 15
- Qdrant dry-run: 16 collections, 96 projected points, including Memory-Steward.
- Memory-Steward dry-run: 0 staged candidates, 0 rejected, 0 quarantined.

## Remaining Gaps

- Mission-control still loads flat JSON as the primary compatibility source; vault-first loading is not complete.
- Qdrant was dry-run verified locally. Live indexing requires Qdrant running at `QDRANT_URL` on Hetzner.
- CI does not yet enforce that only Memory-Steward writes canonical vault entries.
- Cross-lane quarantine is implemented in the steward script, but no live agent has submitted staged candidates through it yet.

## Follow-up Hardening Applied

- Added `scripts/ops/guard-canonical-brain-writes.mjs` and wired it into deploy CI so canonical fact/skill entries must carry required provenance and a Memory-Steward writer marker.
- Added shared vault markdown parsing and summarization helpers in `@chapai/brains` so runtimes can consume Obsidian vault documents through a structured API instead of ad hoc markdown parsing.
- Ran a real Memory-Steward promotion from `audit/proofs/stage3-memory-steward-candidate.jsonl` into `brains/orchestrator/facts/candidate-stage3-vault-audit-before-production-claim.md`.
- Recorded the canonical promotion ledger in `brains/_steward/canonical-ledger/2026-05-07.jsonl`.

Follow-up proof:

- Canonical guard: 33 canonical files checked, 0 failures.
- Stage 3 audit: 15/15 registered vaults present, 15/15 with canonical entries, 1 canonical ledger file, 0 rejected, 0 quarantined.
- Qdrant dry-run: 16 collections, 97 projected points after the steward promotion.
