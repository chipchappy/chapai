import type {
  PracticeChartReviewMetadata,
  PracticeQuestion,
} from "./practice-types";
import {
  makeVerifiedCaseQuestion,
  NCLEX_REFERENCE,
  type CaseReference,
  type VerifiedCaseDefinition,
} from "./verified-case-shared";

const EVIDENCE_REVIEWED_AT = "2026-07-23";

type ChartStage = {
  timeline: string;
  note: string;
  vitals?: PracticeChartReviewMetadata["vitals"];
  labs?: PracticeChartReviewMetadata["labs"];
  orders?: string[];
  assessments?: string[];
  intakeOutput?: string[];
  medicationAdministrationRecord?: string[];
};

function buildUnfoldingChart(
  base: PracticeChartReviewMetadata,
  stages: ChartStage[],
  caseItemNumber: number,
): PracticeChartReviewMetadata {
  const visibleStages = stages.slice(
    0,
    Math.max(1, Math.min(caseItemNumber, stages.length)),
  );
  const latestVitals = [...visibleStages]
    .reverse()
    .find((stage) => stage.vitals)?.vitals;

  return {
    ...base,
    timeline: visibleStages.map((stage) => stage.timeline),
    unfoldingTimeline: visibleStages.map((stage) => stage.timeline),
    nursingNotes: [
      ...(base.nursingNotes ?? []),
      ...visibleStages.map((stage) => stage.note),
    ],
    notes: [
      ...(base.nursingNotes ?? []),
      ...visibleStages.map((stage) => stage.note),
    ],
    vitals: latestVitals ?? base.vitals,
    labs: visibleStages.flatMap((stage) => stage.labs ?? []),
    providerOrders: visibleStages.flatMap((stage) => stage.orders ?? []),
    orders: visibleStages.flatMap((stage) => stage.orders ?? []),
    assessments: visibleStages.flatMap((stage) => stage.assessments ?? []),
    intakeOutput: visibleStages.flatMap((stage) => stage.intakeOutput ?? []),
    medicationAdministrationRecord: visibleStages.flatMap(
      (stage) => stage.medicationAdministrationRecord ?? [],
    ),
  };
}

const preeclampsiaReferences: CaseReference[] = [
  NCLEX_REFERENCE,
  {
    title: "Gestational Hypertension and Preeclampsia",
    citation: "ACOG Practice Bulletin No. 222, reaffirmed 2023",
    href: "https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2020/06/gestational-hypertension-and-preeclampsia",
  },
  {
    title: "Pre-eclampsia",
    citation: "World Health Organization, December 2025",
    href: "https://www.who.int/news-room/fact-sheets/detail/pre-eclampsia",
  },
];

const preeclampsiaBaseChart: PracticeChartReviewMetadata = {
  patientTitle: "Antepartum Unit: 35 weeks 2 days",
  patientCaption:
    "Unfolding maternal-fetal record. Only information available at the current item is shown.",
  chiefComplaint:
    "Persistent headache, visual spots, and right upper-quadrant discomfort.",
  hpi: [
    "A 27-year-old primigravida at 35 weeks 2 days reports a severe frontal headache that began 5 hours ago and did not improve with acetaminophen.",
    "During the past 2 hours, the client developed flashing spots in both visual fields and constant right upper-quadrant pressure.",
    "Fetal movement was normal earlier today. The client denies vaginal bleeding, fluid leakage, contractions, fever, and recent trauma.",
  ],
  history: [
    "Singleton pregnancy; blood pressures were below 130/80 mm Hg before 20 weeks.",
    "No history of chronic hypertension, renal disease, seizure disorder, or substance use.",
    "Prenatal laboratory findings were previously within expected limits.",
  ],
  allergies: ["No known medication allergies."],
  medications: ["Prenatal vitamin", "Ferrous sulfate"],
  nursingNotes: [
    "0805 - Identity, gestational age, allergies, and prenatal record verified. Client positioned laterally with call light in reach while urgent maternal and fetal assessment begins.",
  ],
};

const preeclampsiaStages: ChartStage[] = [
  {
    timeline:
      "0810 - Admitted for urgent evaluation after severe-range blood pressure and neurologic symptoms were identified.",
    note:
      "0810 - Client is awake and anxious, reports headache 8/10 and flashing spots. Blood pressure is 168/112 mm Hg; repeat after 15 minutes is 166/110 mm Hg. Patellar reflexes are 3+ with 2 beats of ankle clonus. Lungs are clear. Fetal baseline is 145/min with moderate variability.",
    vitals: [
      { label: "Blood pressure", value: "166/110", unit: "mm Hg", flag: "critical" },
      { label: "Heart rate", value: "96", unit: "/min", flag: "high" },
      { label: "Respiratory rate", value: "18", unit: "/min", flag: "normal" },
      { label: "SpO2", value: "98", unit: "% room air", flag: "normal" },
      { label: "Temperature", value: "98.4", unit: "F (36.9 C)", flag: "normal" },
    ],
    assessments: [
      "Headache 8/10 with visual scotomata and right upper-quadrant pain.",
      "Patellar reflexes 3+; 2 beats of ankle clonus.",
      "No crackles, vaginal bleeding, or labor pattern.",
      "Fetal heart rate baseline 145/min with moderate variability.",
    ],
  },
  {
    timeline:
      "0830 - Maternal laboratory and urine studies resulted; obstetric clinician notified immediately.",
    note:
      "0830 - Platelet count is 92,000/mm3, AST 86 units/L, serum creatinine 1.2 mg/dL, and urine protein-to-creatinine ratio 0.46. Headache and visual symptoms persist. Continuous fetal monitoring continues.",
    labs: [
      { label: "Platelets", value: "92,000", unit: "/mm3", flag: "low" },
      { label: "AST", value: "86", unit: "units/L", flag: "high" },
      { label: "Creatinine", value: "1.2", unit: "mg/dL", flag: "high" },
      { label: "Urine protein/creatinine", value: "0.46", flag: "high" },
    ],
    assessments: [
      "Persistent severe headache and visual symptoms.",
      "Laboratory evidence of thrombocytopenia and hepatic and renal involvement.",
    ],
  },
  {
    timeline:
      "0840 - Severe preeclampsia response initiated; seizure prophylaxis and urgent blood-pressure treatment prescribed.",
    note:
      "0840 - Client moved to a quiet room with padded side rails. Two patent IV sites are present. The nurse explains magnesium sulfate is intended to prevent eclamptic seizures, not directly lower blood pressure.",
    orders: [
      "Magnesium sulfate IV loading dose followed by maintenance infusion per obstetric protocol.",
      "Administer prescribed rapid-acting antihypertensive for persistent severe-range blood pressure.",
      "Strict intake and output; assess respiratory rate, oxygen saturation, level of consciousness, and deep-tendon reflexes at protocol intervals.",
      "Continuous fetal monitoring and obstetric evaluation for delivery after maternal stabilization.",
      "Keep calcium gluconate immediately available according to unit protocol.",
    ],
    assessments: [
      "Seizure precautions initiated.",
      "Emergency airway and suction equipment available.",
    ],
  },
  {
    timeline:
      "0945 - Magnesium loading dose completed and maintenance infusion running; maternal blood pressure improved.",
    note:
      "0945 - Blood pressure is 148/96 mm Hg after prescribed antihypertensive. Respiratory rate is 16/min, SpO2 98% on room air, patellar reflexes 2+, and client is easily aroused. Urine output is 35 mL during the past hour. Headache is now 5/10.",
    vitals: [
      { label: "Blood pressure", value: "148/96", unit: "mm Hg", flag: "high" },
      { label: "Heart rate", value: "88", unit: "/min", flag: "normal" },
      { label: "Respiratory rate", value: "16", unit: "/min", flag: "normal" },
      { label: "SpO2", value: "98", unit: "% room air", flag: "normal" },
      { label: "Temperature", value: "98.4", unit: "F (36.9 C)", flag: "normal" },
    ],
    intakeOutput: ["0845-0945 - Urine output 35 mL."],
    medicationAdministrationRecord: [
      "Magnesium sulfate loading dose completed; maintenance infusion running as prescribed.",
      "Prescribed rapid-acting antihypertensive administered for persistent severe-range pressure.",
    ],
    assessments: [
      "Patellar reflexes 2+ bilaterally; client easily aroused.",
      "Headache decreased to 5/10; visual spots less frequent.",
    ],
  },
  {
    timeline:
      "1115 - New respiratory depression, absent reflexes, somnolence, and oliguria identified during magnesium infusion.",
    note:
      "1115 - Client is difficult to arouse. Respiratory rate is 9/min, SpO2 92% on room air, and patellar reflexes are absent. Urine output totals 20 mL over the past 2 hours. Magnesium maintenance infusion remains connected.",
    vitals: [
      { label: "Blood pressure", value: "144/92", unit: "mm Hg", flag: "high" },
      { label: "Heart rate", value: "82", unit: "/min", flag: "normal" },
      { label: "Respiratory rate", value: "9", unit: "/min", flag: "critical" },
      { label: "SpO2", value: "92", unit: "% room air", flag: "low" },
      { label: "Temperature", value: "98.2", unit: "F (36.8 C)", flag: "normal" },
    ],
    intakeOutput: ["0945-1115 - Urine output 20 mL total."],
    assessments: [
      "Patellar reflexes absent bilaterally.",
      "Client somnolent and difficult to arouse.",
      "Fetal baseline 140/min with moderate variability.",
    ],
  },
  {
    timeline:
      "1140 - Magnesium infusion stopped; escalation and prescribed reversal treatment completed with improved respiratory and neurologic findings.",
    note:
      "1140 - After the magnesium infusion was stopped and the obstetric emergency response activated, prescribed calcium gluconate was administered. Respiratory rate is 16/min, SpO2 98% with oxygen, patellar reflexes are 2+, and client is alert. Urine output is 35 mL in the latest hour. Fetal baseline remains 140/min with moderate variability.",
    vitals: [
      { label: "Blood pressure", value: "146/94", unit: "mm Hg", flag: "high" },
      { label: "Heart rate", value: "86", unit: "/min", flag: "normal" },
      { label: "Respiratory rate", value: "16", unit: "/min", flag: "normal" },
      { label: "SpO2", value: "98", unit: "% with oxygen", flag: "normal" },
      { label: "Temperature", value: "98.2", unit: "F (36.8 C)", flag: "normal" },
    ],
    intakeOutput: ["1115-1215 - Urine output 35 mL."],
    medicationAdministrationRecord: [
      "Magnesium sulfate infusion stopped at 1117.",
      "Calcium gluconate administered by prescription during emergency response.",
    ],
    assessments: [
      "Client alert; patellar reflexes 2+ bilaterally.",
      "Headache 3/10; no current visual spots.",
      "Fetal baseline 140/min with moderate variability.",
    ],
  },
];

const preeclampsiaDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-severe-preeclampsia-magnesium-ngn",
  title: "Maternal Health: Severe Preeclampsia and Magnesium Therapy",
  references: preeclampsiaReferences,
  sourceIds: [
    "ncsbn-2026-rn-test-plan",
    "acog-practice-bulletin-222-reaffirmed-2023",
    "who-preeclampsia-2025",
  ],
  evidenceReviewedAt: EVIDENCE_REVIEWED_AT,
  buildChartReview: (caseItemNumber) =>
    buildUnfoldingChart(
      preeclampsiaBaseChart,
      preeclampsiaStages,
      caseItemNumber,
    ),
};

const dehydrationReferences: CaseReference[] = [
  NCLEX_REFERENCE,
  {
    title:
      "Guideline on Management of Pneumonia and Diarrhoea in Children up to 10 Years of Age",
    citation: "World Health Organization, 2024",
    href: "https://www.who.int/publications/i/item/9789240103412",
  },
  {
    title:
      "Managing Acute Gastroenteritis Among Children: Oral Rehydration, Maintenance, and Nutritional Therapy",
    citation: "Centers for Disease Control and Prevention, MMWR RR-16",
    href: "https://www.cdc.gov/mmwr/preview/mmwrhtml/rr5216a1.htm",
  },
];

const dehydrationBaseChart: PracticeChartReviewMetadata = {
  patientTitle: "Pediatric Emergency Department: 18-month-old",
  patientCaption:
    "Unfolding pediatric record. Later treatment response is withheld until the corresponding item.",
  chiefComplaint: "Watery diarrhea, vomiting, and markedly decreased urine output.",
  hpi: [
    "An 18-month-old child weighing 10 kg developed frequent watery stools 3 days ago and has had eight stools and four episodes of nonbloody emesis in the past 24 hours.",
    "The parent reports the child refuses most fluids, produced one small wet diaper in 12 hours, and became increasingly sleepy this morning.",
    "There is no blood or bile in the emesis, no blood in the stool, and no known ingestion or recent travel.",
  ],
  history: [
    "Born at term with no chronic cardiac, renal, or endocrine condition.",
    "Immunizations are current, including rotavirus series.",
    "Usual weight documented 2 weeks ago was 10.9 kg.",
  ],
  allergies: ["No known medication allergies."],
  medications: ["No routine medications."],
  nursingNotes: [
    "1305 - Child arrives carried by the parent and is placed on a pediatric stretcher with continuous observation; the current diaper is dry and the admission weight is 10.0 kg.",
  ],
};

