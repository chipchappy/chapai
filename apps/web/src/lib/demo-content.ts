/**
 * demo-content.ts — fully seeded, clinically realistic demo question bank.
 * Used by the /practice page for a fully self-contained demo experience.
 */

export type QuestionMode = "standard" | "case-study" | "chart" | "ngn";
export type ExamType = "nclex" | "ccrn";

export interface DemoOption {
  id: string;
  text: string;
}

export interface VitalSign {
  label: string;
  value: string;
  unit?: string;
  flag?: "high" | "low" | "critical" | "normal";
}

export interface LabValue {
  label: string;
  value: string;
  unit: string;
  reference?: string;
  flag?: "high" | "low" | "critical" | "normal";
}

export interface HemodynamicValue {
  label: string;
  value: string;
  unit: string;
  flag?: "high" | "low" | "critical" | "normal";
}

export interface StandardQuestion {
  mode: "standard";
  id: string;
  exam: ExamType;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  stem: string;
  options: DemoOption[];
  answer: string;
  rationale: string;
  distractorRationales?: Record<string, string>;
  takeaway?: string;
}

export interface CaseStudyQuestion {
  mode: "case-study";
  id: string;
  exam: ExamType;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  caseTitle: string;
  caseContext: string;
  vitals?: VitalSign[];
  labs?: LabValue[];
  hemodynamics?: HemodynamicValue[];
  stem: string;
  options: DemoOption[];
  answer: string;
  rationale: string;
  distractorRationales?: Record<string, string>;
  takeaway?: string;
}

export interface ChartDataRow {
  time: string;
  values: { label: string; value: string; flag?: "high" | "low" | "critical" | "normal" }[];
}

export interface ChartQuestion {
  mode: "chart";
  id: string;
  exam: ExamType;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  chartTitle: string;
  chartCaption: string;
  dataRows: ChartDataRow[];
  stem: string;
  options: DemoOption[];
  answer: string;
  rationale: string;
  distractorRationales?: Record<string, string>;
  takeaway?: string;
}

export interface NgnMatrixRow {
  label: string;
  columns?: string[];
  answer: string; // which column is correct
}

export interface NgnQuestion {
  mode: "ngn";
  id: string;
  exam: ExamType;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  scenarioTitle: string;
  scenario: string;
  additionalInfo?: string;
  stem: string;
  type: "matrix" | "multi-select";
  // Multi-select: select ALL that apply
  options?: DemoOption[];
  answers?: string[]; // multiple correct IDs
  // Matrix: each row mapped to a column
  matrixColumns?: string[];
  matrixRows?: NgnMatrixRow[];
  rationale: string;
  takeaway?: string;
}

export type DemoQuestion = StandardQuestion | CaseStudyQuestion | ChartQuestion | NgnQuestion;

// ─────────────────────────────────────────────────────────────────────────────
// STANDARD NCLEX QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

