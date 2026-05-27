import type { FreeQuestion } from "@/components/seo/FreeLandingPage";

export const SEED_CARDIAC: FreeQuestion[] = [
  {
    id: "card1",
    category: "Cardiac · MCQ",
    stem: "A client with a history of HFrEF presents with worsening dyspnea, JVD, and 3+ pitting edema. Vitals: BP 92/58, HR 118, SpO2 90% on RA. Which provider order would the nurse question?",
    options: [
      { id: "a", text: "Furosemide 40 mg IV push" },
      { id: "b", text: "Oxygen 2 L via nasal cannula" },
      { id: "c", text: "Metoprolol 25 mg PO now" },
      { id: "d", text: "Daily weights" },
    ],
    answer: "c",
    rationale: "Beta-blockers are essential in chronic HFrEF management but should be held or reduced during acute decompensation with hypotension and tachycardia. Initiating or escalating metoprolol while the client is hypotensive can worsen cardiac output. Furosemide treats volume overload, oxygen treats hypoxia, daily weights monitor fluid status.",
  },
  {
    id: "card2",
    category: "Cardiac · MCQ",
    stem: "Which finding indicates that a client receiving IV nitroglycerin for unstable angina is having an adverse reaction?",
    options: [
      { id: "a", text: "Throbbing headache rated 5/10" },
      { id: "b", text: "Blood pressure drop from 140/86 to 84/52" },
      { id: "c", text: "Heart rate increase from 76 to 92" },
      { id: "d", text: "Resolved chest pain" },
    ],
    answer: "b",
    rationale: "Nitroglycerin causes venodilation and can drop preload severely, especially in clients who are volume-depleted or have right ventricular involvement. Systolic below 90 requires holding the drug and notifying the provider. Headache is expected. Reflex tachycardia is expected. Resolved chest pain is the desired outcome.",
  },
  {
    id: "card3",
    category: "Cardiac · MCQ",
    stem: "A client returns from cardiac catheterization with a right femoral access site. Which finding requires immediate intervention?",
    options: [
      { id: "a", text: "Pedal pulses 2+ bilaterally" },
      { id: "b", text: "Small ecchymosis around access site" },
      { id: "c", text: "Cool, mottled right foot with weak posterior tibial pulse" },
      { id: "d", text: "Mild groin discomfort 3/10" },
    ],
    answer: "c",
    rationale: "Cool, mottled extremity with diminished pulse distal to a femoral access site suggests arterial compromise from hematoma, thrombus, or vessel injury. Requires immediate provider notification and ultrasound. Bilateral 2+ pulses are reassuring. Small ecchymosis is expected. Mild discomfort is normal.",
  },
];

export const SEED_RESPIRATORY: FreeQuestion[] = [
  {
    id: "resp1",
    category: "Respiratory · MCQ",
    stem: "A client with COPD on 4 L oxygen via nasal cannula becomes progressively more drowsy. ABG: pH 7.28, PaCO2 68, PaO2 78. What should the nurse do first?",
    options: [
      { id: "a", text: "Increase oxygen to 6 L" },
      { id: "b", text: "Decrease oxygen to 2 L and notify the provider" },
      { id: "c", text: "Encourage the client to take deep breaths" },
      { id: "d", text: "Position client supine for comfort" },
    ],
    answer: "b",
    rationale: "This is CO2 narcosis: chronic CO2 retainers can lose hypoxic drive when given too much oxygen. Drowsiness with acute respiratory acidosis (pH 7.28, PaCO2 68) means PaCO2 is climbing. Decreasing oxygen to the lowest level maintaining SpO2 88–92% is the priority, then provider notification for possible BiPAP. Increasing O2 worsens the problem. Supine position worsens dyspnea.",
  },
  {
    id: "resp2",
    category: "Respiratory · MCQ",
    stem: "Which assessment finding indicates a potentially life-threatening complication of a chest tube?",
    options: [
      { id: "a", text: "Continuous bubbling in the water seal chamber" },
      { id: "b", text: "Tidaling in the water seal chamber" },
      { id: "c", text: "150 mL serosanguineous drainage in 24 hours" },
      { id: "d", text: "Crepitus in the chest wall around insertion site" },
    ],
    answer: "a",
    rationale: "Continuous bubbling in the water seal indicates an air leak from the lung, tubing, or insertion site — could signal worsening pneumothorax or tube disconnection. Tidaling is expected (it shows the system is patent). 150 mL/day drainage is acceptable. Crepitus warrants documentation and monitoring but is not immediately life-threatening unless rapidly progressing.",
  },
  {
    id: "resp3",
    category: "Respiratory · MCQ",
    stem: "A client with status asthmaticus is becoming quiet with shallow breathing after 30 minutes of nebulized albuterol. What does this finding suggest?",
    options: [
      { id: "a", text: "Improvement — the client is responding to treatment" },
      { id: "b", text: "Impending respiratory failure" },
      { id: "c", text: "Medication side effect" },
      { id: "d", text: "Adequate hydration" },
    ],
    answer: "b",
    rationale: "A 'silent chest' in status asthmaticus is ominous — airways are so narrowed that air movement is minimal. The client is exhausted and approaching respiratory failure. Requires immediate escalation: IV steroids, magnesium, possible intubation. Quiet breath sounds in an asthmatic in crisis are NEVER a good sign.",
  },
];