const dehydrationStages: ChartStage[] = [
  {
    timeline:
      "1310 - Child triaged immediately for lethargy and signs of poor circulation.",
    note:
      "1310 - Child is lethargic but responds to painful stimulation. Mucous membranes are very dry; eyes are sunken and tears are absent. Extremities are cool with weak peripheral pulses and capillary refill of 4 seconds. Heart rate is 168/min and blood pressure is 74/42 mm Hg.",
    vitals: [
      { label: "Blood pressure", value: "74/42", unit: "mm Hg", flag: "critical" },
      { label: "Heart rate", value: "168", unit: "/min", flag: "critical" },
      { label: "Respiratory rate", value: "34", unit: "/min", flag: "high" },
      { label: "SpO2", value: "97", unit: "% room air", flag: "normal" },
      { label: "Temperature", value: "99.0", unit: "F (37.2 C)", flag: "normal" },
      { label: "Weight", value: "10.0", unit: "kg", flag: "low" },
    ],
    assessments: [
      "Very dry oral mucosa, sunken eyes, absent tears.",
      "Cool extremities, weak pulses, capillary refill 4 seconds.",
      "Lethargic; responds to painful stimulation.",
      "Abdomen soft without guarding or focal tenderness.",
    ],
    intakeOutput: ["Parent reports one small wet diaper in the previous 12 hours."],
  },
  {
    timeline:
      "1320 - Point-of-care glucose and metabolic studies obtained while vascular access was established.",
    note:
      "1320 - Serum sodium is 150 mEq/L, bicarbonate 14 mEq/L, BUN 32 mg/dL, creatinine 0.7 mg/dL, and glucose 66 mg/dL. Findings are interpreted with the child's clinical perfusion status; treatment is not delayed for laboratory completion.",
    labs: [
      { label: "Sodium", value: "150", unit: "mEq/L", flag: "high" },
      { label: "Bicarbonate", value: "14", unit: "mEq/L", flag: "low" },
      { label: "BUN", value: "32", unit: "mg/dL", flag: "high" },
      { label: "Creatinine", value: "0.7", unit: "mg/dL", flag: "high" },
      { label: "Glucose", value: "66", unit: "mg/dL", flag: "normal" },
    ],
    assessments: [
      "Weight loss from 10.9 kg to 10.0 kg is approximately 8%.",
      "Clinical shock findings remain more urgent than the exact percentage estimate.",
    ],
  },
  {
    timeline:
      "1325 - Pediatric shock response activated for severe dehydration with hypovolemic shock.",
    note:
      "1325 - Peripheral IV access established. The nurse begins continuous cardiorespiratory and pulse-oximetry monitoring and prepares the prescribed weight-based isotonic crystalloid bolus.",
    orders: [
      "Administer 0.9% sodium chloride 20 mL/kg IV promptly; reassess pulse, perfusion, mental status, lung sounds, and vital signs after the bolus.",
      "Repeat isotonic crystalloid bolus if prescribed and shock findings persist after reassessment.",
      "Strict intake and output; weigh diapers.",
      "When perfusion and alertness improve, begin low-osmolarity oral rehydration solution in small frequent amounts and replace ongoing stool losses.",
    ],
    assessments: [
      "Emergency equipment and intraosseous supplies available if vascular access fails.",
    ],
  },
  {
    timeline:
      "1330 - First 200 mL 0.9% sodium chloride bolus started; reassessment plan established before additional fluid.",
    note:
      "1330 - The nurse verifies the 10 kg dosing weight, labels the first 200 mL isotonic bolus, and plans a full cardiopulmonary, neurologic, and perfusion reassessment at completion. No hypotonic fluid or antidiarrheal medication is given.",
    medicationAdministrationRecord: [
      "0.9% sodium chloride 200 mL IV bolus started as prescribed.",
    ],
    intakeOutput: ["1330 - 200 mL isotonic crystalloid bolus infusing."],
    assessments: [
      "Baseline lung sounds clear before bolus.",
      "Continuous pulse oximetry and cardiorespiratory monitoring in place.",
    ],
  },
  {
    timeline:
      "1345 - First bolus completed; circulation improved partially, but shock findings persist.",
    note:
      "1345 - Heart rate is 148/min, blood pressure 82/48 mm Hg, capillary refill 3 seconds, pulses remain weak, and child opens eyes to voice but is not interacting normally. Lungs are clear and there is no hepatomegaly. A second 20 mL/kg isotonic bolus is prescribed.",
    vitals: [
      { label: "Blood pressure", value: "82/48", unit: "mm Hg", flag: "low" },
      { label: "Heart rate", value: "148", unit: "/min", flag: "high" },
      { label: "Respiratory rate", value: "30", unit: "/min", flag: "high" },
      { label: "SpO2", value: "98", unit: "% room air", flag: "normal" },
      { label: "Temperature", value: "99.0", unit: "F (37.2 C)", flag: "normal" },
    ],
    orders: [
      "Administer second 0.9% sodium chloride 20 mL/kg IV bolus and reassess.",
    ],
    assessments: [
      "Capillary refill 3 seconds; peripheral pulses weak.",
      "Opens eyes to voice but remains listless.",
      "Lung sounds remain clear; no hepatomegaly.",
    ],
  },
  {
    timeline:
      "1415 - After second bolus, perfusion and neurologic status improved; oral replacement phase initiated.",
    note:
      "1415 - Child is alert, reaches for the parent, and tolerates 5 mL oral rehydration solution every 1 to 2 minutes without emesis. Heart rate is 118/min, blood pressure 92/56 mm Hg, capillary refill 2 seconds, and tears are present. Urine output is 12 mL in the latest hour.",
    vitals: [
      { label: "Blood pressure", value: "92/56", unit: "mm Hg", flag: "normal" },
      { label: "Heart rate", value: "118", unit: "/min", flag: "normal" },
      { label: "Respiratory rate", value: "24", unit: "/min", flag: "normal" },
      { label: "SpO2", value: "98", unit: "% room air", flag: "normal" },
      { label: "Temperature", value: "99.0", unit: "F (37.2 C)", flag: "normal" },
    ],
    labs: [
      { label: "Repeat sodium", value: "147", unit: "mEq/L", flag: "high" },
      { label: "Repeat bicarbonate", value: "18", unit: "mEq/L", flag: "low" },
    ],
    medicationAdministrationRecord: [
      "Second 0.9% sodium chloride 200 mL IV bolus completed.",
      "Low-osmolarity oral rehydration solution started in small frequent amounts.",
    ],
    intakeOutput: [
      "Latest hour - Urine output 12 mL (1.2 mL/kg/hr).",
      "Oral rehydration solution tolerated without emesis.",
    ],
    assessments: [
      "Alert and interacting with parent.",
      "Tears present; mucosa moistening; capillary refill 2 seconds.",
      "Lungs clear without increased work of breathing.",
    ],
  },
];

const dehydrationDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-pediatric-hypovolemic-dehydration-ngn",
  title: "Pediatrics: Hypovolemic Dehydration from Gastroenteritis",
  references: dehydrationReferences,
  sourceIds: [
    "ncsbn-2026-rn-test-plan",
    "who-child-pneumonia-diarrhoea-guideline-2024",
    "cdc-pediatric-gastroenteritis-rr5216",
  ],
  evidenceReviewedAt: EVIDENCE_REVIEWED_AT,
  buildChartReview: (caseItemNumber) =>
    buildUnfoldingChart(
      dehydrationBaseChart,
      dehydrationStages,
      caseItemNumber,
    ),
};

const asthmaReferences: CaseReference[] = [
  NCLEX_REFERENCE,
  {
    title: "Section 5: Managing Exacerbations of Asthma",
    citation: "NHLBI Expert Panel Report 3",
    href: "https://www.nhlbi.nih.gov/files/docs/guidelines/11_sec5_exacerb.pdf",
  },
  {
    title: "2020 Focused Updates to the Asthma Management Guidelines",
    citation: "National Heart, Lung, and Blood Institute, 2020",
    href: "https://www.nhlbi.nih.gov/health-topics/asthma-management-guidelines-2020-updates",
  },
];

const asthmaBaseChart: PracticeChartReviewMetadata = {
  patientTitle: "Pediatric Emergency Department: 8-year-old",
  patientCaption:
    "Unfolding respiratory record. Treatment response appears only after it occurs.",
  chiefComplaint: "Severe wheezing and difficulty speaking despite rescue inhaler use.",
  hpi: [
    "An 8-year-old child weighing 28 kg developed nasal congestion and cough 2 days ago, followed by rapidly worsening wheeze and chest tightness today.",
    "The parent administered albuterol by metered-dose inhaler four times during the past 3 hours with only brief relief.",
    "During transport, the child could speak only two or three words at a time and became increasingly frightened and tired.",
  ],
  history: [
    "Asthma diagnosed at age 4; one emergency visit in the past year and no prior intubation.",
    "Uses inhaled corticosteroid inconsistently and albuterol as rescue medication.",
    "No congenital heart disease, neuromuscular disease, or known foreign-body event.",
  ],
  allergies: ["Cat dander", "No known medication allergies."],
  medications: ["Albuterol inhaler as needed", "Prescribed inhaled corticosteroid"],
  nursingNotes: [
    "1705 - Child is moved directly from triage to a monitored pediatric bed; parent remains at bedside and confirms the rescue inhaler provided only brief relief during transport.",
  ],
};

const asthmaStages: ChartStage[] = [
  {
    timeline:
      "1710 - Child placed in high-acuity bed for severe respiratory distress and hypoxemia.",
    note:
      "1710 - Child sits in tripod position, speaks two to three words per breath, and has suprasternal and intercostal retractions. Respiratory rate is 38/min and SpO2 88% on room air. Diffuse expiratory wheeze is present, with markedly diminished air entry at both bases. Peak expiratory flow is 35% of personal best.",
    vitals: [
      { label: "Blood pressure", value: "108/68", unit: "mm Hg", flag: "normal" },
      { label: "Heart rate", value: "142", unit: "/min", flag: "high" },
      { label: "Respiratory rate", value: "38", unit: "/min", flag: "critical" },
      { label: "SpO2", value: "88", unit: "% room air", flag: "critical" },
      { label: "Temperature", value: "99.3", unit: "F (37.4 C)", flag: "normal" },
      { label: "Peak flow", value: "35", unit: "% personal best", flag: "critical" },
    ],
    assessments: [
      "Tripod position; suprasternal and intercostal retractions.",
      "Two- to three-word speech.",
      "Diffuse expiratory wheeze with markedly diminished air entry at bases.",
      "Alert, frightened, and following commands.",
    ],
  },
  {
    timeline:
      "1715 - Severity analysis completed; severe airflow obstruction with hypoxemia identified.",
    note:
      "1715 - Child remains alert but cannot complete a sentence. Prolonged expiration and accessory-muscle use persist. There is no stridor, urticaria, facial swelling, unilateral absent breath sounds, or choking history.",
    assessments: [
      "Findings support severe lower-airway obstruction rather than upper-airway obstruction, anaphylaxis, or focal foreign-body obstruction.",
      "Fatigue risk is elevated because work of breathing remains intense.",
    ],
  },
  {
    timeline:
      "1720 - Severe asthma exacerbation protocol initiated with oxygen, rapid bronchodilation, and systemic anti-inflammatory therapy.",
    note:
      "1720 - Supplemental oxygen applied. Repeated nebulized albuterol plus ipratropium and systemic corticosteroid are prescribed. Continuous cardiorespiratory and oxygen-saturation monitoring begins.",
    orders: [
      "Titrate supplemental oxygen and continuously monitor oxygen saturation.",
      "Administer repeated or continuous selective short-acting beta2-agonist therapy as prescribed.",
      "Administer inhaled ipratropium with initial severe-exacerbation treatments as prescribed.",
      "Administer systemic corticosteroid promptly.",
      "Reassess speech, mental status, work of breathing, air entry, breath sounds, and peak flow when feasible.",
      "Escalate immediately for worsening fatigue, drowsiness, or decreasing air movement.",
    ],
  },
  {
    timeline:
      "1725 - Initial medications started; nurse coordinates repeated assessment and escalation readiness.",
    note:
      "1725 - Oxygen and prescribed nebulized bronchodilators are running. Systemic corticosteroid is administered. The nurse keeps resuscitation equipment available and reassesses air entry and mental status between treatments rather than using wheeze intensity alone.",
    medicationAdministrationRecord: [
      "Supplemental oxygen initiated.",
      "Nebulized albuterol plus ipratropium initiated as prescribed.",
      "Systemic corticosteroid administered as prescribed.",
    ],
    assessments: [
      "Continuous pulse oximetry and cardiorespiratory monitoring active.",
      "Air entry, speech, retractions, and alertness designated as serial bedside response markers.",
    ],
  },
  {
    timeline:
      "1750 - Despite treatment, wheeze becomes faint as air movement worsens and drowsiness develops.",
    note:
      "1750 - SpO2 is 92% with oxygen, respiratory rate 40/min, and heart rate 150/min. Child is drowsy, speaks one word at a time, and has barely audible breath sounds with minimal chest excursion. Peak flow cannot be performed.",
    vitals: [
      { label: "Blood pressure", value: "104/64", unit: "mm Hg", flag: "normal" },
      { label: "Heart rate", value: "150", unit: "/min", flag: "high" },
      { label: "Respiratory rate", value: "40", unit: "/min", flag: "critical" },
      { label: "SpO2", value: "92", unit: "% with oxygen", flag: "low" },
      { label: "Temperature", value: "99.3", unit: "F (37.4 C)", flag: "normal" },
    ],
    assessments: [
      "Drowsy; responds to repeated verbal stimulation.",
      "Barely audible breath sounds and minimal chest excursion.",
      "Unable to perform peak flow.",
    ],
  },
  {
    timeline:
      "1840 - After critical-care escalation and intensified prescribed therapy, ventilation and oxygenation improve.",
    note:
      "1840 - Child is alert, speaks in full sentences, and no longer uses accessory muscles at rest. Respiratory rate is 24/min, SpO2 96% on 2 L/min nasal cannula, and peak flow is 65% of personal best. Air entry is improved with scattered expiratory wheeze. Heart rate is 132/min after repeated albuterol.",
    vitals: [
      { label: "Blood pressure", value: "106/66", unit: "mm Hg", flag: "normal" },
      { label: "Heart rate", value: "132", unit: "/min", flag: "high" },
      { label: "Respiratory rate", value: "24", unit: "/min", flag: "high" },
      { label: "SpO2", value: "96", unit: "% on 2 L/min", flag: "normal" },
      { label: "Temperature", value: "99.1", unit: "F (37.3 C)", flag: "normal" },
      { label: "Peak flow", value: "65", unit: "% personal best", flag: "low" },
    ],
    medicationAdministrationRecord: [
      "Continuous albuterol continued under critical-care direction.",
      "Additional escalation therapy administered as prescribed.",
    ],
    assessments: [
      "Alert and speaking in full sentences.",
      "Improved bilateral air entry with scattered expiratory wheeze.",
      "No accessory-muscle use at rest.",
      "Tachycardia persists and requires continued medication-effect monitoring.",
    ],
  },
];

const asthmaDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-pediatric-status-asthmaticus-ngn",
  title: "Pediatrics: Severe Asthma Exacerbation with Impending Failure",
  references: asthmaReferences,
  sourceIds: [
    "ncsbn-2026-rn-test-plan",
    "nhlbi-epr3-asthma-exacerbations-section-5",
    "nhlbi-asthma-focused-updates-2020",
  ],
  evidenceReviewedAt: EVIDENCE_REVIEWED_AT,
  buildChartReview: (caseItemNumber) =>
    buildUnfoldingChart(asthmaBaseChart, asthmaStages, caseItemNumber),
};

const neonatalReferences: CaseReference[] = [
  NCLEX_REFERENCE,
  {
    title: "Postnatal Glucose Homeostasis in Late-Preterm and Term Infants",
    citation: "American Academy of Pediatrics Committee on Fetus and Newborn",
    href: "https://publications.aap.org/pediatrics/article/127/3/e20103851/65026/Postnatal-Glucose-Homeostasis-in-Late-Preterm-and",
  },
  {
    title: "Hypoglycemia",
    citation: "American Academy of Pediatrics Pediatric Care Online, 2024",
    href: "https://publications.aap.org/pediatriccare/article/doi/10.1542/aap.ppcqr.396259/90/Hypoglycemia",
  },
  {
    title:
      "Evaluation and Management of Persistent Hypoglycemia in Neonates, Infants, and Children",
    citation: "Pediatric Endocrine Society guideline",
    href: "https://pedsendo.org/clinical-resource/evaluation-and-management-of-persistent-hypoglycemia-in-neonates-infants-and-children-j-peds-2015/",
  },
];

