# Roadmap

## Phase 1: Vertical Slice (This Branch)

- Fail-closed feature flag and hidden navigation
- Six validated data-driven scenarios
- Deterministic patient, time, event, action, medication, assessment, communication, documentation, scoring, and debrief engines
- Server-authoritative D1 persistence and resume/replay
- Cohort assignment/reporting API foundation
- Responsive catalog, prebrief, workstation, monitor, and debrief
- Automated deterministic tests and 109 non-playable library outlines

Required before any learner pilot: multidisciplinary clinical review, authenticated D1 integration tests, full Playwright paths, accessibility audit, threat modeling, and preview-only operational monitoring.

## Phase 2: Controlled Pilot

- Instructor assignment and cohort trend UI behind a separate role gate
- First-attempt versus latest-attempt comparison
- Explicit time-to-first-assessment/intervention metrics
- Scenario authoring CLI with JSON/YAML import and validation reports
- Richer device/infusion/ventilator models and reusable medication definitions
- Read-only chart media pipeline for reviewed ECG strips, wound diagrams, and equipment visuals
- Local autosave queue for transient connectivity loss with server conflict resolution
- Attempt audit export and support replay tooling
- Rate limits, abuse telemetry, structured incident logging, and retention controls
- Authenticated desktop/tablet/mobile Playwright fixtures

## Phase 3: Institution Readiness

- Reviewed scenario promotion workflow and immutable version archive
- Faculty blueprinting, assignment rules, due dates, remediation, and competency thresholds
- Program/campus/cohort aggregation with minimum sample-size protections
- LMS/SSO integration and auditable role provisioning
- FERPA-oriented contracts, retention/deletion controls, secure exports, and vendor-security evidence
- Formal accessibility conformance assessment
- Psychometric and educational-outcome validation; no predictive claims before evidence exists

## Future Library

`future-scenario-outlines.ts` contains 109 structured plans across Medical-Surgical, Telemetry, Step-Down, Intensive Care, Procedural, and Psychiatric nursing. Every record is `status: outline`, `clinicalReviewStatus: not-started`, and `playable: false`. Converting an outline requires a complete scenario definition, evidence review, deterministic tests, and the clinical review gate.

## Known Limitations

- The physiology model is rule-based rather than a general physiologic solver.
- Current monitoring uses lightweight original SVG/CSS visuals; no reviewed ECG strip/image asset library exists yet.
- Instructor functionality is API/data foundation only and intentionally has no unfinished production UI.
- D1 has no native RLS, so isolation is enforced in server queries and must be integration-tested.
- Current scenarios have not completed clinician/pharmacist approval.
- Offline reconciliation, SSO/LMS, immutable version archive, and full authoring UI are future work.
