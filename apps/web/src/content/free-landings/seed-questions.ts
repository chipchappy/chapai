import type { FreeQuestion } from "@/components/seo/FreeLandingPage";

export const SEED_CASE_STUDIES: FreeQuestion[] = [
  {
    id: "cs1",
    category: "Cardiac · NGN case study",
    stem: "A 62-year-old client arrives in the ED with crushing substernal chest pain radiating to the left arm, diaphoresis, and a heart rate of 112 bpm. The 12-lead ECG shows ST elevation in leads II, III, and aVF. Troponin is 4.8 ng/mL. The provider orders aspirin 325 mg, sublingual nitroglycerin, and prepares for cardiac catheterization. Which finding would most prompt the nurse to hold the nitroglycerin?",
    options: [
      { id: "a", text: "Blood pressure 88/52 mmHg" },
      { id: "b", text: "Heart rate 102 bpm" },
      { id: "c", text: "Reports pain of 7/10" },
      { id: "d", text: "SpO2 95% on 2L nasal cannula" },
    ],
    answer: "a",
    rationale:
      "Inferior wall MI (II, III, aVF) frequently involves the right ventricle, which is preload-dependent. Nitroglycerin causes venodilation, dropping preload, and in RV infarction can precipitate profound hypotension and shock. A systolic of 88 with an inferior STEMI is an absolute contraindication. Heart rate 102 is appropriate sympathetic response, pain warrants treatment, and SpO2 95% is acceptable.",
  },
  {
    id: "cs2",
    category: "Respiratory · NGN case study",
    stem: "A 4-year-old with a known peanut allergy is brought to the clinic after accidentally eating a granola bar. The child has stridor, lip swelling, and audible wheezing. Vital signs: HR 148, RR 38, BP 78/40, SpO2 88% on room air. Which intervention is the priority?",
    options: [
      { id: "a", text: "Administer oral diphenhydramine" },
      { id: "b", text: "Administer IM epinephrine 0.15 mg" },
      { id: "c", text: "Start an IV of 0.9% NaCl bolus" },
      { id: "d", text: "Apply 6 L oxygen via simple mask" },
    ],
    answer: "b",
    rationale:
      "Anaphylaxis with airway compromise (stridor), respiratory distress, and hypotension requires immediate IM epinephrine to the mid-anterolateral thigh. Epinephrine reverses bronchoconstriction, restores vascular tone, and stabilizes mast cells. Antihistamines are adjuncts only and do not treat airway swelling. IV fluids and oxygen follow epinephrine, not before it.",
  },
  {
    id: "cs3",
    category: "Endocrine · NGN case study",
    stem: "A client with type 1 diabetes is admitted with blood glucose 612 mg/dL, pH 7.18, HCO3 12 mEq/L, K+ 5.4 mEq/L, and ketones in the urine. The provider orders an IV insulin infusion. After 2 hours of treatment, the K+ is 3.3 mEq/L. What is the nurse's priority action?",
    options: [
      { id: "a", text: "Continue insulin and notify the provider for potassium replacement" },
      { id: "b", text: "Hold insulin until potassium is rechecked in 4 hours" },
      { id: "c", text: "Administer 10 units of regular insulin IV push" },
      { id: "d", text: "Encourage the client to drink orange juice with a banana" },
    ],
    answer: "a",
    rationale:
      "Insulin drives potassium intracellularly. In DKA, hypokalemia is expected once treatment begins and is life-threatening (dysrhythmia risk) below 3.3 mEq/L. The protocol is to continue insulin while replacing potassium IV — not to hold insulin, which would cause rebound ketosis. Holding insulin without addressing potassium also delays correction of acidosis. Oral intake in DKA is unsafe.",
  },
  {
    id: "cs4",
    category: "Neuro · NGN case study",
    stem: "A 28-year-old is admitted after a motor vehicle collision with a Glasgow Coma Scale of 7. ICP monitoring shows pressures of 24 mmHg sustained over 10 minutes. Which intervention is most appropriate?",
    options: [
      { id: "a", text: "Lower the head of bed to flat" },
      { id: "b", text: "Cluster nursing care to provide rest periods" },
      { id: "c", text: "Administer prescribed mannitol 1 g/kg IV" },
      { id: "d", text: "Suction the airway every 30 minutes" },
    ],
    answer: "c",
    rationale:
      "Normal ICP is 5–15 mmHg; sustained pressure above 20 mmHg requires intervention to prevent herniation. Mannitol is an osmotic diuretic that pulls fluid from brain tissue. Head of bed should be 30°, not flat. Clustering care raises ICP — care should be spaced. Routine suctioning raises ICP; suction only as needed with pre-oxygenation.",
  },
  {
    id: "cs5",
    category: "Maternity · NGN case study",
    stem: "A laboring client at 39 weeks suddenly reports severe abdominal pain. The nurse notes dark red vaginal bleeding, a rigid uterus, and fetal heart tones drop to 90 bpm. Maternal vitals: BP 86/48, HR 132. Which complication is most likely?",
    options: [
      { id: "a", text: "Placenta previa" },
      { id: "b", text: "Placental abruption" },
      { id: "c", text: "Uterine rupture" },
      { id: "d", text: "Cord prolapse" },
    ],
    answer: "b",
    rationale:
      "The classic triad of placental abruption is painful dark vaginal bleeding, a rigid/board-like uterus, and non-reassuring fetal heart tones. Placenta previa is painless bright red bleeding. Uterine rupture typically follows a previous uterine scar with sudden cessation of contractions. Cord prolapse presents with a visible or palpable cord and variable decelerations.",
  },
];