export const SEED_ENDOCRINE: FreeQuestion[] = [
  {
    id: "endo1",
    category: "Endocrine · MCQ",
    stem: "A client with type 1 diabetes is admitted with DKA. Initial labs: glucose 580, K+ 5.2, pH 7.20. Which order should the nurse implement first?",
    options: [
      { id: "a", text: "Start regular insulin IV drip at 0.1 units/kg/hr" },
      { id: "b", text: "Bolus 1 L normal saline IV" },
      { id: "c", text: "Administer sodium bicarbonate IV" },
      { id: "d", text: "Give 40 mEq KCl PO" },
    ],
    answer: "b",
    rationale: "DKA treatment priority: fluids first (1 L NS bolus), then insulin, then potassium replacement as it drops. Insulin without volume resuscitation can drop blood pressure dangerously and worsen perfusion. Sodium bicarbonate is reserved for pH below 6.9 in most protocols. K+ 5.2 doesn't need replacement yet (but will drop with insulin).",
  },
  {
    id: "endo2",
    category: "Endocrine · MCQ",
    stem: "A client returns from a thyroidectomy. Which finding is the MOST concerning?",
    options: [
      { id: "a", text: "Hoarse voice" },
      { id: "b", text: "Sore throat" },
      { id: "c", text: "Stridor and difficulty swallowing" },
      { id: "d", text: "Numbness around the mouth" },
    ],
    answer: "c",
    rationale: "Stridor post-thyroidectomy signals airway compromise from hematoma or laryngeal edema — surgical emergency requiring immediate provider notification and bedside opening of the incision if compression is severe. Hoarse voice may indicate recurrent laryngeal nerve irritation (usually transient). Sore throat is expected. Perioral numbness signals hypocalcemia from inadvertent parathyroid removal — also serious but secondary to airway.",
  },
  {
    id: "endo3",
    category: "Endocrine · MCQ",
    stem: "A client with Addison's disease is admitted in adrenal crisis. Which intervention is the priority?",
    options: [
      { id: "a", text: "Administer IV hydrocortisone immediately" },
      { id: "b", text: "Restrict fluids to prevent overload" },
      { id: "c", text: "Begin slow IV insulin drip" },
      { id: "d", text: "Encourage oral salt intake" },
    ],
    answer: "a",
    rationale: "Adrenal crisis is a life-threatening cortisol deficiency. Immediate IV hydrocortisone (100 mg) is the priority. The client typically needs aggressive volume resuscitation (NOT fluid restriction) for hypotension and hyponatremia. Insulin worsens hypoglycemia common in this state. Oral salt is far too slow for crisis.",
  },
];

