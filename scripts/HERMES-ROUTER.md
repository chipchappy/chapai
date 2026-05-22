# Hermes Router — inter-agent message bus

Hermes is the **messenger** between the two model lanes that hold your subscription
auth. It runs **no model of its own** — it relays each queued task to the lane that
can actually execute it:

| Route | Lane | Model access |
|-------|------|--------------|
| `claude` | `config/claude-employee-queue.json` (run by `run-claude-employee.ps1`) | Claude Code — subscription OAuth (`~/.claude/.credentials.json`) |
| `codex`  | `config/<agent>-queue.json` (run by `run-core-codex-lane.ps1`) | Codex CLI — ChatGPT session (`~/.codex/`) |

This is what lets every agent "communicate together": drop a message on the Hermes
queue addressed to a lane, and Hermes delivers it.

## Status: WIRED, HALTED

- Logic: `scripts/ops/hermes-router.mjs`
- Launcher: `scripts/run-hermes-router.ps1` (registered in `chapai-agent-supervisor.mjs`)
- Queue: `config/hermes-queue.json` · State: `config/hermes-state.json`
- Registry: `config/employee-registry.json` (id `hermes`) · Brain: `brains/agents/hermes.json`

The launcher is **gated by the gaming-mode sentinel**
(`%LOCALAPPDATA%\ChappiAi\gaming-mode.enabled`). While that file exists the whole
swarm — Hermes included — stays paused. Verified: invoking the launcher with the
sentinel present is a no-op.

## How to send a message

Append a task to `config/hermes-queue.json` → `tasks[]` with `status: "pending"`:

```json
{
  "id": "route-001",
  "title": "Audit pricing copy",
  "prompt": "Review PricingCards.tsx for clarity; return a short list. Don't edit files.",
  "kind": "ui-design-readonly-audit",
  "route": "claude",
  "from": "founder",
  "readOnly": true,
  "status": "pending"
}
```

- `route`: `"claude"` or `"codex"`. If omitted, Hermes infers: design/review/audit/
  copy/rationale → claude; everything else → codex.
- `codexAgent` (optional, codex only): `orchestrator` | `frontend` | `backend` |
  `content` | `manager` (default `orchestrator`).
- On delivery Hermes marks the task `routed`, records `routedTo` and `targetTaskId`,
  and bumps counters in `hermes-state.json`.

## Resume / pause the swarm

- **Resume** (activate Hermes + all lanes): delete the sentinel file, and re-enable
  the scheduled tasks (`schtasks /Change /TN "ChapAI Guild Stack" /ENABLE` etc., as
  admin). Hermes then routes on each supervisor cycle.
- **Pause** (keep the site stable): keep the sentinel in place, or run
  `scripts/halt-guild-automation.ps1` as admin.

## Guardrails

Hermes only moves queue entries — it never edits application or site files. External
posting, account actions, paid API calls, and production deploys remain on the
approval list (`config/agent-capability-audit.json`).
