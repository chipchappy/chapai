-- Premium editorial pass batch 004.
-- Source-backed promotions from the remote needs_review queue.
-- No schema, Stripe, auth, or UI changes.

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    options='[{"id":"a","text":"Priority intervention or assessment now"},{"id":"b","text":"Not priority for this conscious client"}]',
    answer='{"Administer 15g of fast-acting oral glucose":"Priority intervention or assessment now","Recheck capillary blood glucose in 15 minutes":"Priority intervention or assessment now","Blood glucose level of 58 mg/dL":"Priority intervention or assessment now","Patient reports confusion and diaphoresis":"Priority intervention or assessment now","Educate patient on consuming complex carbohydrates with protein at meals":"Not priority for this conscious client","Administer intravenous dextrose 50%":"Not priority for this conscious client"}',
    rationale='This client has symptomatic hypoglycemia but is conscious and able to swallow, so the priority is rapid oral carbohydrate treatment followed by repeat glucose assessment in 15 minutes. IV dextrose is reserved for clients who cannot safely take oral carbohydrate or who have severe neurologic compromise.',
    deep_rationale='Hypoglycemia threatens cerebral glucose delivery, which explains the confusion, diaphoresis, tremor, and tachycardia. Because the client is awake and can swallow, the safest first intervention is fast-acting oral carbohydrate, then reassess the capillary glucose in about 15 minutes and repeat treatment if still low. The glucose value and neuroadrenergic symptoms are priority assessment cues because they confirm the problem and guide response. Meal-pattern teaching matters after stabilization, but it does not correct the current low glucose. IV dextrose treats severe hypoglycemia when oral intake is unsafe, so using it first here adds unnecessary IV risk and skips the appropriate oral route.',
    references_json='[{"title":"ADA Standards of Care in Diabetes - 2026","citation":"ADA Standards of Care in Diabetes 2026, Glycemic Goals, Hypoglycemia, and Hyperglycemic Crises: recheck glucose 15 minutes after carbohydrate treatment and repeat treatment if hypoglycemia persists."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Physiological Adaptation / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-004:source-backed-promote'
WHERE id='gen-nemotron-1780621220-5-9mseh';

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    rationale='The client is hypoxemic with an SpO2 of 86%, so controlled supplemental oxygen is the first nursing priority while bronchodilator therapy and further evaluation are initiated. The oxygen target should avoid both persistent hypoxemia and excessive oxygenation in a COPD exacerbation.',
    deep_rationale='Acute COPD exacerbation can rapidly progress to ventilatory failure when bronchospasm, mucus, and impaired gas exchange lower oxygen saturation. In this stem, the immediate abnormal cue is SpO2 86% with respiratory distress, so controlled oxygen to a target range is the first priority. Albuterol and ipratropium are appropriate therapies for airflow obstruction, but oxygenation comes first when the client is actively hypoxemic. Morphine can suppress respirations and is not an initial treatment for this presentation. Clinical pearl: in COPD exacerbation, correct dangerous hypoxemia with controlled oxygen while preparing bronchodilators and monitoring ventilation.',
    references_json='[{"title":"GOLD COPD Strategy Report","citation":"GOLD exacerbation management includes respiratory support with oxygen therapy and close monitoring of oxygenation and ventilation."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Physiological Adaptation / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-004:source-backed-promote'
WHERE id='gen-nemotron-1780622121-3-x2rfr';

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    rationale='Thyroid storm causes life-threatening adrenergic excess, so rapid beta-adrenergic control is the priority for severe tachycardia, hypertension, fever, and altered mental status while antithyroid and adjunctive therapies are prepared.',
    deep_rationale='The stem describes thyroid storm: fever, marked tachycardia, severe hypertension, diaphoresis, and altered mental status after missed antithyroid medication. The most immediate threat is cardiovascular collapse from adrenergic excess, so beta blockade is the priority if not contraindicated. Methimazole treats new hormone synthesis but does not rapidly control the hyperadrenergic state. Glucocorticoids are useful adjuncts because they reduce peripheral T4-to-T3 conversion, but they do not replace initial rate and sympathetic control. IV fluids may be needed for dehydration, yet they do not address the driving thyroid physiology. Clinical pearl: stabilize the storm first, then layer antithyroid, iodine timing, steroids, cooling, and supportive care.',
    references_json='[{"title":"Endotext Thyroid Storm","citation":"Endotext thyroid storm management describes beta blockers for adrenergic control plus antithyroid drugs, iodide timing, glucocorticoids, and supportive therapy."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Physiological Adaptation / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-004:source-backed-promote'
WHERE id='gen-nemotron-1780621220-1-jx7zi';

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    rationale='Lithium toxicity requires stopping further lithium exposure, supporting renal elimination with isotonic IV fluids, and monitoring for neurologic deterioration such as seizures. Sodium bicarbonate and activated charcoal do not remove lithium effectively.',
    deep_rationale='Lithium has a narrow therapeutic index and is cleared primarily by the kidneys, so dehydration, renal impairment, or dosing changes can raise serum levels and cause tremor, confusion, ataxia, seizures, and dysrhythmias. The priority nursing actions in this option set are to hold lithium, begin isotonic hydration as ordered, and monitor neurologic status closely. Sodium bicarbonate is used for selected sodium-channel blocker overdoses and severe acidosis, not routine lithium toxicity. Activated charcoal does not bind lithium ions effectively, so it should not be selected as the antidotal strategy. Severe neurologic findings, renal failure, or rising levels warrant urgent provider and nephrology escalation for possible hemodialysis, but the listed correct options are the immediate bedside actions.',
    references_json='[{"title":"NCBI Bookshelf Lithium Toxicity","citation":"NCBI Bookshelf review: lithium toxicity management includes stopping lithium, IV hydration with normal saline, neurologic monitoring, and dialysis consideration for severe cases; activated charcoal does not effectively bind lithium."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Pharmacological and Parenteral Therapies / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-004:source-backed-promote'
WHERE id='gen-nemotron-1780615821-1-g341t';

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    rationale='Major partial-thickness burns and findings of poor perfusion require burn-fluid resuscitation, and urine output is a key bedside marker of adequacy. Findings that suggest minimal burn severity, normal perfusion, or fluid overload should not be treated as reasons to increase resuscitation.',
    deep_rationale='Burn shock develops from capillary leak and third spacing after significant partial-thickness or full-thickness burns, especially when TBSA is high enough to require formal resuscitation. Low urine output and hypotension with a narrow pulse pressure suggest inadequate circulating volume and poor end-organ perfusion. A 20% TBSA second-degree burn is large enough to require resuscitation planning, while a small first-degree burn is not included in formal burn-size resuscitation calculations. Crackles point toward pulmonary congestion or fluid overload, not a need for more fluid, and normal capillary refill argues against immediate hypoperfusion. Clinical pearl: burn formulas estimate the starting rate; urine output and perfusion cues tell the nurse whether the resuscitation is working.',
    references_json='[{"title":"American Burn Association Advanced Burn Life Support","citation":"ABLS guidance uses urine output and perfusion markers to titrate adult burn-fluid resuscitation."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Physiological Adaptation / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-004:source-backed-promote'
WHERE id='gen-nemotron-1780616721-1-5hebf';
