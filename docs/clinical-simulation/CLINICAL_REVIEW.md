# Clinical Review Gate

## Current Status

The six vertical-slice scenarios are structurally valid and deterministically tested. They are not clinician-approved. Each is marked `clinical-review` and `needs-review` in source data and appears as `Technical testing - clinical review required` in the testing interface.

## Required Reviewers

- Registered nurse with recent practice experience in the represented unit
- Pharmacist review for medication doses, concentrations, compatibility, titration, and high-alert workflows
- Advanced practice/provider review when diagnostic or treatment assumptions exceed independent RN scope
- Nursing education/assessment reviewer for objectives, competency scoring, fairness, and debrief quality

## Review Checklist

1. Confirm the fictional chart is internally consistent and contains no PHI.
2. Confirm baseline and randomized values stay medically plausible.
3. Validate each deterioration and recovery trajectory.
4. Validate orders, doses, routes, hold parameters, contraindications, and reassessment windows.
5. Confirm actions remain within RN scope and defer to facility policy where appropriate.
6. Confirm required actions are genuinely essential and alternatives are not unfairly penalized.
7. Confirm unsafe and critical-error classifications reflect credible patient risk.
8. Validate SBAR, escalation, psychiatric safety, restraint/seclusion, and documentation expectations.
9. Validate each evidence record and the exact recommendation it supports.
10. Run guided, independent, delayed-care, unsafe-action, and replay paths.
11. Review all student-facing language for clarity, accessibility, bias, and trauma-informed phrasing.
12. Record reviewer name/credentials, date, version, findings, changes, and approval decision outside public scenario data.

## Release Rule

Promotion from `clinical-review` to `published` requires documented approval by the designated reviewers, passing automated tests, and product/security sign-off. A source date alone is not approval.

## Maintenance

- Schedule at least annual evidence review and event-driven review after major guideline changes.
- Reopen review after material trajectory, dose, scope, scoring, or evidence changes.
- Keep old versions available for historical attempt interpretation or provide a documented migration.
- Suspend a scenario immediately if a credible safety or accuracy concern is reported.
