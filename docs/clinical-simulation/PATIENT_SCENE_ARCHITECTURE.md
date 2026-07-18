# Reactive Patient Scene Architecture

## Authority Boundary

The scene is a projection of the existing deterministic simulator. It does not calculate treatment, invent physiology, or mutate an attempt.

```text
Persisted PatientState
  -> derivePatientVisualState(scenario, state)
  -> PatientVisualState
  -> anchors and connection paths
  -> RoomScene + PatientBody + MedicalDevices + focused views
```

Only simulator actions, events, delayed effects, and clock operations change `PatientState`. The visual adapter normalizes those fields for presentation. Protected developer overrides create a clearly labeled `developer-preview`; they are never accepted from student APIs or persisted into the attempt.

## Runtime Components

- `SimulationWorkspace` owns the fetched attempt, memoizes `PatientVisualState`, and selects full or reduced scene quality.
- `PatientScene` owns the deliberate bedside, focused, equipment, and overview cameras plus accessible inspection targets.
- `RoomScene` renders six unit-specific room presets.
- `PatientBody` renders the bed, patient profile, position, consciousness, breathing, skin findings, gown, bedding, and movement layers.
- `MedicalDevices` renders oxygen interfaces, ECG leads, IV access, pumps, urinary drainage, surgical or pleural drains, ventilator, defibrillator, and connection paths.
- `BedsideMonitor` remains a separate high-frequency Canvas channel so waveform updates do not rerender the SVG scene.
- `VisualDeveloperControls` and `SimulationDeveloperPanel` expose protected overrides, active assets, anchors, paths, warnings, and performance samples.

The conceptual face, skin, eyes, chest, extremity, bed, and device modules are currently grouped into three render files to keep the first foundation cohesive. Split a group only when its state contract or test surface becomes independently complex.

## Update Lanes

- High frequency: monitor Canvas animation only.
- Moderate frequency: CSS respiratory movement derived from respiratory rate and work.
- Event driven: patient profile, skin, LOC, position, room, devices, and tubing.
- Hidden tab: animation frames pause.
- Reduced capability: shadows are removed and scene quality is marked `reduced`.

The SVG uses a stable `1200 x 680` coordinate system. `scene-geometry.ts` derives patient and equipment anchors from position and head-of-bed angle, then generates finite cubic paths. This keeps lines attached as the patient moves and avoids viewport-specific geometry.

## State Restoration

Patient appearance is deterministic from scenario identity, patient demographics, and attempt seed. Reloading an attempt produces the same body, skin, hair, room, devices, and anchors. Newly added position fields are normalized for older attempts to semi-Fowler at 30 degrees.

## Adding A Scene Capability

1. Add or reuse an authoritative engine field.
2. Normalize it in `visual-state.ts`; do not read scenario prose in the renderer.
3. Add the asset metadata to `scene-assets.ts`.
4. Add anchors or a connection path only if placement changes with patient position.
5. Render the layer with stable `data-*` diagnostics.
6. Add unit mapping, interaction, reveal, accessibility, E2E, and screenshot coverage.
7. Confirm the visual cannot contradict chart, device, medication, or hidden-assessment state.

## Safety

The scene supplements charted data and nursing assessment. It is not a diagnostic display, physiologic digital twin, or clinical decision system. Technical tests establish deterministic behavior only; qualified clinical and accessibility review remain release gates.