const neonatalBaseChart: PracticeChartReviewMetadata = {
  patientTitle: "Newborn Nursery: term infant, 1 hour old",
  patientCaption:
    "Unfolding newborn record. Glucose results and response data appear only when available.",
  chiefComplaint:
    "Infant of a diabetic parent with jitteriness and ineffective feeding.",
  hpi: [
    "A newborn was delivered vaginally at 39 weeks after an uncomplicated labor. Apgar scores were 8 and 9 at 1 and 5 minutes.",
    "The birth parent has type 2 diabetes treated with insulin during pregnancy. The infant weighs 4,320 g and is large for gestational age.",
    "Skin-to-skin contact began after birth. The infant latched briefly at 30 minutes but did not sustain effective sucking.",
  ],
  history: [
    "No congenital anomaly identified on prenatal imaging.",
    "No maternal fever, prolonged membrane rupture, or medication exposure associated with neonatal respiratory depression.",
  ],
  allergies: ["No known allergies."],
  medications: ["Routine newborn prophylaxis completed per facility protocol."],
  nursingNotes: [
    "0705 - Newborn identification bands, maternal diabetes history, and birth weight are verified. Infant remains with the parent while the nurse prepares for symptom-triggered glucose assessment.",
  ],
};

const neonatalStages: ChartStage[] = [
  {
    timeline:
      "0710 - At-risk newborn screening initiated because of maternal diabetes and large-for-gestational-age status.",
    note:
      "0710 - At 70 minutes of life, infant is jittery when undisturbed and has a weak, poorly sustained suck. Axillary temperature is 97.5 F (36.4 C). Respirations are unlabored, color is pink, and SpO2 is 97% on room air.",
    vitals: [
      { label: "Heart rate", value: "156", unit: "/min", flag: "normal" },
      { label: "Respiratory rate", value: "48", unit: "/min", flag: "normal" },
      { label: "SpO2", value: "97", unit: "% room air", flag: "normal" },
      { label: "Temperature", value: "97.5", unit: "F (36.4 C)", flag: "low" },
      { label: "Birth weight", value: "4,320", unit: "g", flag: "high" },
    ],
    assessments: [
      "Jitteriness occurs without stimulation.",
      "Weak suck and inability to sustain feeding.",
      "No grunting, retractions, cyanosis, or murmur.",
    ],
    intakeOutput: ["Breastfed briefly at 30 minutes; effective transfer not established."],
  },
  {
    timeline:
      "0715 - Bedside glucose obtained immediately for symptoms; laboratory-quality plasma sample sent.",
    note:
      "0715 - Point-of-care glucose is 32 mg/dL. A plasma glucose specimen is collected, and the neonatal clinician is notified without delaying treatment preparation. Jitteriness and poor feeding persist.",
    labs: [
      { label: "Point-of-care glucose", value: "32", unit: "mg/dL", flag: "critical" },
    ],
    assessments: [
      "Symptomatic low glucose requires prompt intervention rather than routine prefeed observation.",
    ],
  },
  {
    timeline:
      "0720 - Symptomatic neonatal hypoglycemia response initiated.",
    note:
      "0720 - Infant moved to a radiant warmer with continuous cardiorespiratory monitoring. IV access is established. The nurse prepares prescribed IV dextrose while supporting thermoregulation and the parent-infant relationship.",
    orders: [
      "Administer IV dextrose loading treatment and continuous dextrose infusion per neonatal protocol.",
      "Recheck glucose after treatment and before subsequent feedings according to protocol.",
      "Support feeding when neurologically and respiratory stable; involve lactation support.",
      "Monitor neurologic status, temperature, feeding tolerance, IV site, and cardiorespiratory status.",
      "Escalate for recurrent or persistent hypoglycemia and evaluate for an underlying disorder if it does not resolve in the expected transitional period.",
    ],
  },
  {
    timeline:
      "0725 - Prescribed IV dextrose started; serial glucose and feeding plan coordinated.",
    note:
      "0725 - Prescribed IV dextrose treatment begins. The nurse verifies concentration, dose, pump settings, and IV patency with a second nurse. Jitteriness stops within several minutes. A repeat glucose is scheduled per protocol, and feeding will resume when the infant is alert and coordinated.",
    medicationAdministrationRecord: [
      "Prescribed IV dextrose loading treatment administered.",
      "Continuous dextrose infusion initiated by infusion pump.",
    ],
    assessments: [
      "Jitteriness resolved after treatment began.",
      "IV site soft without redness, swelling, or leakage.",
    ],
  },
  {
    timeline:
      "1015 - Glucose falls again after initial improvement, indicating incomplete stabilization.",
    note:
      "1015 - Glucose was 48 mg/dL after initial treatment and infant took 18 mL expressed breast milk. Before the next feeding, glucose is 36 mg/dL and the infant is again sleepy with a weak suck. IV dextrose is still infusing and the site is patent.",
    labs: [
      { label: "Post-treatment glucose", value: "48", unit: "mg/dL", flag: "normal" },
      { label: "Next prefeed glucose", value: "36", unit: "mg/dL", flag: "critical" },
    ],
    intakeOutput: ["0815 - Took 18 mL expressed breast milk with coordinated suck."],
    assessments: [
      "Recurrent sleepiness and weak suck with recurrent low glucose.",
      "IV site patent; no infiltration.",
    ],
  },
  {
    timeline:
      "1300 - After prescribed infusion adjustment and feeding support, symptoms resolve and glucose values improve, but continued surveillance remains necessary.",
    note:
      "1300 - After provider-directed adjustment of IV dextrose, glucose values are 52 mg/dL and 58 mg/dL before consecutive feedings. Infant is alert, maintains temperature, and takes 25 mL expressed breast milk. The latest IV assessment shows mild swelling and coolness at the insertion site.",
    vitals: [
      { label: "Heart rate", value: "142", unit: "/min", flag: "normal" },
      { label: "Respiratory rate", value: "44", unit: "/min", flag: "normal" },
      { label: "SpO2", value: "98", unit: "% room air", flag: "normal" },
      { label: "Temperature", value: "98.1", unit: "F (36.7 C)", flag: "normal" },
    ],
    labs: [
      { label: "Prefeed glucose 1", value: "52", unit: "mg/dL", flag: "normal" },
      { label: "Prefeed glucose 2", value: "58", unit: "mg/dL", flag: "normal" },
    ],
    intakeOutput: [
      "Latest feeding - 25 mL expressed breast milk with coordinated suck.",
    ],
    assessments: [
      "Alert with normal tone; no jitteriness.",
      "Maintains temperature in bassinet.",
      "IV site mildly swollen and cool; possible infiltration.",
    ],
  },
];

const neonatalDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-neonatal-hypoglycemia-idm-ngn",
  title: "Newborn Care: Hypoglycemia in an Infant of a Diabetic Parent",
  references: neonatalReferences,
  sourceIds: [
    "ncsbn-2026-rn-test-plan",
    "aap-postnatal-glucose-homeostasis",
    "aap-pediatric-care-hypoglycemia-2024",
    "pes-persistent-hypoglycemia-guideline",
  ],
  evidenceReviewedAt: EVIDENCE_REVIEWED_AT,
  buildChartReview: (caseItemNumber) =>
    buildUnfoldingChart(neonatalBaseChart, neonatalStages, caseItemNumber),
};

