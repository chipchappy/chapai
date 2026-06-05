-- Premium editorial pass batch 005b.
-- Completes the two statements left unapplied by batch 005 because of SQL quote escaping.
-- No schema, Stripe, auth, or UI changes.

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    rationale='Environmental safety interventions are the least restrictive first-line approach for a client with dementia, wandering, poor judgment, and fall risk. Removing hazards and using bed or door alarms reduces injury risk without the harms of physical or chemical restraint.',
    deep_rationale='Advanced dementia increases fall and wandering risk because the client may not recognize hazards, communicate needs, or remember instructions. Nursing safety care should start with least-restrictive environmental controls: clear pathways, adequate lighting, close observation, alarms, toileting assistance, and familiar cues when available. Haloperidol and physical restraints can worsen confusion, immobility, injury risk, and loss of dignity, so they are not first-line safety interventions for wandering alone. Relying entirely on family presence is not a dependable hospital safety plan. Clinical pearl: dementia safety means structured environment and supervision first; restraints require a much higher threshold and ongoing reassessment.',
    references_json='[{"title":"Alzheimer''s Association Dementia Care Practice Recommendations","citation":"Dementia care recommendations emphasize person-centered, least-restrictive approaches and environmental/supervision strategies for safety and behavioral symptoms."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Safety and Infection Control and Psychosocial Integrity / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-005b:source-backed-promote'
WHERE id='gen-nemotron-1780629320-3-qh5ra';

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    rationale='A glucose of 42 mg/dL with confusion is an immediate neurologic threat because the brain depends on circulating glucose. The nurse should treat the hypoglycemic client first while other urgent but less immediately reversible problems are triaged.',
    deep_rationale='Prioritization questions reward identifying the client at greatest immediate risk and the problem that nursing action can rapidly reverse. Symptomatic hypoglycemia with confusion can progress quickly to seizure, loss of consciousness, aspiration, or neurologic injury. Crushing chest pain and hypotension are urgent and require rapid evaluation, but the listed hypoglycemic client has an active metabolic threat to cerebral function that can be treated immediately. A controlled laceration is stable and lowest priority. Clinical pearl: altered mental status from a correctable low glucose is a first-now problem in triage.',
    references_json='[{"title":"ADA Standards of Care in Diabetes - 2026","citation":"ADA Standards of Care in Diabetes 2026 describes hypoglycemia recognition and prompt carbohydrate treatment with reassessment."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Management of Care and Physiological Adaptation / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-005b:source-backed-promote'
WHERE id='gen-nemotron-1780627519-1-7xggu';
