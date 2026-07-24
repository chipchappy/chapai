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

const digoxinReferences: CaseReference[] = [
  NCLEX_REFERENCE,
  {
    title: "Digoxin tablets: full prescribing information",
    citation: "DailyMed, U.S. National Library of Medicine, revised March 2026",
    href: "https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=51925501-ab5b-4e12-a67e-ec2b4b592e83&type=display",
  },
  {
    title: "DigiFab (digoxin immune Fab): full prescribing information",
    citation: "DailyMed, U.S. National Library of Medicine, revised 2026",
    href: "https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=49ee0505-77a0-1ff4-e063-6294a90a410e&type=display",
  },
];

const lithiumReferences: CaseReference[] = [
  NCLEX_REFERENCE,
  {
    title: "Lithium carbonate extended-release tablets: full prescribing information",
    citation: "DailyMed, U.S. National Library of Medicine, updated 2025",
    href: "https://dailymed.nlm.nih.gov/dailymed/getFile.cfm?setid=074e3c3b-3a36-4c66-b0a7-e19f9aac8548",
  },
  {
    title: "Extracorporeal treatment for lithium poisoning",
    citation: "EXTRIP Workgroup, Clinical Journal of the American Society of Nephrology, 2015",
    href: "https://pubmed.ncbi.nlm.nih.gov/25583292/",
  },
];

const copdReferences: CaseReference[] = [
  NCLEX_REFERENCE,
  {
    title: "Global Strategy for Prevention, Diagnosis and Management of COPD: 2026 Report",
    citation: "Global Initiative for Chronic Obstructive Lung Disease, 2026",
    href: "https://goldcopd.org/wp-content/uploads/2026/01/GOLD-REPORT-2026-v1.3-8Dec2025_WMV2.pdf",
  },
];

const acuteChestReferences: CaseReference[] = [
  NCLEX_REFERENCE,
  {
    title: "Evidence-Based Management of Sickle Cell Disease: Expert Panel Report",
    citation: "National Heart, Lung, and Blood Institute, NIH, 2014",
    href: "https://www.nhlbi.nih.gov/sites/default/files/media/docs/Evd-Bsd_SickleCellDis_Rep2014.pdf",
  },
  {
    title: "ASH 2020 guidelines for sickle cell disease: transfusion support",
    citation: "American Society of Hematology, Blood Advances, 2020",
    href: "https://ashpublications.org/bloodadvances/article/4/2/327/440607/American-Society-of-Hematology-2020-guidelines-for",
  },
];

function buildDigoxinChartReview(caseItemNumber: number): PracticeChartReviewMetadata {
  const step = Math.max(1, Math.min(6, caseItemNumber));
  const nursingNotes = [
    "0805: Client is placed on continuous cardiac monitoring with fall precautions because of weakness and an irregular bradycardic pulse.",
    "0810: Client reports nausea, poor appetite, weakness, and intermittent yellow-green halos. Apical pulse is 52/min and irregular; client denies current chest pain.",
  ];
  const timeline = [
    "0800: Client arrives from home after 4 days of poor oral intake and diarrhea.",
  ];
  const labs: NonNullable<PracticeChartReviewMetadata["labs"]> = [];
  const diagnostics: NonNullable<PracticeChartReviewMetadata["diagnostics"]> = [];
  const providerOrders = [
    "Place on continuous cardiac monitoring.",
    "Obtain a 12-lead electrocardiogram and serum electrolytes, magnesium, creatinine, and digoxin concentration.",
  ];

  if (step >= 2) {
    nursingNotes.push(
      "0830: Client remains nauseated and light-headed when sitting. Telemetry shows frequent premature ventricular contractions with intermittent bigeminy.",
    );
    timeline.push("0825: Initial laboratory and electrocardiographic results become available.");
    labs.push(
      { label: "Potassium", value: "2.9 mEq/L", flag: "critical" },
      { label: "Magnesium", value: "1.6 mg/dL", flag: "low" },
      { label: "Creatinine", value: "1.6 mg/dL; baseline 0.9 mg/dL", flag: "high" },
      { label: "Digoxin", value: "2.4 ng/mL; last dose 10 hours ago", flag: "high" },
    );
    diagnostics.push({
      label: "12-lead ECG",
      value: "Sinus bradycardia, prolonged PR interval, frequent ventricular ectopy",
      flag: "critical",
    });
  }
  if (step >= 3) {
    nursingNotes.push(
      "0840: Medication reconciliation confirms digoxin 0.125 mg daily and furosemide 40 mg daily. The client continued both medicines during the diarrheal illness.",
    );
    timeline.push("0840: Medication reconciliation is completed.");
  }
  if (step >= 4) {
    nursingNotes.push(
      "0850: Digoxin is withheld. Prescriber is notified of symptoms, rhythm, renal change, and electrolyte results; prescribed potassium and magnesium replacement begins with ECG monitoring.",
    );
    timeline.push("0848: Initial toxicity-management prescriptions are received.");
    providerOrders.push(
      "Withhold digoxin; replace potassium and magnesium per protocol with serial levels.",
      "Maintain IV access and notify prescriber immediately for worsening bradycardia, heart block, or ventricular dysrhythmia.",
    );
  }
  if (step >= 5) {
    nursingNotes.push(
      "0910: Client becomes diaphoretic and more dizzy. Heart rate falls to 38/min; telemetry shows second-degree AV block with a short run of ventricular tachycardia. Blood pressure is 84/50 mm Hg.",
    );
    timeline.push("0910: Potentially life-threatening manifestations develop.");
    providerOrders.push(
      "Prepare and administer prescribed digoxin immune Fab; continue continuous ECG and frequent potassium monitoring.",
    );
  }
  if (step >= 6) {
    nursingNotes.push(
      "1015: After prescribed digoxin immune Fab, heart rate is 68/min in sinus rhythm, blood pressure is 108/66 mm Hg, nausea is improved, and no ventricular ectopy is observed. Potassium is 3.7 mEq/L.",
    );
    timeline.push("1015: Post-treatment reassessment is documented.");
    labs.push({ label: "Repeat potassium", value: "3.7 mEq/L", flag: "normal" });
    diagnostics.push({
      label: "Repeat ECG",
      value: "Sinus rhythm 68/min; no ventricular ectopy",
      flag: "normal",
    });
  }

  return {
    patientTitle: "M.R., 74-year-old adult",
    patientCaption: "Medical telemetry",
    chiefComplaint: "Nausea, weakness, visual changes, and slow pulse",
    history: ["Heart failure with reduced ejection fraction", "Chronic atrial fibrillation", "Hypertension"],
    allergies: ["No known drug allergies"],
    medications: ["Digoxin 0.125 mg by mouth daily", "Furosemide 40 mg by mouth daily", "Lisinopril 10 mg by mouth daily"],
    hpi: [
      "Four days of watery diarrhea and poor oral intake began after a household gastrointestinal illness.",
      "The client continued scheduled digoxin and furosemide and now reports progressive anorexia, nausea, weakness, light-headedness, and intermittent yellow-green halos.",
      "No extra digoxin doses or intentional ingestion are reported.",
    ],
    nursingNotes,
    timeline,
    unfoldingTimeline: timeline,
    vitals:
      step >= 5
        ? [
            { label: "Temperature", value: "98.2 F (36.8 C)", flag: "normal" },
            { label: "Heart rate", value: "38/min", flag: "critical" },
            { label: "Blood pressure", value: "84/50 mm Hg", flag: "critical" },
            { label: "Respiratory rate", value: "20/min", flag: "normal" },
            { label: "SpO2", value: "96% on room air", flag: "normal" },
          ]
        : [
            { label: "Temperature", value: "98.2 F (36.8 C)", flag: "normal" },
            { label: "Heart rate", value: "52/min and irregular", flag: "critical" },
            { label: "Blood pressure", value: "102/62 mm Hg", flag: "normal" },
            { label: "Respiratory rate", value: "18/min", flag: "normal" },
            { label: "SpO2", value: "96% on room air", flag: "normal" },
          ],
    labs,
    diagnostics,
    providerOrders,
    priorityCues: ["Bradycardia with ventricular ectopy", "GI and visual symptoms", "Hypokalemia", "Acute kidney-function decline"],
  };
}

function buildLithiumChartReview(caseItemNumber: number): PracticeChartReviewMetadata {
  const step = Math.max(1, Math.min(6, caseItemNumber));
  const nursingNotes = [
    "1300: Client is placed on fall and seizure precautions with continuous observation because of unsteady gait and slowed responses.",
    "1305: Client is awake but slow to answer. Speech is slightly slurred, hands have a coarse tremor, and gait is unsteady with one-person assistance.",
  ];
  const timeline = [
    "1250: Client presents after 3 days of vomiting and diarrhea during a heat wave.",
  ];
  const labs: NonNullable<PracticeChartReviewMetadata["labs"]> = [];
  const providerOrders = [
    "Institute fall and seizure precautions; place on cardiac monitoring.",
    "Obtain serum lithium, electrolytes, BUN, creatinine, glucose, and ECG.",
  ];

  if (step >= 2) {
    nursingNotes.push(
      "1320: Mucous membranes are dry. Client reports continuing lithium and taking ibuprofen every 6 hours for headache during the illness.",
    );
    timeline.push("1320: Medication reconciliation and laboratory results become available.");
    labs.push(
      { label: "Lithium", value: "2.3 mEq/L; last dose 12 hours ago", flag: "critical" },
      { label: "Sodium", value: "130 mEq/L", flag: "low" },
      { label: "BUN", value: "34 mg/dL", flag: "high" },
      { label: "Creatinine", value: "1.7 mg/dL; baseline 0.8 mg/dL", flag: "high" },
      { label: "Potassium", value: "3.6 mEq/L", flag: "normal" },
    );
  }
  if (step >= 3) {
    nursingNotes.push(
      "1335: Client becomes disoriented to date and cannot safely stand. Coarse tremor and hyperreflexia persist; no seizure activity is observed.",
    );
    timeline.push("1335: Neurologic toxicity progresses despite no additional lithium.");
  }
  if (step >= 4) {
    nursingNotes.push(
      "1345: Lithium and ibuprofen are withheld. Two peripheral IVs are patent; prescribed isotonic saline is infusing with strict intake and output.",
    );
    timeline.push("1345: Initial treatment and serial monitoring begin.");
    providerOrders.push(
      "Withhold lithium and nephrotoxic/interacting medications.",
      "Administer isotonic IV fluid as prescribed; measure urine output and repeat lithium, sodium, and renal studies.",
      "Consult poison control, nephrology, and medical toxicology.",
    );
  }
  if (step >= 5) {
    nursingNotes.push(
      "1440: Confusion worsens and the client is difficult to arouse. Repeat lithium is 2.5 mEq/L and urine output is 15 mL in the past hour.",
    );
    timeline.push("1440: Clinical status and lithium concentration worsen with oliguria.");
    labs.push(
      { label: "Repeat lithium", value: "2.5 mEq/L", flag: "critical" },
      { label: "Urine output", value: "15 mL in 1 hour", flag: "critical" },
    );
    providerOrders.push("Prepare for urgent hemodialysis evaluation and transfer to a higher level of care.");
  }
  if (step >= 6) {
    nursingNotes.push(
      "2030: After hemodialysis and prescribed fluid management, client is awake, oriented to person and place, and follows commands. Tremor is mild; urine output is 45 mL/hr. Repeat lithium is 0.9 mEq/L.",
    );
    timeline.push("2030: Post-dialysis reassessment is documented.");
    labs.push(
      { label: "Post-dialysis lithium", value: "0.9 mEq/L", flag: "normal" },
      { label: "Repeat creatinine", value: "1.2 mg/dL", flag: "high" },
    );
  }

  return {
    patientTitle: "T.L., 46-year-old adult",
    patientCaption: "Emergency department",
    chiefComplaint: "Vomiting, tremor, and unsteady gait",
    history: ["Bipolar I disorder", "Migraine headaches"],
    allergies: ["Sulfonamide antibiotics: rash"],
    medications: ["Lithium carbonate ER 900 mg nightly", "Ibuprofen 600 mg as needed"],
    hpi: [
      "Three days of vomiting and watery diarrhea occurred while the client's home cooling system was not working.",
      "The client continued nightly lithium and used ibuprofen for headache, then developed worsening coarse tremor, slurred speech, difficulty walking, and slowed thinking.",
      "The family denies an intentional overdose or access to another person's medication.",
    ],
    nursingNotes,
    timeline,
    unfoldingTimeline: timeline,
    vitals: [
      { label: "Temperature", value: "99.1 F (37.3 C)", flag: "normal" },
      { label: "Heart rate", value: "106/min", flag: "high" },
      { label: "Blood pressure", value: "96/58 mm Hg", flag: "low" },
      { label: "Respiratory rate", value: "18/min", flag: "normal" },
      { label: "SpO2", value: "97% on room air", flag: "normal" },
    ],
    labs,
    providerOrders,
    intakeOutput: step >= 4 ? ["Strict hourly intake and output", step >= 5 ? "Urine output: 15 mL in past hour" : "Urine output: 30 mL in first hour"] : [],
    priorityCues: ["Progressive neurologic changes", "Volume and sodium depletion", "Acute kidney injury", "Elevated and rising lithium"],
  };
}