export const SEED_BOWTIE: FreeQuestion[] = [
  {
    id: "bt1",
    category: "Bow-tie · sepsis",
    stem: "A 72-year-old presents with fever 102.6°F, HR 122, BP 86/48, RR 28, WBC 18,200, lactate 4.2, and mottled extremities. The decision map should match what condition with what 2 actions and what 2 monitoring parameters? (Identify in the rationale.)",
    options: [
      { id: "a", text: "Center: Septic shock" },
      { id: "b", text: "Action: Begin 30 mL/kg crystalloid bolus and start broad-spectrum antibiotics within 1 hour" },
      { id: "c", text: "Monitor: MAP target ≥ 65 mmHg and serial lactate trending downward" },
      { id: "d", text: "Action: Hold antibiotics until cultures result" },
    ],
    answer: ["a", "b", "c"],
    rationale: "Septic shock = sepsis + persistent hypotension requiring vasopressors or lactate > 2 despite fluids. Bow-tie: center is septic shock; left actions are 30 mL/kg crystalloid bolus + antibiotics within 1 hour (every hour of delay increases mortality ~7.6%); right monitoring is MAP ≥ 65 and trending lactate. Holding antibiotics for cultures is wrong — give empirically.",
  },
  {
    id: "bt2",
    category: "Bow-tie · DKA",
    stem: "A 16-year-old with type 1 diabetes presents with glucose 560, pH 7.18, HCO3 9, K+ 5.4, and ketonuria. Which actions and monitoring complete the bow-tie for this DKA?",
    options: [
      { id: "a", text: "Center: Diabetic ketoacidosis (DKA)" },
      { id: "b", text: "Action: Start IV NS bolus then continuous insulin infusion 0.1 units/kg/hr" },
      { id: "c", text: "Monitor: Hourly glucose and serial potassium every 2 hours" },
      { id: "d", text: "Action: Give subcutaneous regular insulin only" },
    ],
    answer: ["a", "b", "c"],
    rationale: "DKA bow-tie: center is DKA; left actions are isotonic fluid resuscitation followed by IV insulin drip (subcutaneous insulin is not appropriate for active DKA — absorption is unreliable in dehydration); right monitoring is hourly glucose (target drop of 50–75 mg/dL/hr) and potassium every 2 hours because insulin drives K+ intracellularly, often dropping it dangerously.",
  },
];

export const SEED_MATRIX: FreeQuestion[] = [
  {
    id: "mtx1",
    category: "Matrix · stroke triage",
    stem: "For each finding, identify whether it supports a diagnosis of acute ischemic stroke requiring immediate workup, or a less urgent presentation.",
    options: [
      { id: "a", text: "Unilateral facial droop with new arm weakness — Acute stroke" },
      { id: "b", text: "Gradual headache with photophobia over 3 days — Less urgent" },
      { id: "c", text: "Sudden inability to speak — Acute stroke" },
      { id: "d", text: "Stable chronic dizziness with normal exam — Less urgent" },
    ],
    answer: ["a", "b", "c", "d"],
    rationale: "Sudden unilateral neurologic deficits (facial droop, arm weakness, aphasia) trigger stroke alert and tPA window evaluation. Subacute headaches and chronic stable symptoms can be worked up routinely. The FAST mnemonic (Face, Arms, Speech, Time) captures this triage in one cue.",
  },
];

export const SEED_DELEGATION: FreeQuestion[] = [
  {
    id: "del1",
    category: "Delegation · MCQ",
    stem: "Which task is appropriate to delegate to an LPN working under an RN?",
    options: [
      { id: "a", text: "Initial assessment of a newly admitted client" },
      { id: "b", text: "Administration of a routine oral antibiotic to a stable client" },
      { id: "c", text: "Teaching a client about a new diabetes diagnosis" },
      { id: "d", text: "Evaluation of a client's response to a blood transfusion" },
    ],
    answer: "b",
    rationale: "LPNs can administer oral medications to stable clients and reinforce teaching done by the RN. Initial assessment, original teaching, and evaluation of complex responses remain RN responsibilities. Always verify against your state's nurse practice act.",
  },
  {
    id: "del2",
    category: "Delegation · MCQ",
    stem: "A charge nurse is reviewing assignments. Which task should NOT be delegated to a UAP?",
    options: [
      { id: "a", text: "Recording intake and output for a stable client" },
      { id: "b", text: "Ambulating a client recovering from a hip replacement on post-op day 2" },
      { id: "c", text: "Assessing a client's pain level before pain medication" },
      { id: "d", text: "Bathing a client with stable vital signs" },
    ],
    answer: "c",
    rationale: "Pain assessment requires nursing judgment and cannot be delegated. The other tasks are routine, predictable, and appropriate for UAP. The five rights of delegation: right task, right circumstance, right person, right direction, right supervision.",
  },
  {
    id: "del3",
    category: "Delegation · MCQ",
    stem: "Which client should be assigned to the most experienced RN?",
    options: [
      { id: "a", text: "Stable post-op day 3 client awaiting discharge teaching" },
      { id: "b", text: "Newly admitted client with chest pain and ST changes on EKG" },
      { id: "c", text: "Client receiving routine IV antibiotics" },
      { id: "d", text: "Client with a chronic wound needing daily dressing change" },
    ],
    answer: "b",
    rationale: "Newly admitted, unstable clients with potential cardiac emergencies need the most experienced RN. The other clients are stable and predictable. Assignment rules: complexity, instability, and acuity drive the experienced-nurse assignment.",
  },
];

