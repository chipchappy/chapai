-- Premium editorial pass batch 003.
-- Source-backed, low-risk promotions from the remote needs_review queue.
-- No schema, Stripe, auth, or UI changes.

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    rationale='Airborne precautions for active pulmonary tuberculosis require staff respiratory protection before room entry and source control for the coughing client while awaiting an airborne infection isolation room. Donning an N95 respirator and placing a surgical mask on the client addresses both exposure routes.',
    deep_rationale='Mycobacterium tuberculosis spreads through airborne droplet nuclei that can remain suspended in air. Staff should don a fit-tested N95 or higher respirator before room entry, and the coughing client should wear a surgical mask for source control while awaiting airborne isolation. A surgical mask plus distance alone is insufficient for airborne pathogens; a standard private room with contact precautions misses the negative-pressure requirement; and nebulized therapy can increase aerosol risk unless airborne precautions are already in place. Clinical pearl: TB isolation is source control for the client plus respirator protection for staff.',
    references_json='[{"title":"CDC Isolation Precautions - Airborne Precautions","citation":"CDC guidance: patients on airborne precautions should be placed in an AIIR when available; if not, mask the patient, close the door, and use N95 or higher respiratory protection for healthcare personnel."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Safety and Infection Control / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-003:source-backed-promote'
WHERE id='gen-nemotron-1780623920-1-mcnm6';

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    references_json='[{"title":"ADA Standards of Care in Diabetes - 2026","citation":"American Diabetes Association Standards of Care in Diabetes 2026: current evidence-based clinical practice recommendations for diabetes care."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Physiological Adaptation / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-003:source-backed-promote'
WHERE id='gen-nemotron-1780614921-3-tx6zb';

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    stem='A 35-year-old male with partial-thickness burns covering 30% of total body surface area (TBSA) is admitted to the burn unit. He is alert and oriented with stable vital signs. Fluid resuscitation is critical during the first 24 hours. Which action is the priority for monitoring the effectiveness of fluid resuscitation?',
    rationale='Hourly urine output is the priority endpoint for burn-fluid resuscitation because it reflects renal perfusion and intravascular volume response. Wound antibiotics, beta-blockers, and potassium binders do not evaluate whether resuscitation is restoring end-organ perfusion.',
    deep_rationale='Major burns trigger capillary leak, third spacing, and rapid intravascular volume depletion, so formula-based fluid estimates must be titrated to patient response. Hourly urine output is the practical bedside marker of renal perfusion and resuscitation adequacy in the first 24 hours. Topical antibiotics address infection prevention but not perfusion. Beta-blockers can obscure compensatory tachycardia and are not the endpoint for initial resuscitation. Potassium binders are not first-line monitoring for burn shock. Clinical pearl: in adult burn resuscitation, adjust fluids to perfusion markers, especially urine output.',
    references_json='[{"title":"American Burn Association Advanced Burn Life Support","citation":"ABLS burn resuscitation guidance uses urine output as a key endpoint for titrating fluid resuscitation."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Physiological Adaptation / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-003:source-backed-promote'
WHERE id='gen-nemotron-1780618521-3-utjt1';

UPDATE questions
SET publish_state='published',
    review_status='final-curated-live',
    difficulty=4,
    options='[{"id":"a","text":"Use povidone-iodine solution to cleanse the insertion site before applying a new transparent dressing."},{"id":"b","text":"Use a chlorhexidine preparation with alcohol to cleanse the insertion site, working from the insertion site outward, and allow it to dry fully before applying the dressing."},{"id":"c","text":"Apply a new dressing without cleansing the site because the existing dressing appears intact and dry."},{"id":"d","text":"Cleanse the site with normal saline solution to avoid skin irritation from antiseptics."}]',
    rationale='A chlorhexidine preparation with alcohol is recommended for central-line skin antisepsis during dressing care because it reduces catheter-related bloodstream infection risk. The site should be cleaned using aseptic technique and allowed to dry before the dressing is applied.',
    deep_rationale='CLABSI prevention depends on lowering skin bioburden and preventing organisms from tracking along the catheter. CDC guidance supports a chlorhexidine preparation with alcohol for central venous catheter skin antisepsis during insertion and dressing changes when not contraindicated. Povidone-iodine is not preferred when chlorhexidine-alcohol can be used, normal saline has no antimicrobial activity, and skipping antisepsis because a dressing looks dry misses the main contamination risk. Clinical pearl: central-line dressing care is aseptic skin antisepsis plus dry time, not just replacing the cover.',
    distractor_rationales='{"a":"Povidone-iodine may be used when chlorhexidine is contraindicated, but chlorhexidine with alcohol is preferred for CLABSI prevention because it has stronger residual antimicrobial activity.","c":"An intact-looking dressing does not remove skin organisms; skipping antisepsis increases catheter-related bloodstream infection risk.","d":"Normal saline can remove debris but has no antimicrobial activity and does not provide CLABSI-prevention skin antisepsis."}',
    references_json='[{"title":"CDC Intravascular Catheter Infection Prevention Recommendations","citation":"CDC guidance recommends preparing clean skin with a greater than 0.5% chlorhexidine preparation with alcohol before central venous catheter insertion and during dressing changes."},{"title":"NCSBN NCLEX-RN Test Plan 2026","citation":"NCSBN 2026 RN Test Plan, Safety and Infection Control / Clinical Judgment."}]',
    deep_rationale_authored_at=unixepoch(),
    provenance=COALESCE(provenance,'gen') || '|editorial-batch-003:source-backed-promote'
WHERE id='gen-nemotron-1780618521-5-nfn1u';