function buildCopdChartReview(caseItemNumber: number): PracticeChartReviewMetadata {
  const step = Math.max(1, Math.min(6, caseItemNumber));
  const nursingNotes = [
    "0705: Client is placed in high-Fowler position with continuous pulse oximetry; respiratory effort and mental status are assessed without leaving the client unattended.",
    "0710: Client sits upright in tripod position, speaks in 3- to 4-word phrases, and uses accessory muscles. Breath sounds are markedly diminished with diffuse expiratory wheezes.",
  ];
  const timeline = [
    "0655: Client arrives with 2 days of increasing dyspnea and purulent sputum.",
  ];
  const labs: NonNullable<PracticeChartReviewMetadata["labs"]> = [];
  const diagnostics: NonNullable<PracticeChartReviewMetadata["diagnostics"]> = [];
  const providerOrders = [
    "Titrate controlled oxygen to an SpO2 target of 88% to 92%.",
    "Administer prescribed short-acting inhaled bronchodilators and systemic corticosteroid.",
    "Obtain arterial blood gas, chest radiograph, ECG, and infection studies.",
  ];

  if (step >= 2) {
    nursingNotes.push(
      "0730: On 28% Venturi oxygen, SpO2 is 90%. Client remains tachypneic but alert; bronchodilator treatment is in progress.",
    );
    timeline.push("0730: Initial ABG and chest radiograph become available.");
    labs.push(
      { label: "ABG pH", value: "7.30", flag: "low" },
      { label: "PaCO2", value: "62 mm Hg", flag: "critical" },
      { label: "PaO2", value: "58 mm Hg", flag: "low" },
      { label: "HCO3-", value: "30 mEq/L", flag: "high" },
    );
    diagnostics.push({
      label: "Chest radiograph",
      value: "Hyperinflation; no focal infiltrate or pneumothorax",
      flag: "normal",
    });
  }
  if (step >= 3) {
    nursingNotes.push(
      "0750: Respiratory rate is 32/min and accessory-muscle use persists. Client is increasingly fatigued but still follows commands.",
    );
    timeline.push("0750: Work of breathing and fatigue increase.");
  }
  if (step >= 4) {
    nursingNotes.push(
      "0800: Prescribed controlled oxygen, bronchodilators, corticosteroid, and antibiotic for purulent sputum are continued. Respiratory therapy prepares noninvasive ventilation equipment.",
    );
    timeline.push("0800: Escalation plan is initiated with close reassessment.");
    providerOrders.push(
      "Begin noninvasive positive-pressure ventilation if respiratory acidosis or work of breathing worsens and no contraindication is present.",
      "Repeat ABG after intervention and notify provider for declining mental status or inability to protect the airway.",
    );
  }
  if (step >= 5) {
    nursingNotes.push(
      "0820: Client is drowsy and answers with one word. Respiratory rate is 34/min with shallow respirations. Repeat ABG: pH 7.24, PaCO2 72 mm Hg, PaO2 55 mm Hg on controlled oxygen.",
    );
    timeline.push("0820: Worsening hypercapnic respiratory failure is identified.");
    labs.push(
      { label: "Repeat ABG pH", value: "7.24", flag: "critical" },
      { label: "Repeat PaCO2", value: "72 mm Hg", flag: "critical" },
      { label: "Repeat PaO2", value: "55 mm Hg", flag: "critical" },
    );
  }
  if (step >= 6) {
    nursingNotes.push(
      "0945: After noninvasive ventilation, client is alert and speaks in full sentences. Respiratory rate is 22/min, accessory-muscle use is minimal, and SpO2 is 90%. ABG: pH 7.34, PaCO2 56 mm Hg, PaO2 64 mm Hg.",
    );
    timeline.push("0945: Response to noninvasive ventilation is reassessed.");
    labs.push(
      { label: "Post-NIV pH", value: "7.34", flag: "normal" },
      { label: "Post-NIV PaCO2", value: "56 mm Hg", flag: "high" },
      { label: "Post-NIV PaO2", value: "64 mm Hg", flag: "low" },
    );
  }

  return {
    patientTitle: "J.S., 69-year-old adult",
    patientCaption: "Emergency respiratory care",
    chiefComplaint: "Worsening shortness of breath and productive cough",
    history: ["Severe COPD", "Former 45-pack-year tobacco use", "Home oxygen 2 L/min by nasal cannula"],
    allergies: ["No known drug allergies"],
    medications: ["Tiotropium daily", "Budesonide/formoterol twice daily", "Albuterol inhaler as needed"],
    hpi: [
      "Two days of increased dyspnea, wheezing, and thicker yellow sputum progressed despite frequent rescue-inhaler use.",
      "The client normally walks across the home and uses oxygen at 2 L/min but is now breathless at rest.",
      "The client denies chest trauma, unilateral leg swelling, or missed maintenance inhalers.",
    ],
    nursingNotes,
    timeline,
    unfoldingTimeline: timeline,
    vitals:
      step >= 5
        ? [
            { label: "Temperature", value: "100.2 F (37.9 C)", flag: "high" },
            { label: "Heart rate", value: "112/min", flag: "high" },
            { label: "Blood pressure", value: "148/84 mm Hg", flag: "normal" },
            { label: "Respiratory rate", value: "34/min, shallow", flag: "critical" },
            { label: "SpO2", value: "88% on controlled oxygen", flag: "low" },
          ]
        : [
            { label: "Temperature", value: "100.2 F (37.9 C)", flag: "high" },
            { label: "Heart rate", value: "108/min", flag: "high" },
            { label: "Blood pressure", value: "146/82 mm Hg", flag: "normal" },
            { label: "Respiratory rate", value: "30/min", flag: "critical" },
            { label: "SpO2", value: "86% on home oxygen 2 L/min", flag: "low" },
          ],
    labs,
    diagnostics,
    providerOrders,
    priorityCues: ["Increased work of breathing", "Respiratory acidosis", "Rising PaCO2", "New drowsiness"],
  };
}

function buildAcuteChestChartReview(caseItemNumber: number): PracticeChartReviewMetadata {
  const step = Math.max(1, Math.min(6, caseItemNumber));
  const nursingNotes = [
    "1635: Client is repositioned upright and continuous pulse oximetry is initiated when new chest symptoms are reported during the pain admission.",
    "1640: Client reports new right-sided chest pain with inspiration, cough, and shortness of breath. Breath sounds are diminished at the right base with fine crackles.",
  ];
  const timeline = [
    "1200: Client with HbSS disease is admitted for severe back and leg vaso-occlusive pain.",
  ];
  const labs: NonNullable<PracticeChartReviewMetadata["labs"]> = [];
  const diagnostics: NonNullable<PracticeChartReviewMetadata["diagnostics"]> = [];
  const providerOrders = [
    "Apply supplemental oxygen and maintain continuous pulse oximetry.",
    "Obtain chest radiograph, CBC with reticulocyte count, type and screen, and blood cultures.",
  ];

  if (step >= 2) {
    nursingNotes.push(
      "1700: Temperature is 101.8 F (38.8 C), SpO2 is 89% on room air, and respiratory rate is 28/min. Client remains oriented but appears anxious.",
    );
    timeline.push("1700: Diagnostic and laboratory results become available.");
    labs.push(
      { label: "Hemoglobin", value: "7.2 g/dL; baseline 8.5 g/dL", flag: "low" },
      { label: "WBC", value: "16,800/mm3", flag: "high" },
      { label: "Reticulocytes", value: "12%", flag: "high" },
      { label: "Platelets", value: "248,000/mm3", flag: "normal" },
    );
    diagnostics.push({
      label: "Chest radiograph",
      value: "New right lower-lobe pulmonary infiltrate",
      flag: "critical",
    });
  }
  if (step >= 3) {
    nursingNotes.push(
      "1715: Oxygen at 2 L/min raises SpO2 to 94%. Pleuritic pain and cough persist; no focal neurologic deficit is present.",
    );
    timeline.push("1715: The acute chest syndrome pattern is confirmed and treatment is escalated.");
  }
  if (step >= 4) {
    nursingNotes.push(
      "1730: Prescribed ceftriaxone and azithromycin are initiated after cultures. Incentive spirometry is performed while awake; analgesia is titrated with sedation and respiratory monitoring.",
    );
    timeline.push("1730: Coordinated pulmonary, infection, and pain interventions begin.");
    providerOrders.push(
      "Administer prescribed cephalosporin and macrolide therapy.",
      "Encourage incentive spirometry while awake.",
      "Use careful hydration and multimodal analgesia; monitor sedation and ventilation.",
      "Consult hematology and blood bank regarding transfusion.",
    );
  }
  if (step >= 5) {
    nursingNotes.push(
      "1830: SpO2 falls to 88% despite 4 L/min oxygen. Respiratory rate is 34/min; repeat radiograph shows bilateral lower-lobe opacities. Client is transferred to critical care and the blood bank is notified for urgent exchange transfusion preparation.",
    );
    timeline.push("1830: Severe progressive acute chest syndrome develops.");
    diagnostics.push({
      label: "Repeat chest radiograph",
      value: "Progression to bilateral lower-lobe opacities",
      flag: "critical",
    });
    providerOrders.push("Prepare for prescribed urgent exchange transfusion and critical-care respiratory support.");
  }
  if (step >= 6) {
    nursingNotes.push(
      "2300: After exchange transfusion and ongoing respiratory therapy, SpO2 is 96% on 2 L/min, respiratory rate is 20/min, chest pain is 3/10, and the client is alert without excessive sedation.",
    );
    timeline.push("2300: Post-treatment respiratory and neurologic reassessment is documented.");
    labs.push({ label: "Post-treatment hemoglobin", value: "9.1 g/dL", flag: "normal" });
  }

  return {
    patientTitle: "A.K., 23-year-old adult",
    patientCaption: "Acute hematology care",
    chiefComplaint: "New fever, cough, chest pain, and hypoxemia during pain admission",
    history: ["Sickle cell disease, HbSS", "Prior acute chest syndrome at age 17", "Functional asplenia"],
    allergies: ["Morphine: pruritus without anaphylaxis"],
    medications: ["Hydroxyurea daily", "Folic acid daily", "Hydromorphone patient-controlled analgesia during admission"],
    hpi: [
      "The client was admitted earlier today for severe back and leg pain consistent with a vaso-occlusive episode after reduced fluid intake.",
      "Several hours after admission, new pleuritic chest pain, cough, fever, dyspnea, and an oxygen-saturation decline developed.",
      "There was no chest pain, cough, or fever at the time of initial pain presentation.",
    ],
    nursingNotes,
    timeline,
    unfoldingTimeline: timeline,
    vitals:
      step >= 5
        ? [
            { label: "Temperature", value: "102.1 F (38.9 C)", flag: "high" },
            { label: "Heart rate", value: "122/min", flag: "high" },
            { label: "Blood pressure", value: "104/62 mm Hg", flag: "normal" },
            { label: "Respiratory rate", value: "34/min", flag: "critical" },
            { label: "SpO2", value: "88% on 4 L/min oxygen", flag: "critical" },
          ]
        : [
            { label: "Temperature", value: "101.8 F (38.8 C)", flag: "high" },
            { label: "Heart rate", value: "116/min", flag: "high" },
            { label: "Blood pressure", value: "110/66 mm Hg", flag: "normal" },
            { label: "Respiratory rate", value: "28/min", flag: "critical" },
            { label: "SpO2", value: "89% on room air", flag: "low" },
          ],
    labs,
    diagnostics,
    providerOrders,
    priorityCues: ["New infiltrate", "Fever", "Hypoxemia", "Hemoglobin decrease", "Increasing oxygen need"],
  };
}

const digoxinDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-digoxin-toxicity-ngn",
  title: "Complex Care: Digoxin Toxicity with Hypokalemia",
  references: digoxinReferences,
  sourceIds: ["ncsbn-2026-rn-test-plan", "dailymed-digoxin-2026", "dailymed-digifab-2026"],
  evidenceReviewedAt: EVIDENCE_REVIEWED_AT,
  buildChartReview: buildDigoxinChartReview,
};

const lithiumDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-lithium-toxicity-ngn",
  title: "Complex Care: Lithium Toxicity with Dehydration",
  references: lithiumReferences,
  sourceIds: ["ncsbn-2026-rn-test-plan", "dailymed-lithium-2025", "extrip-lithium-2015"],
  evidenceReviewedAt: EVIDENCE_REVIEWED_AT,
  buildChartReview: buildLithiumChartReview,
};

const copdDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-copd-hypercapnia-ngn",
  title: "Complex Care: COPD Exacerbation with Worsening Hypercapnia",
  references: copdReferences,
  sourceIds: ["ncsbn-2026-rn-test-plan", "gold-copd-report-2026"],
  evidenceReviewedAt: EVIDENCE_REVIEWED_AT,
  buildChartReview: buildCopdChartReview,
};

const acuteChestDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-sickle-acute-chest-ngn",
  title: "Complex Care: Sickle Cell Acute Chest Syndrome",
  references: acuteChestReferences,
  sourceIds: ["ncsbn-2026-rn-test-plan", "nhlbi-scd-expert-panel-2014", "ash-transfusion-support-2020"],
  evidenceReviewedAt: EVIDENCE_REVIEWED_AT,
  buildChartReview: buildAcuteChestChartReview,
};

function wrongMapping(label: string, explanation: string): Record<string, string> {
  return { [label]: explanation };
}

export const DIGOXIN_TOXICITY_CASE: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(digoxinDefinition, {
    id: "codex-nclex-digoxin-case-01",
    kind: "multi-select",
    questionType: "sata",
    category: "Pharmacological and Parenteral Therapies",
    nclexClientNeed: "pharmacological",
    cognitiveLevel: "analyze",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem: "Click to highlight the findings that require immediate follow-up for possible digoxin toxicity.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Click to highlight every finding that requires immediate follow-up.",
    options: [
      { id: "a", text: "New nausea and anorexia" },
      { id: "b", text: "Intermittent yellow-green halos" },
      { id: "c", text: "Apical pulse 52/min and irregular" },
      { id: "d", text: "Four days of diarrhea and poor intake" },
      { id: "e", text: "History of chronic atrial fibrillation" },
      { id: "f", text: "SpO2 96% on room air" },
    ],
    highlightRows: [
      { label: "Symptoms", text: "New nausea and anorexia", optionId: "a" },
      { label: "Vision", text: "Intermittent yellow-green halos", optionId: "b" },
      { label: "Cardiac", text: "Apical pulse 52/min and irregular", optionId: "c" },
      { label: "Fluid balance", text: "Four days of diarrhea and poor intake", optionId: "d" },
      { label: "History", text: "History of chronic atrial fibrillation", optionId: "e" },
      { label: "Oxygenation", text: "SpO2 96% on room air", optionId: "f" },
    ],
    correctAnswer: ["a", "b", "c", "d"],
    rationale:
      "The acute cluster of gastrointestinal symptoms, color-vision disturbance, and an irregular bradycardic pulse is characteristic of possible digoxin toxicity and requires the dose to be withheld while the prescriber is notified and the rhythm, electrolytes, kidney function, and digoxin concentration are evaluated. Diarrhea and poor intake matter because volume loss can reduce renal clearance, while concurrent furosemide can promote potassium loss. Chronic atrial fibrillation is background history, and normal oxygen saturation does not explain the new toxicity pattern.",
    rationaleMechanism:
      "Digoxin inhibits the sodium-potassium ATPase and increases vagal effects at the sinoatrial and atrioventricular nodes. Excess effect can slow conduction and increase ventricular automaticity. Hypokalemia leaves less potassium competing with digoxin at the pump, sensitizing the myocardium even when a concentration alone is not dramatically elevated.",
    whyCorrect:
      "The four selected cues connect a narrow-therapeutic-index medication to new gastrointestinal, visual, and cardiac manifestations plus a physiologic trigger for accumulation and electrolyte depletion.",
    distractorRationales: {
      e: "Chronic atrial fibrillation explains why digoxin may have been prescribed, but it is not a new finding indicating current toxicity.",
      f: "Normal oxygen saturation is reassuring for oxygenation and does not account for the gastrointestinal, visual, and conduction abnormalities.",
    },
    takeaway: "With digoxin, pair new GI or visual symptoms with pulse/rhythm changes and electrolyte or renal risk.",
    visualRationale: {
      type: "signal",
      title: "Toxicity cue cluster",
      nodes: [
        { label: "Trigger", value: "Diarrhea + poor intake + loop diuretic" },
        { label: "Symptoms", value: "Nausea + color-vision change" },
        { label: "Cardiac cue", value: "Irregular bradycardia" },
      ],
      conclusion: "The acute cluster is more important than any isolated serum value.",
    },
  }),
  makeVerifiedCaseQuestion(digoxinDefinition, {
    id: "codex-nclex-digoxin-case-02",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "analyze",
    difficulty: 5,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem: "For each finding, identify the mechanism it most directly supports.",
    nclexInstruction: "Select one mechanism for each finding.",
    matrixColumns: ["Digoxin effect/toxicity", "Predisposes to toxicity", "Does not support toxicity"],
    matrixRows: [
      { label: "Frequent PVCs with intermittent bigeminy", answer: "Digoxin effect/toxicity" },
      { label: "Potassium 2.9 mEq/L", answer: "Predisposes to toxicity" },
      { label: "Creatinine 1.6 mg/dL from baseline 0.9 mg/dL", answer: "Predisposes to toxicity" },
      { label: "Yellow-green halos", answer: "Digoxin effect/toxicity" },
      { label: "SpO2 96% on room air", answer: "Does not support toxicity" },
    ],
    correctAnswer: {
      "Frequent PVCs with intermittent bigeminy": "Digoxin effect/toxicity",
      "Potassium 2.9 mEq/L": "Predisposes to toxicity",
      "Creatinine 1.6 mg/dL from baseline 0.9 mg/dL": "Predisposes to toxicity",
      "Yellow-green halos": "Digoxin effect/toxicity",
      "SpO2 96% on room air": "Does not support toxicity",
    },
    rationale:
      "Ventricular ectopy and color-vision disturbance are manifestations compatible with digoxin toxicity. Hypokalemia increases myocardial sensitivity to digoxin, and acute kidney dysfunction can reduce clearance and increase exposure. The serum concentration supports concern because it was obtained 10 hours after the last dose, but management still depends on the complete clinical picture. Normal oxygen saturation neither confirms nor excludes toxicity; it simply does not explain this presentation.",
    rationaleMechanism:
      "Reduced renal elimination increases digoxin exposure, while potassium depletion increases binding at the sodium-potassium ATPase. Together these factors amplify conduction slowing and abnormal automaticity, producing a mixture of bradyarrhythmias and ventricular ectopy.",
    whyCorrect:
      "The mappings separate actual toxicity manifestations from factors that increase susceptibility and from data unrelated to the suspected mechanism.",
    distractorRationales: {
      ...wrongMapping("Frequent PVCs with intermittent bigeminy", "Ventricular ectopy is a toxicity manifestation, not merely a risk factor."),
      "Potassium 2.9 mEq/L": "Hypokalemia sensitizes the myocardium; it is a major predisposing factor rather than proof of a particular rhythm.",
      "Creatinine 1.6 mg/dL from baseline 0.9 mg/dL": "The renal change reduces clearance and predisposes to accumulation; it is not itself a digoxin adverse effect in this scenario.",
      "Yellow-green halos": "Color-vision disturbance is a recognized toxicity manifestation rather than a factor that increases drug exposure.",
      "SpO2 96% on room air": "This normal oxygenation value does not meaningfully support either toxicity or increased susceptibility.",
    },
    takeaway: "Analyze digoxin cases in two layers: manifestations now and factors increasing exposure or myocardial sensitivity.",
    visualRationale: {
      type: "pathway",
      title: "Why toxicity emerged",
      nodes: [
        { label: "Clearance", value: "Creatinine rises" },
        { label: "Sensitivity", value: "K 2.9 mEq/L" },
        { label: "Effect", value: "Bradycardia + PVCs + visual symptoms" },
      ],
      conclusion: "Renal accumulation and hypokalemic sensitization converge on cardiac toxicity.",
    },
  }),
  makeVerifiedCaseQuestion(digoxinDefinition, {
    id: "codex-nclex-digoxin-case-03",
    kind: "bow-tie",
    questionType: "bow_tie",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "synthesize",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem: "Complete the bow-tie by identifying the priority condition, two actions to anticipate, and two parameters to monitor.",
    nclexInstruction: "Select two actions and two monitoring parameters.",
    options: [],
    bowTie: {
      center: { id: "digoxin-toxicity", text: "Chronic digoxin toxicity intensified by hypokalemia and reduced renal clearance", isCorrect: true },
      leftActions: [
        { id: "hold-digoxin", text: "Withhold digoxin and notify the prescriber with the complete cue cluster", isCorrect: true },
        { id: "replace-electrolytes", text: "Administer prescribed potassium and magnesium replacement with ECG monitoring", isCorrect: true },
        { id: "give-next-dose", text: "Give the scheduled digoxin because the level is below 3 ng/mL", isCorrect: false },
        { id: "encourage-ambulation", text: "Ambulate the client to reduce venous stasis", isCorrect: false },
      ],
      rightMonitoring: [
        { id: "ecg-rate", text: "Continuous rhythm, heart rate, and blood pressure", isCorrect: true },
        { id: "k-mg-renal", text: "Potassium, magnesium, kidney function, and clinical symptoms", isCorrect: true },
        { id: "a1c", text: "Hemoglobin A1c", isCorrect: false },
        { id: "weekly-weight", text: "Weekly body weight after discharge", isCorrect: false },
      ],
    },
    correctAnswer: {
      center: "digoxin-toxicity",
      leftActions: ["hold-digoxin", "replace-electrolytes"],
      rightMonitoring: ["ecg-rate", "k-mg-renal"],
    },
    rationale:
      "The highest-priority hypothesis is clinically significant chronic digoxin toxicity promoted by acute kidney dysfunction and severe hypokalemia. The nurse should withhold further digoxin, promptly communicate the rhythm and full toxicity pattern, maintain continuous monitoring, and administer prescribed electrolyte replacement carefully. A numeric concentration is interpreted with dose timing and symptoms; it must not be used as the only reason to continue treatment. Immediate monitoring focuses on rhythm, perfusion, electrolytes, renal function, and symptom progression.",
    rationaleMechanism:
      "The same pharmacologic effect can depress AV conduction while increasing ventricular automaticity, so bradycardia and ventricular ectopy can coexist. Correcting modifiable electrolyte deficits and stopping further exposure reduce ongoing myocardial instability.",
    whyCorrect:
      "This hypothesis explains every major cue and directs actions that remove exposure, address hypokalemic sensitization, and detect deterioration.",
    distractorRationales: {
      "give-next-dose": "Toxicity can occur at lower concentrations when hypokalemia or renal impairment is present; symptoms and dysrhythmia require the dose to be withheld.",
      "encourage-ambulation": "The client has symptomatic bradycardia and ventricular ectopy; ambulation creates fall and hemodynamic risk and does not treat toxicity.",
      a1c: "Long-term glycemic status does not guide the immediate response to digoxin toxicity.",
      "weekly-weight": "Weight can matter in heart-failure care, but weekly monitoring is not the priority during active dysrhythmia and electrolyte disturbance.",
    },
    takeaway: "Prioritize the hypothesis that explains symptoms, rhythm, potassium, and renal clearance together.",
    visualRationale: {
      type: "flow",
      title: "Priority response",
      nodes: [
        { label: "Stop exposure", value: "Hold digoxin" },
        { label: "Reduce sensitivity", value: "Correct K/Mg as prescribed" },
        { label: "Watch instability", value: "Continuous ECG + perfusion" },
      ],
      conclusion: "Treat the clinical toxicity pattern, not a concentration in isolation.",
    },
  }),
  makeVerifiedCaseQuestion(digoxinDefinition, {
    id: "codex-nclex-digoxin-case-04",
    kind: "multi-select",
    questionType: "sata",
    category: "Pharmacological and Parenteral Therapies",
    nclexClientNeed: "pharmacological",
    cognitiveLevel: "apply",
    difficulty: 4,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem: "Which interventions should the nurse include in the immediate plan for suspected digoxin toxicity? Select all that apply.",
    nclexInstruction: "Select all interventions that apply.",
    options: [
      { id: "a", text: "Continue continuous ECG and frequent blood-pressure monitoring." },
      { id: "b", text: "Withhold digoxin and communicate the toxicity findings promptly." },
      { id: "c", text: "Administer prescribed potassium and magnesium replacement with serial levels." },
      { id: "d", text: "Maintain IV access and institute fall precautions." },
      { id: "e", text: "Give furosemide now to increase urinary digoxin elimination." },
      { id: "f", text: "Schedule electrical cardioversion as the routine first treatment for the ectopy." },
    ],
    correctAnswer: ["a", "b", "c", "d"],
    rationale:
      "The plan must prevent additional exposure, continuously detect unstable rhythms or perfusion, correct the electrolyte conditions increasing myocardial sensitivity, and protect the symptomatic client from falls while definitive treatment is considered. Furosemide can worsen potassium and volume depletion and does not provide a safe detoxification strategy. Electrical cardioversion is not a routine first response to digoxin-related ectopy and can precipitate dangerous arrhythmias; any emergency rhythm treatment must be individualized by the resuscitation team.",
    rationaleMechanism:
      "Removing further digoxin and correcting potassium and magnesium reduce ongoing pump inhibition and electrical instability. Continuous monitoring detects progression to high-grade block or ventricular dysrhythmia before perfusion collapses.",
    whyCorrect:
      "The selected interventions address exposure, susceptibility, surveillance, access, and injury prevention without exceeding nursing scope.",
    distractorRationales: {
      e: "A loop diuretic can worsen hypokalemia and dehydration, increasing toxicity risk rather than reliably clearing digoxin.",
      f: "Cardioversion can provoke severe ventricular dysrhythmia in digoxin toxicity and is not the routine first-line response to this monitored ectopy.",
    },
    takeaway: "Stabilize, hold the drug, correct contributors, and monitor continuously while escalating.",
    visualRationale: {
      type: "overview",
      title: "Immediate plan domains",
      nodes: [
        { label: "Safety", value: "Telemetry + falls" },
        { label: "Medication", value: "Hold digoxin" },
        { label: "Contributors", value: "Replace K/Mg" },
        { label: "Escalation", value: "IV access + prompt notification" },
      ],
      conclusion: "Every selected action reduces immediate cardiac or injury risk.",
    },
  }),
  makeVerifiedCaseQuestion(digoxinDefinition, {
    id: "codex-nclex-digoxin-case-05",
    kind: "mcq",
    questionType: "mcq",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "evaluate",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem: "Which action should the nurse take first when the client develops second-degree AV block, a ventricular-tachycardia run, hypotension, and worsening dizziness?",
    nclexInstruction: "Select the priority immediate action.",
    options: [
      { id: "a", text: "Activate the urgent response, maintain resuscitation readiness, and prepare to administer prescribed digoxin immune Fab." },
      { id: "b", text: "Recheck the serum digoxin concentration before notifying the prescriber." },
      { id: "c", text: "Assist the client to walk to determine whether dizziness improves." },
      { id: "d", text: "Give the withheld digoxin dose to improve cardiac contractility." },
    ],
    correctAnswer: "a",
    rationale:
      "Progressive heart block, ventricular tachycardia, hypotension, and symptoms represent potentially life-threatening digoxin toxicity. The nurse should immediately activate the appropriate response, support airway and circulation, maintain continuous ECG monitoring and IV access, and prepare the prescribed antidote, digoxin immune Fab. Repeating a level must not delay treatment because the clinical instability already establishes urgency. Ambulation is unsafe, and additional digoxin can worsen conduction and ventricular irritability.",
    rationaleMechanism:
      "Digoxin immune Fab binds free digoxin, creating complexes that are then eliminated and reducing digoxin interaction with the sodium-potassium ATPase. Because potassium may fall rapidly after Fab reverses toxicity, serial potassium monitoring remains essential.",
    whyCorrect:
      "The selected response addresses an immediately unstable rhythm and perfusion problem while mobilizing the specific therapy indicated for potentially life-threatening toxicity.",
    distractorRationales: {
      b: "A repeat concentration can support follow-up but must not postpone escalation for clinically life-threatening dysrhythmia and hypotension.",
      c: "Ambulation could cause syncope or cardiac arrest and provides no therapeutic benefit.",
      d: "Additional digoxin would intensify the suspected toxic effect and is contraindicated in this moment.",
    },
    takeaway: "When digoxin toxicity becomes hemodynamically unstable, escalate and prepare the antidote without waiting for another level.",
    visualRationale: {
      type: "pathway",
      title: "Instability triggers antidote preparation",
      nodes: [
        { label: "Rhythm", value: "Heart block + VT" },
        { label: "Perfusion", value: "BP 84/50 + dizziness" },
        { label: "Action", value: "Urgent response + prescribed Fab" },
      ],
      conclusion: "Clinical instability, not a repeat level, determines the first action.",
    },
  }),
  makeVerifiedCaseQuestion(digoxinDefinition, {
    id: "codex-nclex-digoxin-case-06",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "evaluate",
    difficulty: 4,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem: "For each reassessment finding, identify whether it supports improvement or requires continued follow-up.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports improvement", "Requires continued follow-up"],
    matrixRows: [
      { label: "Sinus rhythm 68/min without ventricular ectopy", answer: "Supports improvement" },
      { label: "Blood pressure 108/66 mm Hg with improved dizziness", answer: "Supports improvement" },
      { label: "Potassium 3.7 mEq/L after replacement and Fab", answer: "Supports improvement" },
      { label: "New potassium decline on subsequent measurement", answer: "Requires continued follow-up" },
      { label: "Rebound nausea with recurrent bradycardia", answer: "Requires continued follow-up" },
    ],
    correctAnswer: {
      "Sinus rhythm 68/min without ventricular ectopy": "Supports improvement",
      "Blood pressure 108/66 mm Hg with improved dizziness": "Supports improvement",
      "Potassium 3.7 mEq/L after replacement and Fab": "Supports improvement",
      "New potassium decline on subsequent measurement": "Requires continued follow-up",
      "Rebound nausea with recurrent bradycardia": "Requires continued follow-up",
    },
    rationale:
      "Resolution of ventricular ectopy, restoration of a stable sinus rate and blood pressure, symptom improvement, and normalization of potassium support an effective response. Continued surveillance is still necessary because digoxin immune Fab can produce a rapid potassium decline and recurrent symptoms or bradycardia can indicate persistent or recurrent toxicity. Standard total digoxin assays can be misleading after Fab because they may measure bound and unbound digoxin, so bedside status, ECG, renal function, and electrolytes guide evaluation.",
    rationaleMechanism:
      "Reversal reduces free digoxin effect and shifts potassium back into cells, which can lower serum potassium. Clinical and electrical recovery should therefore occur alongside careful electrolyte surveillance.",
    whyCorrect:
      "The classifications distinguish true recovery in rhythm and perfusion from warning patterns that demand renewed assessment and escalation.",
    distractorRationales: {
      "Sinus rhythm 68/min without ventricular ectopy": "A stable rhythm without ectopy is an improvement, although monitoring continues.",
      "Blood pressure 108/66 mm Hg with improved dizziness": "Improved perfusion and symptoms support recovery rather than deterioration.",
      "Potassium 3.7 mEq/L after replacement and Fab": "This value is within range and supports response, but serial monitoring remains necessary.",
      "New potassium decline on subsequent measurement": "Fab treatment can lower potassium rapidly; a downward trend requires prompt reassessment and prescribed correction.",
      "Rebound nausea with recurrent bradycardia": "Return of the original toxicity pattern is not expected recovery and must be escalated.",
    },
    takeaway: "After Fab, evaluate rhythm and perfusion while watching closely for a rapid potassium decline and recurrent toxicity.",
    visualRationale: {
      type: "trend",
      title: "Response after digoxin immune Fab",
      metrics: [
        { label: "Heart rate", value: "38 -> 68/min", direction: "up", directionLabel: "stabilizing" },
        { label: "Blood pressure", value: "84/50 -> 108/66", direction: "up", directionLabel: "improving" },
        { label: "Potassium", value: "2.9 -> 3.7 mEq/L", direction: "up", directionLabel: "corrected", range: "3.5-5.0" },
      ],
      conclusion: "Improvement is multidimensional; potassium still needs serial checks.",
    },
  }),
];

