# ChapAI Swarm Phase 0 Audit

Generated: 2026-05-06T23:02:46.003Z
Repository: C:/Users/Chapman/Desktop/ai/chapai
Mode: read-only audit. No repairs, dashboard edits, agent code edits, memory promotions, connector installs, or production state mutations were performed. Audit artifacts are the only intended writes.

## Executive Summary

Agents inventoried: 15
Dead agents in measured 30d window: none
Reproducible audit dry run: exit 0, proof audit/proofs/agent-audit-dry.run.json
NCLEX refinement unit smoke: exit 0, proof audit/proofs/nclex-refinement-unit.run.json
NCLEX seed to live 5-question smoke: exit 0, proof audit/proofs/nclex-pipeline-e2e-5-question.run.json

## Finding Classes

- BROKEN: explorer
- INEFFICIENT: orchestrator, frontend, backend, content, manager, nemoclaw, claude-code, social-studio, scout, explorer, gemini-audit, antigravity, outreach-email, growth-orchestrator, mobile-product
- MISCONFIGURED: orchestrator, frontend, backend, content, manager, nemoclaw, social-studio, scout, explorer, outreach-email, growth-orchestrator, mobile-product
- ORPHANED: explorer
- REDUNDANT: none
- MISSING: orchestrator, frontend, backend, content, manager, nemoclaw, claude-code, social-studio, scout, explorer, gemini-audit, antigravity, outreach-email, growth-orchestrator, mobile-product

## Systemic Findings

- MISSING: no measured source was found for per-agent p50 latency, p95 latency, success rate, or token spend. Current counts are inferred from state, queue timestamps, and memory provenance only.
- MISCONFIGURED: most entrypoints do not expose a non-mutating canned-input boot mode. Isolation smoke tests therefore use parser/bootstrap checks plus state inventory, not full worker execution, because lane scripts write queue/state/brain files by design.
- MISSING: rejected memory counts and skill last-used timestamps are not recorded in a queryable per-agent schema.
- MISSING: Memory-Steward is not represented as the sole canonical writer in the current inventory; canonical writes are stored in per-agent brain files without enforceable writer provenance.
- MISCONFIGURED: the local gaming-mode sentinel exists at C:/Users/Chapman/AppData/Local/ChappiAi/gaming-mode.enabled. In the first NCLEX curation smoke it caused live curation and rebuild scripts to return immediately; the reproducible proof reran against a clean temp LOCALAPPDATA and passed.
- INEFFICIENT: there is no single append-only invocation ledger tying run id, agent id, input hash, output hash, duration, tokens, exit code, and memory writes.

## Reproducible Smoke Proofs

| Proof | Exit | Input hash | Output hash | Notes |
| --- | ---: | --- | --- | --- |
| audit/proofs/agent-audit-dry.run.json | 0 | none | 6a48a56e834fb187be52dd47779d509eb540f77daedd1f1a2b95cbf4068043ce | npm run agent:audit:dry |
| audit/proofs/nclex-refinement-unit.run.json | 0 | none | 2d6cb1750e0bc5a12f2a9477747e8df020d892eea3bc37425bfb4e61e357becf | core second-pass unit fixture |
| audit/proofs/nclex-pipeline-e2e-5-question.run.json | 0 | 50451c6d2d0f720eed6e7e95bdd180cab78301151a84bc0699e4f06cf63e573f | d7aed0633ee54ad2a5d398ddbb4b2da229a4f092c57a662a1de74d36bc2d5966 | seed -> generate -> review -> curate -> live -> second-pass |
| inline in audit/proofs/nclex-pipeline-e2e-5-question.run.json | 0 | 50451c6d2d0f720eed6e7e95bdd180cab78301151a84bc0699e4f06cf63e573f | 50451c6d2d0f720eed6e7e95bdd180cab78301151a84bc0699e4f06cf63e573f | NCLEX hop: seed |
| audit/proofs/nclex-pipeline-generate-promote.run.json | 0 | none | 10a45ab5cba699fc0fb2e5a5944f71b78ade5874f380c2ce717424ac0c43d4a5 | NCLEX hop: generate-promote |
| audit/proofs/nclex-pipeline-review.run.json | 0 | none | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 | NCLEX hop: review |
| audit/proofs/nclex-pipeline-curate-live.run.json | 0 | none | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 | NCLEX hop: curate-live |
| audit/proofs/nclex-pipeline-second-pass.run.json | 0 | none | 9d756c4da6d9b51579ad2cfab325f9e4ccee2727cd205ed7d852757ba54ce3db | NCLEX hop: second-pass |

