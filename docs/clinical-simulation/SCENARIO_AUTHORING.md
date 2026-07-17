# Scenario Authoring

## Authoring Contract

Create scenario definitions as typed data and pass them through `assertValidScenario`. Do not add scenario-specific branching to React components.

Every definition needs:

- Stable ID, slug, semantic version, unit, difficulty, objectives, and prerequisites
- Concise prebrief and complete fictional patient/chart record
- Initial patient state and medically bounded randomization
- Assessments whose findings remain hidden until a matching action reveals them
- Structured actions with rationale, evidence IDs, effects, dependencies, safety checks, and competency points
- Time- or condition-triggered events
- Explicit completion requirements and debrief teaching points
- Current authoritative source metadata and clinical review status

## Action Design

Use the smallest meaningful action. An action should represent one clinical decision, not an entire correct-care bundle. Every action must have a patient-state, finding, communication, or documentation consequence.

Use:

- `prerequisites` for clinically reasonable sequence requirements
- `safetyChecks` for checks that make administration or intervention safe
- `optimalByMinute` and `lateAfterMinute` for priority windows
- `effects` for immediate deterministic changes
- `delayedEffects` for onset and reassessment behavior
- `communication.requiredElementIds` for structured SBAR or escalation
- `documentation.requiredFieldIds` for concise charting
- `criticalError` only for actions capable of serious simulated harm

Do not punish harmless sequence differences. Model acceptable alternatives as their own actions with `acceptable_alternative` classification.

## Medication Rules

Medication actions should include the scenario order, indication, dose, route, frequency, parameters, hold parameters, required assessments/labs, high-alert status, double-check requirements, compatibility, onset, expected effect, adverse effects, and reassessment interval when applicable.

All calculations and concentrations must be bounded to the fictional scenario. Do not expose a general bedside calculator.

## Event Design

Events run once when virtual time and all conditions match. Keep effects medically plausible and monotonic unless an intervention specifically reverses them. Avoid contradictory event paths by checking the completed/not-completed action predicates.

## Evidence Metadata

Every action references one or more evidence records. Each record includes title, organization, publication date, persistent URL, guideline version, applicable recommendation, review date, and reviewer status.

Prefer primary guidelines and official organizations. Do not promote a scenario to `published` until a qualified reviewer verifies the patient trajectory, orders, medications, contraindications, RN scope, timing, scoring, rationales, and source applicability.

## Automated Validation

The loader rejects:

- Invalid or impossible bounded vital values
- Duplicate action IDs
- Broken action, event, completion, or evidence references
- Unreachable timed events
- Actions with no consequence
- Essential/high-priority actions without competency scoring
- Missing required scenario sections

Add a deterministic required-action path test for every playable scenario.

Run `npm run clinical-sim:validate` after every scenario edit. A validation failure removes the scenario from the student-safe catalog path and is surfaced in the protected developer panel.

## Versioning

- Patch: wording, accessibility, or non-behavioral rationale correction
- Minor: additive action/event or scoring refinement with compatible attempt interpretation
- Major: changed clinical trajectory, removed action, incompatible state shape, or materially changed scoring

Never silently load an old attempt against a different scenario version. The API currently returns a version conflict until a formal migration path exists.
