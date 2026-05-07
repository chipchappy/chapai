# ChapAI Agent Brains

These files are the canonical, portable memory layer for long-running agents.

- Source of truth: repo files in this tree
- Optional index/projection: D1 or KV
- Compatible runtimes: Codex, Claude, Nemoclaw, future batch workers

Each Phase 3 agent vault keeps:
- `identity.md`
- `short_term_context.md`
- `working_scratchpad.md`
- `facts/`
- `skills/`
- `episodes/`
- `relationships/`
- `open_questions.md`
- `daily/YYYY-MM-DD.md`
- `.chapai-vault.json`

The legacy flat JSON files in `brains/agents/*.json` stay as compatibility exports while mission-control and older loaders migrate.

Only durable facts and reusable skills belong here.

## Confounding Controls

- Agents never write to another agent vault directly.
- Runtime output goes to `brains/_steward/staging/*.jsonl`.
- `scripts/ops/memory-steward.mjs` is the only canonical promotion path.
- Canonical entries require `source_agent`, `source_run_id`, `tool_used`, `confidence`, and `ingested_at`.
- Cross-lane imports are quarantined for 14 days unless the source is Memory-Steward.
- Qdrant is a rebuildable projection created by `scripts/ops/sync-qdrant-brains.mjs`; repo files remain canonical.