export const LITHIUM_TOXICITY_CASE: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(lithiumDefinition, {
    id: "codex-nclex-lithium-case-01",
    kind: "multi-select",
    questionType: "sata",
    category: "Pharmacological and Parenteral Therapies",
    nclexClientNeed: "pharmacological",
    cognitiveLevel: "analyze",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem: "Click to highlight the findings that require immediate follow-up for possible lithium toxicity.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Click to highlight every finding that requires immediate follow-up.",
    options: [
      { id: "a", text: "Coarse hand tremor" },
      { id: "b", text: "Slurred speech and unsteady gait" },
      { id: "c", text: "Slowed responses" },
      { id: "d", text: "Three days of vomiting and diarrhea" },
      { id: "e", text: "History of bipolar I disorder" },
      { id: "f", text: "SpO2 97% on room air" },
    ],
    highlightRows: [
      { label: "Neurologic", text: "Coarse hand tremor", optionId: "a" },
      { label: "Neurologic", text: "Slurred speech and unsteady gait", optionId: "b" },
      { label: "Mental status", text: "Slowed responses", optionId: "c" },
      { label: "Fluid loss", text: "Three days of vomiting and diarrhea", optionId: "d" },
      { label: "History", text: "History of bipolar I disorder", optionId: "e" },
      { label: "Oxygenation", text: "SpO2 97% on room air", optionId: "f" },
    ],
    correctAnswer: ["a", "b", "c", "d"],
    rationale:
      "A coarse tremor, dysarthria, ataxia, and slowed cognition are concerning neurologic manifestations in a client taking lithium. Prolonged vomiting and diarrhea create volume and sodium depletion, which can reduce renal lithium clearance and increase tubular lithium reabsorption. These cues require lithium to be withheld while the nurse institutes safety precautions and obtains urgent clinical evaluation and laboratory testing. Bipolar disorder explains the prescription but is not an acute cue, and normal oxygenation does not explain the neurologic pattern.",
    rationaleMechanism:
      "Lithium is cleared almost entirely by the kidneys. When circulating volume or sodium is depleted, the kidney conserves sodium and also reabsorbs more lithium, increasing serum and tissue exposure. Neurologic toxicity can then progress from coarse tremor and ataxia to confusion, seizures, or coma.",
    whyCorrect:
      "The selected cues link a high-risk medication to a dehydration trigger and new neurologic dysfunction, forming a more urgent pattern than any finding alone.",
    distractorRationales: {
      e: "Bipolar I disorder is the stable indication for lithium, not evidence that toxicity is occurring now.",
      f: "Normal oxygen saturation is reassuring but does not rule out or explain lithium-related neurologic dysfunction.",
    },
    takeaway: "In a lithium-treated client, new coarse tremor, ataxia, dysarthria, or confusion during fluid loss is toxicity until evaluated.",
    visualRationale: {
      type: "signal",
      title: "Lithium toxicity cue cluster",
      nodes: [
        { label: "Trigger", value: "Vomiting + diarrhea + heat" },
        { label: "Exposure", value: "Lithium continued" },
        { label: "Neurologic cues", value: "Coarse tremor + ataxia + slowed cognition" },
      ],
      conclusion: "Fluid loss plus new neurologic findings requires immediate follow-up.",
    },
  }),
  makeVerifiedCaseQuestion(lithiumDefinition, {
    id: "codex-nclex-lithium-case-02",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "analyze",
    difficulty: 5,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem: "For each finding, identify how it contributes to the clinical pattern.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Manifestation of toxicity", "Promotes lithium accumulation", "Unrelated/reassuring"],
    matrixRows: [
      { label: "Coarse tremor with ataxia", answer: "Manifestation of toxicity" },
      { label: "Creatinine 1.7 mg/dL from baseline 0.8 mg/dL", answer: "Promotes lithium accumulation" },
      { label: "Sodium 130 mEq/L after GI losses", answer: "Promotes lithium accumulation" },
      { label: "Ibuprofen use during dehydration", answer: "Promotes lithium accumulation" },
      { label: "SpO2 97% on room air", answer: "Unrelated/reassuring" },
    ],
    correctAnswer: {
      "Coarse tremor with ataxia": "Manifestation of toxicity",
      "Creatinine 1.7 mg/dL from baseline 0.8 mg/dL": "Promotes lithium accumulation",
      "Sodium 130 mEq/L after GI losses": "Promotes lithium accumulation",
      "Ibuprofen use during dehydration": "Promotes lithium accumulation",
      "SpO2 97% on room air": "Unrelated/reassuring",
    },
    rationale:
      "Coarse tremor and ataxia are neurologic toxicity manifestations. Acute kidney injury reduces lithium clearance, while sodium and volume depletion increase renal conservation mechanisms that also retain lithium. NSAIDs can reduce renal lithium clearance and further increase concentrations, especially during dehydration. The lithium concentration of 2.3 mEq/L supports the pattern but must be interpreted with chronic exposure, timing, renal function, and symptoms. Normal oxygenation is not the cause of the neurologic findings.",
    rationaleMechanism:
      "Lithium follows sodium handling in the kidney. Reduced glomerular filtration and increased proximal reabsorption during volume depletion decrease elimination; an NSAID can compound the reduction in renal clearance. Chronic users may have substantial tissue burden and neurologic symptoms at concentrations that do not fully predict severity.",
    whyCorrect:
      "The mappings distinguish the toxic end-organ effects from the renal, sodium, and medication factors producing accumulation.",
    distractorRationales: {
      "Coarse tremor with ataxia": "These are neurologic manifestations of toxicity, not factors that merely increase the concentration.",
      "Creatinine 1.7 mg/dL from baseline 0.8 mg/dL": "The acute renal decline impairs elimination and promotes accumulation rather than representing a reassuring finding.",
      "Sodium 130 mEq/L after GI losses": "Sodium and volume depletion increase lithium retention; this is a mechanistic risk factor.",
      "Ibuprofen use during dehydration": "NSAID exposure can reduce renal lithium clearance, so it strengthens rather than weakens the toxicity hypothesis.",
      "SpO2 97% on room air": "This normal value does not account for lithium retention or the neurologic syndrome.",
    },
    takeaway: "Connect lithium toxicity to kidney function, sodium/volume status, interacting medications, and neurologic findings.",
    visualRationale: {
      type: "pathway",
      title: "Accumulation pathway",
      nodes: [
        { label: "GI loss", value: "Volume + sodium depletion" },
        { label: "Renal factors", value: "AKI + ibuprofen" },
        { label: "Result", value: "Lithium 2.3 + neurologic toxicity" },
      ],
      conclusion: "Several renal-retention factors converge on rising tissue exposure.",
    },
  }),
  makeVerifiedCaseQuestion(lithiumDefinition, {
    id: "codex-nclex-lithium-case-03",
    kind: "bow-tie",
    questionType: "bow_tie",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "synthesize",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem: "Using the latest lithium toxicity record, complete the bow-tie by identifying the priority condition, two actions, and two parameters to monitor.",
    nclexInstruction: "Select two actions and two monitoring parameters.",
    options: [],
    bowTie: {
      center: { id: "chronic-lithium-toxicity", text: "Chronic lithium toxicity precipitated by dehydration and acute kidney injury", isCorrect: true },
      leftActions: [
        { id: "hold-lithium", text: "Withhold lithium and ibuprofen and notify the prescriber/poison service", isCorrect: true },
        { id: "isotonic-fluid", text: "Administer prescribed isotonic IV fluid with careful reassessment", isCorrect: true },
        { id: "restrict-sodium", text: "Restrict sodium and free water to reduce neurologic swelling", isCorrect: false },
        { id: "give-lithium", text: "Administer the next lithium dose to prevent mood destabilization", isCorrect: false },
      ],
      rightMonitoring: [
        { id: "neuro-safety", text: "Neurologic status, gait safety, and seizure activity", isCorrect: true },
        { id: "lithium-renal-io", text: "Serial lithium, renal function, sodium, and urine output", isCorrect: true },
        { id: "lipids", text: "Fasting lipid profile", isCorrect: false },
        { id: "mood-only", text: "Mood symptoms without physiologic assessment", isCorrect: false },
      ],
    },
    correctAnswer: {
      center: "chronic-lithium-toxicity",
      leftActions: ["hold-lithium", "isotonic-fluid"],
      rightMonitoring: ["neuro-safety", "lithium-renal-io"],
    },
    rationale:
      "The priority hypothesis is chronic lithium toxicity triggered by gastrointestinal fluid loss, sodium depletion, NSAID exposure, and acute kidney injury. The immediate plan removes further lithium and the interacting NSAID, restores intravascular volume with prescribed isotonic fluid, protects against falls and seizures, and follows neurologic status, renal clearance, urine output, sodium, and serial lithium concentrations. Sodium restriction or additional lithium would worsen the underlying retention problem.",
    rationaleMechanism:
      "Volume restoration can improve renal perfusion and lithium elimination when the kidneys can respond. Serial clinical and laboratory assessment is essential because neurologic severity and lithium concentration may not improve in parallel, particularly after chronic exposure.",
    whyCorrect:
      "This hypothesis accounts for the trigger, impaired elimination, measured concentration, and progressive neurologic dysfunction while directing safe nursing actions.",
    distractorRationales: {
      "restrict-sodium": "Sodium depletion promotes renal lithium reabsorption; restriction does not address this dehydration-driven toxicity pattern.",
      "give-lithium": "Further lithium exposure can worsen tissue burden and neurologic toxicity and must be withheld pending evaluation.",
      lipids: "A lipid profile does not guide acute toxicity stabilization.",
      "mood-only": "Psychiatric assessment remains important later, but isolated mood monitoring misses current renal and neurologic danger.",
    },
    takeaway: "The priority lithium hypothesis must explain dehydration, kidney injury, interacting drugs, and neurologic decline together.",
    visualRationale: {
      type: "flow",
      title: "Priority toxicity response",
      nodes: [
        { label: "Remove", value: "Hold lithium + NSAID" },
        { label: "Restore", value: "Prescribed isotonic fluid" },
        { label: "Reassess", value: "Neuro + lithium + renal + I/O" },
      ],
      conclusion: "Stop exposure and restore clearance while watching for severe neurologic progression.",
    },
  }),
  makeVerifiedCaseQuestion(lithiumDefinition, {
    id: "codex-nclex-lithium-case-04",
    kind: "multi-select",
    questionType: "sata",
    category: "Management of Care",
    nclexClientNeed: "management_of_care",
    cognitiveLevel: "apply",
    difficulty: 4,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem: "Which interventions should the nurse include in the immediate plan of care? Select all that apply.",
    nclexInstruction: "Select all interventions that apply.",
    options: [
      { id: "a", text: "Withhold lithium and ibuprofen." },
      { id: "b", text: "Institute fall and seizure precautions with frequent neurologic checks." },
      { id: "c", text: "Administer prescribed isotonic IV fluid and measure hourly urine output." },
      { id: "d", text: "Trend lithium, sodium, and renal-function results." },
      { id: "e", text: "Give an antidiarrheal and discharge when vomiting stops." },
      { id: "f", text: "Encourage unrestricted oral free water despite worsening confusion." },
    ],
    correctAnswer: ["a", "b", "c", "d"],
    rationale:
      "Safe immediate care stops additional lithium and the interacting NSAID, protects the client from neurologic injury, restores volume with prescribed isotonic fluid, and follows urine output and serial laboratory trends. Symptom suppression alone does not resolve accumulated lithium or acute kidney injury. A confused, ataxic client cannot safely manage unrestricted oral intake because aspiration and fluid-management errors are possible; route and amount must match the clinical plan.",
    rationaleMechanism:
      "Supporting renal perfusion can enhance lithium elimination, while serial concentrations reveal whether clearance is occurring. Neurologic checks remain central because worsening confusion, seizures, or reduced consciousness can indicate severe poisoning even if one concentration appears stable.",
    whyCorrect:
      "The four selected interventions simultaneously remove exposure, prevent injury, support elimination, and measure response.",
    distractorRationales: {
      e: "Stopping diarrhea does not correct lithium accumulation, acute kidney injury, ataxia, or confusion, and discharge would be unsafe.",
      f: "Worsening confusion and ataxia increase aspiration risk; hydration should follow the prescribed route and monitored plan.",
    },
    takeaway: "Lithium toxicity care is exposure control, monitored volume restoration, neurologic safety, and serial clearance assessment.",
    visualRationale: {
      type: "overview",
      title: "Four-part immediate plan",
      nodes: [
        { label: "Hold", value: "Lithium + ibuprofen" },
        { label: "Protect", value: "Falls + seizures" },
        { label: "Hydrate", value: "Prescribed isotonic IV fluid" },
        { label: "Trend", value: "Lithium + Na + renal + urine" },
      ],
      conclusion: "Each domain addresses a different route to prevent permanent neurologic harm.",
    },
  }),
  makeVerifiedCaseQuestion(lithiumDefinition, {
    id: "codex-nclex-lithium-case-05",
    kind: "mcq",
    questionType: "mcq",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "evaluate",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem: "The client is now difficult to arouse, urine output is 15 mL/hr, and repeat lithium is 2.5 mEq/L. Which action should the nurse take first?",
    nclexInstruction: "Select the priority immediate action.",
    options: [
      { id: "a", text: "Escalate immediately and prepare the client for urgent hemodialysis evaluation and higher-level care." },
      { id: "b", text: "Continue the current plan for 6 hours before reporting the change." },
      { id: "c", text: "Administer the next lithium dose with food to prevent nausea." },
      { id: "d", text: "Ask the client to ambulate so neurologic function can be retested." },
    ],
    correctAnswer: "a",
    rationale:
      "A decreased level of consciousness with oliguria and a rising lithium concentration represents severe, worsening poisoning and impaired elimination. The nurse should immediately escalate, support airway and circulation, continue seizure and cardiac precautions, and prepare for nephrology/toxicology-directed extracorporeal treatment. EXTRIP recommends extracorporeal treatment for severe lithium poisoning and for decreased consciousness irrespective of concentration. Waiting, giving more lithium, or ambulating an obtunded client creates avoidable harm.",
    rationaleMechanism:
      "Lithium is a small, water-soluble ion that is dialyzable. When kidney function is impaired and neurologic toxicity progresses, extracorporeal clearance can remove lithium more effectively than waiting for compromised renal elimination.",
    whyCorrect:
      "The selected action recognizes severe end-organ toxicity and mobilizes definitive clearance support before coma, seizure, aspiration, or dysrhythmia develops.",
    distractorRationales: {
      b: "Progressive depressed consciousness and oliguria require immediate escalation; a fixed waiting period can permit irreversible neurologic injury.",
      c: "Additional lithium increases body burden and is unsafe in active toxicity.",
      d: "An obtunded, ataxic client is at extreme fall and aspiration risk; ambulation does not guide the urgent treatment decision.",
    },
    takeaway: "Severe neurologic lithium toxicity or failing renal clearance demands urgent dialysis evaluation, not watchful waiting.",
    visualRationale: {
      type: "pathway",
      title: "Why escalation cannot wait",
      nodes: [
        { label: "Brain", value: "Difficult to arouse" },
        { label: "Kidney", value: "Urine 15 mL/hr" },
        { label: "Trend", value: "Lithium 2.3 -> 2.5" },
        { label: "Action", value: "Urgent dialysis evaluation" },
      ],
      conclusion: "Clinical severity and failing elimination outweigh passive observation.",
    },
  }),
  makeVerifiedCaseQuestion(lithiumDefinition, {
    id: "codex-nclex-lithium-case-06",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "evaluate",
    difficulty: 5,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem: "For each post-dialysis lithium finding, identify whether it supports improvement or requires continued follow-up.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports improvement", "Requires continued follow-up"],
    matrixRows: [
      { label: "Awake and following commands", answer: "Supports improvement" },
      { label: "Lithium 0.9 mEq/L after hemodialysis", answer: "Supports improvement" },
      { label: "Urine output 45 mL/hr", answer: "Supports improvement" },
      { label: "Recurrent coarse tremor and confusion", answer: "Requires continued follow-up" },
      { label: "Lithium concentration rises on a scheduled repeat level", answer: "Requires continued follow-up" },
    ],
    correctAnswer: {
      "Awake and following commands": "Supports improvement",
      "Lithium 0.9 mEq/L after hemodialysis": "Supports improvement",
      "Urine output 45 mL/hr": "Supports improvement",
      "Recurrent coarse tremor and confusion": "Requires continued follow-up",
      "Lithium concentration rises on a scheduled repeat level": "Requires continued follow-up",
    },
    rationale:
      "Improved consciousness, a lower lithium concentration, and restoration of urine output support treatment response. Monitoring must continue because lithium can redistribute from tissues into blood after dialysis, producing a rebound concentration, and recurrent neurologic findings may signal persistent tissue toxicity. A client is not ready for routine discharge solely because one post-dialysis number is below 1.0 mEq/L; serial concentrations, renal function, electrolytes, and neurologic status determine sustained recovery.",
    rationaleMechanism:
      "Hemodialysis clears plasma lithium rapidly, but intracellular and tissue lithium can redistribute afterward. Rebound is therefore evaluated with scheduled post-treatment concentrations and repeated clinical assessment.",
    whyCorrect:
      "The classifications identify both objective improvement and the two classic warning patterns that require continued surveillance after extracorporeal treatment.",
    distractorRationales: {
      "Awake and following commands": "Improved level of consciousness is a meaningful neurologic recovery marker.",
      "Lithium 0.9 mEq/L after hemodialysis": "This supports effective plasma clearance, although it does not eliminate the need for repeat measurements.",
      "Urine output 45 mL/hr": "Improved urine output supports recovering renal perfusion and elimination.",
      "Recurrent coarse tremor and confusion": "Recurring neurologic toxicity is not expected recovery and must be escalated.",
      "Lithium concentration rises on a scheduled repeat level": "A rebound concentration can follow tissue redistribution and requires toxicology/nephrology review.",
    },
    takeaway: "After dialysis, confirm sustained neurologic recovery and watch for lithium rebound with serial levels.",
    visualRationale: {
      type: "timeline",
      title: "Post-dialysis evaluation",
      items: [
        { label: "Immediate", value: "Lithium 0.9; more alert", highlight: true },
        { label: "Next", value: "Repeat lithium + renal panel", note: "Detect redistribution" },
        { label: "Ongoing", value: "Neuro checks + urine output", note: "Confirm sustained recovery" },
      ],
      conclusion: "One improved level is a checkpoint, not the end of surveillance.",
    },
  }),
];

