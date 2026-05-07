---
id: "candidate-stage3-vault-audit-before-production-claim"
agent_id: "orchestrator"
status: "canonical"
kind: "fact"
promoted_by: "memory-steward"
promoted_at: "2026-05-07T16:40:15.063Z"
source_agent: "orchestrator"
source_run_id: "stage3-memory-steward-proof-2026-05-07"
tool_used: "stage3-validation-candidate"
confidence: 0.91
ingested_at: "2026-05-07T16:40:15.063Z"
fingerprint: "a626581270cdb9cdca4b91212ef36fe220768cb32a3dd4d90ac90e2d1b9cd34d"
---

# Canonical Fact

Before claiming Phase 3 memory is production-ready, the orchestrator must verify per-agent vault presence with scripts/ops/audit-stage3-state.mjs and canonical writer enforcement with scripts/ops/guard-canonical-brain-writes.mjs.
