# ChapAI Employee Ladder and Swarm Hiring Sheet

Goal: hire only the smallest set of specialist agent lanes that increase profit, shipping speed, or content throughput after the current product is stable.

## Oversight Model
- `Orchestrator`: sets strategy, approves lane creation, and resolves cross-lane conflicts.
- `Manager`: watches queue health, task completion, and blocker drift. Keeps lanes narrow.
- `Guild Dashboard`: shows live status, brain growth, blockers, and output so human oversight stays cheap.

## Employee Ladder

### Level 1: Profit Lanes
These are the first hires after product stability because they create money or distribution fastest.

- `Growth Studio Bot`
  - Owns: creator outreach, short-form posts, founder DMs, affiliate asks, launch copy.
  - Persistence minimum: target creator list, DM pack, post pack, offer menu, weekly learnings.
  - Oversight: Manager checks the first 10-15 contacts and the first reply patterns.
  - Sub-swarm later: yes, eventually split into `creator outreach`, `social content`, and `partnerships`.

- `Conversion QA Bot`
  - Owns: homepage, package pages, checkout flow, success flow, and trust leaks.
  - Persistence minimum: conversion checklist, known blockers, best CTA, before/after log.
  - Oversight: Manager reviews only changes that affect clicks, checkout, or trust.
  - Sub-swarm later: no, keep it as one tight lane unless the product family expands.

- `Content Ops Bot`
  - Owns: question batch promotion, schema validation, exam mix balancing, content freshness.
  - Persistence minimum: question schema memory, category map, batch status, promotion rules.
  - Oversight: Manager approves only validated net-new content changes.
  - Sub-swarm later: yes, eventually split into `CCRN content`, `NCLEX content`, and `batch QA`.

### Level 2: Retention and Support Lanes
These keep buyers happy and reduce manual support load once revenue starts landing.

- `Support / Onboarding Bot`
  - Owns: first-buy welcome flow, account help, billing questions, retention nudges.
  - Persistence minimum: support playbook, common questions, escalation rule, post-purchase checklist.
  - Oversight: Manager keeps answers short and approved.
  - Sub-swarm later: maybe, only if support volume grows across multiple products.

- `Community / Social Proof Bot`
  - Owns: testimonials, screenshot collection, user wins, public trust-building assets.
  - Persistence minimum: proof library, permission status, best quotes, use-case tags.
  - Oversight: Manager ensures claims stay truthful and reusable.
  - Sub-swarm later: yes, if social proof volume becomes large enough to need separate proof streams.

### Level 3: Future Product Lanes
These are not the first hires, but they help the swarm decide what to build next.

- `Product Scout Bot`
  - Owns: next product ideas, adjacent nurse tools, market scoring, build-vs-buy ranking.
  - Persistence minimum: scout shortlist, market scorecard, profit ranking, build complexity note.
  - Oversight: Orchestrator approves only opportunities with a clear buyer and low launch complexity.
  - Sub-swarm later: yes, if the company starts exploring multiple adjacent products at once.

- `Automation / Swarm Bot`
  - Owns: queue hygiene, persistence checks, task routing, restart continuity, low-token execution rules.
  - Persistence minimum: workflow contract, routing rules, failure modes, restart notes.
  - Oversight: Manager watches for drift; Orchestrator handles policy changes.
  - Sub-swarm later: yes, this lane should become the backbone for future sub-swarms.

## Minimum Brain Standard For Every Employee
- `identity`
- `role`
- `skills`
- `goals`
- `durable memory`
- `recent events`
- `current task`
- `blockers`
- `last updated`
- `owner`
- `sub-swarm eligibility`

## Persistence Rules
- Keep durable memory small and useful.
- Store approved patterns, not raw chat logs.
- Promote only facts that change future work.
- Summarize noisy work into one short event before forgetting the details.
- Each lane should be able to resume after shutdown from the latest brain file, queue file, and last updated timestamp.

## Swarm Expansion Rule
- A lane gets its own sub-swarm only if:
  - it owns a real profit lever or throughput lever,
  - it has a stable prompt/queue pattern,
  - it can be split into 2-3 bounded sub-jobs without losing quality,
  - its persistence model is already clean enough to survive restarts.

## Recommended Hiring Order
1. `Growth Studio Bot`
2. `Content Ops Bot`
3. `Conversion QA Bot`
4. `Support / Onboarding Bot`
5. `Product Scout Bot`
6. `Automation / Swarm Bot`

## Best Near-Term Sub-Swarms
- Growth Studio: creator outreach, social content, partnerships.
- Content Ops: CCRN content, NCLEX content, batch QA.
- Automation / Swarm: queue routing, restart continuity, persistence checks.

