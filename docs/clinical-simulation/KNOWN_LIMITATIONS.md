# Known Limitations

## Clinical Content

- None of the six scenarios has completed human clinical, pharmacy, or assessment review. All are technical-testing content and must not be represented as validated or release-ready.
- ICU septic shock is the gold-standard depth path. The other five scenarios are playable end to end but have fewer branches and less complete medication/state detail.
- Medication values and response timing are bounded educational scenario rules, not a real-world dosing tool.
- The rule engine is deterministic and intentionally simplified; it is not a physiologic digital twin.

## Product Scope

- Instructor assignment/reporting APIs and cohort authorization exist, but no complete faculty-facing simulation management UI is included.
- There is no multiplayer team simulation, voice recognition, equipment integration, LMS integration, or clinical-record import.
- Guided mode provides a workflow cue, not adaptive tutoring.
- A save failure is shown and the last confirmed server state remains resumable, but there is no offline action queue. The learner must retry an action after connectivity returns.

## Patient Scene

- The scene is an original programmatic-vector foundation, not a fully commissioned medical illustration library. It still requires formal nurse, accessibility, and medical-device art review.
- Mechanical ventilation, defibrillation pads, pleural drainage, edema, seizure, and arrest states are renderable in the protected preview, but not every device has a complete learner-operated workflow in current scenarios.
- Focused assessment currently covers face, pupils, breathing, perfusion, IV, oxygen, monitor, pumps, urinary output, drain, and position. Wounds, pressure points, posterior lung fields, mouth/airway detail, and exact pitting edema need richer focused panels.
- No sound is implemented. All alarms remain visual and text based.
- CSS/SVG behavior is verified in Chromium. Safari and Firefox visual compatibility require a dedicated pass.

## Data and Compatibility

- D1 does not support PostgreSQL row-level security. API and store queries enforce attempt ownership; this must be retained and independently security-reviewed before release.
- Current state normalization supports additive fields in older local attempts. There is no general migration system for materially incompatible future scenario versions.
- Scenario definitions are code-versioned rather than database-seeded. `clinical-sim:seed` prepares local storage/test users and validates code-loaded scenarios.
- Trace export is intentionally restricted to development or explicit internal administrators.
- The internal client receives scenario rules needed to render the workspace. This is acceptable for the allowlisted testing build but must be reduced before any student release to limit answer/branch exposure.

## Local Runtime

- The D1-backed build must run through the local OpenNext/Wrangler worker; plain `next dev` does not supply the required D1 binding.
- Local HTTPS uses a self-signed certificate and requires a one-time browser warning bypass.
- The worker build is not incremental and can take several minutes on first start.

## Release Blockers

- Complete RN, pharmacist, provider/scope, education, accessibility, privacy, and security review.
- Validate every scenario branch and scoring decision with qualified reviewers.
- Add formal load testing, failure recovery, dependency scanning, and an institution-ready audit/retention policy.
- Complete instructor workflows or keep all instructor simulation controls hidden.
- Run a controlled non-production pilot before considering any production exposure.