export const SEED_SAFETY: FreeQuestion[] = [
  {
    id: "saf1",
    category: "Safety · MCQ",
    stem: "A nurse identifies a sentinel event after a client falls and sustains a hip fracture. Which is the priority next action?",
    options: [
      { id: "a", text: "Document the event in the chart" },
      { id: "b", text: "Notify the provider and immediately assess the client" },
      { id: "c", text: "Begin a root cause analysis" },
      { id: "d", text: "Complete an incident report" },
    ],
    answer: "b",
    rationale: "Assessment and provider notification are immediate priorities — client safety first. Documentation, incident report, and RCA follow. The incident report is internal QI documentation and is NOT placed in the chart.",
  },
  {
    id: "saf2",
    category: "Safety · MCQ",
    stem: "Which client requires airborne precautions?",
    options: [
      { id: "a", text: "Client with C. difficile diarrhea" },
      { id: "b", text: "Client with active pulmonary tuberculosis" },
      { id: "c", text: "Client with MRSA wound infection" },
      { id: "d", text: "Client with influenza" },
    ],
    answer: "b",
    rationale: "TB requires airborne precautions (negative pressure room, N95). C. diff and MRSA require contact precautions. Flu requires droplet precautions. Airborne diseases include TB, measles, varicella.",
  },
  {
    id: "saf3",
    category: "Safety · MCQ",
    stem: "When restraining a client for safety, which is the MOST critical nursing action?",
    options: [
      { id: "a", text: "Use the least-restrictive option that ensures safety" },
      { id: "b", text: "Tie restraints to the side rails for accessibility" },
      { id: "c", text: "Restrain the client until family arrives" },
      { id: "d", text: "Document the restraint use at the end of shift" },
    ],
    answer: "a",
    rationale: "Least-restrictive principle is foundational. Restraints tied to side rails can cause injury when the rail moves. Restraints require a time-limited provider order (1 hour for behavioral, up to 24 hours for medical) with monitoring every 15–30 min and reassessment at order expiration.",
  },
];

export const SEED_LAB_VALUES_Q: FreeQuestion[] = [
  {
    id: "lab1",
    category: "Lab interpretation · MCQ",
    stem: "A client receiving digoxin has a serum potassium of 2.9 mEq/L. Which is the priority intervention?",
    options: [
      { id: "a", text: "Continue the digoxin and document the K+" },
      { id: "b", text: "Hold the next digoxin dose and notify the provider for K+ replacement" },
      { id: "c", text: "Increase the digoxin dose to compensate" },
      { id: "d", text: "Encourage potassium-rich foods at the next meal" },
    ],
    answer: "b",
    rationale: "Hypokalemia (K+ <3.5) significantly increases digoxin toxicity risk. With K+ at 2.9, hold the dig and replace potassium IV or PO depending on severity. Foods alone won't correct this fast enough.",
  },
  {
    id: "lab2",
    category: "Lab interpretation · MCQ",
    stem: "Which ABG result indicates uncompensated metabolic acidosis?",
    options: [
      { id: "a", text: "pH 7.32, PaCO2 38, HCO3 18" },
      { id: "b", text: "pH 7.46, PaCO2 28, HCO3 22" },
      { id: "c", text: "pH 7.30, PaCO2 50, HCO3 24" },
      { id: "d", text: "pH 7.36, PaCO2 30, HCO3 18" },
    ],
    answer: "a",
    rationale: "Uncompensated metabolic acidosis: low pH (<7.35), low HCO3 (<22), normal PaCO2 (35–45). Option B is respiratory alkalosis. Option C is respiratory acidosis. Option D shows compensated metabolic acidosis (pH normalized, PaCO2 dropped to compensate).",
  },
  {
    id: "lab3",
    category: "Lab interpretation · MCQ",
    stem: "A client receiving vancomycin has a trough of 24 mcg/mL. Which action is most appropriate?",
    options: [
      { id: "a", text: "Continue the same dose" },
      { id: "b", text: "Hold the next dose and notify the provider" },
      { id: "c", text: "Increase the dose to maintain therapy" },
      { id: "d", text: "Switch to oral vancomycin" },
    ],
    answer: "b",
    rationale: "Therapeutic vancomycin trough is 10–20 mcg/mL. A trough of 24 is supratherapeutic and increases nephrotoxicity and ototoxicity risk. Hold the dose, notify the provider, and check renal function. Oral vancomycin is used for C. diff colitis, not systemic infection.",
  },
];
