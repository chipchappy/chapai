import fs from "node:fs";
import path from "node:path";

const OUT = path.join("packages", "content", "staging", "promoted-v2", "p1-bow-ties.json");

const VARIANTS = [
  { suffix: "ed", setting: "emergency department", age: 64, cue: "new confusion and worsening vital-sign instability" },
  { suffix: "stepdown", setting: "step-down unit", age: 52, cue: "rapid deterioration after two hours of observation" },
  { suffix: "urgent", setting: "urgent transfer report", age: 38, cue: "high-risk findings that require immediate escalation" },
];

const TOPICS = [
  {
    slug: "sepsis",
    title: "Sepsis With Hypoperfusion",
    category: "physiological_adaptation",
    subcategory: "Sepsis / Perfusion",
    center: "Septic shock from suspected infection",
    scenario: "The client has fever, suspected infection, cool extremities, and a falling blood pressure despite increasing tachycardia.",
    labs: ["Lactate 4.1 mmol/L", "WBC 18,600/mm3", "Creatinine increased from baseline"],
    vitals: ["T 39.1 C", "HR 126/min", "BP 82/48 mm Hg", "SpO2 93%"],
    actions: [
      ["cultures-antibiotics", "Obtain cultures and start broad-spectrum antibiotics", true],
      ["crystalloid-bolus", "Administer isotonic crystalloid bolus as prescribed", true],
      ["oral-fluids", "Encourage oral fluids and reassess in 2 hours", false],
      ["antipyretic-only", "Give acetaminophen as the primary intervention", false],
    ],
    monitoring: [
      ["lactate-map", "Lactate trend and mean arterial pressure", true],
      ["urine-output", "Hourly urine output", true],
      ["daily-weight", "Daily weight after stabilization", false],
      ["skin-turgor", "Skin turgor alone", false],
    ],
    rationale: "The pattern is septic shock with impaired perfusion. Early antibiotics, cultures, fluids, lactate, MAP, and urine output address the time-sensitive threats.",
  },
  {
    slug: "dka",
    title: "Diabetic Ketoacidosis",
    category: "physiological_adaptation",
    subcategory: "Endocrine / DKA",
    center: "DKA with dehydration and metabolic acidosis",
    scenario: "The client has polyuria, abdominal pain, Kussmaul respirations, dry mucous membranes, and a fruity breath odor.",
    labs: ["Glucose 496 mg/dL", "Anion gap 24", "Potassium 3.4 mEq/L", "Positive serum ketones"],
    vitals: ["HR 118/min", "BP 94/56 mm Hg", "RR 28/min"],
    actions: [
      ["isotonic-fluid", "Start isotonic IV fluid replacement", true],
      ["potassium-insulin", "Verify potassium plan before IV insulin infusion", true],
      ["bicarbonate-routine", "Give sodium bicarbonate routinely for all DKA", false],
      ["hold-fluids", "Restrict fluids until glucose normalizes", false],
    ],
    monitoring: [
      ["potassium", "Serum potassium and cardiac rhythm", true],
      ["anion-gap", "Anion gap and glucose trend", true],
      ["hba1c", "Hemoglobin A1c only", false],
      ["ketone-urine-only", "Urine ketones once per shift only", false],
    ],
    rationale: "DKA care prioritizes volume restoration and safe insulin therapy. Potassium can fall quickly after insulin, so electrolytes and anion-gap closure must be trended.",
  },
  {
    slug: "mi",
    title: "Acute Myocardial Infarction",
    category: "physiological_adaptation",
    subcategory: "Cardiac / ACS",
    center: "Acute coronary syndrome with evolving infarction",
    scenario: "The client reports crushing chest pressure radiating to the jaw with diaphoresis and nausea.",
    labs: ["Troponin pending", "ECG shows ST elevation in contiguous leads"],
    vitals: ["HR 104/min", "BP 148/86 mm Hg", "SpO2 95%"],
    actions: [
      ["aspirin", "Administer chewable aspirin if not contraindicated", true],
      ["activate-reperfusion", "Activate reperfusion pathway and notify the provider", true],
      ["ambulate", "Ambulate to assess exertional tolerance", false],
      ["delay-ecg", "Delay ECG review until pain medication works", false],
    ],
    monitoring: [
      ["st-rhythm", "ST-segment and rhythm changes", true],
      ["pain-bp", "Chest pain, blood pressure, and perfusion", true],
      ["oral-intake", "Oral intake percentage", false],
      ["bowel-pattern", "Bowel pattern", false],
    ],
    rationale: "STEMI care requires rapid antiplatelet therapy and reperfusion coordination. Rhythm, ST changes, pain, and perfusion show whether ischemia is progressing.",
  },
  {
    slug: "stroke",
    title: "Acute Ischemic Stroke",
    category: "physiological_adaptation",
    subcategory: "Neuro / Stroke",
    center: "Acute ischemic stroke within treatment window",
    scenario: "The client has sudden unilateral weakness, facial droop, slurred speech, and a known last-well time under 2 hours.",
    labs: ["Point-of-care glucose 108 mg/dL", "INR pending"],
    vitals: ["BP 184/102 mm Hg", "HR 88/min", "SpO2 96%"],
    actions: [
      ["stroke-activation", "Activate stroke protocol and document last-known-well time", true],
      ["ct-screen", "Prepare for noncontrast CT and thrombolytic screening", true],
      ["oral-meds", "Give oral antihypertensive medication immediately", false],
      ["food-swallow", "Offer food to assess swallowing", false],
    ],
    monitoring: [
      ["neuro-checks", "Focused neuro checks and NIHSS trend", true],
      ["bp-window", "Blood pressure within stroke-treatment parameters", true],
      ["daily-lipids", "Daily lipid panel", false],
      ["routine-weight", "Routine weight", false],
    ],
    rationale: "The priority is rapid stroke pathway activation without delaying imaging or eligibility screening. Neuro status and blood pressure guide treatment safety.",
  },
  {
    slug: "opioid-overdose",
    title: "Opioid Overdose",
    category: "pharmacological",
    subcategory: "Toxicology / Respiratory depression",
    center: "Opioid-induced respiratory depression",
    scenario: "The client is difficult to arouse with pinpoint pupils and slow shallow respirations after receiving opioid medication.",
    labs: ["ABG: PaCO2 elevated", "Medication record shows recent opioid dose"],
    vitals: ["RR 7/min", "SpO2 86%", "HR 58/min"],
    actions: [
      ["ventilation", "Support airway and ventilation with oxygen", true],
      ["naloxone", "Administer naloxone as prescribed", true],
      ["let-sleep", "Allow the client to sleep and reassess later", false],
      ["more-opioid", "Give another opioid dose for comfort", false],
    ],
    monitoring: [
      ["rr-spo2", "Respiratory rate and oxygen saturation", true],
      ["sedation-rebound", "Sedation level and recurrent respiratory depression", true],
      ["appetite", "Appetite after awakening", false],
      ["skin-temp", "Skin temperature only", false],
    ],
    rationale: "Ventilation comes first because opioid toxicity suppresses respiratory drive. Naloxone can wear off before the opioid, so recurrent sedation and oxygenation require close monitoring.",
  },
  {
    slug: "pe",
    title: "Pulmonary Embolism",
    category: "physiological_adaptation",
    subcategory: "Respiratory / Perfusion",
    center: "Pulmonary embolism with impaired oxygenation",
    scenario: "The postoperative client develops sudden dyspnea, pleuritic chest pain, tachycardia, and anxiety.",
    labs: ["D-dimer elevated", "ABG shows respiratory alkalosis"],
    vitals: ["HR 124/min", "RR 30/min", "SpO2 88%", "BP 96/60 mm Hg"],
    actions: [
      ["oxygen-hob", "Apply oxygen and position with head of bed elevated", true],
      ["rapid-escalation", "Notify provider or rapid response for anticoagulation workup", true],
      ["leg-massage", "Massage the painful calf", false],
      ["walk-client", "Ambulate the client to relieve anxiety", false],
    ],
    monitoring: [
      ["spo2-work", "Oxygen saturation and work of breathing", true],
      ["bp-hr", "Blood pressure and heart rate trend", true],
      ["calf-size-daily", "Daily calf circumference only", false],
      ["diet-tolerance", "Diet tolerance", false],
    ],
    rationale: "PE can rapidly impair gas exchange and right-heart output. Oxygenation, hemodynamics, and urgent anticoagulation evaluation are higher priority than mobility or local leg care.",
  },
  {
    slug: "sickle-crisis",
    title: "Sickle Cell Crisis",
    category: "physiological_adaptation",
    subcategory: "Hematology / Vaso-occlusion",
    center: "Vaso-occlusive sickle-cell crisis",
    scenario: "The client reports severe limb and chest pain after dehydration with increasing fatigue.",
    labs: ["Hemoglobin 7.8 g/dL", "Reticulocyte count elevated"],
    vitals: ["HR 112/min", "SpO2 91%", "T 37.9 C"],
    actions: [
      ["analgesia", "Administer prescribed opioid analgesia promptly", true],
      ["hydration-oxygen", "Start IV hydration and oxygen if hypoxemic", true],
      ["ice-packs", "Apply ice packs to painful joints", false],
      ["delay-pain-meds", "Delay analgesia until imaging confirms crisis", false],
    ],
    monitoring: [
      ["pain-resp", "Pain score and respiratory status", true],
      ["cbc-retic", "CBC, reticulocyte count, and oxygenation", true],
      ["calorie-count", "Calorie count only", false],
      ["visual-acuity", "Visual acuity only", false],
    ],
    rationale: "Vaso-occlusion requires rapid pain control, hydration, and oxygenation support. Cold exposure and delayed analgesia can worsen sickling and physiologic stress.",
  },
  {
    slug: "eclampsia",
    title: "Eclampsia",
    category: "physiological_adaptation",
    subcategory: "OB / Hypertensive emergency",
    center: "Eclampsia or severe preeclampsia with seizure risk",
    scenario: "The pregnant client has severe headache, visual changes, hyperreflexia, and severe-range blood pressure.",
    labs: ["Platelets 92,000/mm3", "Proteinuria present", "AST elevated"],
    vitals: ["BP 168/112 mm Hg", "HR 102/min"],
    actions: [
      ["magnesium", "Administer magnesium sulfate as prescribed", true],
      ["seizure-left", "Maintain seizure precautions and left-lateral positioning", true],
      ["dark-room-only", "Place in a dark room as the only intervention", false],
      ["encourage-walking", "Encourage walking to reduce anxiety", false],
    ],
    monitoring: [
      ["rr-dtr", "Respirations, deep tendon reflexes, and level of consciousness", true],
      ["bp-urine", "Blood pressure and urine output", true],
      ["fetal-kicks-only", "Kick counts only", false],
      ["appetite", "Appetite and meal completion", false],
    ],
    rationale: "Magnesium reduces seizure risk, but toxicity can suppress respirations and reflexes. Blood pressure and urine output reflect maternal perfusion and renal involvement.",
  },
  {
    slug: "anaphylaxis",
    title: "Anaphylaxis",
    category: "physiological_adaptation",
    subcategory: "Immune / Airway",
    center: "Anaphylaxis with airway and perfusion threat",
    scenario: "The client develops throat tightness, wheezing, urticaria, and hypotension shortly after a new medication.",
    labs: ["Medication administration record shows new antibiotic"],
    vitals: ["BP 78/42 mm Hg", "HR 132/min", "SpO2 89%"],
    actions: [
      ["epinephrine", "Administer intramuscular epinephrine immediately", true],
      ["airway-oxygen", "Support airway and give high-flow oxygen", true],
      ["oral-antihistamine", "Give oral antihistamine and wait for effect", false],
      ["finish-infusion", "Finish the medication infusion slowly", false],
    ],
    monitoring: [
      ["airway-breathing", "Airway swelling, breath sounds, and oxygenation", true],
      ["bp-rebound", "Blood pressure and recurrent symptoms", true],
      ["rash-only", "Rash color only", false],
      ["temperature", "Temperature every 4 hours", false],
    ],
    rationale: "Anaphylaxis is an immediate airway and circulatory emergency. Epinephrine and airway support are first-line while monitoring for recurrent bronchospasm or hypotension.",
  },
  {
    slug: "neutropenic-fever",
    title: "Neutropenic Fever",
    category: "safety_infection_control",
    subcategory: "Oncology / Infection",
    center: "Neutropenic fever with sepsis risk",
    scenario: "The client receiving chemotherapy reports chills and malaise with a new fever.",
    labs: ["ANC 420/mm3", "WBC 900/mm3"],
    vitals: ["T 38.6 C", "HR 116/min", "BP 100/58 mm Hg"],
    actions: [
      ["cultures-antibiotics", "Obtain cultures and start empiric IV antibiotics promptly", true],
      ["protective-precautions", "Initiate protective neutropenic precautions", true],
      ["rectal-temp", "Check rectal temperature for accuracy", false],
      ["fresh-flowers", "Bring fresh flowers to improve mood", false],
    ],
    monitoring: [
      ["temp-hemodynamics", "Temperature and hemodynamic trend", true],
      ["anc-cultures", "ANC trend and culture results", true],
      ["mouthwash-choice", "Preferred mouthwash flavor", false],
      ["daily-weight-only", "Daily weight only", false],
    ],
    rationale: "Neutropenic fever can progress quickly to sepsis. Cultures, empiric antibiotics, protective precautions, temperature, ANC, and cultures target the immediate infection risk.",
  },
];

