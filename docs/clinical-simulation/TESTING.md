# Testing

## Automated Gates

```powershell
npm run typecheck
npm run clinical-sim:validate
npm run clinical-sim:test
npm test
npm run build --workspace=@chapai/web
```

The focused Node suite covers:

- All six scenario schemas and unique unit coverage
- Broken-reference rejection
- Future outlines remaining non-playable
- Seed reproducibility
- One deterministic required-action/debrief path per playable scenario
- Time-triggered deterioration
- Delayed treatment effects
- Unsafe medication sequencing
- Incomplete communication/documentation
- Competency scoring bounds
- Delayed-action classification
- Persisted pause state, assessment timestamps, and physiological bounds
- Next-event calculation and protected manual event triggering
- Seven distinct ICU septic-shock trajectories
- State-dependent provider responses and action-derived debrief metrics

## Local Integration Matrix

Run against a local Wrangler D1 binding with the feature enabled:

1. Sign in and start guided mode.
2. Confirm a D1 attempt row contains scenario version, seed, virtual time, and state.
3. Perform an assessment and confirm hidden findings appear and an action row is stored.
4. Refresh and confirm the same state resumes.
5. Attempt a medication before its safety checks and confirm the server classifies it unsafe.
6. Advance time and confirm delayed events occur once.
7. Complete enough actions, generate a debrief, and confirm domain scores are stored.
8. Confirm a second student cannot GET or PATCH the first student's attempt ID.
9. Confirm an instructor sees only students in the authorized cohort.
10. Confirm a student receives 403 from the instructor endpoint.

## End-to-End Matrix

`tests/clinical-simulation.spec.ts` covers the disabled route/API/navigation gate, enabled mobile catalog, primary septic success path, persisted pause/refresh/resume, same/new-seed replay, reset, abandon, trace sanitization, cross-user isolation, unsafe care, delayed recognition, failed escalation, critical failure, debrief, and existing `/quiz` route.

Run against the isolated local worker only:

```powershell
$env:BASE_URL='https://127.0.0.1:8788'
$env:CLINICAL_SIMULATION_E2E_ENABLED='true'
npm run clinical-sim:e2e
```

Production runs leave `CLINICAL_SIMULATION_E2E_ENABLED` unset and execute only the read-only disabled-feature checks. Never point mutating simulator tests at production.

Production smoke tests remain read-only. Do not point mutating simulation tests at production.

## Manual Accessibility Checks

- Keyboard-only navigation through filters, tabs, structured fields, actions, and debrief
- Screen-reader announcement of monitor values, alarm state, responses, and errors
- 200 percent zoom without clipped controls
- Reduced-motion behavior
- Status meaning available through text/icon, not color alone
- Touch targets at least 40 to 44 CSS pixels