NCLEX smoke result:

- Seeded questions: 5
- Review decision: eligible_for_curated_promotion
- Strict promotion ready: 5
- Curated live count: 5
- Second-pass approved unique: 5

## Agent Inventory

Entrypoint parser proofs are stored as audit/proofs/agent-<agent_id>-entrypoint-parse.run.json. Explorer exits 2 there because no runnable entrypoint is mapped.

| Agent | Lane | Model | Trigger | Entrypoint | 30d invocations | Success | p50 | p95 | Token spend | Memory c/s/r | Skills | Classes | Proof |
| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | ---: | --- | --- |
| orchestrator | Architecture | codex | guild-ops-loop core lane or active duty roster | scripts/run-core-codex-lane.ps1 | 3 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 3/0/NO_MEASURED_SOURCE | 6 | INEFFICIENT, MISCONFIGURED, MISSING | audit/proofs/orchestrator.run.json |
| frontend | Product Build | codex | guild-ops-loop core lane or active duty roster | scripts/run-core-codex-lane.ps1 | 2 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 4/0/NO_MEASURED_SOURCE | 8 | INEFFICIENT, MISCONFIGURED, MISSING | audit/proofs/frontend.run.json |
| backend | Backend | codex | guild-ops-loop core lane or active duty roster | scripts/run-core-codex-lane.ps1 | 2 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 4/0/NO_MEASURED_SOURCE | 6 | INEFFICIENT, MISCONFIGURED, MISSING | audit/proofs/backend.run.json |
| content | Question System | codex | guild-ops-loop content review and live curation lane | scripts/run-content-review.ps1 + scripts/run-reviewed-live-curation.ps1 + scripts/run-core-codex-lane.ps1 -EmployeeId content | 20 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 21/0/NO_MEASURED_SOURCE | 6 | INEFFICIENT, MISCONFIGURED, MISSING | audit/proofs/content.run.json |
| manager | Manager | codex | guild-ops-loop manager sweep | scripts/run-manager-lane.ps1 | 4 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 8/0/NO_MEASURED_SOURCE | 6 | INEFFICIENT, MISCONFIGURED, MISSING | audit/proofs/manager.run.json |
| nemoclaw | Local Batch Worker | nemotron | guild-ops-loop batch-status/worker-cycle route | ../ccrn-agent/remote-control/scripts/exec_route.py worker-cycle | 5 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 6/0/NO_MEASURED_SOURCE | 9 | INEFFICIENT, MISCONFIGURED, MISSING | audit/proofs/nemoclaw.run.json |
| claude-code | Design Review | claude | guild-ops-loop Claude queue eligibility | scripts/run-claude-employee.ps1 | 30 | 0.429 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 19/0/NO_MEASURED_SOURCE | 18 | INEFFICIENT, MISSING | audit/proofs/claude-code.run.json |
| social-studio | Growth Studio | codex | guild-ops-loop social lane eligibility | scripts/run-social-studio.ps1 + scripts/run-social-dispatch.ps1 | 3 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 3/0/NO_MEASURED_SOURCE | 6 | INEFFICIENT, MISCONFIGURED, MISSING | audit/proofs/social-studio.run.json |
| scout | Venture Scout | codex | guild-ops-loop scout eligibility or active duty roster | scripts/run-scout-lane.ps1 | 3 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 3/12/NO_MEASURED_SOURCE | 6 | INEFFICIENT, MISCONFIGURED, MISSING | audit/proofs/scout.run.json |
| explorer | Market Explorer | codex | registered brain/state only; no runner found in guild-ops-loop |  | 3 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 3/0/NO_MEASURED_SOURCE | 6 | BROKEN, INEFFICIENT, MISCONFIGURED, MISSING, ORPHANED | audit/proofs/explorer.run.json |
| gemini-audit | External Audit Advisor | gemini | guild-ops-loop Gemini audit eligibility | scripts/run-gemini-audit-lane.ps1 | 9 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 5/0/NO_MEASURED_SOURCE | 7 | INEFFICIENT, MISSING | audit/proofs/gemini-audit.run.json |
| antigravity | Gemini Sub-Swarm | gemini | guild-ops-loop Antigravity eligibility | scripts/run-antigravity-lane.ps1 | 9 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 5/0/NO_MEASURED_SOURCE | 12 | INEFFICIENT, MISSING | audit/proofs/antigravity.run.json |
| outreach-email | Email Growth | codex | guild-ops-loop email lane eligibility | scripts/run-outreach-email-lane.ps1 + scripts/run-email-dispatch.ps1 | 3 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 3/0/NO_MEASURED_SOURCE | 6 | INEFFICIENT, MISCONFIGURED, MISSING | audit/proofs/outreach-email.run.json |
| growth-orchestrator | Growth Control | codex | guild-ops-loop growth orchestration eligibility | scripts/run-growth-orchestrator.ps1 | 3 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 3/0/NO_MEASURED_SOURCE | 6 | INEFFICIENT, MISCONFIGURED, MISSING | audit/proofs/growth-orchestrator.run.json |
| mobile-product | Mobile Product | codex | guild-ops-loop mobile product eligibility | scripts/run-mobile-product-lane.ps1 | 3 | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | NO_MEASURED_SOURCE | 3/0/NO_MEASURED_SOURCE | 8 | INEFFICIENT, MISCONFIGURED, MISSING | audit/proofs/mobile-product.run.json |

