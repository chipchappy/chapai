# Future-Proof Agent Architecture

## Goal
Keep ChapAI ready for fast-moving agent/tool releases without rewriting the whole company every time a provider changes.

## Core rules
- brains stay file-backed and provider-agnostic
- provider-specific auth lives in adapter state, not in the brain schema
- every external send path stays approval-gated until it is proven safe
- manager owns wake rules, blocked-state truth, and handoff clarity
- reserve lanes stay sleeping when they have no bounded work so tokens are not burned for vanity activity

## Adapter-first model
Every major runtime or platform should plug into one explicit adapter contract:
- capabilities
- auth requirements
- approval gate
- safe operating mode
- fallback mode

Current registry:
- `config/provider-adapter-registry.json`

This lets the swarm absorb:
- new model providers
- new social APIs
- new email providers
- future MCP or tool servers

without changing the core brain format.

## What should stay stable
- `brains/agents/*.json` as the canonical employee memory format
- `config/*-state.json` as runtime truth
- `config/*-queue.json` as bounded work
- `config/guild-snapshot.json` as shared operator truth
- Telegram as the remote operator surface

## What should be easy to swap
- model vendor
- local CLI path
- posting connector
- email delivery provider
- diagram/image pipeline
- future mobile delivery surface

## Safe autonomy ladder
### Manual-ready
- the lane prepares work
- human sends or approves

### Semi-auto
- the lane prepares and queues work
- human gives final approval
- agent logs outcomes and learns from performance

### API-ready
- the lane can send bounded approved work
- rate limits and approval rules stay explicit
- performance signals feed back into durable growth

## Current high-leverage next unlocks
1. Mercury approval-only social sends
2. Beacon daily-question email sends
3. Kepler minimal delivery pipeline for repeat touchpoints
4. Hume reviewed-live curation to keep scale from hurting question quality
5. Scout mobile path memo so we can move into iOS/Android without bloating the core app early

## What future releases should plug into
- provider adapters
- manager queue discipline
- durable-memory promotion rules
- approval outboxes
- Telegram operator routes

That is how we stay fast without becoming fragile.
