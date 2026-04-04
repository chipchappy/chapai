# Open-Model Adoption: Gemma / MedGemma Lane

This note keeps the swarm honest about which free or cheap Google open-model lanes should exist today.

## Current stance

- Keep the `gemma4` provider slot as a real active registry entry.
- Use the current real Google open-model path as the implementation target, not a placeholder.
- For medical bounded work, prefer a medical-tuned open-model lane before escalating to premium models when quality risk is acceptable.

## Recommended implementation order

1. `Gemma 4`
   - cheap routing
   - trend clustering
   - reply-angle generation
   - low-cost question precheck
   - diagram caption cleanup
2. `MedGemma`
   - medical wording precheck
   - rationale compression support
   - category labeling
   - diagram-language cleanup
3. Hume / premium models
   - final clinical gate
   - live promotion
   - premium tutor behavior

## Safety rule

Open-model medical outputs are never the final promotion gate.

Use them only for bounded prep work before Hume or a premium review lane confirms the question, rationale, or diagram.

## Low-cost tasks that should route here first

- trend and influencer clustering
- X reply-angle drafting
- question duplicate detection support
- question category / subcategory cleanup
- diagram caption cleanup
- rationale condensation for email and social previews

## Tasks that should still escalate

- final live-bank promotion
- premium homepage / logo decisions
- final tutor behavior changes
- pricing / conversion-critical brand copy
- any clinically ambiguous answer/rationale decision
