# Autonomous Learning Playbook

## Source signal
- Reference video analyzed: `LLMs Explained Visually` by Jordan McKinney (`x1ZDxlgBGfo`)

## Useful takeaways
- LLMs do not learn by themselves during inference.
- The biggest autonomy gains come from the harness around the model.
- The harness should define:
  - who the model is
  - what tools it can use
  - what external memory exists
  - what subset of context is worth loading now
- External memory is more useful than oversized prompts.
- Tool descriptions should be explicit and small.
- Context should be budgeted aggressively.
- Agents should stay bounded to roles and repeatable workflows.

## How ChapAI applies this
- `brains/agents/*.json` store portable, file-backed memory for each employee.
- `brains/org/charter.json` stores durable organization rules shared across runtimes.
- `config/claude-employee-queue.json` gives Claude bounded tasks instead of open-ended autonomy.
- `scripts/run-claude-employee.ps1` preserves pending tasks when Claude is blocked by auth or usage limits.
- `scripts/guild-ops-loop.ps1` keeps the cheap worker loop alive and avoids wasting calls while Claude is rate-limited.
- `packages/content/staging` and `packages/content/questions` keep staged, promoted, and live content separate.

## Operating rules
1. Keep each employee on one role at a time.
2. Load only the minimum relevant files for each bounded task.
3. Promote durable memory only when it clearly improves the next cycle.
4. Use cheap local generation for volume and sampled QA for trust.
5. Use Claude for high-signal review, growth, and premium-surface critique, not bulk drafting.
6. Treat dashboard truthfulness as a product requirement: stale or inferred state must never pretend to be live.

## Current practical implication
- Claude is authenticated and part of the guild, but usage-limited until the reset window.
- Nemoclaw remains the cheapest active volume lane.
- Codex remains the main execution/orchestration lane.
- The most leverage now comes from:
  - better dashboard truth
  - better conversion/UI polish
  - faster low-cost content promotion
  - simple, trackable launch experiments
