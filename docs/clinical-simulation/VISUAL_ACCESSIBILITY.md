# Visual Accessibility

The patient scene is supplementary. Every required observation and action must remain usable without color perception, precise pointing, animation, or visual access.

## Implemented Controls

- The SVG has a patient-specific title and reveal-safe description.
- Every hotspot is a keyboard-accessible button with a clinical label.
- A structured alternative inspection list removes pixel hunting.
- Bedside, focused, equipment, and overview views use labeled buttons and pressed state.
- Focus panels state whether a finding is revealed and route learners to assessment actions.
- Critical changes use text, icon, contrast, and status semantics rather than color alone.
- Focus indicators, minimum touch targets, high-contrast media rules, and reduced motion are present.
- Alarm meaning never depends on sound.

## Hidden Findings

Accessibility text follows the same reveal contract as visible focus panels. Do not put hidden pupil size, drain amount, urine output, IV patency, posterior assessment, or other focused findings into:

- SVG title or description;
- ARIA labels;
- live regions;
- button names;
- visually hidden text;
- client telemetry.

When hidden, describe only what is grossly visible and identify the assessment needed to reveal more.

## Interaction Requirements

- All interactions must be reachable in logical Tab order.
- No action may require a small hotspot; the list alternative must offer the same destination.
- Focus must remain visible and return to a sensible control when a panel closes.
- Mobile controls must stay inside the viewport with at least 36-pixel current targets; production accessibility review should evaluate the 44-pixel target goal.
- Do not auto-focus or open disruptive panels when physiology changes.

## Remaining Review

Run NVDA plus Chrome, VoiceOver plus Safari where available, keyboard-only testing, 200% zoom, Windows high contrast, forced colors, color-vision simulation, and WCAG 2.2 AA review before release. Automated semantics and screenshots do not replace disabled-user testing.