## Per-Agent Detail

### orchestrator - Atlas

- Lane: Architecture
- Model: codex
- Trigger: guild-ops-loop core lane or active duty roster
- Entrypoint: scripts/run-core-codex-lane.ps1 (exists: true, dry-run supported: false)
- Last 30d invocations: 3 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 3, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 6; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, harness architecture, handoff design, restart-safe continuity
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls none
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISCONFIGURED, MISSING
- Proof: audit/proofs/orchestrator.run.json
- Failure modes observed in logs/state:
  - state.blocker: No runtime heartbeat yet; initialized as an empty state template.
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/logout 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /auth/callback 399 B 180 kB

### frontend - Turing

- Lane: Product Build
- Model: codex
- Trigger: guild-ops-loop core lane or active duty roster
- Entrypoint: scripts/run-core-codex-lane.ps1 (exists: true, dry-run supported: false)
- Last 30d invocations: 2 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 4, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 8; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, premium ui refinement, hero simplification, conversion surface polish, opportunity scouting, validation memo writing
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls none
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISCONFIGURED, MISSING
- Proof: audit/proofs/frontend.run.json
- Failure modes observed in logs/state:
  - state.blocker: No runtime heartbeat yet; initialized as an empty state template.
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/logout 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /auth/callback 399 B 180 kB

### backend - Kepler

- Lane: Backend
- Model: codex
- Trigger: guild-ops-loop core lane or active duty roster
- Entrypoint: scripts/run-core-codex-lane.ps1 (exists: true, dry-run supported: false)
- Last 30d invocations: 2 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 4, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 6; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, checkout verification, tutor fallback resilience, live route health
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls none
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISCONFIGURED, MISSING
- Proof: audit/proofs/backend.run.json
- Failure modes observed in logs/state:
  - state.blocker: No runtime heartbeat yet; initialized as an empty state template.
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/logout 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /auth/callback 399 B 180 kB

### content - Hume

- Lane: Question System
- Model: codex
- Trigger: guild-ops-loop content review and live curation lane
- Entrypoint: scripts/run-content-review.ps1 + scripts/run-reviewed-live-curation.ps1 + scripts/run-core-codex-lane.ps1 -EmployeeId content (exists: true, dry-run supported: false)
- Last 30d invocations: 20 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 21, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 6; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, batch validation, rationale refinement, diagram coverage
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls packages/content pipeline scripts, content review, live curation
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISCONFIGURED, MISSING
- Proof: audit/proofs/content.run.json
- Failure modes observed in logs/state:
  - state.blocker: No runtime heartbeat yet; initialized as an empty state template.
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/logout 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /auth/callback 399 B 180 kB

### manager - Kuhn

