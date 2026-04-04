# ChapAI Agent Brains

These files are the canonical, portable memory layer for long-running agents.

- Source of truth: repo files in this tree
- Optional index/projection: D1 or KV
- Compatible runtimes: Codex, Claude, Nemoclaw, future batch workers

Each agent keeps:
- `profile.json`
- durable memory
- active context
- append-only memory events

Only durable facts and reusable skills belong here.