export const SEED_SATA: FreeQuestion[] = [
  {
    id: "sata1",
    category: "Pharmacology · SATA",
    stem: "A nurse is teaching a client about warfarin therapy. Which statements indicate the teaching has been effective? Select all that apply.",
    options: [
      { id: "a", text: "I should call my provider if I see blood in my urine." },
      { id: "b", text: "I will avoid large amounts of leafy green vegetables." },
      { id: "c", text: "I can take ibuprofen for headaches." },
      { id: "d", text: "I will use an electric razor for shaving." },
      { id: "e", text: "I will get my INR checked as scheduled." },
    ],
    answer: ["a", "b", "d", "e"],
    rationale:
      "Warfarin increases bleeding risk so hematuria warrants provider notification (A). Vitamin K from leafy greens antagonizes warfarin, so consistency rather than total avoidance is the goal, but large variations are problematic (B is acceptable phrasing). Electric razors reduce cut risk (D). INR monitoring is essential (E). Ibuprofen (C) is an NSAID that increases bleeding risk and is contraindicated — acetaminophen is preferred.",
  },
  {
    id: "sata2",
    category: "Cardiac · SATA",
    stem: "Which assessment findings should the nurse expect in a client with left-sided heart failure? Select all that apply.",
    options: [
      { id: "a", text: "Crackles in the lung bases" },
      { id: "b", text: "Jugular vein distention" },
      { id: "c", text: "Dyspnea on exertion" },
      { id: "d", text: "Peripheral edema" },
      { id: "e", text: "Orthopnea" },
    ],
    answer: ["a", "c", "e"],
    rationale:
      "Left-sided failure backs up into the pulmonary circulation, producing pulmonary congestion: crackles, dyspnea on exertion, orthopnea, and paroxysmal nocturnal dyspnea. JVD and peripheral edema are signs of right-sided failure, where venous return backs up systemically. Many patients eventually develop both, but the question asks for left-sided findings.",
  },
  {
    id: "sata3",
    category: "Infection control · SATA",
    stem: "A client is admitted with active pulmonary tuberculosis. Which precautions should the nurse implement? Select all that apply.",
    options: [
      { id: "a", text: "Place the client in a negative-pressure room" },
      { id: "b", text: "Wear an N95 respirator when entering the room" },
      { id: "c", text: "Use a surgical mask when transporting the client" },
      { id: "d", text: "Have the client wear an N95 during transport" },
      { id: "e", text: "Keep the door open for ventilation" },
    ],
    answer: ["a", "b"],
    rationale:
      "TB requires airborne precautions: negative-pressure room with door closed, N95 or PAPR for staff. During transport the client wears a surgical mask (not N95) to contain droplet nuclei — the staff member outside the room can wear a regular mask. Door must remain closed to maintain negative pressure.",
  },
  {
    id: "sata4",
    category: "Pediatrics · SATA",
    stem: "Which findings in a 6-month-old infant would prompt immediate provider notification? Select all that apply.",
    options: [
      { id: "a", text: "Sunken anterior fontanel" },
      { id: "b", text: "Capillary refill of 4 seconds" },
      { id: "c", text: "Mottled extremities" },
      { id: "d", text: "Wet diaper count of 6 in 24 hours" },
      { id: "e", text: "Lethargy and weak cry" },
    ],
    answer: ["a", "b", "c", "e"],
    rationale:
      "Sunken fontanel signals dehydration. Cap refill greater than 3 seconds and mottling indicate poor perfusion. Lethargy and weak cry are red flags for sepsis or severe dehydration. 6 wet diapers in 24 hours is within normal limits (expected 6–8 daily) — that finding is reassuring, not concerning.",
  },
  {
    id: "sata5",
    category: "Mental health · SATA",
    stem: "Which interventions are appropriate when caring for a client in acute alcohol withdrawal? Select all that apply.",
    options: [
      { id: "a", text: "Administer lorazepam as prescribed" },
      { id: "b", text: "Initiate seizure precautions" },
      { id: "c", text: "Restrain the client to prevent injury" },
      { id: "d", text: "Monitor vital signs every 4 hours" },
      { id: "e", text: "Provide thiamine before glucose" },
    ],
    answer: ["a", "b", "e"],
    rationale:
      "Benzodiazepines (lorazepam) are first-line for withdrawal symptom control. Seizure precautions are essential — withdrawal seizures occur 6–48 hours after last drink. Thiamine before glucose prevents Wernicke's encephalopathy. Restraints worsen agitation and are last-resort. Vital signs in active withdrawal need to be every 1–2 hours, not every 4.",
  },
];