- Lane: Manager
- Model: codex
- Trigger: guild-ops-loop manager sweep
- Entrypoint: scripts/run-manager-lane.ps1 (exists: true, dry-run supported: false)
- Last 30d invocations: 4 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 8, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 6; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, lane triage, blocker compression, status compression
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls config/*-state.json, config/active-duty-roster.json
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISCONFIGURED, MISSING
- Proof: audit/proofs/manager.run.json
- Failure modes observed in logs/state:
  - state.blocker: No runtime heartbeat yet; initialized as an empty state template.
  - C:\Users\Chapman\Desktop\ai\chapai\config\manager-state.json: "blockedUntil": null,
  - C:\Users\Chapman\Desktop\ai\chapai\config\manager-state.json: "resumeFrom": "Start with laneAssignments, then inspect the top blocked or drifting lane.",
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/logout 399 B 180 kB

### nemoclaw - Nemoclaw

- Lane: Local Batch Worker
- Model: nemotron
- Trigger: guild-ops-loop batch-status/worker-cycle route
- Entrypoint: ../ccrn-agent/remote-control/scripts/exec_route.py worker-cycle (exists: true, dry-run supported: false)
- Last 30d invocations: 5 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 6, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 9; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, incremental batch promotion, mixed batch generation, low-token content expansion, diagram coverage, rationale refinement, batch validation
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls ../ccrn-agent remote exec route, packages/content/staging/promoted
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISCONFIGURED, MISSING
- Proof: audit/proofs/nemoclaw.run.json
- Failure modes observed in logs/state:
  - state.blocker: No runtime heartbeat yet; initialized as an empty state template.
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/logout 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /auth/callback 399 B 180 kB

### claude-code - Claude Code

- Lane: Design Review
- Model: claude
- Trigger: guild-ops-loop Claude queue eligibility
- Entrypoint: scripts/run-claude-employee.ps1 (exists: true, dry-run supported: false)
- Last 30d invocations: 30 from state/queue timestamps and memory event provenance only
- Last 30d success rate: 0.429
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 19, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 18; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, premium review, design critique, conversion diagnosis, external audit synthesis, creator economics, EHR-inspired UI patterns for NGN clinical review, Answer-blind pre-submit / reveal post-submit React pattern, CSS component layer token architecture for design system parity, design-token-audit: identify all inline color/shadow values and map to semantic token names before touching components, agent-state-visual-grammar: encode live/blocked/stale/idle as left-edge bar color + truth-level pill ? not prose, a11y-tab-pattern: role=tab requires aria-controls + aria-selected boolean + role=tabpanel on target, CSS grid fixed-height cockpit layout for EHR-style UI, pill tab bar with live data badges, details/summary expander card pattern for zero-scroll panel content, warm ink-on-sand color token application for clinical UI
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls none
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISSING
- Proof: audit/proofs/claude-code.run.json
- Failure modes observed in logs/state:
  - state.blocker: No code editor access from this agent ? design spec is complete but implementation requires a human or Code agent with write access to apply CSS and TSX changes.
  - queue.tasks: {"id":"claude-case-study-ux","title":"Audit case-study and bow-tie learner surfaces","goal":"Tighten hierarchy, context framing, and answer-state clarity for richer NCLEX study modes without redesign drift.","prompt":"Review the learner-facing case-study and r
  - queue.tasks: {"id":"claude-dashboard-clarity","title":"Audit the private launch dashboard for clarity","goal":"Make the swarm dashboard readable, truthful, and launch-useful on desktop and mobile.","prompt":"Review the private dashboard and focus on hierarchy, state legibi
  - queue.tasks: {"id":"claude-tutor-ux","title":"Audit the tutor and rationale experience","goal":"Make the AI tutor and rationale surfaces feel integrated, premium, and easy to scan.","prompt":"Review the learner-facing rationale and tutor surfaces and return only bounded re
  - queue.tasks: {"id":"claude-checkout-ux","title":"Audit the live auth and checkout experience","goal":"Find the smallest UI improvements that reduce confusion across login, upgrade, success, and billing.","prompt":"Review the current live purchase path and call out only the

### social-studio - Mercury

- Lane: Growth Studio
- Model: codex
- Trigger: guild-ops-loop social lane eligibility
- Entrypoint: scripts/run-social-studio.ps1 + scripts/run-social-dispatch.ps1 (exists: true, dry-run supported: false)
- Last 30d invocations: 3 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 3, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 6; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, creator outreach copy, conversion messaging, search-intent growth
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls drafts/social-*, config/social-outbox/dispatch-state.json
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISCONFIGURED, MISSING
- Proof: audit/proofs/social-studio.run.json
- Failure modes observed in logs/state:
  - state.blocker: No runtime heartbeat yet; initialized as an empty state template.
  - C:\Users\Chapman\Desktop\ai\chapai\config\social-studio-state.json: "blockedUntil": null,
  - C:\Users\Chapman\Desktop\ai\chapai\config\social-studio-state.json: "missingKeys": [
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/logout 399 B 180 kB

### scout - Aster

- Lane: Venture Scout
- Model: codex
- Trigger: guild-ops-loop scout eligibility or active duty roster
- Entrypoint: scripts/run-scout-lane.ps1 (exists: true, dry-run supported: false)
- Last 30d invocations: 3 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 3, staging 12, rejected NO_MEASURED_SOURCE
- Skill writes: 6; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, opportunity scouting, validation memo writing, profit-first prioritization
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls none
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISCONFIGURED, MISSING
- Proof: audit/proofs/scout.run.json
- Failure modes observed in logs/state:
  - state.blocker: No runtime heartbeat yet; initialized as an empty state template.
  - C:\Users\Chapman\Desktop\ai\chapai\config\scout-state.json: "blockedUntil": null,
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/logout 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /auth/callback 399 B 180 kB

### explorer - Euler

- Lane: Market Explorer
- Model: codex
- Trigger: registered brain/state only; no runner found in guild-ops-loop
- Entrypoint:  (exists: false, dry-run supported: false)
- Last 30d invocations: 3 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 3, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 6; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, opportunity scouting, validation memo writing, profit-first prioritization
- Dependency graph: called by none; calls none
- Dead code in 30d: false
- Classifications: BROKEN, INEFFICIENT, MISCONFIGURED, MISSING, ORPHANED
- Proof: audit/proofs/explorer.run.json
- Failure modes observed in logs/state:
  - state.blocker: No runtime heartbeat yet; initialized as an empty state template.
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/logout 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /auth/callback 399 B 180 kB

### gemini-audit - Gemini

- Lane: External Audit Advisor
- Model: gemini
- Trigger: guild-ops-loop Gemini audit eligibility
- Entrypoint: scripts/run-gemini-audit-lane.ps1 (exists: true, dry-run supported: false)
- Last 30d invocations: 9 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 5, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 7; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, external audit synthesis, pricing clarity review, bounded recommendation handoff, creator economics
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls none
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISSING
- Proof: audit/proofs/gemini-audit.run.json
- Failure modes observed in logs/state:
  - C:\Users\Chapman\Desktop\ai\chapai\config\gemini-audit-state.json: "blockedUntil": null,
  - C:\Users\Chapman\Desktop\ai\chapai\config\gemini-audit-queue.json: "blocked": [
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/logout 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /auth/callback 399 B 180 kB

### antigravity - Antigravity

- Lane: Gemini Sub-Swarm
- Model: gemini
- Trigger: guild-ops-loop Antigravity eligibility
- Entrypoint: scripts/run-antigravity-lane.ps1 (exists: true, dry-run supported: false)
- Last 30d invocations: 9 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 5, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 12; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, external audit synthesis, pricing clarity review, bounded recommendation handoff, creator outreach copy, conversion messaging, search-intent growth, harness architecture, handoff design, creator economics
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls none
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISSING
- Proof: audit/proofs/antigravity.run.json
- Failure modes observed in logs/state:
  - C:\Users\Chapman\Desktop\ai\chapai\config\antigravity-state.json: "blockedUntil": null,
  - C:\Users\Chapman\Desktop\ai\chapai\config\antigravity-queue.json: "blocked": [
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/logout 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /auth/callback 399 B 180 kB

### outreach-email - Beacon

- Lane: Email Growth
- Model: codex
- Trigger: guild-ops-loop email lane eligibility
- Entrypoint: scripts/run-outreach-email-lane.ps1 + scripts/run-email-dispatch.ps1 (exists: true, dry-run supported: false)
- Last 30d invocations: 3 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 3, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 6; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, daily question delivery, educator outreach sequencing, deliverability readiness
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls drafts/daily-question-*, config/email-outbox/dispatch-state.json
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISCONFIGURED, MISSING
- Proof: audit/proofs/outreach-email.run.json
- Failure modes observed in logs/state:
  - state.blocker: No runtime heartbeat yet; initialized as an empty state template.
  - C:\Users\Chapman\Desktop\ai\chapai\config\outreach-email-state.json: "blockedUntil": null,
  - C:\Users\Chapman\Desktop\ai\chapai\config\outreach-email-state.json: "blocked": 0
  - C:\Users\Chapman\Desktop\ai\chapai\config\outreach-email-state.json: "blocker": "Email provider path is configured, but the Resend API key is still missing.",
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB

### growth-orchestrator - Helios

- Lane: Growth Control
- Model: codex
- Trigger: guild-ops-loop growth orchestration eligibility
- Entrypoint: scripts/run-growth-orchestrator.ps1 (exists: true, dry-run supported: false)
- Last 30d invocations: 3 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 3, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 6; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, harness architecture, handoff design, restart-safe continuity
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls social/email/scout states, public-data approval queue
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISCONFIGURED, MISSING
- Proof: audit/proofs/growth-orchestrator.run.json
- Failure modes observed in logs/state:
  - state.blocker: No runtime heartbeat yet; initialized as an empty state template.
  - C:\Users\Chapman\Desktop\ai\chapai\config\growth-orchestrator-state.json: "blockedUntil": null,
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/logout 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /auth/callback 399 B 180 kB

### mobile-product - Nova

- Lane: Mobile Product
- Model: codex
- Trigger: guild-ops-loop mobile product eligibility
- Entrypoint: scripts/run-mobile-product-lane.ps1 (exists: true, dry-run supported: false)
- Last 30d invocations: 3 from state/queue timestamps and memory event provenance only
- Last 30d success rate: NO_MEASURED_SOURCE
- Last 30d latency: p50 NO_MEASURED_SOURCE, p95 NO_MEASURED_SOURCE
- Last 30d token spend: NO_MEASURED_SOURCE
- Memory writes: canonical 3, staging 0, rejected NO_MEASURED_SOURCE
- Skill writes: 8; last-used timestamp: NO_MEASURED_SOURCE; skills: truthful status reporting, bounded task execution, checkpoint handoff, expo architecture, mobile onboarding flow, offline study path, opportunity scouting, validation memo writing
- Dependency graph: called by scripts/guild-ops-loop.ps1, scripts/start-guild-stack.ps1 (indirect); calls none
- Dead code in 30d: false
- Classifications: INEFFICIENT, MISCONFIGURED, MISSING
- Proof: audit/proofs/mobile-product.run.json
- Failure modes observed in logs/state:
  - state.blocker: No runtime heartbeat yet; initialized as an empty state template.
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/login 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /api/dashboard-auth/logout 399 B 180 kB
  - C:\Users\Chapman\Desktop\ai\chapai\logs\launch-3103.out.log: ? ? /auth/callback 399 B 180 kB

## Dead Code

- No registered agent with an entrypoint was classified as dead solely from the measured 30d evidence window. Explorer is ORPHANED/BROKEN because no runnable entrypoint is mapped, but it has state references.

## Metric Gaps Blocking Later Acceptance

- A real 24/7 workforce cannot be certified from current telemetry because run IDs, latency histograms, token spend, success/failure events, and memory write provenance are not joined in one durable table.
- The dashboard can only be considered observable after these proof files are replaced or supplemented by live agent telemetry. Current dashboard state files are snapshots, not a complete websocket-backed source of truth.
- Telegram control, external connectors, per-agent Obsidian vaults, Qdrant collections, watchdog restarts, backups, OTel/Langfuse/Grafana/Loki, and 72-hour soak evidence were not modified or certified in Phase 0.

## Phase 0 Boundary

This audit intentionally stops before Phase 1 repairs. The next phase should not start from assumptions; it should use the proofs above as the baseline and preserve run-id provenance for every repair.
