# Patient Scene Testing

## Test Layers

### Unit and engine integration

`scripts/__tests__/clinical-simulation-visual.test.ts` verifies oxygen normalization, breathing, WOB, LOC, skin states, deterministic profile, reveal rules, positioning, tubing, action-driven oxygen, pumps, arterial-line gating, deterioration, drainage, protected previews, contradictions, and finite geometry for every playable scenario.

```powershell
npm run clinical-sim:test
npm run clinical-sim:validate
```

### Browser integration

`tests/clinical-simulation-scene.spec.ts` verifies actual D1-backed attempts, reload restoration, hidden pupil behavior, real oxygen and position actions, coherent deterioration, protected overrides, reduced breathing, performance diagnostics, and mobile bounds.

```powershell
$env:BASE_URL='https://127.0.0.1:8788'
$env:CLINICAL_SIMULATION_E2E_ENABLED='true'
npm run clinical-sim:e2e
```

### Visual regression

`tests/clinical-simulation-scene.visual.spec.ts` freezes the clock and reduced-motion state before capturing 11 baselines: stable and deteriorating ICU, 900-pixel tablet, postoperative drain, treated NIV, untreated respiratory fatigue, telemetry chest pain, procedural sedation compromise, protected ventilated/unresponsive deep-skin-tone preview, behavioral health, and 390-pixel mobile. Captures wait for fonts and scene controls, center the scene away from sticky chrome, and use a 0.1% pixel-difference ceiling.

```powershell
npm run clinical-sim:visual:update # intentional baseline creation or review
npm run clinical-sim:visual        # regression comparison
```

Review every changed baseline. Do not raise thresholds to hide unexplained drift. Waveform Canvas is outside the patient-scene capture.

## Manual Matrix

Check desktop `1440 x 900`, tablet `1024 x 900` and `900 x 900`, and mobile `390 x 844` in light, dark, reduced-motion, and high-contrast modes. Verify:

- no body-level horizontal overflow;
- patient, airway, monitor, and urgent controls remain visible;
- lines stay attached in every supported position;
- focus panels remain within viewport;
- hidden findings stay hidden in visible and accessible text;
- scene and chart state agree after actions, delays, reload, and reset;
- mobile supplies a simplified scene and list controls.

## Performance Protocol

Use a paused deterministic attempt, then measure a 2.5-second active sample and an extended 10-minute browser session. Record FPS, average frame interval, JS heap where supported, SVG nodes, layout shift, initial route transfer, and repeated-state-change behavior. Test full and reduced quality on a mid-range tablet or equivalent throttle.

The July 17, 2026 local Chromium production-worker sample measured 60 fps / 16.76 ms initially and 51 fps / 19.87 ms after 90 rapid protected override mutations. JS heap remained 9.5 MB, the stressed scene contained 204 SVG nodes, and the scene requested zero external image, video, or Canvas assets. Local navigation completed in 269.2 ms with 474.4 KB transferred across the full page shell. These are development-machine observations, not cross-device performance guarantees; the required extended physical-tablet run remains a release task.

## Clinical QA

Automated tests prove software behavior, not nursing accuracy. Every new state mapping, device placement, skin finding, and scenario transition requires qualified clinical review and traceable approval.