const preeclampsiaCaseStudyDeck: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(preeclampsiaDefinition, {
    id: "codex-nclex-preeclampsia-magnesium-case-01",
    kind: "multi-select",
    questionType: "sata",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "analyze",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem:
      "Which findings require immediate follow-up for a hypertensive emergency with severe features? Select all that apply.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Select all findings that require immediate follow-up.",
    options: [
      { id: "a", text: "Blood pressure 166/110 mm Hg after repeat measurement" },
      { id: "b", text: "Persistent headache rated 8/10" },
      { id: "c", text: "Flashing spots in both visual fields" },
      { id: "d", text: "Right upper-quadrant pain" },
      { id: "e", text: "Patellar reflexes 3+ with ankle clonus" },
      { id: "f", text: "Fetal baseline 145/min with moderate variability" },
      { id: "g", text: "Singleton pregnancy at 35 weeks 2 days" },
      { id: "h", text: "Temperature 98.4 F (36.9 C)" },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "Persistent severe-range blood pressure plus new cerebral and hepatic warning symptoms requires immediate obstetric escalation. The severe headache, visual scotomata, right upper-quadrant pain, hyperreflexia, and clonus indicate increased risk for eclampsia, stroke, hepatic injury, and other maternal complications. These are acute changes, not routine discomforts of late pregnancy. A fetal baseline of 145/min with moderate variability is reassuring at this moment, and neither gestational age nor a normal temperature explains the maternal instability. NCLEX cue recognition prioritizes new threats to neurologic, vascular, and end-organ safety.",
    rationaleMechanism:
      "Preeclampsia involves abnormal placentation, endothelial dysfunction, vasoconstriction, and capillary injury. Severe hypertension increases cerebral vascular stress, while neurologic irritability and upper-abdominal pain may signal cerebral and hepatic involvement.",
    whyCorrect:
      "The selected cues form a coherent severe-feature pattern: confirmed severe hypertension, persistent neurologic symptoms, upper-abdominal pain, and neuromuscular irritability. Together they demand action before a seizure or organ injury occurs.",
    distractorRationales: {
      f: "A baseline of 145/min with moderate variability is currently reassuring; continuous fetal surveillance remains appropriate, but this is not the immediate abnormal cue.",
      g: "Gestational age and singleton status provide context for management but are not acute evidence of deterioration.",
      h: "The temperature is within the expected range and does not account for the severe hypertensive and neurologic findings.",
    },
    takeaway:
      "Severe blood pressure plus persistent headache, visual change, upper-abdominal pain, hyperreflexia, or clonus is an obstetric emergency pattern.",
    visualRationale: {
      type: "signal",
      accent: "rose",
      title: "Severe-feature signal cluster",
      nodes: [
        { label: "Vascular", value: "BP 166/110 mm Hg" },
        { label: "Cerebral", value: "Headache and visual scotomata" },
        { label: "Hepatic", value: "Right upper-quadrant pain" },
        { label: "Neuromuscular", value: "3+ reflexes and clonus" },
      ],
      conclusion:
        "Multiple acute severe-feature signals outweigh reassuring background findings.",
    },
  }),
  makeVerifiedCaseQuestion(preeclampsiaDefinition, {
    id: "codex-nclex-preeclampsia-magnesium-case-02",
    kind: "matrix",
    questionType: "matrix",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "analyze",
    difficulty: 4,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem:
      "For each finding, identify whether it supports preeclampsia with severe features or is currently reassuring.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports severe features", "Currently reassuring"],
    matrixRows: [
      {
        label: "Platelet count 92,000/mm3",
        answer: "Supports severe features",
      },
      {
        label: "AST 86 units/L with right upper-quadrant pain",
        answer: "Supports severe features",
      },
      {
        label: "Creatinine 1.2 mg/dL without known renal disease",
        answer: "Supports severe features",
      },
      {
        label: "Fetal baseline 145/min with moderate variability",
        answer: "Currently reassuring",
      },
    ],
    correctAnswer: {
      "Platelet count 92,000/mm3": "Supports severe features",
      "AST 86 units/L with right upper-quadrant pain": "Supports severe features",
      "Creatinine 1.2 mg/dL without known renal disease": "Supports severe features",
      "Fetal baseline 145/min with moderate variability": "Currently reassuring",
    },
    rationale:
      "Thrombocytopenia, elevated hepatic enzymes with right upper-quadrant pain, and a new creatinine elevation each show maternal end-organ involvement. These data strengthen the severe-preeclampsia pattern established by the blood pressure and neurologic symptoms. Moderate fetal heart-rate variability with a baseline in the expected range is reassuring at this moment, but it does not reduce the seriousness of maternal disease or eliminate the need for continuous fetal assessment. The correct analysis separates present evidence of maternal injury from a currently stable fetal surveillance finding.",
    rationaleMechanism:
      "Endothelial injury and vasospasm can reduce organ perfusion, activate platelets, injure hepatic tissue, and impair renal filtration. Maternal deterioration may precede an abnormal fetal tracing, so maternal and fetal data must be interpreted in parallel.",
    whyCorrect:
      "Each maternal laboratory abnormality maps to a recognized severe-feature domain, while the fetal tracing retains moderate variability and is not currently evidence of fetal compromise.",
    distractorRationales: {
      "Platelet count 92,000/mm3 -> Currently reassuring":
        "A platelet count below 100,000/mm3 is thrombocytopenia, not a reassuring pregnancy change.",
      "AST 86 units/L with right upper-quadrant pain -> Currently reassuring":
        "Elevated hepatic enzymes combined with right upper-quadrant pain indicates possible hepatic involvement and requires urgent follow-up.",
      "Creatinine 1.2 mg/dL without known renal disease -> Currently reassuring":
        "A creatinine of 1.2 mg/dL is abnormal in this context and supports renal involvement rather than normal pregnancy physiology.",
      "Fetal baseline 145/min with moderate variability -> Supports severe features":
        "This fetal baseline and variability are presently reassuring; maternal severe features remain urgent for other reasons.",
    },
    takeaway:
      "Analyze severe preeclampsia across cerebral, hematologic, hepatic, renal, and fetal domains rather than relying on proteinuria alone.",
    visualRationale: {
      type: "compare",
      accent: "violet",
      title: "Maternal injury versus current fetal status",
      options: [
        {
          label: "Platelets 92,000/mm3",
          verdict: "correct",
          note: "Hematologic severe feature",
        },
        {
          label: "AST 86 plus RUQ pain",
          verdict: "correct",
          note: "Hepatic severe feature",
        },
        {
          label: "Creatinine 1.2 mg/dL",
          verdict: "correct",
          note: "Renal severe feature",
        },
        {
          label: "FHR 145 with moderate variability",
          verdict: "partial",
          note: "Reassuring now; continue surveillance",
        },
      ],
      conclusion:
        "Maternal end-organ injury can be severe even while the fetal tracing remains reassuring.",
    },
  }),
  makeVerifiedCaseQuestion(preeclampsiaDefinition, {
    id: "codex-nclex-preeclampsia-magnesium-case-03",
    kind: "bow-tie",
    questionType: "bow_tie",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "synthesize",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem:
      "Using the severe preeclampsia record, complete the bow-tie by identifying the priority condition, two actions to anticipate, and two parameters to monitor most closely.",
    nclexInstruction: "Select the center condition, two actions, and two monitoring parameters.",
    options: [],
    bowTie: {
      center: {
        id: "preeclampsia-severe",
        text: "Preeclampsia with severe features and high risk for eclampsia",
        isCorrect: true,
      },
      leftActions: [
        {
          id: "pre-magnesium",
          text: "Begin prescribed magnesium sulfate seizure prophylaxis with safety monitoring",
          isCorrect: true,
        },
        {
          id: "pre-antihypertensive",
          text: "Administer prescribed rapid-acting antihypertensive for persistent severe-range pressure",
          isCorrect: true,
        },
        {
          id: "pre-ambulate",
          text: "Encourage ambulation to reduce anxiety and blood pressure",
          isCorrect: false,
        },
        {
          id: "pre-delay",
          text: "Delay treatment until a 24-hour urine protein result is available",
          isCorrect: false,
        },
      ],
      rightMonitoring: [
        {
          id: "pre-resp-reflex-urine",
          text: "Respiratory status, deep-tendon reflexes, consciousness, and urine output",
          isCorrect: true,
        },
        {
          id: "pre-maternal-fetal",
          text: "Serial blood pressure and continuous fetal status",
          isCorrect: true,
        },
        {
          id: "pre-daily-weight",
          text: "Daily weight as the primary acute response marker",
          isCorrect: false,
        },
        {
          id: "pre-bowel-sounds",
          text: "Bowel sounds every 15 minutes",
          isCorrect: false,
        },
      ],
    },
    correctAnswer: {
      center: "preeclampsia-severe",
      leftActions: ["pre-magnesium", "pre-antihypertensive"],
      rightMonitoring: ["pre-resp-reflex-urine", "pre-maternal-fetal"],
    },
    rationale:
      "The priority hypothesis is preeclampsia with severe features because persistent severe hypertension is accompanied by cerebral symptoms, hyperreflexia and clonus, thrombocytopenia, hepatic involvement, and renal involvement. Magnesium sulfate is prescribed to reduce eclampsia risk; it is not the antihypertensive. A rapid-acting antihypertensive addresses the separate danger of sustained severe blood pressure. Magnesium safety depends on serial respiratory, neurologic, and renal assessment because renal clearance affects accumulation. Blood pressure and fetal status must also be trended while the obstetric team stabilizes the client and determines delivery timing.",
    rationaleMechanism:
      "Severe endothelial dysfunction creates simultaneous seizure, stroke, hepatic, renal, placental, and fetal risks. Magnesium decreases neuromuscular excitability, while antihypertensive therapy reduces acute vascular pressure; their purposes are complementary, not interchangeable.",
    whyCorrect:
      "The selected condition integrates all available cues, and the actions target the two immediate preventable maternal threats: eclampsia and severe-hypertension complications. The monitoring choices detect both treatment toxicity and maternal-fetal deterioration.",
    distractorRationales: {
      "pre-ambulate":
        "Ambulation increases fall and seizure-injury risk and does not treat the severe-feature process.",
      "pre-delay":
        "Severe features do not require a 24-hour urine result before urgent treatment; delaying care increases maternal and fetal risk.",
      "pre-daily-weight":
        "Weight may contribute to longer-term fluid assessment but cannot replace acute neurologic, respiratory, renal, blood-pressure, and fetal monitoring.",
      "pre-bowel-sounds":
        "Bowel sounds are not a priority marker of preeclampsia progression or magnesium toxicity.",
    },
    takeaway:
      "Magnesium prevents seizures; rapid-acting antihypertensive therapy treats severe pressure. Monitor each therapy for its intended response and risks.",
    visualRationale: {
      type: "pathway",
      accent: "indigo",
      title: "Two threats, two targeted therapies",
      nodes: [
        { label: "Seizure risk", value: "Magnesium sulfate prophylaxis" },
        { label: "Stroke risk", value: "Urgent blood-pressure treatment" },
        {
          label: "Magnesium safety",
          value: "Respirations, reflexes, alertness, urine",
        },
        { label: "Disease surveillance", value: "BP and fetal status" },
      ],
      conclusion:
        "Treat seizure risk and severe hypertension concurrently while monitoring maternal-fetal response.",
    },
  }),
  makeVerifiedCaseQuestion(preeclampsiaDefinition, {
    id: "codex-nclex-preeclampsia-magnesium-case-04",
    kind: "multi-select",
    questionType: "sata",
    category: "Management of Care",
    nclexClientNeed: "management_of_care",
    cognitiveLevel: "synthesize",
    difficulty: 4,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem:
      "Which interventions should the nurse include in the immediate plan while magnesium sulfate is infusing? Select all that apply.",
    nclexInstruction: "Select all interventions that apply.",
    options: [
      {
        id: "a",
        text: "Maintain seizure precautions and reduce unnecessary stimulation.",
      },
      {
        id: "b",
        text: "Assess respiratory rate, oxygen saturation, level of consciousness, and deep-tendon reflexes at protocol intervals.",
      },
      {
        id: "c",
        text: "Measure hourly urine output and maintain strict intake and output.",
      },
      {
        id: "d",
        text: "Keep calcium gluconate and emergency airway equipment immediately available.",
      },
      {
        id: "e",
        text: "Continue serial blood-pressure assessment and continuous fetal monitoring.",
      },
      {
        id: "f",
        text: "Increase the magnesium infusion if the blood pressure remains above 140/90 mm Hg.",
      },
      {
        id: "g",
        text: "Allow unassisted bathroom ambulation to preserve independence.",
      },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "Safe magnesium therapy combines seizure protection, toxicity surveillance, renal monitoring, rescue readiness, and continued assessment of the underlying disease. Respiratory depression, declining consciousness, and loss of deep-tendon reflexes are clinically important toxicity signals. Hourly urine output matters because magnesium is cleared by the kidneys and oliguria can increase accumulation risk. Calcium gluconate and airway support must be readily available according to protocol. Blood pressure and fetal monitoring continue because a reassuring initial response does not end maternal-fetal risk.",
    rationaleMechanism:
      "Magnesium depresses neuromuscular transmission in a dose-related manner. Reduced renal excretion can increase exposure, causing progressive reflex loss, sedation, and respiratory depression; calcium antagonizes magnesium's effects during clinically significant toxicity.",
    whyCorrect:
      "The selected actions collectively prevent injury, detect toxicity early, maintain readiness to reverse respiratory compromise, and track whether severe preeclampsia is stabilizing.",
    distractorRationales: {
      f: "Magnesium is not titrated to lower blood pressure. Persistent severe hypertension requires the prescribed antihypertensive pathway and clinician notification.",
      g: "Unassisted ambulation is unsafe because seizure, sedation, weakness, and falls remain possible; toileting requires an individualized safety plan.",
    },
    takeaway:
      "During magnesium therapy, think respirations, reflexes, alertness, urine output, calcium availability, and continued maternal-fetal surveillance.",
    visualRationale: {
      type: "overview",
      accent: "purple",
      title: "Magnesium safety bundle",
      nodes: [
        { label: "Prevent", value: "Seizure precautions" },
        { label: "Detect", value: "Respirations, reflexes, consciousness" },
        { label: "Clear", value: "Hourly urine output" },
        { label: "Rescue", value: "Calcium and airway equipment ready" },
        { label: "Reassess", value: "Blood pressure and fetal status" },
      ],
      conclusion:
        "A maintenance infusion is safe only when bedside surveillance and rescue readiness remain active.",
    },
  }),
  makeVerifiedCaseQuestion(preeclampsiaDefinition, {
    id: "codex-nclex-preeclampsia-magnesium-case-05",
    kind: "mcq",
    questionType: "mcq",
    category: "Pharmacological and Parenteral Therapies",
    nclexClientNeed: "pharmacological",
    cognitiveLevel: "evaluate",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem:
      "Which action should the nurse take first after identifying the 1115 findings?",
    nclexInstruction: "Select the priority action.",
    options: [
      {
        id: "a",
        text: "Stop the magnesium infusion, stay with the client, support oxygenation, and activate immediate obstetric escalation.",
      },
      {
        id: "b",
        text: "Reduce environmental stimulation and reassess the client in 30 minutes.",
      },
      {
        id: "c",
        text: "Increase the maintenance IV fluid rate rapidly to improve urine output.",
      },
      {
        id: "d",
        text: "Document absent reflexes as an expected therapeutic effect and continue the infusion.",
      },
    ],
    correctAnswer: "a",
    rationale:
      "Respiratory rate 9/min, reduced oxygen saturation, absent reflexes, somnolence, and oliguria during magnesium infusion indicate probable clinically significant magnesium toxicity. The nurse's first action is to stop further magnesium delivery while remaining with the client, supporting airway and oxygenation, and activating immediate obstetric and emergency response. The nurse should then prepare to administer prescribed calcium gluconate and obtain additional evaluation according to protocol. Observation alone permits progression to respiratory arrest, and unprescribed rapid fluid administration is unsafe in preeclampsia because pulmonary edema is a concern.",
    rationaleMechanism:
      "Excess magnesium suppresses neuromuscular transmission. Oliguria reduces magnesium elimination, allowing reflex loss and sedation to progress to respiratory depression; stopping the infusion immediately removes the ongoing exposure.",
    whyCorrect:
      "Stopping the source while supporting breathing addresses the immediate threat to life. Escalation brings the authorized reversal treatment and advanced airway support without delay.",
    distractorRationales: {
      b: "Reducing stimulation is appropriate for seizure precautions but does not treat active respiratory depression and neuromuscular toxicity.",
      c: "Rapidly increasing fluid without a prescription may worsen pulmonary edema risk and does not reverse magnesium's neuromuscular effects.",
      d: "Absent reflexes with somnolence and respiratory depression are toxicity findings, not acceptable therapeutic effects.",
    },
    takeaway:
      "With respiratory depression and absent reflexes during magnesium therapy, stop the infusion first and escalate for airway support and calcium reversal.",
    visualRationale: {
      type: "flow",
      accent: "red",
      title: "Toxicity response",
      nodes: [
        { label: "Recognize", value: "RR 9, absent reflexes, somnolence, oliguria" },
        { label: "Stop exposure", value: "Stop magnesium infusion" },
        { label: "Support", value: "Stay, oxygenate, monitor airway" },
        { label: "Escalate", value: "Emergency response and prescribed calcium" },
      ],
      conclusion:
        "Do not wait for a serum level when bedside respiratory and neurologic toxicity is present.",
    },
  }),
  makeVerifiedCaseQuestion(preeclampsiaDefinition, {
    id: "codex-nclex-preeclampsia-magnesium-case-06",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "evaluate",
    difficulty: 4,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem:
      "For each reassessment finding, indicate whether it supports recovery from magnesium toxicity or requires continued follow-up for severe preeclampsia.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: [
      "Supports toxicity recovery",
      "Requires continued preeclampsia follow-up",
    ],
    matrixRows: [
      {
        label: "Respiratory rate 16/min and SpO2 98% with oxygen",
        answer: "Supports toxicity recovery",
      },
      {
        label: "Patellar reflexes 2+ and client alert",
        answer: "Supports toxicity recovery",
      },
      {
        label: "Urine output 35 mL in the latest hour",
        answer: "Supports toxicity recovery",
      },
      {
        label: "Blood pressure 146/94 mm Hg",
        answer: "Requires continued preeclampsia follow-up",
      },
    ],
    correctAnswer: {
      "Respiratory rate 16/min and SpO2 98% with oxygen":
        "Supports toxicity recovery",
      "Patellar reflexes 2+ and client alert": "Supports toxicity recovery",
      "Urine output 35 mL in the latest hour": "Supports toxicity recovery",
      "Blood pressure 146/94 mm Hg":
        "Requires continued preeclampsia follow-up",
    },
    rationale:
      "Normalization of respiratory rate and oxygenation, return of deep-tendon reflexes and alertness, and improved urine output support recovery from acute magnesium toxicity. These improvements do not resolve the underlying hypertensive disorder. Blood pressure remains elevated, and the client still requires serial maternal assessment, fetal surveillance, antihypertensive management as prescribed, and obstetric planning. Evaluation questions should separate response to the medication emergency from continuing disease risk.",
    rationaleMechanism:
      "Calcium and removal of ongoing magnesium exposure restore neuromuscular function, while renal recovery improves clearance. Preeclampsia originates from a separate endothelial and placental disease process and can persist despite reversal of medication toxicity.",
    whyCorrect:
      "The first three findings directly reflect improved ventilation, neuromuscular function, consciousness, and renal output. The remaining hypertension belongs to the unresolved preeclampsia problem.",
    distractorRationales: {
      "Respiratory rate 16/min and SpO2 98% with oxygen -> Requires continued preeclampsia follow-up":
        "Respiratory recovery is the direct positive response to toxicity intervention, although ongoing monitoring remains necessary.",
      "Patellar reflexes 2+ and client alert -> Requires continued preeclampsia follow-up":
        "Return of reflexes and alertness specifically supports reversal of magnesium's neuromuscular depression.",
      "Urine output 35 mL in the latest hour -> Requires continued preeclampsia follow-up":
        "Improved urine output supports safer magnesium clearance and recovery from oliguria, while renal trends still require monitoring.",
      "Blood pressure 146/94 mm Hg -> Supports toxicity recovery":
        "Blood pressure is not the primary measure of magnesium-toxicity reversal and remains abnormal enough to require continued disease management.",
    },
    takeaway:
      "Recovery from magnesium toxicity does not equal resolution of preeclampsia; continue maternal-fetal surveillance and definitive obstetric management.",
    visualRationale: {
      type: "compare",
      accent: "emerald",
      title: "Two problems, two outcome sets",
      options: [
        {
          label: "Ventilation and reflexes",
          verdict: "correct",
          note: "Magnesium toxicity improving",
        },
        {
          label: "Alertness and urine output",
          verdict: "correct",
          note: "Neurologic and renal recovery",
        },
        {
          label: "BP 146/94 mm Hg",
          verdict: "partial",
          note: "Underlying preeclampsia persists",
        },
      ],
      conclusion:
        "Close the medication emergency while keeping the obstetric emergency active.",
    },
  }),
];