export const SEED_PRIORITIZATION: FreeQuestion[] = [
  {
    id: "pri1",
    category: "Prioritization · MCQ",
    stem: "A nurse on a medical unit has received report on four clients. Which client should the nurse assess first?",
    options: [
      { id: "a", text: "A client with pneumonia and a temperature of 101.2°F" },
      { id: "b", text: "A client 1 day post-op who reports 6/10 incisional pain" },
      { id: "c", text: "A client with COPD and an SpO2 of 86% on 2L oxygen" },
      { id: "d", text: "A client with cellulitis awaiting IV antibiotics" },
    ],
    answer: "c",
    rationale:
      "ABC principles: airway and breathing trump everything else. SpO2 of 86% on supplemental oxygen represents an acute oxygenation problem requiring immediate assessment. While the COPD client's baseline may be lower than 95%, 86% is dangerous and the trajectory matters. The other clients have problems that can be addressed in sequence after the unstable one is stabilized.",
  },
  {
    id: "pri2",
    category: "Delegation · MCQ",
    stem: "Which task is most appropriate for the nurse to delegate to unlicensed assistive personnel (UAP)?",
    options: [
      { id: "a", text: "Assessing a new admission's pain level" },
      { id: "b", text: "Teaching insulin injection technique" },
      { id: "c", text: "Recording intake and output for a stable client" },
      { id: "d", text: "Evaluating wound healing on a postoperative client" },
    ],
    answer: "c",
    rationale:
      "Delegation rules: routine, predictable tasks for stable clients can go to UAP. Assessment, teaching, and evaluation are nursing process steps that require nursing judgment and cannot be delegated. I&O for a stable client is a measurable, repeatable task with no clinical judgment required.",
  },
  {
    id: "pri3",
    category: "Triage · MCQ",
    stem: "In a mass casualty event, which client should the nurse triage as red (immediate)?",
    options: [
      { id: "a", text: "An adult with a respiratory rate of 32 and active bleeding from the femoral artery" },
      { id: "b", text: "A child with a closed fracture of the forearm" },
      { id: "c", text: "An elderly adult with no pulse or respirations" },
      { id: "d", text: "A teenager with superficial lacerations to the face" },
    ],
    answer: "a",
    rationale:
      "START triage: red (immediate) = life-threatening but salvageable. Femoral arterial bleeding plus tachypnea is salvageable with rapid intervention. Black (expectant) = no pulse/respirations in mass casualty context. Yellow (delayed) = closed fractures. Green (minor/walking wounded) = superficial wounds.",
  },
  {
    id: "pri4",
    category: "Prioritization · MCQ",
    stem: "A nurse is caring for four postoperative clients. Which client requires the most immediate intervention?",
    options: [
      { id: "a", text: "Post-op day 1 hip replacement with hemoglobin 9.8 g/dL" },
      { id: "b", text: "Post-op day 2 cholecystectomy with absent bowel sounds in all four quadrants" },
      { id: "c", text: "Post-op day 0 thyroidectomy with stridor and difficulty swallowing" },
      { id: "d", text: "Post-op day 3 hysterectomy with urine output of 35 mL/hr" },
    ],
    answer: "c",
    rationale:
      "Stridor post-thyroidectomy signals airway compromise from hematoma or laryngeal edema — surgical emergency, ABC priority. Hgb 9.8 post-hip is anticipated. Absent bowel sounds on day 2 post-cholecystectomy is concerning but not immediately life-threatening. Urine output 35 mL/hr meets the 30 mL/hr minimum.",
  },
  {
    id: "pri5",
    category: "Priority drug · MCQ",
    stem: "A nurse is preparing to administer four scheduled morning medications. Which should be given first?",
    options: [
      { id: "a", text: "Levothyroxine 100 mcg PO to a client with hypothyroidism" },
      { id: "b", text: "Furosemide 40 mg IV to a client with a potassium of 3.0 mEq/L" },
      { id: "c", text: "Regular insulin 6 units subq to a client with glucose 142" },
      { id: "d", text: "Metoprolol 25 mg PO to a client with a heart rate of 78" },
    ],
    answer: "c",
    rationale:
      "Regular insulin acts in 30 minutes and the client needs coverage before breakfast — timing-critical. Levothyroxine should be held until labs are reviewed (or given but not first). Furosemide must be held: giving it with K+ of 3.0 will worsen hypokalemia — provider notification needed first. Metoprolol with HR 78 is acceptable but not urgent.",
  },
];

