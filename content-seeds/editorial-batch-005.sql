-- Premium editorial pass batch 005.
-- Source-backed promotions from the remote needs_review queue.
-- No schema, Stripe, auth, or UI changes.

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    rationale='This client has septic shock physiology: suspected infected diabetic foot wound, hypotension, tachycardia, leukocytosis, and lactate 4.8 mmol/L. Broad-spectrum IV antibiotics should be started rapidly after recognition while hemodynamic resuscitation and source-control steps proceed.',
    deep_rationale='Septic shock is a time-sensitive perfusion emergency. The stem gives a purulent wound source plus hypotension and elevated lactate, which indicates systemic infection with impaired tissue perfusion. Broad-spectrum IV antibiotics are the best answer in this option set because delaying effective antimicrobial therapy increases progression to organ failure and death. Insulin may be needed after stabilization, but glucose correction does not treat the infectious shock driver. Cold compresses and simple elevation do not address bacteremia, lactate elevation, or hypotension and can distract from sepsis bundle priorities. Clinical pearl: in suspected septic shock, think rapid antibiotics, cultures when feasible without delay, fluids/vasopressors as ordered, and source control.',
    references_json='[{"title":"Surviving Sepsis Campaign 2021 Guidelines","citation":"SSC adult sepsis guidelines recommend immediate sepsis/shock recognition and rapid antimicrobial therapy, with antibiotics ideally within 1 hour for septic shock or high likelihood of sepsis."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Physiological Adaptation and Management of Care / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-005:source-backed-promote'
WHERE id='gen-nemotron-1780628419-5-6gqbw';

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    rationale='An INR of 4.5 is above the therapeutic range for atrial fibrillation and increases bleeding risk. The nurse should hold warfarin, assess for bleeding, and notify the prescriber for dose adjustment or reversal decisions based on bleeding status and institutional protocol.',
    deep_rationale='Warfarin safety questions test recognition of excessive anticoagulation and prevention of hemorrhage. An INR of 4.5 is supratherapeutic for the usual atrial-fibrillation target of 2.0 to 3.0, so continuing the scheduled dose increases bleeding risk. The safest nursing action is to hold the next dose, assess for occult or overt bleeding, and notify the prescriber. IV vitamin K is not automatically indicated for every elevated INR; reversal depends on the INR level, bleeding, and provider orders. Permanently discontinuing warfarin or switching anticoagulants is outside immediate nursing management and does not address the current safety problem. Clinical pearl: high INR means pause, assess bleeding, protect from injury, and escalate.',
    references_json='[{"title":"NCBI Bookshelf Warfarin","citation":"NCBI StatPearls Warfarin review describes INR monitoring, supratherapeutic INR management, bleeding assessment, and provider-directed reversal decisions."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Pharmacological and Parenteral Therapies / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-005:source-backed-promote'
WHERE id='gen-nemotron-1780628419-3-34n2x';

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    rationale='Environmental safety interventions are the least restrictive first-line approach for a client with dementia, wandering, poor judgment, and fall risk. Removing hazards and using bed or door alarms reduces injury risk without the harms of physical or chemical restraint.',
    deep_rationale='Advanced dementia increases fall and wandering risk because the client may not recognize hazards, communicate needs, or remember instructions. Nursing safety care should start with least-restrictive environmental controls: clear pathways, adequate lighting, close observation, alarms, toileting assistance, and familiar cues when available. Haloperidol and physical restraints can worsen confusion, immobility, injury risk, and loss of dignity, so they are not first-line safety interventions for wandering alone. Relying entirely on family presence is not a dependable hospital safety plan. Clinical pearl: dementia safety means structured environment and supervision first; restraints require a much higher threshold and ongoing reassessment.',
    references_json='[{"title":"Alzheimer''s Association Dementia Care Practice Recommendations","citation":"Dementia care recommendations emphasize person-centered, least-restrictive approaches and environmental/supervision strategies for safety and behavioral symptoms."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Safety and Infection Control and Psychosocial Integrity / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-005:source-backed-promote'
WHERE id='gen-nemotron-1780629320-3-qh5ra';

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    rationale='A glucose of 42 mg/dL with confusion is an immediate neurologic threat because the brain depends on circulating glucose. The nurse should treat the hypoglycemic client first while other urgent but less immediately reversible problems are triaged.',
    deep_rationale='Prioritization questions reward identifying the client at greatest immediate risk and the problem that nursing action can rapidly reverse. Symptomatic hypoglycemia with confusion can progress quickly to seizure, loss of consciousness, aspiration, or neurologic injury. Crushing chest pain and hypotension are urgent and require rapid evaluation, but the listed hypoglycemic client has an active metabolic threat to cerebral function that can be treated immediately. A controlled laceration is stable and lowest priority. Clinical pearl: altered mental status from a correctable low glucose is a first-now problem in triage.',
    references_json='[{"title":"ADA Standards of Care in Diabetes - 2026","citation":"ADA Standards of Care in Diabetes 2026 describes hypoglycemia recognition and prompt carbohydrate treatment with reassessment."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Management of Care and Physiological Adaptation / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-005:source-backed-promote'
WHERE id='gen-nemotron-1780627519-1-7xggu';