const standardNclex: StandardQuestion[] = [
  {
    mode: "standard",
    id: "demo-nclex-001",
    exam: "nclex",
    category: "Management of Care",
    difficulty: 3,
    stem: "A nurse is caring for four patients on a medical-surgical unit. Which patient requires the nurse's immediate assessment?\n\nA. A 52-year-old with COPD reporting increased dyspnea and an SpO₂ of 88% on 2 L/min nasal cannula (baseline SpO₂ 86–90%)\nB. A 67-year-old post-op day 1 after hip replacement reporting incision pain rated 7/10\nC. A 44-year-old with new-onset confusion and a blood pressure of 88/54 mmHg\nD. A 71-year-old with heart failure whose weight increased 1.5 kg since yesterday",
    options: [
      { id: "a", text: "A 52-year-old with COPD reporting increased dyspnea and SpO₂ of 88%" },
      { id: "b", text: "A 67-year-old post-op day 1 reporting incision pain rated 7/10" },
      { id: "c", text: "A 44-year-old with new-onset confusion and BP of 88/54 mmHg" },
      { id: "d", text: "A 71-year-old with heart failure whose weight increased 1.5 kg since yesterday" },
    ],
    answer: "c",
    rationale:
      "New-onset confusion with hypotension (BP 88/54) represents altered mental status combined with hemodynamic instability — classic early signs of septic shock or acute decompensation. This patient's presentation indicates inadequate organ perfusion and requires immediate assessment and intervention. The COPD patient's SpO₂ is near their documented baseline. The post-op pain patient is uncomfortable but stable. The heart failure patient needs monitoring but is not in immediate danger.",
    distractorRationales: {
      a: "The COPD patient's SpO₂ of 88% on 2 L/min is near their documented baseline of 86–90%. Increased dyspnea warrants monitoring but is not the most urgent finding among these four patients.",
      b: "Post-operative pain at 7/10 is expected on day 1. The patient is uncomfortable but hemodynamically stable and not in immediate danger.",
      d: "A 1.5 kg weight gain in 24 hours suggests fluid retention and warrants notification and assessment, but the patient is not in immediate physiologic danger.",
    },
    takeaway: "When prioritizing, look for the combination of altered mental status AND hemodynamic instability. Each alone is concerning; together, they signal a physiologic emergency.",
  },
  {
    mode: "standard",
    id: "demo-nclex-002",
    exam: "nclex",
    category: "Safety & Infection Control",
    difficulty: 2,
    stem: "A nurse is preparing to administer heparin 5,000 units subcutaneously to a patient. Which action is most important before administration?",
    options: [
      { id: "a", text: "Aspirate before injection to confirm needle placement" },
      { id: "b", text: "Verify the dose using the 'rights' and check the patient's current aPTT" },
      { id: "c", text: "Rotate the injection site to the abdomen 2 inches from the umbilicus" },
      { id: "d", text: "Apply firm pressure to the site for 2–3 minutes after injection" },
    ],
    answer: "b",
    rationale:
      "The most important step before any anticoagulant administration is verifying the six rights (right drug, dose, route, patient, time, reason) AND checking current coagulation labs. Heparin has a narrow therapeutic index and bleeding risk is significant. An elevated aPTT may contraindicate or require dose adjustment before administration. Site rotation and post-injection pressure are correct technique but are secondary to safe pre-administration verification.",
    distractorRationales: {
      a: "Aspiration before subcutaneous injections is no longer recommended by clinical guidelines; it can cause unnecessary tissue trauma and bruising.",
      c: "Abdominal site rotation is correct technique but is not the priority action BEFORE administration — verification must come first.",
      d: "Applying pressure after injection is correct practice but occurs after administration, not before.",
    },
    takeaway: "For high-alert medications (heparin, insulin, anticoagulants), always verify labs AND apply the six rights before giving the dose. The pre-check protects the patient.",
  },
  {
    mode: "standard",
    id: "demo-nclex-003",
    exam: "nclex",
    category: "Pharmacological & Parenteral",
    difficulty: 3,
    stem: "A patient is receiving IV vancomycin 1,250 mg in 250 mL NS over 90 minutes. Thirty minutes into the infusion, the patient reports neck and facial flushing, itching, and a new rash across the chest and back. The nurse notes no urticaria, wheeze, or drop in blood pressure. What is the priority nursing action?",
    options: [
      { id: "a", text: "Stop the infusion immediately and prepare epinephrine" },
      { id: "b", text: "Slow the infusion rate and notify the provider" },
      { id: "c", text: "Administer diphenhydramine 25 mg IV push and continue the infusion at the current rate" },
      { id: "d", text: "Obtain an ECG and check electrolytes" },
    ],
    answer: "b",
    rationale:
      "This presentation — flushing, pruritus, and rash with vancomycin, in the absence of anaphylaxis signs (no wheeze, no urticaria, no hypotension) — is consistent with Red Man Syndrome, a rate-related infusion reaction caused by histamine release. It is NOT a true allergic reaction. The correct intervention is to slow (not stop) the infusion to reduce the rate of histamine release, then notify the provider. Diphenhydramine may be ordered by the provider but should not be administered without an order. Epinephrine is not indicated without anaphylaxis.",
    distractorRationales: {
      a: "Epinephrine is only indicated for anaphylaxis. The absence of airway compromise, wheeze, and hypotension rules out anaphylaxis here.",
      c: "Diphenhydramine requires a provider order. Continuing the infusion at the current rate without slowing it would worsen the reaction.",
      d: "ECG and electrolytes are not indicated for this presentation.",
    },
    takeaway: "Red Man Syndrome = rate-related, not allergy. Slow the rate, notify the provider. Anaphylaxis = airway/hemodynamic involvement — then stop the infusion and consider epinephrine.",
  },
  {
    mode: "standard",
    id: "demo-nclex-004",
    exam: "nclex",
    category: "Reduction of Risk Potential",
    difficulty: 3,
    stem: "A nurse is reviewing the morning labs for a patient with chronic kidney disease. Potassium is 6.4 mEq/L (baseline 5.8), creatinine 3.8 mg/dL, and the patient's cardiac monitor shows new peaked T-waves in precordial leads. Which intervention does the nurse anticipate first?",
    options: [
      { id: "a", text: "Prepare to administer sodium polystyrene sulfonate (Kayexalate) per rectal route" },
      { id: "b", text: "Hold the patient's morning ACE inhibitor and notify the provider" },
      { id: "c", text: "Prepare to administer IV calcium gluconate and notify the provider immediately" },
      { id: "d", text: "Initiate a potassium-restricted diet consult and recheck labs in 4 hours" },
    ],
    answer: "c",
    rationale:
      "Peaked T-waves on ECG represent cardiac membrane instability from severe hyperkalemia — this is a medical emergency. The first priority is cardiac membrane stabilization with IV calcium gluconate (or calcium chloride), which acts within minutes to reduce the risk of fatal dysrhythmia. This must happen before any potassium elimination strategy. Kayexalate works over hours to eliminate potassium via the GI tract but does nothing to stabilize the cardiac membrane acutely.",
    distractorRationales: {
      a: "Kayexalate reduces total body potassium but takes hours to work. It does not address the immediate cardiac emergency caused by peaked T-waves.",
      b: "Holding the ACE inhibitor is appropriate (ACEs worsen hyperkalemia) but is not the immediate priority when ECG changes are present.",
      d: "Rechecking labs in 4 hours is an inappropriate response to cardiac membrane instability. Immediate action is needed.",
    },
    takeaway: "In hyperkalemia with ECG changes: FIRST stabilize the cardiac membrane (calcium gluconate). THEN shift potassium into cells (insulin + dextrose, albuterol). THEN eliminate potassium (Kayexalate, dialysis).",
  },
  {
    mode: "standard",
    id: "demo-nclex-005",
    exam: "nclex",
    category: "Psychosocial Integrity",
    difficulty: 2,
    stem: "A nurse is discharging a 74-year-old patient who was hospitalized for a fall at home. The patient lives alone and states, 'I manage fine. I don't need any help.' The patient's daughter asks the nurse to 'make sure the doctor orders home health.' What is the priority nursing action?",
    options: [
      { id: "a", text: "Respect the patient's autonomy and document the patient's refusal of home health services" },
      { id: "b", text: "Conduct a fall risk and functional assessment, then discuss findings with the patient and family together" },
      { id: "c", text: "Contact social work to arrange mandatory home health services given the documented fall risk" },
      { id: "d", text: "Ask the physician to place the home health order without informing the patient to avoid conflict" },
    ],
    answer: "b",
    rationale:
      "The priority is to objectively assess the patient's actual fall risk and functional status rather than acting on either the patient's denial or the family's request. A thorough assessment (Morse Fall Scale, ADL evaluation, medication review, home environment assessment) provides the evidence needed for a patient-centered conversation that respects autonomy while addressing real safety concerns. The patient and family should be included together in the discussion. Ordering services without the patient's informed consent violates autonomy and is unethical.",
    distractorRationales: {
      a: "Simply documenting refusal without a proper assessment misses the clinical obligation to evaluate and educate before accepting a refusal.",
      c: "Home health cannot be 'mandated' without the patient's consent for a competent adult; this violates autonomy.",
      d: "Arranging care without the patient's knowledge violates patient rights and is unethical regardless of safety intent.",
    },
    takeaway: "Assessment comes before action. Use objective data to frame the safety conversation, then respect the competent patient's informed decision. Autonomy is upheld through education, not by bypassing the patient.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STANDARD CCRN QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

const standardCcrn: StandardQuestion[] = [
  {
    mode: "standard",
    id: "demo-ccrn-001",
    exam: "ccrn",
    category: "Cardiovascular",
    difficulty: 4,
    stem: "A patient in the ICU is intubated and mechanically ventilated with an FiO₂ of 0.60 and PEEP of 12 cmH₂O. The pulmonary artery catheter readings are: CO 3.8 L/min, CI 2.0 L/min/m², PCWP 22 mmHg, CVP 18 mmHg, SVR 1,480 dynes·s/cm⁵. The patient's BP is 96/58 mmHg, HR 112, SpO₂ 91%. Which finding is most consistent with the clinical picture?",
    options: [
      { id: "a", text: "Distributive shock with vasodilation and high cardiac output" },
      { id: "b", text: "Obstructive shock from tension pneumothorax" },
      { id: "c", text: "Cardiogenic shock with impaired pump function and elevated filling pressures" },
      { id: "d", text: "Hypovolemic shock with inadequate preload" },
    ],
    answer: "c",
    rationale:
      "The hemodynamic profile — low CO (3.8), low CI (2.0 < 2.2 threshold), elevated PCWP (22 mmHg indicating elevated left heart filling), elevated CVP (18), elevated SVR (compensatory vasoconstriction), and low BP — is the classic fingerprint of cardiogenic shock. The heart is failing to pump effectively (low CO/CI), preload is high (PCWP 22, CVP 18), and the peripheral vasculature is clamping down to maintain pressure (elevated SVR). Distributive shock shows high CO + low SVR. Hypovolemic shows low preload (low PCWP/CVP). Obstructive shows equalized diastolic pressures.",
    distractorRationales: {
      a: "Distributive shock (e.g., septic shock) presents with high CO and LOW SVR — the opposite of this hemodynamic pattern.",
      b: "Tension pneumothorax causes obstructive shock with elevated CVP but would present with very low CO, tracheal deviation, and absent breath sounds — and would require immediate decompression.",
      d: "Hypovolemic shock has low preload: PCWP and CVP would be LOW, not elevated as seen here.",
    },
    takeaway: "Cardiogenic fingerprint: Low CO + Low CI + High PCWP + High CVP + High SVR + Low BP. The failing pump backs up pressure behind it (elevated filling pressures) and triggers compensatory vasoconstriction (high SVR).",
  },
  {
    mode: "standard",
    id: "demo-ccrn-002",
    exam: "ccrn",
    category: "Respiratory",
    difficulty: 4,
    stem: "An intubated patient with ARDS is on volume-controlled ventilation: TV 420 mL, RR 22, PEEP 14, FiO₂ 0.80. Plateau pressure is 34 cmH₂O and driving pressure is 20 cmH₂O. The ABG shows pH 7.28, PaCO₂ 58, PaO₂ 62. The intensivist is at bedside. Which ventilator adjustment is most consistent with current ARDS Network lung-protective strategy?",
    options: [
      { id: "a", text: "Increase tidal volume to 520 mL to improve minute ventilation and correct the respiratory acidosis" },
      { id: "b", text: "Decrease PEEP to 8 cmH₂O to reduce airway pressure and improve hemodynamics" },
      { id: "c", text: "Decrease tidal volume to keep driving pressure ≤15 cmH₂O and accept permissive hypercapnia" },
      { id: "d", text: "Switch to pressure-support ventilation at 18 cmH₂O to allow patient-triggered breathing" },
    ],
    answer: "c",
    rationale:
      "The driving pressure (plateau pressure − PEEP) of 20 cmH₂O exceeds the recommended ≤15 cmH₂O target associated with improved ARDS outcomes. The ARDS Network strategy prioritizes low tidal volume (6 mL/kg IBW) and driving pressure minimization to prevent ventilator-induced lung injury (VILI), even at the expense of accepting hypercapnia (permissive hypercapnia). The pH of 7.28 is uncomfortable but tolerable in ARDS management. Increasing tidal volume would worsen driving pressure and VILI. Reducing PEEP risks de-recruitment of already-damaged alveoli. Pressure support is generally not appropriate in severe ARDS where work of breathing is very high.",
    distractorRationales: {
      a: "Increasing tidal volume worsens driving pressure, promotes VILI, and is directly contraindicated by the ARDSNet protocol for moderate-severe ARDS.",
      b: "Decreasing PEEP in ARDS with high FiO₂ requirement risks alveolar de-recruitment and worsening V/Q mismatch; PEEP should be maintained or optimized using FiO₂/PEEP tables.",
      d: "Pressure support ventilation requires adequate respiratory drive and patient effort — it is generally inappropriate in severe ARDS where respiratory mechanics are severely compromised.",
    },
    takeaway: "ARDS ventilation: 6 mL/kg IBW tidal volumes, driving pressure ≤15 cmH₂O, plateau pressure <30 cmH₂O. Accept permissive hypercapnia. Protect the lung first.",
  },
  {
    mode: "standard",
    id: "demo-ccrn-003",
    exam: "ccrn",
    category: "Neurological",
    difficulty: 3,
    stem: "A 58-year-old patient is admitted to the ICU following a large right middle cerebral artery (MCA) infarct. GCS is 9 (E2V3M4). On ICU day 2, the nurse notes: increasing lethargy (GCS now 7), left pupil 5 mm and sluggish (was 3 mm and brisk), right arm flexor posturing, BP 188/104, HR 54. Which complication does this presentation indicate?",
    options: [
      { id: "a", text: "Hemorrhagic transformation of the ischemic infarct" },
      { id: "b", text: "Transtentorial (uncal) herniation from malignant cerebral edema" },
      { id: "c", text: "Hypertensive emergency requiring immediate antihypertensive treatment" },
      { id: "d", text: "Cerebellar infarct extension with fourth ventricle compression" },
    ],
    answer: "b",
    rationale:
      "This presentation is transtentorial (uncal) herniation: progressive decline in LOC, ipsilateral (same-side as infarct) pupil dilation with loss of reactivity (uncal compression of CN III), and contralateral motor posturing (corticospinal tract compression below the uncus). The triad of hypertension, bradycardia, and irregular respirations — Cushing's triad — represents the brain's last-ditch effort to maintain perfusion pressure. In the context of a large MCA infarct, malignant cerebral edema with transtentorial herniation is the primary diagnosis. This is a neurosurgical emergency. Aggressive BP lowering (option C) is contraindicated here because hypertension is compensatory.",
    distractorRationales: {
      a: "Hemorrhagic transformation typically presents with sudden neurologic worsening and headache, and would be confirmed on emergent CT — it does not explain the unilateral pupil dilation and herniation signs.",
      c: "The hypertension here is Cushing's response — a compensatory mechanism to maintain cerebral perfusion pressure against rising ICP. Aggressively lowering BP would catastrophically reduce CPP. This is not a hypertensive emergency in the conventional sense.",
      d: "Cerebellar infarct would present with different neurological findings (ataxia, nystagmus, ipsilateral limb coordination deficits) and typically affects posterior fossa structures, not the MCA territory described.",
    },
    takeaway: "Cushing's triad (HTN + bradycardia + irregular respirations) + progressive pupil changes after large stroke = herniation. Do NOT lower BP aggressively. This is a neurosurgical emergency — call the team and prepare for ICP management.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CASE STUDY QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

const caseStudyQuestions: CaseStudyQuestion[] = [
  {
    mode: "case-study",
    id: "demo-case-001",
    exam: "ccrn",
    category: "Cardiovascular",
    difficulty: 5,
    caseTitle: "Post-CABG Cardiogenic Shock",
    caseContext:
      "Mr. D.L. is a 68-year-old male, ICU day 2 following emergent CABG × 3 for acute STEMI. He was extubated on ICU day 1 but has progressively deteriorated overnight. He reports worsening shortness of breath and fatigue. He appears pale, diaphoretic, and mottled at the knees. JVD is present at 45°. Breath sounds reveal coarse crackles bilateral bases. Extremities are cool and clammy.",
    vitals: [
      { label: "BP", value: "78/52", unit: "mmHg", flag: "critical" },
      { label: "MAP", value: "61", unit: "mmHg", flag: "low" },
      { label: "HR", value: "122", unit: "bpm", flag: "high" },
      { label: "RR", value: "28", unit: "/min", flag: "high" },
      { label: "SpO₂", value: "89%", unit: "on 6L NC", flag: "critical" },
      { label: "Temp", value: "37.0", unit: "°C", flag: "normal" },
      { label: "Urine Output", value: "12", unit: "mL/hr (past 2h)", flag: "critical" },
    ],
    labs: [
      { label: "Lactate", value: "5.4", unit: "mmol/L", reference: "0.5–2.2", flag: "critical" },
      { label: "BNP", value: "2,140", unit: "pg/mL", reference: "<100", flag: "critical" },
      { label: "Troponin I", value: "6.8", unit: "ng/mL", reference: "<0.04", flag: "critical" },
      { label: "Creatinine", value: "2.4", unit: "mg/dL", reference: "0.7–1.3", flag: "high" },
      { label: "pH", value: "7.26", unit: "", reference: "7.35–7.45", flag: "critical" },
      { label: "PaO₂", value: "58", unit: "mmHg", reference: "80–100", flag: "critical" },
      { label: "WBC", value: "14.2", unit: "K/µL", reference: "4.5–11.0", flag: "high" },
    ],
    hemodynamics: [
      { label: "CO", value: "2.1", unit: "L/min", flag: "critical" },
      { label: "CI", value: "1.1", unit: "L/min/m²", flag: "critical" },
      { label: "PCWP", value: "30", unit: "mmHg", flag: "critical" },
      { label: "CVP", value: "22", unit: "mmHg", flag: "high" },
      { label: "PA Systolic", value: "58", unit: "mmHg", flag: "critical" },
      { label: "PA Mean", value: "42", unit: "mmHg", flag: "critical" },
      { label: "SVR", value: "2,040", unit: "dynes·s/cm⁵", flag: "high" },
      { label: "SvO₂", value: "48%", unit: "", flag: "critical" },
    ],
    stem: "Based on the clinical presentation, vitals, labs, and hemodynamic data, which is the most appropriate next intervention?",
    options: [
      { id: "a", text: "Administer a 500 mL NS fluid bolus to improve preload and cardiac output" },
      { id: "b", text: "Initiate dobutamine infusion for inotropy and prepare for intra-aortic balloon pump (IABP) insertion" },
      { id: "c", text: "Administer furosemide 40 mg IV push to reduce pulmonary congestion and improve oxygenation" },
      { id: "d", text: "Increase the norepinephrine infusion rate to target a MAP >80 mmHg" },
    ],
    answer: "b",
    rationale:
      "This patient has severe cardiogenic shock post-CABG: CI of 1.1 (profound pump failure), PCWP 30 (markedly elevated preload — the tank is already overfull), SVR 2,040 (massive compensatory vasoconstriction), SvO₂ 48% (severely inadequate oxygen delivery), and lactate 5.4 (tissue hypoperfusion). The heart needs mechanical support and inotropic augmentation. Dobutamine improves contractility and reduces afterload modestly via beta-1 stimulation. IABP counterpulsation reduces afterload (SVR is already high, this worsens pump work) and augments diastolic coronary perfusion — exactly what a post-CABG failing heart needs. IV fluids are contraindicated (PCWP already 30 mmHg — more preload will worsen pulmonary edema). Furosemide may be part of later management but does not address the pump failure. Increasing norepinephrine alone increases SVR further, increasing cardiac afterload in an already-failing ventricle.",
    distractorRationales: {
      a: "Administering fluids is contraindicated. PCWP 30 mmHg indicates severely elevated left heart filling pressures — more preload will worsen pulmonary edema and further impair gas exchange without improving output.",
      c: "Furosemide may be used later to reduce congestion, but it does not address the primary problem: a failing pump. In cardiogenic shock, diuresis alone without cardiac support can precipitate further hemodynamic collapse.",
      d: "Increasing norepinephrine increases SVR, which increases cardiac afterload. In a failing ventricle, increasing afterload reduces stroke volume further — worsening the shock state.",
    },
    takeaway: "Cardiogenic shock post-CABG: the problem is pump failure, not volume depletion. High PCWP = do not give fluids. Target inotropic support + mechanical support (IABP) to reduce afterload and augment output. SvO₂ <50% indicates critical oxygen delivery failure.",
  },
  {
    mode: "case-study",
    id: "demo-case-002",
    exam: "nclex",
    category: "Physiological Adaptation",
    difficulty: 4,
    caseTitle: "SIADH in a Post-Neurosurgical Patient",
    caseContext:
      "Ms. T.W. is a 55-year-old woman, post-operative day 3 following transsphenoidal hypophysectomy for a pituitary adenoma. She was progressing well but this morning reported a worsening headache, nausea, and generalized fatigue. The nurse notes she appears slightly confused and has gained 2.8 kg since surgery. Her urine output has been low (18–22 mL/hr). She denies any history of kidney disease.",
    vitals: [
      { label: "BP", value: "136/84", unit: "mmHg", flag: "normal" },
      { label: "HR", value: "76", unit: "bpm", flag: "normal" },
      { label: "SpO₂", value: "97%", unit: "on room air", flag: "normal" },
      { label: "Urine Output", value: "19", unit: "mL/hr", flag: "low" },
    ],
    labs: [
      { label: "Sodium (Na⁺)", value: "118", unit: "mEq/L", reference: "136–145", flag: "critical" },
      { label: "Serum Osmolality", value: "248", unit: "mOsm/kg", reference: "275–295", flag: "critical" },
      { label: "Urine Sodium", value: "68", unit: "mEq/L", reference: "<20 in hyponatremia", flag: "high" },
      { label: "Urine Osmolality", value: "640", unit: "mOsm/kg", reference: ">serum", flag: "high" },
      { label: "Potassium (K⁺)", value: "3.9", unit: "mEq/L", reference: "3.5–5.0", flag: "normal" },
      { label: "Creatinine", value: "0.8", unit: "mg/dL", reference: "0.5–1.1", flag: "normal" },
    ],
    stem: "The laboratory findings are most consistent with SIADH. Which nursing intervention is the highest priority?",
    options: [
      { id: "a", text: "Administer 3% hypertonic saline 150 mL IV bolus to rapidly correct the sodium" },
      { id: "b", text: "Implement fluid restriction to 800–1,000 mL/day and notify the provider" },
      { id: "c", text: "Administer furosemide 40 mg IV to increase urine output and correct the dilutional hyponatremia" },
      { id: "d", text: "Encourage oral fluid intake and ambulate the patient to stimulate ADH suppression" },
    ],
    answer: "b",
    rationale:
      "SIADH is confirmed by the classic pattern: hyponatremia (Na 118), low serum osmolality (248), concentrated urine despite low serum osmolality (urine osm 640), and elevated urine sodium (68) in the setting of euvolemia or mild fluid overload (2.8 kg weight gain, adequate BP). The cornerstone of SIADH management is fluid restriction (800–1,000 mL/day), which corrects free water excess by limiting intake while the kidneys continue excreting water in the urine. Hypertonic saline (3%) is reserved for severe symptomatic hyponatremia with seizures, coma, or herniation — confusion alone at Na 118 doesn't meet that threshold and rapid correction risks osmotic demyelination syndrome (ODS). Furosemide alone worsens sodium loss. Encouraging fluids worsens SIADH.",
    distractorRationales: {
      a: "Hypertonic saline (3%) is indicated only for severe symptomatic hyponatremia with seizures or coma. Na of 118 with confusion is concerning but doesn't meet the threshold. Rapid correction risks osmotic demyelination syndrome (ODS/CPM), which causes permanent brainstem damage.",
      c: "Furosemide without proper sodium replacement would worsen the hyponatremia by causing both water AND sodium loss.",
      d: "Encouraging oral fluid intake is directly contraindicated in SIADH — it worsens free water excess and further dilutes the sodium.",
    },
    takeaway: "SIADH = too much free water. Fix it by restricting free water intake. Hypertonic saline is the emergency option only for coma/seizures — correct too fast and you risk ODS. Maximum safe correction: 8–10 mEq/L per 24 hours.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHART / DATA QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

const chartQuestions: ChartQuestion[] = [
  {
    mode: "chart",
    id: "demo-chart-001",
    exam: "ccrn",
    category: "Cardiovascular",
    difficulty: 4,
    chartTitle: "Hemodynamic Trend — Dobutamine Titration",
    chartCaption:
      "A 71-year-old patient with decompensated heart failure has been on dobutamine infusion for 6 hours. PA catheter data collected hourly. Dobutamine was titrated from 5 → 10 → 12 mcg/kg/min.",
    dataRows: [
      {
        time: "Hour 0 (baseline)",
        values: [
          { label: "CO", value: "2.2 L/min", flag: "critical" },
          { label: "CI", value: "1.1 L/min/m²", flag: "critical" },
          { label: "PCWP", value: "28 mmHg", flag: "critical" },
          { label: "MAP", value: "58 mmHg", flag: "critical" },
          { label: "SVR", value: "1,960 dynes", flag: "high" },
          { label: "SvO₂", value: "46%", flag: "critical" },
        ],
      },
      {
        time: "Hour 2 (dob 5 mcg)",
        values: [
          { label: "CO", value: "2.9 L/min", flag: "low" },
          { label: "CI", value: "1.5 L/min/m²", flag: "low" },
          { label: "PCWP", value: "24 mmHg", flag: "high" },
          { label: "MAP", value: "62 mmHg", flag: "low" },
          { label: "SVR", value: "1,740 dynes", flag: "high" },
          { label: "SvO₂", value: "52%", flag: "low" },
        ],
      },
      {
        time: "Hour 4 (dob 10 mcg)",
        values: [
          { label: "CO", value: "3.6 L/min", flag: "normal" },
          { label: "CI", value: "1.9 L/min/m²", flag: "low" },
          { label: "PCWP", value: "20 mmHg", flag: "high" },
          { label: "MAP", value: "68 mmHg", flag: "normal" },
          { label: "SVR", value: "1,520 dynes", flag: "high" },
          { label: "SvO₂", value: "58%", flag: "normal" },
        ],
      },
      {
        time: "Hour 6 (dob 12 mcg)",
        values: [
          { label: "CO", value: "4.1 L/min", flag: "normal" },
          { label: "CI", value: "2.1 L/min/m²", flag: "normal" },
          { label: "PCWP", value: "18 mmHg", flag: "high" },
          { label: "MAP", value: "72 mmHg", flag: "normal" },
          { label: "SVR", value: "1,420 dynes", flag: "high" },
          { label: "SvO₂", value: "62%", flag: "normal" },
        ],
      },
    ],
    stem: "Reviewing the hemodynamic trend over 6 hours of dobutamine titration, which interpretation is most accurate regarding the patient's response and appropriate next management priority?",
    options: [
      { id: "a", text: "The patient has not responded — CI remains below 2.2 L/min/m² and SVR remains elevated; escalate to vasopressor therapy" },
      { id: "b", text: "The patient has responded positively — CO, CI, MAP, and SvO₂ are trending toward goal; PCWP remains elevated and diuresis should be considered" },
      { id: "c", text: "The response is insufficient — decrease dobutamine to 5 mcg/kg/min and add norepinephrine 0.05 mcg/kg/min" },
      { id: "d", text: "The patient has fully compensated — wean dobutamine and transition to oral heart failure medications immediately" },
    ],
    answer: "b",
    rationale:
      "The trend shows meaningful improvement across all key parameters over 6 hours: CO improved from 2.2 → 4.1 L/min (+86%), CI from 1.1 → 2.1 (approaching but not yet at goal of ≥2.2), MAP 58 → 72 (now adequate), SvO₂ 46 → 62% (approaching 65% goal), SVR declining (vasodilation from improved output). This represents a positive response to inotropy. However, PCWP remains elevated at 18 mmHg (target <18–20), indicating persistent pulmonary congestion — the next management priority is to add a diuretic (furosemide) to relieve pulmonary edema while continuing the dobutamine. Adding a vasopressor would increase afterload against a still-recovering ventricle. Weaning dobutamine is premature at CI 2.1.",
    distractorRationales: {
      a: "The patient IS responding — all key parameters are improving directionally. CI at 2.1 is approaching the 2.2 threshold. Adding a vasopressor increases afterload and is not the correct next step for a patient who is responding to inotropy.",
      c: "Decreasing the dobutamine dose at this point of improving parameters would be clinically inappropriate. The trend is favorable and the patient needs continued support, not step-down.",
      d: "The patient has improved but CI is still borderline (2.1), PCWP is 18 (still mildly elevated), and SvO₂ 62% is just below the 65% target. It is premature to discontinue dobutamine — a premature wean would risk hemodynamic collapse.",
    },
    takeaway: "Trend-reading skill: look at DIRECTION (is it improving?) and MAGNITUDE (is it near goal?). CO/CI improving = good. PCWP still elevated = add diuretic. SvO₂ approaching 65% = on track. Don't wean early when recovery is still in progress.",
  },
  {
    mode: "chart",
    id: "demo-chart-002",
    exam: "nclex",
    category: "Reduction of Risk Potential",
    difficulty: 3,
    chartTitle: "Intake & Output Record — Post-Operative Fluid Balance",
    chartCaption:
      "Mr. P.A. is a 74-year-old male, ICU day 1 following emergency bowel resection for a perforated diverticulum. He received 4.5 L crystalloid intraoperatively and is now on maintenance IV fluids.",
    dataRows: [
      {
        time: "0600–1200",
        values: [
          { label: "IV Fluids In", value: "950 mL", flag: "normal" },
          { label: "PO", value: "0 mL", flag: "normal" },
          { label: "Urine Out", value: "180 mL", flag: "low" },
          { label: "NG Drain", value: "90 mL", flag: "normal" },
          { label: "Jackson-Pratt", value: "35 mL", flag: "normal" },
          { label: "Net Balance", value: "+645 mL", flag: "high" },
        ],
      },
      {
        time: "1200–1800",
        values: [
          { label: "IV Fluids In", value: "950 mL", flag: "normal" },
          { label: "PO", value: "0 mL", flag: "normal" },
          { label: "Urine Out", value: "140 mL", flag: "low" },
          { label: "NG Drain", value: "60 mL", flag: "normal" },
          { label: "Jackson-Pratt", value: "25 mL", flag: "normal" },
          { label: "Net Balance", value: "+725 mL", flag: "high" },
        ],
      },
      {
        time: "1800–2400",
        values: [
          { label: "IV Fluids In", value: "950 mL", flag: "normal" },
          { label: "PO", value: "0 mL", flag: "normal" },
          { label: "Urine Out", value: "95 mL", flag: "critical" },
          { label: "NG Drain", value: "45 mL", flag: "normal" },
          { label: "Jackson-Pratt", value: "18 mL", flag: "normal" },
          { label: "Net Balance", value: "+792 mL", flag: "critical" },
        ],
      },
    ],
    stem: "Reviewing the 18-hour intake and output trend, which finding is most clinically significant and requires immediate provider notification?",
    options: [
      { id: "a", text: "The total positive fluid balance of +2,162 mL over 18 hours requires immediate reduction of IV fluid rates" },
      { id: "b", text: "The progressive decline in urine output — now 95 mL over 6 hours (15.8 mL/hr) — suggests developing acute kidney injury" },
      { id: "c", text: "The NG drainage of 45 mL in the last 6 hours is lower than expected and suggests obstruction" },
      { id: "d", text: "The Jackson-Pratt output of 18 mL in the last period is decreasing, which may indicate drain clotting" },
    ],
    answer: "b",
    rationale:
      "The most clinically significant finding is the declining urine output trend: 180 mL → 140 mL → 95 mL over successive 6-hour periods. The most recent period yields 15.8 mL/hr — well below the 0.5 mL/kg/hr minimum (for a 70 kg patient = 35 mL/hr minimum). In a post-operative patient with septic risk (bowel perforation), declining UO despite adequate IV fluids suggests either inadequate perfusion (sepsis, bleeding, third-spacing) or early AKI. This is the most time-sensitive finding requiring immediate provider notification. The positive total balance is expected post-operatively and does not mandate immediate rate reduction without clinical context.",
    distractorRationales: {
      a: "Positive fluid balance of +2.2 L over 18 hours post-emergency bowel surgery is expected and clinically appropriate given intraoperative losses and ongoing third-spacing. Reducing IV fluids without reassessing the cause of oliguria could worsen perfusion.",
      c: "NG drainage of 45 mL/6h is within acceptable range for a patient post-bowel resection with NPO status. A sudden dramatic increase in NG drainage would be more concerning (high-output obstruction or fistula).",
      d: "Decreasing JP drain output is generally a positive sign (decreasing operative site drainage) and does not indicate obstruction in this context.",
    },
    takeaway: "Post-op oliguria trend is more important than a single low value. 0.5 mL/kg/hr is the minimum — track the trend, not just the moment. Declining UO after bowel surgery means assess for sepsis, bleeding, or third-spacing before adjusting fluids.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NGN-STYLE QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

const ngnQuestions: NgnQuestion[] = [
  {
    mode: "ngn",
    id: "demo-ngn-001",
    exam: "nclex",
    category: "Physiological Adaptation",
    difficulty: 4,
    scenarioTitle: "Acid-Base Classification — Respiratory Failure",
    scenario:
      "A 62-year-old male with a history of severe COPD and obstructive sleep apnea presents to the ED with worsening dyspnea over 48 hours. He uses 2 L/min home oxygen. On arrival he is in moderate respiratory distress, using accessory muscles. SpO₂ 86% on room air, improved to 91% on 4 L/min NC.",
    additionalInfo:
      "ABG results (on 4 L/min NC): pH 7.28 | PaCO₂ 72 mmHg | HCO₃⁻ 33 mEq/L | PaO₂ 56 mmHg | SpO₂ 91%\n\nBaseline ABG on file (from clinic 3 months ago, on 2 L/min): pH 7.36 | PaCO₂ 58 mmHg | HCO₃⁻ 32 mEq/L",
    stem: "For each finding in the table below, classify it as reflecting the PRIMARY acid-base disorder, a COMPENSATORY response, or UNRELATED to the primary disorder.",
    type: "matrix",
    matrixColumns: ["Primary Disorder", "Compensatory Response", "Unrelated"],
    matrixRows: [
      { label: "pH 7.28 (acidotic)", answer: "Primary Disorder" },
      { label: "PaCO₂ 72 mmHg (elevated)", answer: "Primary Disorder" },
      { label: "HCO₃⁻ 33 mEq/L (elevated)", answer: "Compensatory Response" },
      { label: "PaO₂ 56 mmHg (low)", answer: "Unrelated" },
      { label: "SpO₂ 91% on 4 L/min", answer: "Unrelated" },
    ],
    rationale:
      "This ABG shows respiratory acidosis: the primary disorder is CO₂ retention (PaCO₂ 72, elevated above normal 35–45), causing a low pH (7.28, acidosis). In COPD, the elevated HCO₃⁻ (33) represents the kidneys' COMPENSATORY response to chronic CO₂ retention — the kidneys retain bicarbonate to buffer the acid load over days to weeks. The low PaO₂ (56) and SpO₂ (91%) reflect hypoxemia, which is a consequence of the underlying lung disease and ventilation/perfusion mismatch — not part of the primary acid-base disorder itself. Note: compared to baseline, pH dropped further (7.36→7.28) and PaCO₂ rose significantly (58→72), indicating acute-on-chronic respiratory failure.",
    takeaway: "Respiratory acidosis: pH down + CO₂ up. Kidney compensation: HCO₃ rises over days. Hypoxemia is a separate clinical problem running in parallel — important to treat but not part of the acid-base classification. In COPD: look for acute-on-chronic changes by comparing to baseline.",
  },
  {
    mode: "ngn",
    id: "demo-ngn-002",
    exam: "ccrn",
    category: "Multisystem",
    difficulty: 5,
    scenarioTitle: "Septic Shock — Priority Actions",
    scenario:
      "A 58-year-old female is transferred from the medical floor to the ICU after an acute deterioration. She was admitted 24 hours ago with a urinary tract infection. Now: altered mental status (oriented to self only), HR 138, BP 74/42 mmHg, RR 32, Temp 39.4°C, SpO₂ 93% on 4L NC. Skin: warm, flushed, diaphoretic. Urine is dark yellow, output 12 mL over past 2 hours.",
    additionalInfo:
      "Current labs: Lactate 7.2 mmol/L | WBC 22.4 K/µL | Procalcitonin 48 ng/mL | Creatinine 3.1 mg/dL (baseline 0.9) | INR 1.8 | Platelets 82 K/µL | Blood cultures × 2 drawn on admission floor\n\nCurrent medications: Ceftriaxone 1g IV q24h (started 18h ago), LR 125 mL/hr since admission",
    stem: "Select ALL interventions that are indicated as part of the Hour-1 Septic Shock Bundle for this patient.",
    type: "multi-select",
    options: [
      { id: "a", text: "Administer at least 30 mL/kg IV crystalloid bolus (approximately 2,100 mL for a 70 kg patient) over ≤3 hours" },
      { id: "b", text: "Draw repeat blood cultures before initiating or changing antibiotic therapy" },
      { id: "c", text: "Initiate norepinephrine to target MAP ≥65 mmHg" },
      { id: "d", text: "Administer broad-spectrum antibiotics covering gram-negative organisms (current ceftriaxone may be inadequate for septic shock)" },
      { id: "e", text: "Insert a urinary catheter to closely monitor hourly urine output as a perfusion marker" },
      { id: "f", text: "Administer fresh frozen plasma to correct the INR of 1.8" },
    ],
    answers: ["a", "c", "d", "e"],
    rationale:
      "The Surviving Sepsis Campaign Hour-1 Bundle includes: (1) Measure lactate — done (7.2, severely elevated); (2) Blood cultures before antibiotics — already drawn 18h ago, no need to redraw unless changing antibiotics; (3) Broad-spectrum antibiotics — ceftriaxone alone is likely insufficient for septic shock from UTI, especially with organ failure; (4) 30 mL/kg IV crystalloid for hypotension or lactate ≥4; (5) Vasopressors if MAP <65 mmHg despite resuscitation. Urinary catheter is standard ICU practice to monitor organ perfusion. FFP is NOT indicated for sepsis-related coagulopathy in the absence of active bleeding — INR of 1.8 alone is not an indication.",
    takeaway: "Hour-1 bundle: Lactate + cultures + broad antibiotics + 30 mL/kg fluids + vasopressors for MAP <65. FFP is NOT routine for sepsis-related DIC without active bleeding. Watch for the trap: cultures already drawn → don't delay antibiotics waiting to redraw.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION SETS BY MODE
// ─────────────────────────────────────────────────────────────────────────────

export const demoQuestionSets: Record<QuestionMode, DemoQuestion[]> = {
  standard: [...standardNclex, ...standardCcrn],
  "case-study": caseStudyQuestions,
  chart: chartQuestions,
  ngn: ngnQuestions,
};

export const modeDescriptions: Record<QuestionMode, { label: string; description: string; count: number; exam: string }> = {
  standard: {
    label: "Standard Questions",
    description: "Single best answer MCQ covering NCLEX and CCRN core content. Priority, safety, pharmacology, and critical care.",
    count: standardNclex.length + standardCcrn.length,
    exam: "NCLEX + CCRN",
  },
  "case-study": {
    label: "Case Studies",
    description: "Complex clinical scenarios with full patient context — vitals, labs, hemodynamics. Think through the whole picture.",
    count: caseStudyQuestions.length,
    exam: "CCRN + NCLEX",
  },
  chart: {
    label: "Chart & Data Reading",
    description: "Interpret hemodynamic trends, I&O records, and clinical data tables. Read the pattern, not just the number.",
    count: chartQuestions.length,
    exam: "CCRN + NCLEX",
  },
  ngn: {
    label: "NGN-Style",
    description: "Next Generation NCLEX format: matrix classification, multi-select, and clinical scenario-based thinking.",
    count: ngnQuestions.length,
    exam: "NCLEX",
  },
};