export const SEED_PHARM: FreeQuestion[] = [
  {
    id: "ph1",
    category: "Pharmacology · MCQ",
    stem: "A client receiving IV heparin has an aPTT of 145 seconds (therapeutic 60–80 seconds). What is the nurse's priority action?",
    options: [
      { id: "a", text: "Increase the heparin infusion rate" },
      { id: "b", text: "Stop the infusion and notify the provider" },
      { id: "c", text: "Administer vitamin K" },
      { id: "d", text: "Continue the infusion and recheck in 4 hours" },
    ],
    answer: "b",
    rationale:
      "An aPTT nearly double the therapeutic range puts the client at severe bleeding risk. The infusion must be stopped immediately and the provider notified for protamine sulfate (heparin's antidote) consideration. Vitamin K reverses warfarin, not heparin. Continuing or increasing the rate worsens the bleeding risk.",
  },
  {
    id: "ph2",
    category: "Pharmacology · MCQ",
    stem: "Which finding requires the nurse to hold the next dose of digoxin?",
    options: [
      { id: "a", text: "Apical heart rate of 58 bpm" },
      { id: "b", text: "Serum potassium of 4.2 mEq/L" },
      { id: "c", text: "Blood pressure 118/72 mmHg" },
      { id: "d", text: "Serum digoxin level of 1.4 ng/mL" },
    ],
    answer: "a",
    rationale:
      "Hold digoxin if apical pulse is below 60 in adults (below 70 in children, below 90 in infants). K+ 4.2 is normal — hypokalemia worsens digoxin toxicity, not normal levels. BP 118/72 is fine. Therapeutic digoxin is 0.5–2.0 ng/mL; 1.4 is within range.",
  },
  {
    id: "ph3",
    category: "Pharmacology · MCQ",
    stem: "A client is prescribed lisinopril for hypertension. Which finding requires immediate provider notification?",
    options: [
      { id: "a", text: "Persistent dry cough" },
      { id: "b", text: "Swelling of the lips and tongue" },
      { id: "c", text: "Dizziness when standing" },
      { id: "d", text: "Serum potassium of 4.8 mEq/L" },
    ],
    answer: "b",
    rationale:
      "Angioedema is a life-threatening adverse effect of ACE inhibitors and can progress to airway obstruction. Dry cough is a common but not dangerous side effect, often a reason for switching to an ARB. Orthostatic dizziness is expected. K+ 4.8 is high-normal but ACE inhibitors do raise potassium — monitor, but not emergent.",
  },
  {
    id: "ph4",
    category: "Pharmacology · MCQ",
    stem: "Which laboratory value must the nurse verify before administering IV vancomycin?",
    options: [
      { id: "a", text: "Liver function tests" },
      { id: "b", text: "Serum creatinine and trough level" },
      { id: "c", text: "Hemoglobin and hematocrit" },
      { id: "d", text: "Prothrombin time" },
    ],
    answer: "b",
    rationale:
      "Vancomycin is nephrotoxic and dose adjustments depend on renal function. Trough levels (drawn 30 min before the next dose) guide dosing to keep levels therapeutic (typically 10–20 mcg/mL) without toxicity. LFTs, CBC, and PT are not the primary monitoring labs for vancomycin.",
  },
  {
    id: "ph5",
    category: "Pharmacology · MCQ",
    stem: "A client taking metformin is scheduled for a CT scan with IV contrast. What is the priority nursing action?",
    options: [
      { id: "a", text: "Give an extra dose of metformin before the scan" },
      { id: "b", text: "Hold metformin and confirm the provider's order" },
      { id: "c", text: "Notify radiology to use oral contrast instead" },
      { id: "d", text: "Administer 500 mL of IV saline post-procedure" },
    ],
    answer: "b",
    rationale:
      "Metformin combined with iodinated IV contrast risks lactic acidosis from contrast-induced acute kidney injury. Standard practice is to hold metformin at the time of contrast administration and for 48 hours after, restarting only after renal function is rechecked. Always confirm the specific provider order. Hydration is appropriate but secondary.",
  },
];

export const SEED_GENERAL: FreeQuestion[] = [
  ...SEED_CASE_STUDIES.slice(0, 2),
  ...SEED_SATA.slice(0, 1),
  ...SEED_PHARM.slice(0, 1),
  ...SEED_PRIORITIZATION.slice(0, 1),
];