const dehydrationCaseStudyDeck: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(dehydrationDefinition, {
    id: "codex-nclex-pediatric-dehydration-case-01",
    kind: "multi-select",
    questionType: "sata",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "analyze",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem:
      "Which findings require immediate follow-up for severe dehydration with impaired circulation? Select all that apply.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Select all findings that require immediate follow-up.",
    options: [
      { id: "a", text: "Lethargy with response only to painful stimulation" },
      { id: "b", text: "Heart rate 168/min" },
      { id: "c", text: "Blood pressure 74/42 mm Hg" },
      { id: "d", text: "Capillary refill 4 seconds with weak pulses" },
      { id: "e", text: "One small wet diaper in 12 hours" },
      { id: "f", text: "Very dry mucosa, sunken eyes, and absent tears" },
      { id: "g", text: "Soft abdomen without focal tenderness" },
      { id: "h", text: "Temperature 99.0 F (37.2 C)" },
    ],
    correctAnswer: ["a", "b", "c", "d", "e", "f"],
    rationale:
      "The child has neurologic depression, marked tachycardia, hypotension, delayed capillary refill, weak pulses, oliguria, and pronounced mucosal and eye findings. Together these cues indicate severe volume depletion with impaired perfusion rather than uncomplicated diarrhea that can wait for routine oral teaching. The nurse should recognize the circulation threat immediately and prepare for emergency isotonic fluid resuscitation with frequent reassessment. A soft nontender abdomen and near-normal temperature help narrow the presentation but do not signal shock.",
    rationaleMechanism:
      "Gastrointestinal fluid losses reduce intravascular volume and venous return. Compensatory tachycardia eventually fails to maintain perfusion, producing weak pulses, delayed capillary refill, hypotension, reduced renal output, and altered mental status.",
    whyCorrect:
      "Each selected finding reflects either substantial fluid deficit or end-organ hypoperfusion. Their clustering makes the time-sensitive circulation problem more important than identifying the exact infectious cause first.",
    distractorRationales: {
      g: "A soft abdomen without focal tenderness is currently reassuring and does not represent the immediate perfusion threat.",
      h: "A temperature of 99.0 F is not the critical abnormality; the child's shock findings require priority action.",
    },
    takeaway:
      "In a dehydrated child, altered mental status, hypotension, delayed refill, weak pulses, tachycardia, and oliguria signal an emergency.",
    visualRationale: {
      type: "signal",
      accent: "orange",
      title: "Volume-loss shock pattern",
      nodes: [
        { label: "Brain", value: "Lethargy" },
        { label: "Circulation", value: "HR 168 and BP 74/42" },
        { label: "Periphery", value: "Refill 4 sec, weak pulses" },
        { label: "Kidney", value: "One small wet diaper" },
        { label: "Deficit", value: "Dry mucosa, no tears, sunken eyes" },
      ],
      conclusion:
        "End-organ perfusion findings elevate dehydration from a replacement problem to a resuscitation problem.",
    },
  }),
  makeVerifiedCaseQuestion(dehydrationDefinition, {
    id: "codex-nclex-pediatric-dehydration-case-02",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "analyze",
    difficulty: 4,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem:
      "For each finding, identify whether it most directly supports fluid-volume deficit with hypoperfusion or requires consideration of another immediate cause.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: [
      "Supports volume deficit/hypoperfusion",
      "Suggests another immediate cause",
    ],
    matrixRows: [
      {
        label: "Weight decreased from 10.9 kg to 10.0 kg",
        answer: "Supports volume deficit/hypoperfusion",
      },
      {
        label: "BUN 32 mg/dL with concentrated clinical appearance",
        answer: "Supports volume deficit/hypoperfusion",
      },
      {
        label: "Bicarbonate 14 mEq/L after frequent watery stools",
        answer: "Supports volume deficit/hypoperfusion",
      },
      {
        label: "Soft abdomen without guarding or focal tenderness",
        answer: "Supports volume deficit/hypoperfusion",
      },
    ],
    correctAnswer: {
      "Weight decreased from 10.9 kg to 10.0 kg":
        "Supports volume deficit/hypoperfusion",
      "BUN 32 mg/dL with concentrated clinical appearance":
        "Supports volume deficit/hypoperfusion",
      "Bicarbonate 14 mEq/L after frequent watery stools":
        "Supports volume deficit/hypoperfusion",
      "Soft abdomen without guarding or focal tenderness":
        "Supports volume deficit/hypoperfusion",
    },
    rationale:
      "Recent weight loss is the clearest quantitative clue to fluid deficit when a reliable prior weight exists. Elevated BUN can accompany reduced renal perfusion and hemoconcentration, while low bicarbonate is compatible with bicarbonate loss in stool and metabolic acidosis from poor perfusion. A soft abdomen without focal peritoneal findings does not itself prove dehydration, but in this forced-choice analysis it supports the established gastroenteritis pattern rather than an acute surgical abdomen. Laboratory results refine the pattern; they must not delay treatment when shock is clinically apparent.",
    rationaleMechanism:
      "Water and electrolyte loss contracts the extracellular and intravascular compartments. Renal hypoperfusion raises nitrogenous waste, stool bicarbonate loss and lactate lower bicarbonate, and measured weight falls as body water is lost.",
    whyCorrect:
      "All four findings are congruent with the documented diarrheal volume-loss pattern, and none introduces a stronger immediate alternate explanation such as peritonitis, hemorrhage, or obstruction.",
    distractorRationales: {
      "Weight decreased from 10.9 kg to 10.0 kg -> Suggests another immediate cause":
        "A recent measured weight decrease of about 8% is direct evidence of clinically important fluid loss.",
      "BUN 32 mg/dL with concentrated clinical appearance -> Suggests another immediate cause":
        "In this acute context, elevated BUN aligns with reduced circulating volume and renal perfusion; it is not isolated evidence of intrinsic renal disease.",
      "Bicarbonate 14 mEq/L after frequent watery stools -> Suggests another immediate cause":
        "Diarrheal bicarbonate loss and hypoperfusion can both lower bicarbonate, so this finding fits the current process.",
      "Soft abdomen without guarding or focal tenderness -> Suggests another immediate cause":
        "The absence of focal peritoneal findings makes an acute surgical abdominal process less likely in the current record.",
    },
    takeaway:
      "Use recent weight, perfusion findings, urine output, and acid-base data together; never wait for laboratories to resuscitate clinically apparent shock.",
    visualRationale: {
      type: "pathway",
      accent: "amber",
      title: "How diarrheal losses become shock",
      nodes: [
        { label: "Loss", value: "Stool and emesis" },
        { label: "Deficit", value: "8% recent weight decrease" },
        { label: "Perfusion", value: "High BUN, oliguria, weak pulses" },
        { label: "Acid-base", value: "Bicarbonate 14 mEq/L" },
      ],
      conclusion:
        "The laboratory pattern supports, but does not replace, the bedside diagnosis of hypovolemic shock.",
    },
  }),
  makeVerifiedCaseQuestion(dehydrationDefinition, {
    id: "codex-nclex-pediatric-dehydration-case-03",
    kind: "bow-tie",
    questionType: "bow_tie",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "synthesize",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem:
      "Using the pediatric dehydration record, complete the bow-tie by identifying the priority condition, two actions to anticipate, and two parameters to monitor most closely.",
    nclexInstruction: "Select the center condition, two actions, and two monitoring parameters.",
    options: [],
    bowTie: {
      center: {
        id: "dehydration-shock",
        text: "Severe dehydration with hypovolemic shock from gastroenteritis",
        isCorrect: true,
      },
      leftActions: [
        {
          id: "dehydration-isotonic",
          text: "Administer prescribed 20 mL/kg isotonic crystalloid promptly",
          isCorrect: true,
        },
        {
          id: "dehydration-reassess",
          text: "Perform a full perfusion and cardiopulmonary reassessment after each bolus",
          isCorrect: true,
        },
        {
          id: "dehydration-juice",
          text: "Give undiluted fruit juice as the initial shock treatment",
          isCorrect: false,
        },
        {
          id: "dehydration-hypotonic",
          text: "Begin rapid hypotonic IV fluid replacement",
          isCorrect: false,
        },
      ],
      rightMonitoring: [
        {
          id: "dehydration-perfusion",
          text: "Mental status, pulse quality, capillary refill, heart rate, and blood pressure",
          isCorrect: true,
        },
        {
          id: "dehydration-output-lungs",
          text: "Urine output, lung sounds, work of breathing, and ongoing losses",
          isCorrect: true,
        },
        {
          id: "dehydration-stool-color",
          text: "Stool color as the primary resuscitation endpoint",
          isCorrect: false,
        },
        {
          id: "dehydration-head-circ",
          text: "Daily head circumference",
          isCorrect: false,
        },
      ],
    },
    correctAnswer: {
      center: "dehydration-shock",
      leftActions: ["dehydration-isotonic", "dehydration-reassess"],
      rightMonitoring: ["dehydration-perfusion", "dehydration-output-lungs"],
    },
    rationale:
      "The priority hypothesis is severe dehydration with hypovolemic shock because fluid losses are followed by hypotension, tachycardia, weak pulses, delayed refill, oliguria, and lethargy. Current official guidance supports rapid weight-based isotonic crystalloid for severe dehydration and repeated reassessment until pulse, perfusion, and mental status normalize. Reassessment is essential before each additional bolus to determine whether shock persists and to identify fluid intolerance or an alternate cause. Urine output and ongoing losses guide the subsequent replacement phase after circulation is stabilized.",
    rationaleMechanism:
      "Isotonic crystalloid expands the extracellular and intravascular spaces, improving preload, cardiac output, tissue oxygen delivery, renal perfusion, and consciousness. Hypotonic fluid does not provide the same safe initial intravascular expansion.",
    whyCorrect:
      "The selected actions directly restore circulating volume and test the child's response, while the monitoring choices capture cerebral, cardiovascular, renal, and respiratory endpoints of resuscitation.",
    distractorRationales: {
      "dehydration-juice":
        "Undiluted juice has an inappropriate carbohydrate and electrolyte composition and cannot replace emergency isotonic resuscitation.",
      "dehydration-hypotonic":
        "Rapid hypotonic fluid is not recommended for initial resuscitation and may worsen electrolyte derangement.",
      "dehydration-stool-color":
        "Stool characteristics may help evaluate etiology, but they do not show whether circulation has been restored.",
      "dehydration-head-circ":
        "Head circumference is a growth measurement and is not an acute shock-response marker.",
    },
    takeaway:
      "Resuscitate pediatric hypovolemic shock with prescribed isotonic weight-based fluid, then reassess the whole child before repeating.",
    visualRationale: {
      type: "flow",
      accent: "blue",
      title: "Resuscitation loop",
      nodes: [
        { label: "Identify", value: "Shock from fluid loss" },
        { label: "Treat", value: "20 mL/kg isotonic crystalloid" },
        { label: "Reassess", value: "Brain, pulse, refill, BP, lungs" },
        { label: "Decide", value: "Repeat, escalate, or transition to ORS" },
      ],
      conclusion:
        "A bolus is not complete until the child's response has been reassessed.",
    },
  }),
  makeVerifiedCaseQuestion(dehydrationDefinition, {
    id: "codex-nclex-pediatric-dehydration-case-04",
    kind: "ordering",
    questionType: "ordering",
    category: "Management of Care",
    nclexClientNeed: "management_of_care",
    cognitiveLevel: "synthesize",
    difficulty: 4,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem:
      "Place the nursing actions in the order they should occur for the initial fluid-resuscitation cycle.",
    nclexInstruction:
      "Drag each action into order, beginning with the action performed first.",
    options: [
      {
        id: "a",
        text: "Verify the current weight, prescription, IV patency, fluid type, and calculated 200 mL dose.",
      },
      {
        id: "b",
        text: "Obtain baseline mental status, pulses, capillary refill, blood pressure, lung sounds, and work of breathing.",
      },
      {
        id: "c",
        text: "Administer the prescribed 0.9% sodium chloride bolus promptly with continuous observation.",
      },
      {
        id: "d",
        text: "Reassess neurologic, circulatory, renal, and respiratory response immediately after the bolus.",
      },
      {
        id: "e",
        text: "Use the reassessment to report response and determine whether another prescribed bolus or a transition plan is needed.",
      },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "The nurse first verifies the prescription against the child's actual dosing weight, confirms a patent route, and ensures the correct isotonic fluid and volume. A concise baseline assessment is then recorded so treatment response can be judged. The prescribed bolus is administered promptly while the child is observed. Immediate post-bolus reassessment determines whether perfusion improved and whether respiratory intolerance appeared. Only then should the team decide to repeat resuscitation, escalate for another diagnosis, or transition toward oral replacement. The sequence preserves both urgency and medication-fluid safety.",
    rationaleMechanism:
      "Weight-based dosing prevents under-resuscitation and excessive volume. Comparing the same perfusion and cardiopulmonary endpoints before and after expansion shows whether increased preload restored effective circulation.",
    whyCorrect:
      "This order creates a closed-loop resuscitation cycle: verify, establish baseline, treat, reassess, and adapt. Skipping the reassessment breaks the safety feedback needed before more fluid is given.",
    distractorRationales: {
      "a-after-c":
        "Giving the bolus before verifying weight, fluid, dose, and route risks a preventable fluid-administration error.",
      "b-after-c":
        "Without baseline perfusion and lung findings, the nurse cannot reliably judge improvement or new fluid intolerance.",
      "c-after-d":
        "The child needs prompt prescribed resuscitation; post-treatment reassessment cannot occur before treatment.",
      "d-after-e":
        "A decision about more fluid must be based on a completed reassessment, not on the original presentation alone.",
      "e-before-d":
        "Reporting and adapting the plan before reassessment omits the response data that should guide the decision.",
    },
    takeaway:
      "Use a closed-loop sequence for every pediatric bolus: verify, baseline, infuse, reassess, adapt.",
    visualRationale: {
      type: "timeline",
      accent: "cyan",
      title: "One safe fluid-resuscitation cycle",
      items: [
        { label: "1", value: "Verify weight, route, fluid, and dose", highlight: true },
        { label: "2", value: "Capture baseline response markers" },
        { label: "3", value: "Administer prescribed isotonic bolus" },
        { label: "4", value: "Reassess brain, circulation, lungs, urine" },
        { label: "5", value: "Adapt the plan from the response" },
      ],
      conclusion:
        "Each additional bolus requires a new clinical decision, not automatic repetition.",
    },
  }),
  makeVerifiedCaseQuestion(dehydrationDefinition, {
    id: "codex-nclex-pediatric-dehydration-case-05",
    kind: "mcq",
    questionType: "mcq",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "evaluate",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem:
      "Which action should the nurse take next after the 1345 reassessment?",
    nclexInstruction: "Select the priority action.",
    options: [
      {
        id: "a",
        text: "Administer the newly prescribed second 200 mL 0.9% sodium chloride bolus and continue close reassessment.",
      },
      {
        id: "b",
        text: "Stop resuscitation because any improvement in heart rate proves shock has resolved.",
      },
      {
        id: "c",
        text: "Replace the isotonic fluid with free water rapidly to correct the sodium of 150 mEq/L.",
      },
      {
        id: "d",
        text: "Give an antidiarrheal medication before providing any additional fluid.",
      },
    ],
    correctAnswer: "a",
    rationale:
      "The first bolus produced partial improvement, but the child remains tachycardic and listless with weak pulses, delayed capillary refill, and low blood pressure. Clear lungs and absence of hepatomegaly reduce concern for current fluid intolerance. The nurse should implement the prescribed second weight-based isotonic bolus and repeat the full reassessment. Hypernatremia is corrected through controlled rehydration after circulation is stabilized, not by rapid free-water administration. Antidiarrheal medication does not restore perfusion and is not recommended as the priority treatment.",
    rationaleMechanism:
      "The first bolus increased circulating volume but did not fully restore preload and tissue perfusion. A second prescribed isotonic increment continues extracellular-volume expansion without causing a rapid fall in serum sodium.",
    whyCorrect:
      "Persistent shock signs plus a documented prescription and no current fluid-overload findings make the second isotonic bolus the time-sensitive next action.",
    distractorRationales: {
      b: "Heart rate improvement alone does not establish shock resolution; mental status, pulses, refill, blood pressure, and urine output remain abnormal.",
      c: "Rapid free-water administration can change sodium too quickly and does not provide appropriate initial intravascular resuscitation.",
      d: "Antidiarrheals do not correct shock and may be unsafe in young children; volume restoration remains the priority.",
    },
    takeaway:
      "Repeat prescribed isotonic fluid when shock signs persist after reassessment, while continuing to watch for overload and alternate causes.",
    visualRationale: {
      type: "compare",
      accent: "teal",
      title: "Partial response is not shock resolution",
      options: [
        {
          label: "HR 168 to 148/min",
          verdict: "partial",
          note: "Improving but still high",
        },
        {
          label: "Refill 4 to 3 seconds",
          verdict: "partial",
          note: "Still delayed",
        },
        {
          label: "Listless with weak pulses",
          verdict: "wrong",
          note: "Perfusion remains inadequate",
        },
        {
          label: "Lungs clear",
          verdict: "correct",
          note: "No present fluid-intolerance signal",
        },
      ],
      conclusion:
        "Persistent multi-domain shock findings support the prescribed second bolus.",
    },
  }),
  makeVerifiedCaseQuestion(dehydrationDefinition, {
    id: "codex-nclex-pediatric-dehydration-case-06",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "evaluate",
    difficulty: 4,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem:
      "For each reassessment finding, indicate whether it supports restored perfusion or requires continued follow-up.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports restored perfusion", "Requires continued follow-up"],
    matrixRows: [
      {
        label: "Alert and reaching for the parent",
        answer: "Supports restored perfusion",
      },
      {
        label: "Heart rate 118/min, blood pressure 92/56 mm Hg, capillary refill 2 seconds",
        answer: "Supports restored perfusion",
      },
      {
        label: "Urine output 1.2 mL/kg/hr",
        answer: "Supports restored perfusion",
      },
      {
        label: "Sodium 147 mEq/L and bicarbonate 18 mEq/L",
        answer: "Requires continued follow-up",
      },
    ],
    correctAnswer: {
      "Alert and reaching for the parent": "Supports restored perfusion",
      "Heart rate 118/min, blood pressure 92/56 mm Hg, capillary refill 2 seconds":
        "Supports restored perfusion",
      "Urine output 1.2 mL/kg/hr": "Supports restored perfusion",
      "Sodium 147 mEq/L and bicarbonate 18 mEq/L":
        "Requires continued follow-up",
    },
    rationale:
      "Return of age-appropriate interaction, normalized circulation findings, brisker capillary refill, and urine output above 1 mL/kg/hr support improved cerebral, cardiovascular, and renal perfusion. The child can now begin carefully supervised oral rehydration in small frequent amounts while ongoing stool losses are replaced. Sodium and bicarbonate are improving but remain abnormal, so controlled replacement and repeat clinical and laboratory evaluation remain necessary. Resuscitation success does not mean the total deficit, ongoing losses, and electrolyte disturbance are fully corrected.",
    rationaleMechanism:
      "Restored circulating volume improves cardiac output and blood flow to the brain, skin, and kidneys. Extracellular and intracellular deficits and acid-base abnormalities correct more gradually during the replacement phase.",
    whyCorrect:
      "The first three findings are direct bedside endpoints of restored perfusion. The remaining laboratory abnormalities identify residual dehydration and acid-base work, not failure of the initial shock resuscitation.",
    distractorRationales: {
      "Alert and reaching for the parent -> Requires continued follow-up":
        "Age-appropriate interaction is a strong positive neurologic response, although routine observation continues.",
      "Heart rate 118/min, blood pressure 92/56 mm Hg, capillary refill 2 seconds -> Requires continued follow-up":
        "This coordinated normalization supports improved circulation rather than ongoing shock.",
      "Urine output 1.2 mL/kg/hr -> Requires continued follow-up":
        "This urine output supports improved renal perfusion for the child's weight.",
      "Sodium 147 mEq/L and bicarbonate 18 mEq/L -> Supports restored perfusion":
        "The trend is favorable, but both values remain abnormal and require controlled ongoing rehydration and reassessment.",
    },
    takeaway:
      "After shock resolves, transition from resuscitation to measured replacement of the remaining deficit and ongoing losses.",
    visualRationale: {
      type: "trend",
      accent: "green",
      title: "Resuscitation response and residual deficit",
      metrics: [
        {
          label: "Heart rate",
          value: "168 to 118/min",
          direction: "down",
          directionLabel: "improved",
        },
        {
          label: "Capillary refill",
          value: "4 to 2 sec",
          direction: "down",
          directionLabel: "improved",
        },
        {
          label: "Urine output",
          value: "1.2 mL/kg/hr",
          direction: "up",
          directionLabel: "restored",
        },
        {
          label: "Sodium",
          value: "150 to 147 mEq/L",
          direction: "down",
          directionLabel: "still high",
        },
      ],
      conclusion:
        "Perfusion is restored; electrolyte and total-deficit correction must continue in a controlled phase.",
    },
  }),
];

