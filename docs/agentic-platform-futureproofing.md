# Agentic Platform Futureproofing

## Goal
Keep ChapAI useful even when models, SDKs, distribution channels, and automation tooling change faster than product code can.

## Core rule
Brains stay file-backed and provider-agnostic.

That means:
- employee identity, handoffs, skills, durable memory, and wake rules should never depend on one vendor CLI
- changing Claude, Gemini, Codex, Nemoclaw, push, or email providers should not require changing the brain schema
- approval rules should live at the adapter layer, not inside each employee brain

## Operational layers

### 1. Brain layer
- canonical source of truth for each employee
- stores role, goals, skills, durable memory, active context, and workflow contract
- optimized for restart safety and takeover by another runtime

### 2. Lane state layer
- queue, current task, heartbeat, blockedUntil, nextCheckAt
- tracks whether an employee is live, sleeping, blocked, or stale
- should stay compact and machine-readable

### 3. Adapter layer
- maps external systems into safe capabilities
- current registry: `config/provider-adapter-registry.json`
- examples:
  - Claude CLI
  - Gemini audit lane
  - Nemoclaw question generation
  - X / Instagram distribution
  - email delivery
  - Expo mobile surface
  - Telegram remote operator path

### 4. Approval layer
- final-public actions should stay approval-gated until proven safe
- examples:
  - first social sends
  - first email template launches
  - new creator campaigns
  - new institution-facing campaigns

## Design rules for future tools
- plug new tools into the adapter registry before trusting them in production
- declare required env vars, approval gates, and safe operating modes up front
- keep model-specific logic in one runner, not spread through the app
- reuse the same approval queue and handoff packet structure across channels

## Product rules
- learner-facing practice should use live-only questions by default
- draft questions must pass review before entering live practice
- diagram queues and rewrite queues should be tracked separately
- tutor prompts should coach on pattern, trap, next rep, and study tip

## Growth rules
- social, email, creator outreach, and retention loops should share one growth-control layer
- manual-ready, semi-auto, and api-ready must be explicit states
- no fake autonomy: if credentials are missing, the lane should say so clearly
- use daily question capture as the lightest repeat-touchpoint loop

## Mobile rules
- use Expo-first shared product logic
- do not fork business logic between web and mobile
- delay native billing complexity until the web subscription path is cleaner
- use one daily question source across web, email, push, and mobile

## What this protects against
- CLI or SDK changes
- model-rate-limit outages
- provider credential churn
- new channel additions like push or in-app messaging
- new employee runtimes taking over work from sleeping or blocked lanes

## Current top missing unlocks
- X credentials
- Instagram credentials
- email delivery credentials
- first real social reply wave
- first real daily question email send