export const COPD_HYPERCAPNIA_CASE: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(copdDefinition, {
    id: "codex-nclex-copd-case-01",
    kind: "multi-select",
    questionType: "sata",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "analyze",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem: "Click to highlight the findings that require immediate follow-up for acute respiratory compromise.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Click to highlight every finding that requires immediate follow-up.",
    options: [
      { id: "a", text: "Speaks in 3- to 4-word phrases" },
      { id: "b", text: "Tripod position with accessory-muscle use" },
      { id: "c", text: "SpO2 86% on prescribed home oxygen" },
      { id: "d", text: "Respiratory rate 30/min" },
      { id: "e", text: "Former 45-pack-year tobacco use" },
      { id: "f", text: "Uses tiotropium daily" },
    ],
    highlightRows: [
      { label: "Speech", text: "Speaks in 3- to 4-word phrases", optionId: "a" },
      { label: "Work of breathing", text: "Tripod position with accessory-muscle use", optionId: "b" },
      { label: "Oxygenation", text: "SpO2 86% on prescribed home oxygen", optionId: "c" },
      { label: "Ventilation", text: "Respiratory rate 30/min", optionId: "d" },
      { label: "History", text: "Former 45-pack-year tobacco use", optionId: "e" },
      { label: "Medication", text: "Uses tiotropium daily", optionId: "f" },
    ],
    correctAnswer: ["a", "b", "c", "d"],
    rationale:
      "Short-phrase speech, tripod positioning, accessory-muscle use, tachypnea, and oxygen saturation below the client's usual target despite home oxygen indicate substantial acute respiratory distress. These findings require immediate controlled oxygen, bronchodilator treatment, focused assessment, and evaluation for respiratory failure and alternate diagnoses. Tobacco history and maintenance tiotropium provide COPD context but are not acute deterioration cues.",
    rationaleMechanism:
      "An exacerbation increases airway inflammation, bronchospasm, mucus, and expiratory flow limitation. Air trapping increases the work of breathing; as respiratory muscles fatigue, alveolar ventilation can fall and carbon dioxide can accumulate.",
    whyCorrect:
      "The four selected findings directly measure current oxygenation, ventilation effort, and the client's ability to speak rather than chronic disease background.",
    distractorRationales: {
      e: "Past tobacco exposure explains disease risk but does not by itself establish current respiratory failure.",
      f: "A maintenance inhaler is relevant medication history but is not an acute physiologic abnormality.",
    },
    takeaway: "In COPD, prioritize current work of breathing, speech, mental status, and oxygenation over chronic history.",
    visualRationale: {
      type: "signal",
      title: "Acute respiratory distress cluster",
      nodes: [
        { label: "Speech", value: "3-4 words" },
        { label: "Effort", value: "Tripod + accessory muscles" },
        { label: "Rate", value: "30/min" },
        { label: "Oxygen", value: "86% on home O2" },
      ],
      conclusion: "Multiple current respiratory cues establish urgency.",
    },
  }),
  makeVerifiedCaseQuestion(copdDefinition, {
    id: "codex-nclex-copd-case-02",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "analyze",
    difficulty: 5,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem: "For each finding, identify the physiologic problem it most directly supports.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Oxygenation impairment/support need", "Acute-on-chronic ventilatory failure", "Does not support an acute pulmonary complication"],
    matrixRows: [
      { label: "PaO2 58 mm Hg", answer: "Oxygenation impairment/support need" },
      { label: "pH 7.30 with PaCO2 62 mm Hg and HCO3- 30 mEq/L", answer: "Acute-on-chronic ventilatory failure" },
      { label: "Increasing fatigue with accessory-muscle use", answer: "Acute-on-chronic ventilatory failure" },
      { label: "Chest radiograph without focal infiltrate or pneumothorax", answer: "Does not support an acute pulmonary complication" },
      { label: "SpO2 90% on controlled oxygen", answer: "Oxygenation impairment/support need" },
    ],
    correctAnswer: {
      "PaO2 58 mm Hg": "Oxygenation impairment/support need",
      "pH 7.30 with PaCO2 62 mm Hg and HCO3- 30 mEq/L": "Acute-on-chronic ventilatory failure",
      "Increasing fatigue with accessory-muscle use": "Acute-on-chronic ventilatory failure",
      "Chest radiograph without focal infiltrate or pneumothorax": "Does not support an acute pulmonary complication",
      "SpO2 90% on controlled oxygen": "Oxygenation impairment/support need",
    },
    rationale:
      "Low PaO2 and the need for controlled oxygen support hypoxemia. The elevated PaCO2 with acidemia shows inadequate ventilation; the elevated bicarbonate suggests chronic compensation with a new acute respiratory acidosis. Increasing fatigue and accessory-muscle use indicate that ventilatory reserve is failing. The radiograph does not show pneumonia or pneumothorax, although it cannot exclude every alternate cause. An SpO2 of 90% is within the usual controlled-oxygen target for an exacerbation but still represents oxygenation being actively supported rather than normal room-air physiology.",
    rationaleMechanism:
      "Chronic carbon dioxide retention permits renal bicarbonate compensation. A new PaCO2 rise lowers pH before additional renal compensation can occur, creating an acute-on-chronic respiratory acidosis and signaling inadequate alveolar ventilation.",
    whyCorrect:
      "The mappings distinguish oxygen-transfer impairment from ventilatory pump failure and use imaging to narrow important alternative diagnoses.",
    distractorRationales: {
      "PaO2 58 mm Hg": "This directly quantifies arterial hypoxemia rather than carbon dioxide clearance.",
      "pH 7.30 with PaCO2 62 mm Hg and HCO3- 30 mEq/L": "Acidemia with elevated PaCO2 is a ventilation problem; bicarbonate elevation suggests a chronic component.",
      "Increasing fatigue with accessory-muscle use": "Fatigue under high work of breathing warns that ventilation may worsen; it is more than isolated hypoxemia.",
      "Chest radiograph without focal infiltrate or pneumothorax": "The absence of these findings lowers support for those acute complications; it does not diagnose ventilatory failure by itself.",
      "SpO2 90% on controlled oxygen": "This is on the prescribed target but requires controlled oxygen support, so it belongs with oxygenation rather than acid-base interpretation.",
    },
    takeaway: "PaO2/SpO2 describe oxygenation; pH plus PaCO2 and fatigue describe ventilation.",
    visualRationale: {
      type: "compare",
      title: "Oxygenation versus ventilation",
      options: [
        { label: "Oxygenation", verdict: "partial", note: "PaO2 58; SpO2 maintained at 90% with controlled oxygen" },
        { label: "Ventilation", verdict: "correct", note: "PaCO2 62 with pH 7.30 and respiratory-muscle fatigue" },
        { label: "Imaging alternatives", verdict: "partial", note: "No focal infiltrate or pneumothorax" },
      ],
      conclusion: "The immediate danger is acute-on-chronic hypercapnic respiratory failure.",
    },
  }),
  makeVerifiedCaseQuestion(copdDefinition, {
    id: "codex-nclex-copd-case-03",
    kind: "bow-tie",
    questionType: "bow_tie",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "synthesize",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem: "Using the latest COPD exacerbation record, complete the bow-tie by identifying the priority condition, two actions, and two parameters to monitor.",
    nclexInstruction: "Select two actions and two monitoring parameters.",
    options: [],
    bowTie: {
      center: { id: "copd-acute-hypercapnia", text: "COPD exacerbation with acute-on-chronic hypercapnic respiratory failure", isCorrect: true },
      leftActions: [
        { id: "controlled-o2", text: "Continue controlled oxygen titrated to the prescribed 88% to 92% target", isCorrect: true },
        { id: "bronchodilator-steroid", text: "Administer prescribed short-acting bronchodilators and systemic corticosteroid", isCorrect: true },
        { id: "high-flow-100", text: "Apply uncontrolled 100% oxygen indefinitely without reassessment", isCorrect: false },
        { id: "sedative", text: "Administer a sedative to reduce the respiratory rate", isCorrect: false },
      ],
      rightMonitoring: [
        { id: "mental-work", text: "Mental status, respiratory effort, rate, and speech", isCorrect: true },
        { id: "spo2-abg", text: "SpO2 and serial ABG response", isCorrect: true },
        { id: "daily-weight", text: "Daily weight as the primary respiratory endpoint", isCorrect: false },
        { id: "a1c", text: "Hemoglobin A1c", isCorrect: false },
      ],
    },
    correctAnswer: {
      center: "copd-acute-hypercapnia",
      leftActions: ["controlled-o2", "bronchodilator-steroid"],
      rightMonitoring: ["mental-work", "spo2-abg"],
    },
    rationale:
      "The priority hypothesis is an acute COPD exacerbation causing acute-on-chronic hypercapnic respiratory failure. Controlled oxygen treats hypoxemia while avoiding unnecessary hyperoxia, and prescribed bronchodilators plus corticosteroid reduce airflow obstruction and inflammation. The nurse must trend mental status, work of breathing, speech, saturation, and ABGs because fatigue, drowsiness, worsening acidosis, or rising PaCO2 indicates ventilatory failure. Sedation can depress ventilation, and oxygen should be titrated and reassessed rather than delivered without a target.",
    rationaleMechanism:
      "Bronchodilation reduces expiratory resistance and corticosteroid therapy reduces inflammatory burden. Controlled oxygen corrects dangerous hypoxemia, while serial gas exchange and bedside assessment reveal whether alveolar ventilation is recovering or respiratory muscles are failing.",
    whyCorrect:
      "This hypothesis integrates obstructive physiology, acute symptoms, compensated chronic hypercapnia, new acidemia, and respiratory fatigue.",
    distractorRationales: {
      "high-flow-100": "Life-threatening hypoxemia should never be left untreated, but ongoing oxygen is titrated to a target with reassessment rather than delivered at an unnecessarily high concentration without monitoring.",
      sedative: "A sedative can worsen respiratory drive, airway protection, and hypercapnia; tachypnea is a compensatory sign, not the primary treatment target.",
      "daily-weight": "Weight can be useful in other cardiopulmonary conditions but is not the immediate endpoint for acute hypercapnic failure.",
      a1c: "Long-term glycemic status does not guide this respiratory emergency.",
    },
    takeaway: "Treat hypoxemia and airflow obstruction while continuously asking whether ventilation and mental status are improving.",
    visualRationale: {
      type: "flow",
      title: "COPD respiratory-failure response",
      nodes: [
        { label: "Oxygenate", value: "Controlled O2, target 88%-92%" },
        { label: "Open airways", value: "Short-acting bronchodilators" },
        { label: "Reduce inflammation", value: "Systemic corticosteroid" },
        { label: "Watch ventilation", value: "Mental status + ABG" },
      ],
      conclusion: "A saturation target does not replace ventilation assessment.",
    },
  }),
  makeVerifiedCaseQuestion(copdDefinition, {
    id: "codex-nclex-copd-case-04",
    kind: "multi-select",
    questionType: "sata",
    category: "Pharmacological and Parenteral Therapies",
    nclexClientNeed: "pharmacological",
    cognitiveLevel: "apply",
    difficulty: 4,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem: "Which interventions should the nurse include in the immediate plan for worsening hypercapnic respiratory failure? Select all that apply.",
    nclexInstruction: "Select all interventions that apply.",
    options: [
      { id: "a", text: "Maintain controlled oxygen and titrate to the prescribed SpO2 target." },
      { id: "b", text: "Administer prescribed short-acting bronchodilators and systemic corticosteroid." },
      { id: "c", text: "Administer the prescribed antibiotic for increased purulent sputum." },
      { id: "d", text: "Prepare noninvasive ventilation and repeat the ABG as ordered." },
      { id: "e", text: "Place the client supine and discourage position changes." },
      { id: "f", text: "Give a benzodiazepine to eliminate tachypnea before reassessment." },
    ],
    correctAnswer: ["a", "b", "c", "d"],
    rationale:
      "The immediate plan uses controlled oxygen, short-acting bronchodilation, systemic corticosteroid, and prescribed antibiotic therapy when purulent sputum supports bacterial involvement. Because respiratory acidosis and fatigue are present, the nurse should prepare noninvasive ventilation and obtain repeat ABGs while watching mental status and airway protection. Upright positioning usually assists mechanics. A benzodiazepine can worsen ventilatory depression and obscure neurologic decline.",
    rationaleMechanism:
      "The selected interventions address oxygenation, bronchoconstriction, airway inflammation, a possible infectious trigger, and failing alveolar ventilation. Noninvasive positive pressure can reduce work of breathing and improve gas exchange in appropriate clients with acute hypercapnic respiratory failure.",
    whyCorrect:
      "The four interventions form a coordinated exacerbation plan and include a clear escalation path rather than relying on oxygen alone.",
    distractorRationales: {
      e: "Supine positioning can worsen diaphragmatic mechanics and dyspnea; an upright position supports ventilation unless another condition contraindicates it.",
      f: "Sedation can depress respiratory drive and conceal worsening hypercapnic encephalopathy; it does not treat airflow obstruction.",
    },
    takeaway: "A severe COPD exacerbation plan must treat obstruction and triggers while preparing ventilatory support.",
    visualRationale: {
      type: "overview",
      title: "Coordinated exacerbation plan",
      nodes: [
        { label: "Oxygen", value: "Targeted and reassessed" },
        { label: "Airflow", value: "Bronchodilator + steroid" },
        { label: "Trigger", value: "Antibiotic when indicated" },
        { label: "Ventilation", value: "Prepare NIV + repeat ABG" },
      ],
      conclusion: "Oxygen is one component, not the entire treatment plan.",
    },
  }),
  makeVerifiedCaseQuestion(copdDefinition, {
    id: "codex-nclex-copd-case-05",
    kind: "mcq",
    questionType: "mcq",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "evaluate",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem: "The client becomes drowsy with shallow respirations; repeat ABG is pH 7.24, PaCO2 72 mm Hg. Which action should the nurse take first?",
    nclexInstruction: "Select the priority immediate action.",
    options: [
      { id: "a", text: "Activate respiratory escalation and initiate prescribed noninvasive ventilation while assessing airway protection." },
      { id: "b", text: "Increase oxygen to 100% and wait 60 minutes before reassessing mental status." },
      { id: "c", text: "Administer a sedative so the client can rest." },
      { id: "d", text: "Encourage the client to walk to mobilize secretions." },
    ],
    correctAnswer: "a",
    rationale:
      "Drowsiness, shallow respirations, worsening acidemia, and a rising PaCO2 indicate ventilatory failure. The nurse should immediately escalate, assess whether the client can protect the airway, initiate prescribed noninvasive ventilation when appropriate, and maintain readiness for invasive ventilation if mental status or gas exchange worsens. Oxygen alone does not remove carbon dioxide, and delaying reassessment can permit respiratory arrest. Sedation and ambulation are unsafe.",
    rationaleMechanism:
      "Noninvasive positive-pressure ventilation unloads fatigued respiratory muscles, improves alveolar ventilation, and can lower PaCO2 and raise pH. It is used only while the client can cooperate and protect the airway; declining consciousness may require intubation.",
    whyCorrect:
      "The selected action addresses the failing ventilatory pump and incorporates the safety decision that determines whether noninvasive support remains appropriate.",
    distractorRationales: {
      b: "Oxygen treats hypoxemia but does not correct inadequate ventilation; uncontrolled high oxygen plus delayed reassessment misses worsening hypercapnia.",
      c: "Sedation can worsen respiratory depression and airway protection in a drowsy hypercapnic client.",
      d: "A fatigued, drowsy client with severe respiratory acidosis is unsafe to ambulate and needs ventilatory support.",
    },
    takeaway: "Drowsiness plus rising PaCO2 and falling pH is a ventilation emergency, not an oxygen-only problem.",
    visualRationale: {
      type: "trend",
      title: "Worsening ventilatory failure",
      metrics: [
        { label: "pH", value: "7.30 -> 7.24", direction: "down", directionLabel: "worsening acidemia", range: "7.35-7.45" },
        { label: "PaCO2", value: "62 -> 72 mm Hg", direction: "up", directionLabel: "worsening retention", range: "35-45" },
        { label: "Mental status", value: "Alert -> drowsy", direction: "down", directionLabel: "declining" },
      ],
      conclusion: "Escalate ventilatory support and reassess airway protection now.",
    },
  }),
  makeVerifiedCaseQuestion(copdDefinition, {
    id: "codex-nclex-copd-case-06",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "evaluate",
    difficulty: 5,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem: "For each reassessment finding, identify whether it supports improvement or requires continued escalation.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports improvement", "Requires continued escalation"],
    matrixRows: [
      { label: "Alert and speaking in full sentences", answer: "Supports improvement" },
      { label: "Respiratory rate 22/min with minimal accessory-muscle use", answer: "Supports improvement" },
      { label: "pH 7.34 and PaCO2 56 mm Hg", answer: "Supports improvement" },
      { label: "SpO2 90% on controlled oxygen", answer: "Supports improvement" },
      { label: "New inability to remove secretions or protect the airway", answer: "Requires continued escalation" },
    ],
    correctAnswer: {
      "Alert and speaking in full sentences": "Supports improvement",
      "Respiratory rate 22/min with minimal accessory-muscle use": "Supports improvement",
      "pH 7.34 and PaCO2 56 mm Hg": "Supports improvement",
      "SpO2 90% on controlled oxygen": "Supports improvement",
      "New inability to remove secretions or protect the airway": "Requires continued escalation",
    },
    rationale:
      "Improved alertness and speech, less work of breathing, a rising pH, falling PaCO2, and saturation within the prescribed 88% to 92% range support response to noninvasive ventilation. PaCO2 need not immediately normalize to show improvement in a chronically hypercapnic client. Inability to clear secretions or protect the airway is a major safety concern and can make noninvasive ventilation inappropriate, requiring immediate escalation for advanced airway evaluation.",
    rationaleMechanism:
      "Successful ventilatory support improves alveolar ventilation and respiratory-muscle efficiency, so pH and mental status recover as PaCO2 falls. Airway-protection failure changes the risk-benefit balance because a tight mask does not secure the airway.",
    whyCorrect:
      "The classifications use trends and bedside function rather than demanding normal values in a client with chronic compensated hypercapnia.",
    distractorRationales: {
      "Alert and speaking in full sentences": "Improved cognition and speech indicate better ventilation and reduced distress.",
      "Respiratory rate 22/min with minimal accessory-muscle use": "Lower effort supports respiratory-muscle recovery.",
      "pH 7.34 and PaCO2 56 mm Hg": "The pH and PaCO2 trends are improving; chronic hypercapnia means a normal PaCO2 is not required immediately.",
      "SpO2 90% on controlled oxygen": "This is within the prescribed GOLD-aligned target range and supports adequate controlled oxygenation.",
      "New inability to remove secretions or protect the airway": "This threatens aspiration and NIV failure and requires immediate escalation.",
    },
    takeaway: "Judge COPD response by mental status, work, pH/PaCO2 trend, target saturation, and airway protection.",
    visualRationale: {
      type: "trend",
      title: "Response to noninvasive ventilation",
      metrics: [
        { label: "pH", value: "7.24 -> 7.34", direction: "up", directionLabel: "improving", range: "7.35-7.45" },
        { label: "PaCO2", value: "72 -> 56 mm Hg", direction: "down", directionLabel: "improving", range: "35-45" },
        { label: "Respiratory rate", value: "34 -> 22/min", direction: "down", directionLabel: "less work" },
        { label: "SpO2", value: "90%", direction: "steady", directionLabel: "on target", range: "88-92" },
      ],
      conclusion: "Trends support improvement; airway protection remains a hard safety gate.",
    },
  }),
];

