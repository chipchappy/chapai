# Manual Testing

This checklist is written for a tester who does not need to understand the codebase.

## 1. Prepare a Clean Local Build

Requirements: Git, Node.js 20 or newer, npm, and Chrome/Edge.

```powershell
git switch feature/clinical-simulation
npm ci
npm run clinical-sim:setup
npm run clinical-sim:validate
```

The setup command applies migrations `0001`, `0006`, and `0007` only to `.local-state/clinical-simulation`, creates local auth tables/test users, and generates an ignored local auth secret. It never uses `--remote`.

Start the worker in the same terminal:

```powershell
npm run clinical-sim:dev
```

The first build can take several minutes. Keep the terminal open. Open `https://127.0.0.1:8788/auth/login?next=/clinical-simulation` and accept the self-signed local certificate warning.

Use:

```text
Email: clinical.sim.test@clarity.local
Password: ClinicalSimLocal2026!
```

The direct simulator URL is `https://127.0.0.1:8788/clinical-simulation`.

## 2. Confirm Feature Activation

1. Confirm `Clinical Simulation` appears in the signed-in navigation.
2. Open the catalog and confirm six cards appear.
3. Confirm every card says clinical review is required.
4. Open `Septic Shock With Worsening Hypoperfusion`.
5. Choose Guided or Independent mode.
6. For reproducibility, enter seed `260717` in the test-only seed field.
7. Start the scenario and confirm handoff, patient, monitor, chart, assessment/actions, communication, documentation, and timeline are available.

## 3. Successful Septic-Shock Path

Complete these decisions without advancing past the stated windows. Dependencies can also be completed when the interface identifies them.

1. Perform the general survey and assess airway, breathing, hemodynamics, neurologic status, urine output, IV access, infection source, and medication safety.
2. Collect ordered blood cultures without delaying treatment.
3. Administer ordered empiric antibiotics.
4. Administer the ordered 500 mL balanced crystalloid bolus.
5. Reassess fluid responsiveness and lung sounds.
6. Titrate oxygen within the active order if indicated.
7. Verify the norepinephrine order, concentration, pump, line, and monitoring plan.
8. Start the ordered norepinephrine infusion.
9. Send a complete shock SBAR to the intensivist. Select identity, concern, background, assessment, interventions, and request.
10. Reassess MAP, perfusion, mentation, urine output, lungs, and IV site.
11. Submit documentation containing assessment, intervention, response, notification, and safety.
12. Advance 5 minutes so the delayed pressor response is processed.
13. Select `Complete and debrief`.

Expected: MAP and urine output improve, mentation improves, the outcome is `Patient stabilized`, no required action is missed, and the debrief cites the actions and timing from this attempt.

## 4. Delayed and Critical Path

1. Start a new septic-shock attempt with seed `260717`.
2. Do not assess or treat immediately.
3. Use `+5m` repeatedly or `Next event` until minute 18.
4. Observe worsening hypotension, tachycardia, mentation, urine output, and lactate notices.
5. Do not notify the intensivist or activate emergency escalation.
6. Complete when the critical failure condition enables the control.

Expected: delayed-recognition, shock-worsening, antibiotic-delay, escalation-delay, and critical-deterioration events are reflected in the state/debrief; the poor outcome is causal rather than a generic failure screen.

## 5. Unsafe Path

1. Start a new septic-shock attempt.
2. In Interventions, choose `Give another large fluid bolus without reassessment`.
3. Confirm it is classified unsafe.
4. Confirm oxygen saturation falls and `fluid-associated pulmonary edema` appears in the trajectory.
5. Optionally choose `Administer scheduled losartan` to inspect the controlled critical-error branch.
6. Complete enough actions or advance to an end condition, then inspect the safety and medication debrief.

## 6. Resume, Restart, and Abandon

1. Perform one assessment, then select `Save & exit`.
2. Reopen the catalog and select Resume. Confirm the same attempt ID, seed, minute, action, and revealed finding remain.
3. Refresh the run page and confirm the state still remains.
4. Open `Test panel`, pause the clock, refresh, and confirm the clock remains paused.
5. Select `Reset attempt`, accept the confirmation, and confirm the same attempt/seed returns to minute zero with no actions.
6. Select `Restart same seed`; confirm a new attempt is created with the same seed and the old attempt remains in history.
7. Select `Restart new seed`; confirm a new seed appears.
8. Select `Abandon`, accept the confirmation, and confirm the attempt remains in history but cannot resume.

## 7. Developer Panel and Trace

The `Test panel` is available in local development and only to explicit internal administrators outside development.

Verify:

- Pause/Resume, `+1 minute`, `+5 minutes`, and `Next event`
- Scenario/version, attempt, seed, clock, and validation status
- Current/hidden patient state, event queue, score, completion conditions, recent actions, and processed events
- Trigger a selected event once; a processed event cannot be triggered twice
- `Copy summary` writes a compact reproducibility record to the clipboard
- `Export trace` downloads `clinical-simulation-<attempt-id>.json`

Open the JSON and confirm it includes scenario/version, attempt/seed, actions/times, state changes, events, scores, errors, and outcome. It must not contain a user ID, email, password, cookie, token, or secret.

## 8. Automated Checks

With the local worker still running, open a second PowerShell terminal:

```powershell
$env:BASE_URL='https://127.0.0.1:8788'
$env:CLINICAL_SIMULATION_E2E_ENABLED='true'
npm run clinical-sim:e2e
```

The local test credentials are selected automatically for a localhost target. Run the non-browser gates with:

```powershell
npm run typecheck
npm run clinical-sim:validate
npm run clinical-sim:test
npm test
npm run build --workspace=@chapai/web
```

## 9. Inspect or Reset Stored Data

Stop the worker before reset if a test is actively saving.

```powershell
npm run clinical-sim:inspect
npm run clinical-sim:reset
npm run clinical-sim:setup
```

`reset` removes local simulator attempts and assignments but preserves test users. `destroy` removes only the isolated simulator state and generated local environment file:

```powershell
npm run clinical-sim:destroy
```

## 10. Report a Bug

Include the scenario/version, attempt ID, seed, virtual minute, last action, expected result, actual result, browser/viewport, screenshot, and exported trace. Remove any manually entered identifying information; do not use real patient data.

## 11. Disable the Feature

Press `Ctrl+C` to stop the local worker. The normal application default remains `CLINICAL_SIMULATION_ENABLED=false`. Do not set the production flag or deploy the local Wrangler configuration.
