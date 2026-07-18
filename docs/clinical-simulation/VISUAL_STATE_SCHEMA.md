# Patient Visual State Schema

`PatientVisualState` is the typed, read-only presentation contract between the simulation engine and scene renderer.

## Major Groups

| Group | Source | Purpose |
| --- | --- | --- |
| identity | scenario ID, version, attempt seed | Deterministic restoration and diagnostics |
| profile | patient demographics plus seed | Respectful skin palette, body, hair, apparent age, clothing |
| room | scenario unit and current urgency | Unit preset and clinical lighting |
| position | `position`, `headOfBedDegrees`, scenario behavior | Bed angle, body anchors, lateral or ambulatory state |
| respiration | vital RR and respiratory-effort text | Pattern, duration, depth, WOB, accessory use, spontaneous movement |
| consciousness | LOC, orientation, behavior, GCS, sedation score | Eye opening, tracking, blink rate, purposeful movement |
| skin | skin, perfusion, edema, bleeding, temperature, MAP, SpO2 | Tone-aware pallor, cyanosis, mottling, moisture, flushing, edema |
| pupils | pupil state plus reveal status | Focused size, symmetry, reaction, gaze |
| movement | behavior and complications | Restrained restlessness, guarding, shivering, seizure state |
| devices | engine devices, oxygen, ventilator, infusions, actions | Device visibility, settings, connection, output, pump state |
| revealed | performed assessments | Permission to expose focused findings and text equivalents |
| warnings | clinical-to-visual assertions | Protected contradiction diagnostics |

## Conservative Mapping Rules

- Fatigue never maps to coma.
- Response only to painful stimulus maps to obtunded, not fully unresponsive.
- Sedation score is evaluated before generic wording such as `unresponsive to voice`.
- Respiratory arrest removes spontaneous chest motion; assisted ventilation remains visibly distinct.
- Low SpO2 does not apply a universal blue body overlay. Changes are limited to lips, nail beds, distal skin, activity, and the monitor.
- Mottling is regional and tone-specific.
- An arterial waveform appears only when the line state says connected or transduced, not when equipment is merely available.
- A ventilator preview forces a matching artificial airway and mechanical-ventilation interface.

## Reveal Contract

The adapter derives reveal booleans from `revealedFindingIds`. Grossly visible findings may render immediately. Pupil detail, exact urine or drain output, IV patency, capillary refill, and auscultation text remain hidden until the matching assessment.

The accessible description uses the same reveal contract. Hidden values must not appear in the SVG title, description, focused panel, alternative interaction list, or live region.

## Developer Overrides

`VisualDebugOverrides` supports skin, body, LOC, RR, WOB, position, oxygen, room, pupil, IV, drain, pads, ventilation, seizure, arrest, improvement, and reduced motion previews. Overrides:

- exist only in React state inside the protected panel;
- mark the visual source `developer-preview`;
- do not patch the attempt;
- do not bypass engine actions in learner mode;
- produce an informational consistency warning.

## Extending The Schema

Prefer a normalized enum or bounded severity over freeform renderer matching. Add mapping tests for normal, edge, contradictory, delayed, and hidden states. Preserve defaults in `normalizePatientStateInPlace` for additive persisted fields.