export const SICKLE_CELL_ACUTE_CHEST_CASE: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(acuteChestDefinition, {
    id: "codex-nclex-acute-chest-case-01",
    kind: "multi-select",
    questionType: "sata",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "analyze",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem: "Click to highlight the new findings that require immediate follow-up for acute chest syndrome.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Click to highlight every finding that requires immediate follow-up.",
    options: [
      { id: "a", text: "New pleuritic chest pain" },
      { id: "b", text: "New cough and dyspnea" },
      { id: "c", text: "Fine crackles at the right base" },
      { id: "d", text: "New oxygen-saturation decline" },
      { id: "e", text: "History of HbSS disease" },
      { id: "f", text: "Back and leg pain present at admission" },
    ],
    highlightRows: [
      { label: "Chest", text: "New pleuritic chest pain", optionId: "a" },
      { label: "Respiratory", text: "New cough and dyspnea", optionId: "b" },
      { label: "Assessment", text: "Fine crackles at the right base", optionId: "c" },
      { label: "Oxygenation", text: "New oxygen-saturation decline", optionId: "d" },
      { label: "History", text: "History of HbSS disease", optionId: "e" },
      { label: "Pain", text: "Back and leg pain present at admission", optionId: "f" },
    ],
    correctAnswer: ["a", "b", "c", "d"],
    rationale:
      "New chest pain, cough, dyspnea, focal crackles, and an oxygen-saturation decline during a vaso-occlusive admission require immediate assessment for acute chest syndrome. These changes are distinct from the musculoskeletal pain present on arrival and can progress rapidly. HbSS disease establishes susceptibility, but the time-sensitive cues are the new pulmonary findings. The nurse should apply oxygen for hypoxemia, notify the provider, obtain prescribed chest imaging and laboratory studies, and intensify respiratory monitoring.",
    rationaleMechanism:
      "Acute chest syndrome involves new pulmonary injury with mechanisms that may include infection, fat embolization, and pulmonary vaso-occlusion. Hypoxemia promotes additional sickling, creating a cycle of worsening perfusion, inflammation, and gas-exchange impairment.",
    whyCorrect:
      "The selected findings represent a new respiratory syndrome rather than stable disease history or the original pain presentation.",
    distractorRationales: {
      e: "HbSS disease is the risk context, but it is not a new deterioration cue by itself.",
      f: "The original back and leg pain is important to manage but does not alone establish a new pulmonary complication.",
    },
    takeaway: "In sickle cell disease, any new fever, chest symptom, respiratory finding, or oxygen decline deserves immediate ACS evaluation.",
    visualRationale: {
      type: "signal",
      title: "New pulmonary change during VOC",
      nodes: [
        { label: "Symptoms", value: "Chest pain + cough + dyspnea" },
        { label: "Assessment", value: "Right-base crackles" },
        { label: "Oxygenation", value: "New saturation decline" },
      ],
      conclusion: "New pulmonary cues are not explained by the original limb and back pain.",
    },
  }),
  makeVerifiedCaseQuestion(acuteChestDefinition, {
    id: "codex-nclex-acute-chest-case-02",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "analyze",
    difficulty: 5,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem: "For each finding, identify how it contributes to the suspected acute chest syndrome pattern.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports acute chest syndrome", "Supports worsening oxygen-carrying capacity", "Does not support the acute pulmonary pattern"],
    matrixRows: [
      { label: "New right lower-lobe infiltrate", answer: "Supports acute chest syndrome" },
      { label: "Fever 101.8 F (38.8 C) with cough", answer: "Supports acute chest syndrome" },
      { label: "SpO2 89% on room air", answer: "Supports acute chest syndrome" },
      { label: "Hemoglobin 7.2 g/dL from baseline 8.5 g/dL", answer: "Supports worsening oxygen-carrying capacity" },
      { label: "Platelets 248,000/mm3", answer: "Does not support the acute pulmonary pattern" },
    ],
    correctAnswer: {
      "New right lower-lobe infiltrate": "Supports acute chest syndrome",
      "Fever 101.8 F (38.8 C) with cough": "Supports acute chest syndrome",
      "SpO2 89% on room air": "Supports acute chest syndrome",
      "Hemoglobin 7.2 g/dL from baseline 8.5 g/dL": "Supports worsening oxygen-carrying capacity",
      "Platelets 248,000/mm3": "Does not support the acute pulmonary pattern",
    },
    rationale:
      "A new pulmonary infiltrate plus fever and respiratory symptoms in a client with sickle cell disease supports acute chest syndrome. Hypoxemia strengthens the urgency and can accelerate sickling. The hemoglobin decrease reduces oxygen-carrying capacity and is relevant to transfusion planning, although anemia alone does not define ACS. A normal platelet count does not explain the acute pulmonary syndrome and should not distract from the infiltrate, symptoms, oxygenation, and hemoglobin trend.",
    rationaleMechanism:
      "Pulmonary inflammation and vaso-occlusion impair ventilation-perfusion matching. Simultaneous anemia lowers arterial oxygen content, so even a modest saturation decline can produce significant tissue oxygen-delivery stress.",
    whyCorrect:
      "The mappings connect the diagnostic pulmonary pattern to the separate but compounding problem of reduced hemoglobin-mediated oxygen delivery.",
    distractorRationales: {
      "New right lower-lobe infiltrate": "A new infiltrate is central to the ACS clinical definition when respiratory symptoms are present.",
      "Fever 101.8 F (38.8 C) with cough": "These new symptoms support an acute pulmonary process and require antimicrobial evaluation.",
      "SpO2 89% on room air": "Hypoxemia is a major severity cue within the ACS pattern rather than merely an anemia measurement.",
      "Hemoglobin 7.2 g/dL from baseline 8.5 g/dL": "The decrease worsens oxygen-carrying capacity and informs transfusion decisions, but it is not the new infiltrate itself.",
      "Platelets 248,000/mm3": "A normal platelet count does not materially support this acute pulmonary hypothesis.",
    },
    takeaway: "Analyze ACS as new infiltrate plus respiratory illness, then layer in oxygenation and hemoglobin trend for severity.",
    visualRationale: {
      type: "pathway",
      title: "Why oxygen delivery is threatened",
      nodes: [
        { label: "Lung", value: "New infiltrate" },
        { label: "Gas exchange", value: "SpO2 89%" },
        { label: "Carrier", value: "Hgb 7.2 from 8.5" },
        { label: "Risk", value: "Accelerating sickling and hypoxia" },
      ],
      conclusion: "Pulmonary dysfunction and anemia compound oxygen-delivery failure.",
    },
  }),
  makeVerifiedCaseQuestion(acuteChestDefinition, {
    id: "codex-nclex-acute-chest-case-03",
    kind: "bow-tie",
    questionType: "bow_tie",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "synthesize",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem: "Using the latest sickle cell record, complete the bow-tie by identifying the priority condition, two actions, and two parameters to monitor.",
    nclexInstruction: "Select two actions and two monitoring parameters.",
    options: [],
    bowTie: {
      center: { id: "acute-chest-syndrome", text: "Acute chest syndrome during a vaso-occlusive episode", isCorrect: true },
      leftActions: [
        { id: "oxygen", text: "Administer supplemental oxygen and maintain continuous pulse oximetry", isCorrect: true },
        { id: "antibiotics-spirometry", text: "Administer prescribed antibiotics and encourage incentive spirometry while awake", isCorrect: true },
        { id: "rapid-hypotonic", text: "Infuse rapid hypotonic fluid without reassessing respiratory status", isCorrect: false },
        { id: "suppress-cough", text: "Suppress the cough and defer chest imaging until pain resolves", isCorrect: false },
      ],
      rightMonitoring: [
        { id: "respiratory", text: "SpO2, work of breathing, lung sounds, and oxygen requirement", isCorrect: true },
        { id: "neuro-hgb", text: "Mental status, sedation, hemoglobin trend, and imaging progression", isCorrect: true },
        { id: "a1c", text: "Hemoglobin A1c", isCorrect: false },
        { id: "joint-rom", text: "Daily joint range of motion as the primary endpoint", isCorrect: false },
      ],
    },
    correctAnswer: {
      center: "acute-chest-syndrome",
      leftActions: ["oxygen", "antibiotics-spirometry"],
      rightMonitoring: ["respiratory", "neuro-hgb"],
    },
    rationale:
      "The priority condition is acute chest syndrome: a new infiltrate with fever, chest symptoms, respiratory findings, and hypoxemia in a client with HbSS disease. Oxygen treats hypoxemia, antibiotics address infectious causes that cannot be reliably excluded at presentation, and incentive spirometry helps prevent or reverse atelectatic worsening. Monitoring must detect increasing oxygen need, work of breathing, infiltrate progression, falling hemoglobin, and opioid-related sedation. Unmonitored rapid fluid can worsen pulmonary status.",
    rationaleMechanism:
      "Maintaining oxygenation interrupts hypoxia-driven sickling, antimicrobial therapy covers common infectious contributors, and lung expansion reduces atelectasis. Careful analgesia supports ventilation but requires sedation monitoring because hypoventilation can worsen ACS.",
    whyCorrect:
      "This hypothesis explains the new pulmonary and systemic findings and directs interventions that address oxygenation, infection, and lung expansion.",
    distractorRationales: {
      "rapid-hypotonic": "Excessive or poorly monitored fluid can worsen pulmonary edema and gas exchange; hydration should be careful and prescribed.",
      "suppress-cough": "Deferring imaging or pulmonary evaluation ignores a rapidly progressive complication; cough suppression does not treat ACS.",
      a1c: "Long-term glycemic status does not guide acute chest syndrome treatment.",
      "joint-rom": "Mobility matters during recovery, but it is not the primary endpoint during acute hypoxemic pulmonary disease.",
    },
    takeaway: "ACS care protects oxygenation, treats likely infection, expands the lungs, and watches closely for progression.",
    visualRationale: {
      type: "flow",
      title: "Break the acute chest cycle",
      nodes: [
        { label: "Hypoxemia", value: "Supplemental oxygen" },
        { label: "Infection risk", value: "Prescribed antibiotics" },
        { label: "Atelectasis", value: "Incentive spirometry" },
        { label: "Progression", value: "Continuous respiratory reassessment" },
      ],
      conclusion: "Treat several plausible mechanisms at the same time.",
    },
  }),
  makeVerifiedCaseQuestion(acuteChestDefinition, {
    id: "codex-nclex-acute-chest-case-04",
    kind: "multi-select",
    questionType: "sata",
    category: "Management of Care",
    nclexClientNeed: "management_of_care",
    cognitiveLevel: "apply",
    difficulty: 5,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem: "Which interventions should the nurse include in the coordinated plan of care? Select all that apply.",
    nclexInstruction: "Select all interventions that apply.",
    options: [
      { id: "a", text: "Maintain supplemental oxygen and continuous pulse oximetry." },
      { id: "b", text: "Administer prescribed cephalosporin and macrolide antimicrobial therapy." },
      { id: "c", text: "Encourage incentive spirometry while awake." },
      { id: "d", text: "Titrate analgesia while monitoring sedation and ventilation." },
      { id: "e", text: "Coordinate hematology and blood-bank evaluation for transfusion." },
      { id: "f", text: "Administer repeated rapid fluid boluses until the urine is colorless." },
      { id: "g", text: "Delay antimicrobials until a final organism is identified." },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "Coordinated acute chest care includes oxygenation, empiric antimicrobial therapy, lung expansion, effective but safely monitored analgesia, and early transfusion evaluation based on severity and hemoglobin decline. Hydration is individualized and generally avoids overhydration because pulmonary edema can worsen gas exchange. Waiting for final microbiology can dangerously delay treatment when fever and a new infiltrate are present.",
    rationaleMechanism:
      "These interventions interrupt multiple contributors: oxygen limits hypoxia-driven sickling; antibiotics cover infectious triggers; spirometry recruits lung; analgesia permits deeper breathing; and transfusion can improve oxygen-carrying capacity and reduce circulating sickled cells when indicated.",
    whyCorrect:
      "The selected bundle treats the immediate syndrome while preparing for progression, without assuming one mechanism explains every ACS episode.",
    distractorRationales: {
      f: "Uncontrolled rapid hydration can worsen pulmonary edema; urine color is not a safe fluid-resuscitation endpoint.",
      g: "Microbiologic confirmation may be delayed or absent, so prescribed empiric antibiotics should not wait in a febrile pulmonary syndrome.",
    },
    takeaway: "Premium ACS management is a coordinated bundle, not oxygen or pain medication alone.",
    visualRationale: {
      type: "overview",
      title: "Five-domain acute chest plan",
      nodes: [
        { label: "Oxygen", value: "Correct hypoxemia" },
        { label: "Infection", value: "Empiric antibiotics" },
        { label: "Expansion", value: "Incentive spirometry" },
        { label: "Pain", value: "Analgesia + sedation checks" },
        { label: "Blood", value: "Early transfusion evaluation" },
      ],
      conclusion: "Every domain protects ventilation or oxygen delivery.",
    },
  }),
  makeVerifiedCaseQuestion(acuteChestDefinition, {
    id: "codex-nclex-acute-chest-case-05",
    kind: "mcq",
    questionType: "mcq",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    cognitiveLevel: "evaluate",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem: "SpO2 is now 88% despite 4 L/min oxygen and the infiltrate has become bilateral. Which action should the nurse take first?",
    nclexInstruction: "Select the priority immediate action.",
    options: [
      { id: "a", text: "Escalate to critical care and prepare for the prescribed urgent exchange transfusion while supporting oxygenation." },
      { id: "b", text: "Wait for the next morning chest radiograph before changing the plan." },
      { id: "c", text: "Increase the opioid basal rate so the client sleeps through the dyspnea." },
      { id: "d", text: "Stop oxygen because supplemental oxygen has not normalized the saturation." },
    ],
    correctAnswer: "a",
    rationale:
      "Hypoxemia below 90% despite supplemental oxygen with rapidly progressive bilateral infiltrates indicates severe acute chest syndrome. The nurse should immediately escalate respiratory support, transfer to critical care, and coordinate the prescribed urgent exchange transfusion. NHLBI guidance supports exchange transfusion for severe ACS defined by oxygen saturation below 90% despite supplemental oxygen, and ASH guidance favors exchange approaches for severe ACS. Waiting, increasing sedating opioid exposure, or stopping oxygen can accelerate respiratory failure.",
    rationaleMechanism:
      "Exchange transfusion raises oxygen-carrying capacity while reducing the proportion of circulating sickled erythrocytes, limiting further vaso-occlusion without the same degree of viscosity increase that a large simple transfusion could produce.",
    whyCorrect:
      "The selected response matches severe progressive disease and mobilizes both respiratory rescue and hematologic therapy.",
    distractorRationales: {
      b: "Rapid radiographic and oxygenation deterioration requires immediate escalation; overnight delay can permit respiratory collapse.",
      c: "Increasing basal opioid during hypoxemic respiratory failure can worsen sedation and hypoventilation and does not treat ACS.",
      d: "Oxygen should be continued and escalated appropriately; failure to normalize saturation is a reason for more support, not withdrawal.",
    },
    takeaway: "Progressive infiltrates plus saturation below 90% despite oxygen is severe ACS requiring immediate escalation.",
    visualRationale: {
      type: "pathway",
      title: "Severe ACS threshold",
      nodes: [
        { label: "Oxygen", value: "88% despite 4 L/min" },
        { label: "Imaging", value: "Unilateral -> bilateral" },
        { label: "Severity", value: "Rapidly progressive ACS" },
        { label: "Action", value: "Critical care + urgent exchange preparation" },
      ],
      conclusion: "Both oxygenation and imaging trajectories demand immediate escalation.",
    },
  }),
  makeVerifiedCaseQuestion(acuteChestDefinition, {
    id: "codex-nclex-acute-chest-case-06",
    kind: "matrix",
    questionType: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    cognitiveLevel: "evaluate",
    difficulty: 5,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem: "For each post-treatment acute chest syndrome finding, identify whether it supports improvement or requires continued follow-up.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports improvement", "Requires continued follow-up"],
    matrixRows: [
      { label: "SpO2 96% on 2 L/min oxygen", answer: "Supports improvement" },
      { label: "Respiratory rate 20/min with reduced chest pain", answer: "Supports improvement" },
      { label: "Alert without excessive opioid sedation", answer: "Supports improvement" },
      { label: "New increasing oxygen requirement", answer: "Requires continued follow-up" },
      { label: "Fever persists with expanding infiltrates", answer: "Requires continued follow-up" },
    ],
    correctAnswer: {
      "SpO2 96% on 2 L/min oxygen": "Supports improvement",
      "Respiratory rate 20/min with reduced chest pain": "Supports improvement",
      "Alert without excessive opioid sedation": "Supports improvement",
      "New increasing oxygen requirement": "Requires continued follow-up",
      "Fever persists with expanding infiltrates": "Requires continued follow-up",
    },
    rationale:
      "A lower oxygen requirement with improved saturation, normalized respiratory rate, reduced pain, and preserved alertness support recovery after exchange transfusion and respiratory treatment. The nurse must continue incentive spirometry, prescribed antimicrobials, respiratory assessment, and pain/sedation monitoring. Increasing oxygen need or persistent fever with expanding infiltrates indicates ongoing or recurrent pulmonary injury and requires immediate reassessment rather than routine step-down care.",
    rationaleMechanism:
      "Improved oxygen content and fewer circulating sickled cells reduce hypoxia-driven vaso-occlusion, while antimicrobials and lung-expansion measures address infectious and atelectatic contributors. Deteriorating oxygen need or imaging means the pathologic cycle remains active.",
    whyCorrect:
      "The classifications combine oxygen requirement, respiratory mechanics, pain control, mental status, fever, and imaging rather than relying on saturation alone.",
    distractorRationales: {
      "SpO2 96% on 2 L/min oxygen": "Improved saturation on less oxygen supports better gas exchange.",
      "Respiratory rate 20/min with reduced chest pain": "Normalized effort and improved pain support recovery and more effective ventilation.",
      "Alert without excessive opioid sedation": "Preserved alertness supports adequate ventilation and safe analgesia.",
      "New increasing oxygen requirement": "A rising oxygen need is an early deterioration cue even before severe desaturation recurs.",
      "Fever persists with expanding infiltrates": "Persistent systemic and radiographic progression requires renewed evaluation and escalation.",
    },
    takeaway: "ACS improvement means less oxygen, less work, safe analgesia, and no radiographic or febrile progression.",
    visualRationale: {
      type: "trend",
      title: "Post-exchange response",
      metrics: [
        { label: "SpO2", value: "88% on 4 L -> 96% on 2 L", direction: "up", directionLabel: "improving" },
        { label: "Respiratory rate", value: "34 -> 20/min", direction: "down", directionLabel: "improving" },
        { label: "Chest pain", value: "Severe -> 3/10", direction: "down", directionLabel: "improving" },
      ],
      conclusion: "Improvement must persist while oxygen is weaned and pulmonary therapy continues.",
    },
  }),
];

export const COMPLEX_CARE_VERIFIED_CASE_STUDIES: PracticeQuestion[] = [
  ...DIGOXIN_TOXICITY_CASE,
  ...LITHIUM_TOXICITY_CASE,
  ...COPD_HYPERCAPNIA_CASE,
  ...SICKLE_CELL_ACUTE_CHEST_CASE,
];