const asthmaCaseStudyDeck: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(asthmaDefinition, {
    id: "codex-nclex-pediatric-asthma-case-01",
    kind: "multi-select",
    questionType: "sata",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "analyze",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem:
      "Which findings require immediate follow-up for a severe asthma exacerbation? Select all that apply.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Select all findings that require immediate follow-up.",
    options: [
      { id: "a", text: "SpO2 88% on room air" },
      { id: "b", text: "Speaks only two to three words per breath" },
      { id: "c", text: "Suprasternal and intercostal retractions" },
      { id: "d", text: "Peak expiratory flow 35% of personal best" },
      {
        id: "e",
        text: "Diffuse wheeze with markedly diminished air entry at both bases",
      },
      { id: "f", text: "Heart rate 142/min" },
      { id: "g", text: "Nasal congestion that began 2 days ago" },
      { id: "h", text: "No prior endotracheal intubation" },
    ],
    correctAnswer: ["a", "b", "c", "d", "e", "f"],
    rationale:
      "Hypoxemia, fragmented speech, retractions, very low peak flow, reduced air entry, and marked tachycardia identify severe airflow obstruction with substantial work of breathing. The child needs immediate oxygenation support, rapid bronchodilator therapy, systemic corticosteroid, continuous monitoring, and frequent reassessment. A viral prodrome may be the trigger but is not the immediate danger. The absence of prior intubation does not make the current episode safe; current physiology determines acuity.",
    rationaleMechanism:
      "Bronchial smooth-muscle constriction, airway inflammation, and mucus narrow the airways, increase expiratory resistance, trap air, and create ventilation-perfusion mismatch. As obstruction worsens, air movement and oxygenation fall while respiratory effort and fatigue rise.",
    whyCorrect:
      "The selected findings measure oxygenation, ventilation, speech, work of breathing, airflow, and physiologic stress. Their combined severity signals risk for respiratory failure.",
    distractorRationales: {
      g: "The viral symptoms may explain the trigger but do not determine the immediate severity or treatment priority.",
      h: "A reassuring history cannot override current hypoxemia, severe obstruction, and increased work of breathing.",
    },
    takeaway:
      "In pediatric asthma, speech, oxygen saturation, work of breathing, air entry, mental status, and peak flow define urgency.",
    visualRationale: {
      type: "signal",
      accent: "sky",
      title: "Severe obstruction signals",
      nodes: [
        { label: "Oxygenation", value: "SpO2 88%" },
        { label: "Speech", value: "2-3 words" },
        { label: "Effort", value: "Retractions and tripod posture" },
        { label: "Flow", value: "PEF 35% personal best" },
        { label: "Air movement", value: "Markedly diminished at bases" },
      ],
      conclusion:
        "A child can be wheezing and still moving dangerously little air.",
    },
  }),
  makeVerifiedCaseQuestion(asthmaDefinition, {
    id: "codex-nclex-pediatric-asthma-case-02",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "analyze",
    difficulty: 4,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem:
      "For each finding, identify whether it measures severe lower-airway obstruction or helps narrow away from an alternate acute cause.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: [
      "Measures severe lower-airway obstruction",
      "Narrows away from alternate cause",
    ],
    matrixRows: [
      {
        label: "Peak flow 35% of personal best",
        answer: "Measures severe lower-airway obstruction",
      },
      {
        label: "Two- to three-word speech with retractions",
        answer: "Measures severe lower-airway obstruction",
      },
      {
        label: "No stridor, facial swelling, or urticaria",
        answer: "Narrows away from alternate cause",
      },
      {
        label: "No choking event or unilateral absent breath sounds",
        answer: "Narrows away from alternate cause",
      },
    ],
    correctAnswer: {
      "Peak flow 35% of personal best":
        "Measures severe lower-airway obstruction",
      "Two- to three-word speech with retractions":
        "Measures severe lower-airway obstruction",
      "No stridor, facial swelling, or urticaria":
        "Narrows away from alternate cause",
      "No choking event or unilateral absent breath sounds":
        "Narrows away from alternate cause",
    },
    rationale:
      "Peak flow far below personal best objectively measures severe expiratory limitation, while fragmented speech and retractions show that breathing consumes substantial effort. The absence of stridor, facial swelling, and urticaria makes upper-airway obstruction or anaphylaxis less likely. The absence of a choking event and unilateral breath-sound loss makes focal foreign-body obstruction less likely. The nurse still treats the severe asthma pattern immediately while remaining alert for alternate causes if response is atypical.",
    rationaleMechanism:
      "Diffuse lower-airway narrowing reduces expiratory flow throughout both lungs. Upper-airway edema tends to cause stridor, and a focal obstruction more often creates asymmetric air entry; these discriminators sharpen but do not delay emergency management.",
    whyCorrect:
      "The first pair quantifies current asthma severity, while the second pair reduces support for competing explanations without falsely proving they are impossible.",
    distractorRationales: {
      "Peak flow 35% of personal best -> Narrows away from alternate cause":
        "Peak flow is primarily a severity measurement of expiratory obstruction; it is not specific enough to exclude every alternate cause.",
      "Two- to three-word speech with retractions -> Narrows away from alternate cause":
        "Fragmented speech and retractions measure respiratory distress but are not by themselves diagnostic discriminators.",
      "No stridor, facial swelling, or urticaria -> Measures severe lower-airway obstruction":
        "These absent findings narrow away from upper-airway edema and anaphylaxis rather than measuring asthma severity.",
      "No choking event or unilateral absent breath sounds -> Measures severe lower-airway obstruction":
        "These findings reduce support for focal foreign-body obstruction but do not quantify lower-airway severity.",
    },
    takeaway:
      "Analyze both severity markers and diagnostic discriminators, but never postpone treatment of severe respiratory distress.",
    visualRationale: {
      type: "compare",
      accent: "blue",
      title: "Severity versus differential clues",
      options: [
        {
          label: "PEF 35%",
          verdict: "correct",
          note: "Objective severe airflow limitation",
        },
        {
          label: "Short speech and retractions",
          verdict: "correct",
          note: "High work of breathing",
        },
        {
          label: "No stridor or swelling",
          verdict: "partial",
          note: "Upper-airway cause less likely",
        },
        {
          label: "No choking or asymmetry",
          verdict: "partial",
          note: "Focal obstruction less likely",
        },
      ],
      conclusion:
        "The record supports severe diffuse lower-airway obstruction while making key alternatives less likely.",
    },
  }),
  makeVerifiedCaseQuestion(asthmaDefinition, {
    id: "codex-nclex-pediatric-asthma-case-03",
    kind: "bow-tie",
    questionType: "bow_tie",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "synthesize",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem:
      "Complete the bow-tie by identifying the priority condition, two immediate therapies, and two parameters to monitor most closely.",
    nclexInstruction: "Select the center condition, two actions, and two monitoring parameters.",
    options: [],
    bowTie: {
      center: {
        id: "asthma-severe",
        text: "Severe asthma exacerbation with risk for respiratory failure",
        isCorrect: true,
      },
      leftActions: [
        {
          id: "asthma-oxygen-saba",
          text: "Provide oxygen and repeated or continuous prescribed selective SABA therapy",
          isCorrect: true,
        },
        {
          id: "asthma-ipratropium-steroid",
          text: "Administer prescribed ipratropium with initial treatments and systemic corticosteroid promptly",
          isCorrect: true,
        },
        {
          id: "asthma-sedative",
          text: "Administer a sedative to decrease respiratory effort",
          isCorrect: false,
        },
        {
          id: "asthma-suppress-cough",
          text: "Give a cough suppressant and reassess after sleep",
          isCorrect: false,
        },
      ],
      rightMonitoring: [
        {
          id: "asthma-mental-air",
          text: "Mental status, speech, work of breathing, and bilateral air entry",
          isCorrect: true,
        },
        {
          id: "asthma-spo2-flow",
          text: "Continuous SpO2 and serial peak flow when the child can perform it",
          isCorrect: true,
        },
        {
          id: "asthma-sputum-color",
          text: "Sputum color as the primary response endpoint",
          isCorrect: false,
        },
        {
          id: "asthma-daily-weight",
          text: "Daily weight during the initial hour",
          isCorrect: false,
        },
      ],
    },
    correctAnswer: {
      center: "asthma-severe",
      leftActions: ["asthma-oxygen-saba", "asthma-ipratropium-steroid"],
      rightMonitoring: ["asthma-mental-air", "asthma-spo2-flow"],
    },
    rationale:
      "The priority condition is a severe asthma exacerbation with risk for respiratory failure. Official acute-exacerbation guidance identifies oxygen, a selective short-acting beta2-agonist, ipratropium during initial severe treatment, and prompt systemic corticosteroid as core therapies. The nurse must repeatedly assess mental status, speech, work of breathing, and air entry because fatigue and decreasing breath sounds can signal worsening ventilation even if wheeze becomes quieter. Oxygen saturation and peak flow, when feasible, add objective response data.",
    rationaleMechanism:
      "SABA reverses bronchial smooth-muscle constriction, ipratropium adds anticholinergic bronchodilation, corticosteroid treats airway inflammation over time, and oxygen corrects hypoxemia while obstruction is reversed.",
    whyCorrect:
      "The selected therapies address hypoxemia, bronchospasm, and inflammation immediately. The selected monitoring detects both improving airflow and progression toward exhaustion or respiratory failure.",
    distractorRationales: {
      "asthma-sedative":
        "Sedation can depress respiratory drive, mask worsening mental status, and increase danger in a child already at risk for respiratory failure.",
      "asthma-suppress-cough":
        "A cough suppressant and sleep do not reverse severe bronchospasm or hypoxemia and would delay emergency treatment.",
      "asthma-sputum-color":
        "Sputum characteristics may inform infection assessment but do not measure immediate ventilation or treatment response.",
      "asthma-daily-weight":
        "Weight is not an acute respiratory response endpoint during the first treatment hour.",
    },
    takeaway:
      "Treat severe asthma across oxygenation, bronchospasm, and inflammation while watching for fatigue and loss of air movement.",
    visualRationale: {
      type: "pathway",
      accent: "cyan",
      title: "Severe-asthma treatment targets",
      nodes: [
        { label: "Hypoxemia", value: "Supplemental oxygen" },
        { label: "Bronchospasm", value: "Repeated/continuous SABA plus ipratropium" },
        { label: "Inflammation", value: "Systemic corticosteroid" },
        { label: "Failure risk", value: "Mental status, speech, air entry, SpO2" },
      ],
      conclusion:
        "No single medication or monitor is sufficient for a severe exacerbation.",
    },
  }),
  makeVerifiedCaseQuestion(asthmaDefinition, {
    id: "codex-nclex-pediatric-asthma-case-04",
    kind: "multi-select",
    questionType: "sata",
    category: "Pharmacological and Parenteral Therapies",
    nclexClientNeed: "pharmacological",
    cognitiveLevel: "synthesize",
    difficulty: 4,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem:
      "Which interventions should the nurse include in the immediate severe-exacerbation plan? Select all that apply.",
    nclexInstruction: "Select all interventions that apply.",
    options: [
      {
        id: "a",
        text: "Titrate supplemental oxygen and continuously monitor oxygen saturation.",
      },
      {
        id: "b",
        text: "Administer repeated or continuous prescribed albuterol and initial ipratropium.",
      },
      {
        id: "c",
        text: "Administer the prescribed systemic corticosteroid promptly.",
      },
      {
        id: "d",
        text: "Reassess speech, alertness, retractions, air entry, and peak flow when feasible between treatments.",
      },
      {
        id: "e",
        text: "Keep airway and resuscitation equipment available and establish clear escalation criteria.",
      },
      {
        id: "f",
        text: "Withhold bronchodilator therapy until a chest radiograph confirms asthma.",
      },
      {
        id: "g",
        text: "Use wheeze loudness as the only measure of improvement.",
      },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "The immediate plan must support oxygenation, rapidly reverse bronchospasm, treat inflammation, measure serial response, and prepare for respiratory deterioration. Severe asthma is treated clinically; a chest radiograph is not required before time-sensitive bronchodilation in a typical presentation. Wheeze loudness is especially unsafe as a sole response marker because a quieter chest can mean either improvement or critically reduced airflow. The nurse should integrate speech, alertness, effort, air entry, oxygenation, and objective flow when possible.",
    rationaleMechanism:
      "Bronchodilators can improve airway caliber within minutes, while systemic corticosteroids reduce inflammatory edema more gradually. Repeated bedside assessment identifies whether those mechanisms are improving ventilation or whether fatigue is overtaking the child's compensatory effort.",
    whyCorrect:
      "The five selected actions form a complete acute-care bundle that treats the pathophysiology and creates an explicit safety net for escalation.",
    distractorRationales: {
      f: "Waiting for imaging delays first-line therapy. Imaging is reserved for atypical findings or suspected complications, not routine confirmation before treatment.",
      g: "Wheeze requires airflow; diminishing wheeze with poorer air entry and drowsiness can indicate impending respiratory failure.",
    },
    takeaway:
      "Plan severe-asthma care as treat, reassess, and escalate; never equate a quieter chest with automatic improvement.",
    visualRationale: {
      type: "overview",
      accent: "indigo",
      title: "Acute severe-asthma bundle",
      nodes: [
        { label: "Oxygen", value: "Correct hypoxemia" },
        { label: "Bronchodilate", value: "Albuterol plus initial ipratropium" },
        { label: "Control inflammation", value: "Systemic corticosteroid" },
        { label: "Measure", value: "Speech, effort, air entry, SpO2, flow" },
        { label: "Prepare", value: "Airway equipment and escalation" },
      ],
      conclusion:
        "Treatment and surveillance occur concurrently, not sequentially.",
    },
  }),
  makeVerifiedCaseQuestion(asthmaDefinition, {
    id: "codex-nclex-pediatric-asthma-case-05",
    kind: "mcq",
    questionType: "mcq",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "evaluate",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem:
      "Which action should the nurse take first when the 1750 findings appear?",
    nclexInstruction: "Select the priority action.",
    options: [
      {
        id: "a",
        text: "Activate immediate critical-care and airway escalation while continuing oxygen and prescribed bronchodilator support.",
      },
      {
        id: "b",
        text: "Decrease monitoring because the wheeze is now quieter.",
      },
      {
        id: "c",
        text: "Encourage the child to walk to improve lung expansion.",
      },
      {
        id: "d",
        text: "Wait 30 minutes for the systemic corticosteroid to take full effect before notifying the clinician.",
      },
    ],
    correctAnswer: "a",
    rationale:
      "Drowsiness, one-word speech, minimal chest excursion, barely audible breath sounds, persistent tachypnea, and hypoxemia despite treatment indicate impending respiratory failure. The nurse must activate immediate critical-care and airway escalation while maintaining oxygenation and prescribed bronchodilator support. A quieter chest is dangerous when air entry and alertness worsen because wheeze may disappear as airflow becomes critically low. Walking, waiting, or reducing surveillance could allow respiratory arrest.",
    rationaleMechanism:
      "Severe obstruction increases the work required to ventilate until respiratory muscles fatigue. As tidal airflow falls, wheeze can diminish, carbon dioxide clearance can fail, and consciousness can deteriorate.",
    whyCorrect:
      "This action mobilizes advanced ventilation capability before arrest while preserving the therapies that support oxygenation and bronchodilation.",
    distractorRationales: {
      b: "A quieter wheeze with worsening air movement and drowsiness is a deterioration signal, not a reason to reduce monitoring.",
      c: "Ambulation increases oxygen demand and is unsafe for a drowsy child with impending respiratory failure.",
      d: "Systemic corticosteroids do not reverse critical obstruction immediately; airway escalation cannot wait for their full effect.",
    },
    takeaway:
      "A silent or nearly silent chest plus fatigue or altered mental status is an airway emergency.",
    visualRationale: {
      type: "flow",
      accent: "red",
      title: "Recognize impending respiratory failure",
      nodes: [
        { label: "Earlier", value: "Loud wheeze with severe effort" },
        { label: "Now", value: "Minimal air movement and faint sounds" },
        { label: "Brain", value: "Drowsy, one-word speech" },
        { label: "Action", value: "Critical-care and airway escalation now" },
      ],
      conclusion:
        "Less sound is not improvement when less air is moving.",
    },
  }),
  makeVerifiedCaseQuestion(asthmaDefinition, {
    id: "codex-nclex-pediatric-asthma-case-06",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "evaluate",
    difficulty: 4,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem:
      "For each reassessment finding, indicate whether it supports respiratory improvement or requires continued follow-up.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports respiratory improvement", "Requires continued follow-up"],
    matrixRows: [
      {
        label: "Alert and speaking in full sentences",
        answer: "Supports respiratory improvement",
      },
      {
        label: "SpO2 96% on 2 L/min with no retractions at rest",
        answer: "Supports respiratory improvement",
      },
      {
        label: "Peak flow increased from 35% to 65% of personal best",
        answer: "Supports respiratory improvement",
      },
      {
        label: "Heart rate 132/min after repeated albuterol",
        answer: "Requires continued follow-up",
      },
    ],
    correctAnswer: {
      "Alert and speaking in full sentences": "Supports respiratory improvement",
      "SpO2 96% on 2 L/min with no retractions at rest":
        "Supports respiratory improvement",
      "Peak flow increased from 35% to 65% of personal best":
        "Supports respiratory improvement",
      "Heart rate 132/min after repeated albuterol":
        "Requires continued follow-up",
    },
    rationale:
      "Full-sentence speech, normal alertness, improved oxygen saturation, absence of retractions at rest, better air entry, and a substantial peak-flow increase all support improved ventilation and reduced work of breathing. The child is not yet ready for unmonitored discharge simply because the trend is favorable; peak flow remains below personal best and oxygen is still required. Tachycardia can occur with repeated beta2-agonist treatment, but it must be trended with rhythm, perfusion, dose exposure, and overall response rather than dismissed.",
    rationaleMechanism:
      "Improved airway caliber increases expiratory flow and ventilation, reducing accessory-muscle demand and restoring speech and oxygenation. Beta2-agonist stimulation can also increase heart rate, creating a treatment effect that requires surveillance.",
    whyCorrect:
      "The first three findings directly demonstrate better airflow, gas exchange, and functional breathing. Persistent tachycardia is a separate medication and physiologic safety issue requiring continued evaluation.",
    distractorRationales: {
      "Alert and speaking in full sentences -> Requires continued follow-up":
        "This is a strong positive functional response compared with prior drowsiness and one-word speech.",
      "SpO2 96% on 2 L/min with no retractions at rest -> Requires continued follow-up":
        "Improved oxygenation and reduced work of breathing support response, even though oxygen weaning must still be assessed.",
      "Peak flow increased from 35% to 65% of personal best -> Requires continued follow-up":
        "The value is not normal, but the large upward change is direct evidence of bronchodilator response and improved airflow.",
      "Heart rate 132/min after repeated albuterol -> Supports respiratory improvement":
        "Tachycardia does not measure airway improvement and may reflect medication effect, stress, or residual illness; it needs continued monitoring.",
    },
    takeaway:
      "Evaluate asthma response using function, oxygenation, work of breathing, air entry, and flow, while separately monitoring medication effects.",
    visualRationale: {
      type: "trend",
      accent: "emerald",
      title: "Airflow and function improve together",
      metrics: [
        {
          label: "Peak flow",
          value: "35% to 65%",
          direction: "up",
          directionLabel: "improved",
        },
        {
          label: "Speech",
          value: "1 word to full sentences",
          direction: "up",
          directionLabel: "improved",
        },
        {
          label: "SpO2",
          value: "88% RA to 96% on 2 L",
          direction: "up",
          directionLabel: "improved",
        },
        {
          label: "Heart rate",
          value: "132/min",
          direction: "steady",
          directionLabel: "monitor",
        },
      ],
      conclusion:
        "Improvement is multidimensional; tachycardia remains a separate safety trend.",
    },
  }),
];