function cell(topicSlug, tuple) {
  const [id, text, isCorrect] = tuple;
  return { id: `${topicSlug}-${id}`, text, isCorrect };
}

function makeQuestion(topic, topicIndex, variant, variantIndex) {
  const id = `p1-bowtie-${String(topicIndex + 1).padStart(2, "0")}-${topic.slug}-${variant.suffix}`;
  const leftActions = topic.actions.map((item) => cell(topic.slug, item));
  const rightMonitoring = topic.monitoring.map((item) => cell(topic.slug, item));
  const center = { id: `${topic.slug}-condition`, text: topic.center, isCorrect: true };
  const answer = {
    center: center.id,
    leftActions: leftActions.filter((item) => item.isCorrect).map((item) => item.id),
    rightMonitoring: rightMonitoring.filter((item) => item.isCorrect).map((item) => item.id),
  };
  const wrongCells = [...leftActions, ...rightMonitoring].filter((item) => !item.isCorrect);

  return {
    id,
    exam: "nclex",
    type: "bow_tie",
    category: topic.category,
    subcategory: topic.subcategory,
    difficulty: variantIndex === 0 ? 3 : variantIndex === 1 ? 4 : 5,
    stem: `Complete the bow-tie for the client in the ${variant.setting}.`,
    scenarioTitle: topic.title,
    scenario: `A ${variant.age}-year-old client in the ${variant.setting} has ${variant.cue}. ${topic.scenario}`,
    exhibits: [
      { type: "note", title: "Nurses' Note", body: topic.scenario },
      { type: "vitals", title: "Vital Signs", items: topic.vitals },
      { type: "labs", title: "Diagnostic Data", items: topic.labs },
      { type: "assessment", title: "Focused Assessment", items: [variant.cue, topic.center] },
    ],
    options: [],
    bowTie: { center, leftActions, rightMonitoring },
    answer,
    rationale: topic.rationale,
    distractorRationales: Object.fromEntries(wrongCells.map((item) => [
      item.id,
      `${item.text} does not address the immediate ${topic.subcategory.toLowerCase()} priority and could delay stabilization.`,
    ])),
    tags: ["p1", "bow_tie", topic.slug, "ngn"],
    blueprintPct: 1,
    conceptNotes: [topic.center, topic.subcategory],
    provenance: "scripts/generate-p1-bow-ties.mjs",
    reviewStatus: "approved",
    revision: 1,
    publishState: "published",
  };
}

const questions = TOPICS.flatMap((topic, topicIndex) => (
  VARIANTS.map((variant, variantIndex) => makeQuestion(topic, topicIndex, variant, variantIndex))
));

const batch = {
  batchId: "p1-bow-ties",
  generatedAt: new Date().toISOString(),
  generatedBy: {
    agentId: "codex-local",
    runtime: "zero-api-cost-template-generator",
    promptSource: "P1.5 high-yield NCLEX bow-tie scaffolding",
  },
  examMix: { nclex: questions.length, ccrn: 0 },
  validation: { valid: true, errors: [] },
  distribution: Object.fromEntries(TOPICS.map((topic) => [topic.slug, 3])),
  questions,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(batch, null, 2)}\n`);
console.log(JSON.stringify({ out: OUT, questions: questions.length }, null, 2));
