# Clarity Clinical Simulation

**Runnable internal testing build: Yes.** The reactive-scene phase runs locally from its isolated feature branch and has not been deployed. The previously deployed simulator remains restricted by its production flag and administrator allowlist.

## What Is Runnable

- Authenticated catalog, prebrief, guided/independent modes, attempt history, resume, abandon, reset, replay, and debrief
- Deterministic patient state, virtual time, assessments, interventions, medications, communication, documentation, event processing, and scoring
- Deep ICU septic-shock path with improving, delayed, incomplete, unsafe, missed-reassessment, failed-escalation, and critical-deterioration trajectories
- Five additional end-to-end technical-testing scenarios
- Server-owned D1 persistence and per-user attempt isolation
- Protected developer panel with time controls, event triggers, state inspection, reset/restart, debug copy, and sanitized trace export
- Engine-driven 2.5D patient scenes with six room presets, responsive positioning, clinical skin and respiratory cues, modular devices, connected tubing, focused assessments, and reveal-safe accessibility text
- Automated scenario, engine, API-flow, responsive UI, feature-gate, and NCLEX-route regression tests

All six scenarios are marked `Technical testing - clinical review required`. Automated validation is not clinical approval.

## Start Locally

Run from the repository root in PowerShell:

```powershell
npm ci
npm run clinical-sim:setup
npm run clinical-sim:validate
npm run clinical-sim:dev
```

Open `https://127.0.0.1:8788/clinical-simulation`. Accept the local certificate warning, then sign in at `/auth/login` with:

```text
Email: clinical.sim.test@clarity.local
Password: ClinicalSimLocal2026!
```

`clinical-sim:setup` is idempotent. It uses only `apps/web/wrangler.clinical-simulation.local.jsonc` and `.local-state/clinical-simulation`; it contains no remote flag, production route, or production database resource.

See [MANUAL_TESTING.md](./MANUAL_TESTING.md) for exact success, delay, unsafe, resume, replay, and trace-export scripts.

## Commands

```powershell
npm run clinical-sim:setup      # Local migrations and deterministic test users
npm run clinical-sim:seed       # Idempotent setup alias; scenarios are versioned in code
npm run clinical-sim:validate   # Validate every playable scenario and hidden outline
npm run clinical-sim:test       # Focused unit and trajectory suite
npm run clinical-sim:e2e        # Playwright; requires the local worker and E2E env vars
npm run clinical-sim:visual     # Deterministic patient-scene screenshot regression
npm run clinical-sim:inspect    # List local stored attempts without opening the UI
npm run clinical-sim:reset      # Remove local attempts/assignments; preserve test users
npm run clinical-sim:destroy    # Remove only isolated local simulator state and env file
```

## Feature Gate

`CLINICAL_SIMULATION_ENABLED` defaults to `false`. When false, the navigation item is absent and the page/API routes return 404. In production, the flag alone is insufficient: the authenticated email must also be explicitly listed in `CLINICAL_SIMULATION_ADMIN_EMAILS`.

Each page repeats the access check before scenario lookup, in addition to the layout and API guards. This prevents Next.js parallel server rendering from placing protected scenario data in a soft-404 response payload.

The tracked local Wrangler file enables the flag only in a development worker with a separate local D1 database. No deploy command is part of this workflow.

See [PATIENT_SCENE_ARCHITECTURE.md](./PATIENT_SCENE_ARCHITECTURE.md) for the visual-state boundary and [VISUAL_TESTING.md](./VISUAL_TESTING.md) for scene verification.

## Data Isolation

Migration `0007` creates only:

- `clinical_simulation_attempts`
- `clinical_simulation_actions`
- `clinical_simulation_assignments`

Every student attempt query includes the authenticated hosted user ID. D1 has no PostgreSQL-style row-level security, so ownership is enforced at every API/store query. Existing quiz, readiness, billing, access-key, and progress tables are not changed.

## Rollback

Stop the local worker, disable the flag, and run `npm run clinical-sim:destroy`. For a non-production database that already received migration `0007`, the isolated down migration drops only simulator tables:

```powershell
npx wrangler d1 execute <NON_PRODUCTION_DATABASE> --local --file packages/db/drizzle/migration-0007-clinical-simulation.down.sql
```

Never add `--remote` to the internal testing workflow.

## Safety Boundary

This is an educational simulator, not clinical decision support. Do not enter real patient information. Patient response and scoring come only from deterministic scenario rules, never from a general-purpose language model. Facility policy, active orders, supervised clinical judgment, and clinician/pharmacist review remain authoritative.