const neonatalCaseStudyDeck: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(neonatalDefinition, {
    id: "codex-nclex-neonatal-hypoglycemia-case-01",
    kind: "multi-select",
    questionType: "sata",
    category: "Health Promotion and Maintenance",
    nclexClientNeed: "health_promotion",
    cognitiveLevel: "analyze",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem:
      "Which findings require immediate follow-up for possible neonatal hypoglycemia? Select all that apply.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Select all findings that require immediate follow-up.",
    options: [
      { id: "a", text: "Birth parent treated with insulin for type 2 diabetes" },
      { id: "b", text: "Birth weight 4,320 g at 39 weeks" },
      { id: "c", text: "Jitteriness when undisturbed" },
      { id: "d", text: "Weak, poorly sustained suck" },
      { id: "e", text: "Axillary temperature 97.5 F (36.4 C)" },
      { id: "f", text: "SpO2 97% on room air" },
      { id: "g", text: "Apgar scores 8 and 9" },
      { id: "h", text: "Pink color with unlabored respirations" },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "Maternal diabetes and large-for-gestational-age status identify an infant who needs glucose screening. Jitteriness, ineffective feeding, and low temperature are compatible with neonatal hypoglycemia and require an immediate glucose measurement rather than waiting for the next routine prefeed check. These signs are nonspecific, so the nurse must also consider temperature instability, sepsis, electrolyte disturbance, and neurologic disease while treating a confirmed low glucose promptly. Normal oxygenation, reassuring Apgar scores, and unlabored respirations do not remove the glucose risk.",
    rationaleMechanism:
      "Maternal hyperglycemia can stimulate fetal pancreatic insulin production. After placental glucose delivery stops at birth, persistent neonatal hyperinsulinemia can drive glucose into tissues and suppress alternative fuel availability, producing early low glucose.",
    whyCorrect:
      "The selected findings include two major screening risks and three possible manifestations. Together they justify immediate bedside glucose assessment and neonatal escalation.",
    distractorRationales: {
      f: "Normal oxygen saturation is reassuring for oxygenation but does not exclude low glucose.",
      g: "Reassuring Apgar scores describe initial transition and do not eliminate later hypoglycemia risk in an infant of a diabetic parent.",
      h: "Pink color and unlabored breathing are reassuring respiratory findings but do not explain jitteriness and poor feeding.",
    },
    takeaway:
      "Screen at-risk newborns and check glucose immediately when jitteriness, poor feeding, lethargy, apnea, temperature instability, or seizures occur.",
    visualRationale: {
      type: "signal",
      accent: "amber",
      title: "Risk plus symptoms",
      nodes: [
        { label: "Maternal risk", value: "Insulin-treated diabetes" },
        { label: "Growth risk", value: "LGA, 4,320 g" },
        { label: "Neurologic cue", value: "Jitteriness" },
        { label: "Feeding cue", value: "Weak suck" },
        { label: "Metabolic cue", value: "Temperature 36.4 C" },
      ],
      conclusion:
        "An at-risk infant with compatible signs needs glucose measured now, not at the next routine interval.",
    },
  }),
  makeVerifiedCaseQuestion(neonatalDefinition, {
    id: "codex-nclex-neonatal-hypoglycemia-case-02",
    kind: "matrix",
    questionType: "matrix",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "analyze",
    difficulty: 4,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem:
      "For each finding, identify whether it supports neonatal hypoglycemia risk or manifestation or is currently reassuring.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: [
      "Supports hypoglycemia risk/manifestation",
      "Currently reassuring",
    ],
    matrixRows: [
      {
        label: "Point-of-care glucose 32 mg/dL with jitteriness",
        answer: "Supports hypoglycemia risk/manifestation",
      },
      {
        label: "Infant of an insulin-treated diabetic parent",
        answer: "Supports hypoglycemia risk/manifestation",
      },
      {
        label: "Large for gestational age with ineffective feeding",
        answer: "Supports hypoglycemia risk/manifestation",
      },
      {
        label: "SpO2 97% on room air without respiratory distress",
        answer: "Currently reassuring",
      },
    ],
    correctAnswer: {
      "Point-of-care glucose 32 mg/dL with jitteriness":
        "Supports hypoglycemia risk/manifestation",
      "Infant of an insulin-treated diabetic parent":
        "Supports hypoglycemia risk/manifestation",
      "Large for gestational age with ineffective feeding":
        "Supports hypoglycemia risk/manifestation",
      "SpO2 97% on room air without respiratory distress":
        "Currently reassuring",
    },
    rationale:
      "A glucose of 32 mg/dL in a symptomatic infant requires prompt treatment preparation and laboratory confirmation without delaying care. Maternal diabetes and large size support the hyperinsulinemic risk pathway, while poor feeding both signals possible neuroglycopenia and reduces enteral glucose delivery. Normal oxygen saturation and unlabored respirations are reassuring for the respiratory transition but do not make the low glucose benign. A point-of-care result should be interpreted with the clinical condition and confirmed by a laboratory-quality method when possible.",
    rationaleMechanism:
      "Persistent insulin action after birth accelerates glucose uptake and limits hepatic glucose production and ketone availability. The newborn brain has high glucose demand, so low delivery may cause jitteriness, poor feeding, lethargy, apnea, or seizures.",
    whyCorrect:
      "The first three findings converge on symptomatic low glucose in a high-risk infant. The respiratory finding is normal and belongs to a different physiologic domain.",
    distractorRationales: {
      "Point-of-care glucose 32 mg/dL with jitteriness -> Currently reassuring":
        "This low value plus symptoms is not an expected transition that can be observed without prompt action.",
      "Infant of an insulin-treated diabetic parent -> Currently reassuring":
        "Maternal diabetes is a recognized newborn hypoglycemia screening risk because fetal insulin secretion may remain elevated after birth.",
      "Large for gestational age with ineffective feeding -> Currently reassuring":
        "Large size and poor intake increase concern rather than reassure, especially when low glucose is documented.",
      "SpO2 97% on room air without respiratory distress -> Supports hypoglycemia risk/manifestation":
        "Normal oxygenation does not support hypoglycemia; it simply shows the infant is not currently in respiratory distress.",
    },
    takeaway:
      "Connect maternal diabetes, LGA status, feeding effectiveness, symptoms, and measured glucose; do not interpret any one value in isolation.",
    visualRationale: {
      type: "pathway",
      accent: "yellow",
      title: "Why an infant of a diabetic parent becomes hypoglycemic",
      nodes: [
        { label: "Before birth", value: "High maternal glucose exposure" },
        { label: "Fetal response", value: "Increased insulin production" },
        { label: "Cord clamped", value: "Maternal glucose supply stops" },
        { label: "After birth", value: "Insulin action persists" },
        { label: "Result", value: "Glucose 32 with jitteriness" },
      ],
      conclusion:
        "The glucose source changes abruptly at birth, but fetal insulin activity may not.",
    },
  }),
  makeVerifiedCaseQuestion(neonatalDefinition, {
    id: "codex-nclex-neonatal-hypoglycemia-case-03",
    kind: "bow-tie",
    questionType: "bow_tie",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "synthesize",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem:
      "Complete the bow-tie by identifying the priority condition, two immediate actions, and two parameters to monitor most closely.",
    nclexInstruction: "Select the center condition, two actions, and two monitoring parameters.",
    options: [],
    bowTie: {
      center: {
        id: "neonate-symptomatic-hypoglycemia",
        text: "Symptomatic neonatal hypoglycemia in an infant of a diabetic parent",
        isCorrect: true,
      },
      leftActions: [
        {
          id: "neonate-notify-dextrose",
          text: "Notify the neonatal clinician and administer prescribed IV dextrose promptly",
          isCorrect: true,
        },
        {
          id: "neonate-warm-feed",
          text: "Support thermoregulation and resume supported feeding when neurologically stable",
          isCorrect: true,
        },
        {
          id: "neonate-water",
          text: "Give sterile water to dilute circulating insulin",
          isCorrect: false,
        },
        {
          id: "neonate-wait",
          text: "Wait for the next routine prefeed check before intervening",
          isCorrect: false,
        },
      ],
      rightMonitoring: [
        {
          id: "neonate-glucose-neuro",
          text: "Serial glucose values and neurologic status",
          isCorrect: true,
        },
        {
          id: "neonate-feed-iv",
          text: "Feeding effectiveness, temperature, cardiorespiratory status, and IV site",
          isCorrect: true,
        },
        {
          id: "neonate-head-circ",
          text: "Daily head circumference as the acute response measure",
          isCorrect: false,
        },
        {
          id: "neonate-stool",
          text: "Meconium color as the primary glucose endpoint",
          isCorrect: false,
        },
      ],
    },
    correctAnswer: {
      center: "neonate-symptomatic-hypoglycemia",
      leftActions: ["neonate-notify-dextrose", "neonate-warm-feed"],
      rightMonitoring: ["neonate-glucose-neuro", "neonate-feed-iv"],
    },
    rationale:
      "The priority hypothesis is symptomatic neonatal hypoglycemia. Jitteriness and ineffective feeding occur with a glucose of 32 mg/dL in an infant with strong hyperinsulinemic risk factors. AAP guidance calls for immediate measurement in symptomatic infants and prompt treatment; laboratory confirmation should be obtained when possible but should not delay stabilization. Prescribed IV dextrose is appropriate for a symptomatic low value, with warmth and feeding support integrated as the infant becomes coordinated and stable. Serial glucose and neurologic assessment determine response and recurrence.",
    rationaleMechanism:
      "Glucose is an essential neonatal brain fuel. In hyperinsulinemic states, both circulating glucose and alternative fuels can be limited, so prolonged or recurrent deficiency creates risk for neuroglycopenic injury.",
    whyCorrect:
      "The selected actions restore glucose delivery and reduce avoidable metabolic demand while preserving feeding support. The monitoring choices detect recurrence, neurologic response, temperature instability, and infusion complications.",
    distractorRationales: {
      "neonate-water":
        "Sterile water provides no glucose, does not lower insulin safely, and can cause dangerous fluid and sodium imbalance.",
      "neonate-wait":
        "A symptomatic glucose of 32 mg/dL requires prompt action; waiting risks prolonged brain fuel deficiency.",
      "neonate-head-circ":
        "Head circumference is a growth measurement and cannot show acute glucose response.",
      "neonate-stool":
        "Meconium color does not measure glucose correction or neurologic recovery.",
    },
    takeaway:
      "Treat symptomatic neonatal hypoglycemia promptly while confirming the value, supporting warmth and feeding, and trending neurologic and glucose response.",
    visualRationale: {
      type: "flow",
      accent: "orange",
      title: "Symptomatic low-glucose response",
      nodes: [
        { label: "Recognize", value: "Risk plus jitteriness and weak suck" },
        { label: "Measure", value: "POC 32; send plasma confirmation" },
        { label: "Treat", value: "Prescribed IV dextrose without delay" },
        { label: "Support", value: "Warmth and feeding when coordinated" },
        { label: "Trend", value: "Glucose, neuro status, IV site" },
      ],
      conclusion:
        "Confirmation improves accuracy; it must not postpone treatment of a symptomatic infant.",
    },
  }),
  makeVerifiedCaseQuestion(neonatalDefinition, {
    id: "codex-nclex-neonatal-hypoglycemia-case-04",
    kind: "multi-select",
    questionType: "sata",
    category: "Pharmacological and Parenteral Therapies",
    nclexClientNeed: "pharmacological",
    cognitiveLevel: "synthesize",
    difficulty: 4,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem:
      "Which interventions should the nurse include in the immediate care plan? Select all that apply.",
    nclexInstruction: "Select all interventions that apply.",
    options: [
      {
        id: "a",
        text: "Verify the prescribed dextrose concentration, dose, pump settings, and IV patency with an independent safety check.",
      },
      {
        id: "b",
        text: "Recheck glucose at protocol-defined intervals and before feedings until stable.",
      },
      {
        id: "c",
        text: "Assess jitteriness, tone, alertness, feeding coordination, temperature, and cardiorespiratory status.",
      },
      {
        id: "d",
        text: "Support expressed breast milk or breastfeeding when the infant can feed safely and involve lactation support.",
      },
      {
        id: "e",
        text: "Inspect the IV site frequently because hypertonic dextrose exposure can injure tissue if infiltration occurs.",
      },
      {
        id: "f",
        text: "Stop glucose monitoring after the first value rises above the treatment threshold.",
      },
      {
        id: "g",
        text: "Delay feeding support until all IV dextrose has been discontinued.",
      },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "The plan must deliver dextrose safely, document sustained glucose response, monitor neurologic and physiologic recovery, preserve feeding, and prevent IV injury. A single improved glucose does not establish stability because insulin activity can produce recurrence between feedings or during infusion changes. Feeding support should continue when the infant is clinically able; IV therapy and enteral nutrition are complementary. Frequent IV-site assessment is essential because dextrose infiltration can damage neonatal tissue.",
    rationaleMechanism:
      "IV dextrose supplies immediate substrate, while regular milk intake supports ongoing glucose availability. Serial measurements detect whether endogenous insulin activity continues to exceed glucose delivery.",
    whyCorrect:
      "The selected actions cover dose safety, recurrence detection, neurologic surveillance, nutrition, thermoregulation, and vascular-access protection.",
    distractorRationales: {
      f: "One acceptable value may be transient; serial prefeed values and clinical stability are needed before monitoring is reduced.",
      g: "Withholding enteral feeding unnecessarily disrupts nutrition and parent-infant care; safe feeding should resume when coordination and respiratory status permit.",
    },
    takeaway:
      "Neonatal glucose care is a sustained-stability plan, not a one-number task.",
    visualRationale: {
      type: "overview",
      accent: "gold",
      title: "Five-part stabilization plan",
      nodes: [
        { label: "Infusion safety", value: "Concentration, dose, pump, IV" },
        { label: "Glucose trend", value: "Post-treatment and prefeed checks" },
        { label: "Clinical trend", value: "Neuro, temperature, breathing" },
        { label: "Nutrition", value: "Milk feeding and lactation support" },
        { label: "Tissue safety", value: "Frequent IV-site inspection" },
      ],
      conclusion:
        "Sustained euglycemia requires safe parenteral delivery plus effective enteral support.",
    },
  }),
  makeVerifiedCaseQuestion(neonatalDefinition, {
    id: "codex-nclex-neonatal-hypoglycemia-case-05",
    kind: "mcq",
    questionType: "mcq",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "evaluate",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem:
      "Which action should the nurse take first after the prefeed glucose of 36 mg/dL is obtained?",
    nclexInstruction: "Select the priority action.",
    options: [
      {
        id: "a",
        text: "Notify the neonatal clinician immediately, continue safety monitoring, and prepare to implement the prescribed escalation or infusion adjustment.",
      },
      {
        id: "b",
        text: "Discontinue the IV dextrose because the earlier glucose reached 48 mg/dL.",
      },
      {
        id: "c",
        text: "Wait until the infant misses two more feedings before reporting the recurrent low value.",
      },
      {
        id: "d",
        text: "Give plain water and recheck the glucose after the next routine assessment.",
      },
    ],
    correctAnswer: "a",
    rationale:
      "The infant has recurrent low glucose with renewed sleepiness and weak suck despite IV dextrose and a completed feeding. The nurse should notify the neonatal clinician immediately, continue cardiorespiratory and neurologic monitoring, verify IV patency and infusion settings, and prepare to implement the prescribed escalation. Recurrence shows that the initial response was not sustained and may require a higher glucose delivery rate or further evaluation. Discontinuing dextrose, waiting for additional episodes, or giving water would prolong glucose deficiency.",
    rationaleMechanism:
      "Persistent insulin effect can consume delivered glucose faster than the current infusion and feeding replace it. Recurrent neuroglycopenic signs indicate inadequate substrate delivery for current metabolic demand.",
    whyCorrect:
      "Immediate escalation addresses a documented recurrent brain-fuel problem while the nurse verifies that the treatment is actually reaching the infant safely.",
    distractorRationales: {
      b: "An earlier acceptable value does not justify stopping therapy when the current glucose and symptoms show recurrence.",
      c: "Waiting for repeated episodes exposes the infant to prolonged or recurrent neuroglycopenia and delays adjustment of ineffective treatment.",
      d: "Water contains no glucose and can worsen fluid-electrolyte balance; it has no role in correcting neonatal hypoglycemia.",
    },
    takeaway:
      "A recurrent low glucose with symptoms during therapy means the plan is insufficient now; escalate rather than waiting.",
    visualRationale: {
      type: "trend",
      accent: "red",
      title: "Initial response was not sustained",
      metrics: [
        {
          label: "Initial glucose",
          value: "32 mg/dL",
          direction: "steady",
          directionLabel: "symptomatic low",
        },
        {
          label: "After treatment",
          value: "48 mg/dL",
          direction: "up",
          directionLabel: "temporary response",
        },
        {
          label: "Next prefeed",
          value: "36 mg/dL",
          direction: "down",
          directionLabel: "recurrent low",
        },
      ],
      conclusion:
        "A rebound decline during therapy requires immediate reassessment and provider-directed escalation.",
    },
  }),
  makeVerifiedCaseQuestion(neonatalDefinition, {
    id: "codex-nclex-neonatal-hypoglycemia-case-06",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "evaluate",
    difficulty: 4,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem:
      "For each reassessment finding, indicate whether it supports metabolic stabilization or requires immediate or continued follow-up.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: [
      "Supports metabolic stabilization",
      "Requires immediate/continued follow-up",
    ],
    matrixRows: [
      {
        label: "Prefeed glucose values 52 and 58 mg/dL",
        answer: "Supports metabolic stabilization",
      },
      {
        label: "Alert with normal tone and no jitteriness",
        answer: "Supports metabolic stabilization",
      },
      {
        label: "Takes 25 mL expressed breast milk with coordinated suck",
        answer: "Supports metabolic stabilization",
      },
      {
        label: "IV site mildly swollen and cool",
        answer: "Requires immediate/continued follow-up",
      },
    ],
    correctAnswer: {
      "Prefeed glucose values 52 and 58 mg/dL":
        "Supports metabolic stabilization",
      "Alert with normal tone and no jitteriness":
        "Supports metabolic stabilization",
      "Takes 25 mL expressed breast milk with coordinated suck":
        "Supports metabolic stabilization",
      "IV site mildly swollen and cool":
        "Requires immediate/continued follow-up",
    },
    rationale:
      "Two acceptable prefeed glucose values, normal neurologic behavior, thermal stability, and coordinated milk intake support improvement after the infusion adjustment. They do not by themselves authorize abrupt discontinuation; glucose must remain stable through a protocol-directed wean and feeding plan. A swollen cool IV site suggests infiltration and requires immediate infusion-site action according to neonatal IV policy, including stopping use of the affected site and escalating for assessment and alternate access. Metabolic improvement never makes a compromised dextrose infusion site safe.",
    rationaleMechanism:
      "Sustained prefeed glucose and effective intake show that available substrate is beginning to meet metabolic demand. Dextrose outside the vein can injure tissue and simultaneously reduce the glucose actually delivered systemically.",
    whyCorrect:
      "The first three findings demonstrate biochemical, neurologic, and feeding recovery. The IV finding identifies a new treatment complication requiring immediate action even while glucose control improves.",
    distractorRationales: {
      "Prefeed glucose values 52 and 58 mg/dL -> Requires immediate/continued follow-up":
        "Serial values above the early transitional target support stabilization, though protocol-directed monitoring and weaning still continue.",
      "Alert with normal tone and no jitteriness -> Requires immediate/continued follow-up":
        "Resolution of neurogenic signs is a positive clinical response when paired with improved glucose values.",
      "Takes 25 mL expressed breast milk with coordinated suck -> Requires immediate/continued follow-up":
        "Effective feeding supports ongoing enteral glucose delivery and is a favorable functional outcome.",
      "IV site mildly swollen and cool -> Supports metabolic stabilization":
        "Swelling and coolness suggest infiltration, which threatens tissue and treatment delivery and requires immediate follow-up.",
    },
    takeaway:
      "Evaluate glucose, neurologic status, feeding, temperature, and IV integrity together; a successful number never excuses an unsafe infusion site.",
    visualRationale: {
      type: "compare",
      accent: "emerald",
      title: "Metabolic recovery with a new IV hazard",
      options: [
        {
          label: "Glucose 52 and 58",
          verdict: "correct",
          note: "Serial biochemical improvement",
        },
        {
          label: "Alert, no jitteriness",
          verdict: "correct",
          note: "Neurologic recovery",
        },
        {
          label: "Coordinated 25 mL feed",
          verdict: "correct",
          note: "Functional nutritional recovery",
        },
        {
          label: "Swollen, cool IV site",
          verdict: "wrong",
          note: "Possible infiltration; act now",
        },
      ],
      conclusion:
        "Continue metabolic stabilization while immediately protecting the infant from infusion injury.",
    },
  }),
];

export const verifiedMaternalPediatricNclexCaseStudyDeck: PracticeQuestion[] = [
  ...preeclampsiaCaseStudyDeck,
  ...dehydrationCaseStudyDeck,
  ...asthmaCaseStudyDeck,
  ...neonatalCaseStudyDeck,
];
