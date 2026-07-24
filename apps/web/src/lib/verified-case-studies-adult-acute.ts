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

const adaHospitalReference: CaseReference = {
  title: "Diabetes Care in the Hospital: Standards of Care in Diabetes - 2026",
  citation: "American Diabetes Association Professional Practice Committee for Diabetes, 2026",
  href: "https://diabetesjournals.org/care/article/49/Supplement_1/S339/163925/16-Diabetes-Care-in-the-Hospital-Standards-of-Care",
};

const adaHyperglycemicCrisesReference: CaseReference = {
  title: "Glycemic Goals, Hypoglycemia, and Hyperglycemic Crises: Standards of Care in Diabetes - 2026",
  citation: "American Diabetes Association Professional Practice Committee for Diabetes, 2026",
  href: "https://diabetesjournals.org/care/article/49/Supplement_1/S132/163927/6-Glycemic-Goals-Hypoglycemia-and-Hyperglycemic",
};

const strokeReference: CaseReference = {
  title: "2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke",
  citation: "American Heart Association and American Stroke Association, 2026",
  href: "https://www.ahajournals.org/doi/10.1161/STR.0000000000000513",
};

const heartFailureReference: CaseReference = {
  title: "2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure",
  citation: "American Heart Association, American College of Cardiology, and Heart Failure Society of America, 2022",
  href: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063",
};

const hemovigilanceReference: CaseReference = {
  title: "NHSN Biovigilance Component Hemovigilance Module Protocol, Version 3.0",
  citation: "Centers for Disease Control and Prevention, January 2026",
  href: "https://www.cdc.gov/nhsn/pdfs/biovigilance/bv-hv-protocol-current.pdf",
};

const bloodSafetyReference: CaseReference = {
  title: "Hemovigilance Module",
  citation: "Centers for Disease Control and Prevention, reviewed March 20, 2026",
  href: "https://www.cdc.gov/nhsn/biovigilance/blood-safety/index.html",
};

const fdaBloodCircularReference: CaseReference = {
  title: "An Acceptable Circular of Information for the Use of Human Blood and Blood Components",
  citation: "U.S. Food and Drug Administration, final guidance, September 2024",
  href: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/acceptable-circular-information-use-human-blood-and-blood-components",
};

function boundedStep(caseItemNumber: number): number {
  return Math.max(1, Math.min(6, caseItemNumber));
}

const dkaBaseChart: PracticeChartReviewMetadata = {
  patientTitle: "Day 1: Emergency Department",
  patientCaption: "Unfolding emergency record. New information appears as the case advances.",
  chiefComplaint: "Vomiting, abdominal pain, and increasing weakness.",
  hpi: [
    "A 24-year-old client with type 1 diabetes mellitus reports 2 days of nausea, repeated vomiting, diffuse abdominal pain, intense thirst, and frequent urination.",
    "The client developed nasal congestion and a nonproductive cough 3 days ago and has eaten very little since yesterday.",
    "The client continued basal insulin but skipped several mealtime insulin doses because no meals were tolerated.",
    "Home glucose readings were above 350 mg/dL despite correction doses; urine ketones were large this morning.",
  ],
  history: [
    "Type 1 diabetes mellitus diagnosed at age 13.",
    "Uses basal insulin nightly and rapid-acting insulin with meals.",
    "One prior diabetic ketoacidosis admission 4 years ago.",
    "No chronic kidney disease or heart failure.",
  ],
  allergies: ["No known medication allergies."],
  nursingNotes: [
    "0810: Client arrives by wheelchair, appears ill and fatigued, and answers questions appropriately.",
    "0815: Oral mucosa is dry. Respirations are deep and rapid. Breath has a fruity odor. Abdomen is diffusely tender without guarding or rigidity.",
  ],
  assessments: [
    "Neurologic: Alert and oriented to person, place, time, and situation.",
    "Respiratory: Deep, rapid respirations; lungs clear bilaterally.",
    "Cardiovascular: Tachycardic; peripheral pulses weak; capillary refill 3 seconds.",
    "Gastrointestinal: Repeated emesis and diffuse abdominal discomfort without peritoneal signs.",
  ],
  priorityCues: [
    "Type 1 diabetes, missed prandial insulin, vomiting, dehydration, hyperglycemia, large ketones, and Kussmaul respirations.",
  ],
};

function buildDkaChartReview(caseItemNumber: number): PracticeChartReviewMetadata {
  const step = boundedStep(caseItemNumber);
  const nursingNotes = [...(dkaBaseChart.nursingNotes ?? [])];
  const timeline = [
    "0810: Emergency-department triage completed.",
    "0815: Focused respiratory, perfusion, neurologic, and abdominal assessments documented.",
  ];
  const labs: NonNullable<PracticeChartReviewMetadata["labs"]> = [];
  const providerOrders: string[] = [
    "Place client on continuous cardiac monitoring.",
    "Establish two peripheral IV access sites.",
    "Measure strict intake and output.",
  ];
  let vitals: NonNullable<PracticeChartReviewMetadata["vitals"]> = [
    { label: "Temperature", value: "100.2 F (37.9 C)", flag: "high" },
    { label: "Heart rate", value: "124/min", flag: "high" },
    { label: "Respiratory rate", value: "30/min, deep", flag: "high" },
    { label: "Blood pressure", value: "94/58 mm Hg", flag: "low" },
    { label: "SpO2", value: "97% on room air" },
  ];

  if (step >= 2) {
    nursingNotes.push(
      "0825: Point-of-care glucose reads HI. The client reports increasing thirst and asks for water after another episode of emesis.",
    );
    timeline.push("0825: Initial metabolic and venous blood gas results become available.");
    labs.push(
      { label: "Serum glucose", value: "486 mg/dL", flag: "critical" },
      { label: "Beta-hydroxybutyrate", value: "5.8 mmol/L", flag: "critical" },
      { label: "Venous pH", value: "7.18", flag: "critical" },
      { label: "Bicarbonate", value: "11 mmol/L", flag: "critical" },
      { label: "Anion gap", value: "26 mmol/L", flag: "high" },
      { label: "Potassium", value: "5.4 mmol/L", flag: "high" },
      { label: "Sodium", value: "130 mmol/L", flag: "low" },
      { label: "BUN", value: "34 mg/dL", flag: "high" },
      { label: "Creatinine", value: "1.5 mg/dL", flag: "high" },
    );
  }

  if (step >= 3) {
    nursingNotes.push(
      "0830: The nurse reports the hyperglycemia, ketonemia, metabolic acidosis, dehydration, and current potassium result to the emergency provider.",
    );
    timeline.push("0830: Hyperglycemic-crisis protocol is activated for diabetic ketoacidosis.");
  }

  if (step >= 4) {
    providerOrders.push(
      "Begin prescribed isotonic IV crystalloid and reassess perfusion, sodium, and urine output.",
      "Begin regular insulin infusion per protocol after potassium safety is confirmed.",
      "Check bedside glucose hourly and electrolytes, venous pH, and beta-hydroxybutyrate at protocol intervals.",
      "Add dextrose-containing fluid when glucose reaches the protocol threshold while insulin continues to clear ketones.",
    );
    nursingNotes.push(
      "0840: Isotonic crystalloid is started as prescribed. Urine output is 20 mL of dark yellow urine.",
    );
    timeline.push("0840: Fluid resuscitation begins; serial metabolic monitoring is planned.");
  }

  if (step >= 5) {
    nursingNotes.push(
      "1200: After fluids and insulin, glucose is 238 mg/dL and vomiting has stopped. Telemetry shows frequent premature ventricular contractions; the client reports leg cramping.",
    );
    timeline.push("1200: New potassium-related cues appear during ongoing ketoacidosis treatment.");
    labs.push(
      { label: "Potassium", value: "3.2 mmol/L", flag: "critical" },
      { label: "Beta-hydroxybutyrate", value: "2.1 mmol/L", flag: "high" },
      { label: "Venous pH", value: "7.27", flag: "low" },
      { label: "Bicarbonate", value: "15 mmol/L", flag: "low" },
    );
    providerOrders.push(
      "Hold insulin infusion for potassium below the protocol safety threshold; notify provider and replace potassium as prescribed.",
    );
  }

  if (step >= 6) {
    nursingNotes.push(
      "1700: Client is alert, denies nausea and abdominal pain, and is tolerating oral fluids. Respirations are 18/min and no longer deep. Urine output has been 55 mL/hr for the past 2 hours.",
    );
    timeline.push("1700: Metabolic and clinical response is reassessed after potassium replacement and continued treatment.");
    labs.push(
      { label: "Serum glucose", value: "176 mg/dL", flag: "high" },
      { label: "Beta-hydroxybutyrate", value: "0.4 mmol/L" },
      { label: "Venous pH", value: "7.33" },
      { label: "Bicarbonate", value: "19 mmol/L" },
      { label: "Potassium", value: "4.0 mmol/L" },
    );
    vitals = [
      { label: "Temperature", value: "99.1 F (37.3 C)" },
      { label: "Heart rate", value: "88/min" },
      { label: "Respiratory rate", value: "18/min" },
      { label: "Blood pressure", value: "112/70 mm Hg" },
      { label: "SpO2", value: "98% on room air" },
    ];
  }

  return {
    ...dkaBaseChart,
    patientCaption: `Unfolding NGN record, item ${step} of 6. Review only information available at this point in the case.`,
    nursingNotes,
    unfoldingTimeline: timeline,
    vitals,
    labs,
    providerOrders,
  };
}

const dkaDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-adult-dka-ngn",
  title: "Adult Health: Diabetic Ketoacidosis",
  references: [
    NCLEX_REFERENCE,
    adaHospitalReference,
    adaHyperglycemicCrisesReference,
  ],
  sourceIds: [
    "ncsbn-2026-rn-test-plan",
    "ada-standards-2026-hospital-care",
    "ada-standards-2026-hyperglycemic-crises",
  ],
  evidenceReviewedAt: EVIDENCE_REVIEWED_AT,
  buildChartReview: buildDkaChartReview,
};

const strokeBaseChart: PracticeChartReviewMetadata = {
  patientTitle: "Day 1: Emergency Department Stroke Alert",
  patientCaption: "Unfolding stroke-alert record. New information appears as the case advances.",
  chiefComplaint: "Sudden inability to speak and right-sided weakness.",
  hpi: [
    "A 68-year-old client was speaking normally with a spouse at 0910 when the client suddenly dropped a coffee cup and could not form words.",
    "Emergency medical services arrived at 0924 and documented right facial droop, right arm drift, and severe expressive aphasia.",
    "The spouse confirms the client was last known well at 0910 and had no headache, seizure, fall, or recent trauma.",
    "The client arrived at the emergency department at 0950; the spouse provides medication history because aphasia limits the interview.",
  ],
  history: [
    "Hypertension and hyperlipidemia.",
    "No prior stroke, intracranial hemorrhage, or recent surgery.",
    "No known bleeding disorder.",
  ],
  medications: [
    "Amlodipine 10 mg by mouth daily.",
    "Atorvastatin 40 mg by mouth nightly.",
    "No anticoagulant medication reported by client or spouse.",
  ],
  allergies: ["No known medication allergies."],
  nursingNotes: [
    "0950: Stroke alert activated on arrival. Client is awake, follows one-step commands, and communicates with gestures.",
    "0953: Right facial droop, right arm and leg weakness, left gaze preference, and severe expressive aphasia are present. Airway is patent; oral secretions are controlled.",
  ],
  assessments: [
    "Neurologic: NIH Stroke Scale score 12; disabling language and motor deficits.",
    "Respiratory: Airway patent; lungs clear; no respiratory distress.",
    "Cardiovascular: Regular rhythm; peripheral pulses 2+.",
  ],
  priorityCues: [
    "Precisely documented last-known-well time with sudden focal neurologic deficits and no hypoglycemia.",
  ],
};

function buildStrokeChartReview(caseItemNumber: number): PracticeChartReviewMetadata {
  const step = boundedStep(caseItemNumber);
  const nursingNotes = [...(strokeBaseChart.nursingNotes ?? [])];
  const timeline = [
    "0910: Last known well; symptoms begin suddenly while spouse is present.",
    "0950: Emergency-department arrival and stroke-alert activation.",
  ];
  const labs: NonNullable<PracticeChartReviewMetadata["labs"]> = [
    { label: "Point-of-care glucose", value: "118 mg/dL" },
  ];
  const diagnostics: NonNullable<PracticeChartReviewMetadata["diagnostics"]> = [];
  const providerOrders: string[] = [
    "Maintain NPO status until a validated swallow screen is completed.",
    "Continuous cardiac and oxygen-saturation monitoring; frequent neurologic and blood-pressure assessment.",
    "Two peripheral IV access sites; obtain emergency laboratory specimens without delaying brain imaging.",
  ];
  let vitals: NonNullable<PracticeChartReviewMetadata["vitals"]> = [
    { label: "Temperature", value: "98.6 F (37.0 C)" },
    { label: "Heart rate", value: "92/min" },
    { label: "Respiratory rate", value: "18/min" },
    { label: "Blood pressure", value: "176/98 mm Hg", flag: "high" },
    { label: "SpO2", value: "96% on room air" },
  ];

  if (step >= 2) {
    nursingNotes.push(
      "1000: Client is transported directly to CT with stroke-team monitoring. Deficits remain unchanged; no vomiting or decline in level of consciousness occurs.",
    );
    timeline.push("1007: Noncontrast head CT is completed.");
    diagnostics.push(
      { label: "Noncontrast head CT", value: "No intracranial hemorrhage; no large established infarct" },
      { label: "12-lead ECG", value: "Sinus rhythm at 90/min" },
    );
    labs.push(
      { label: "Platelets", value: "226,000/mm3" },
      { label: "INR", value: "1.0" },
      { label: "Serum creatinine", value: "0.9 mg/dL" },
    );
  }

  if (step >= 3) {
    nursingNotes.push(
      "1010: The stroke team confirms persistent disabling aphasia and right hemiparesis. The spouse again verifies last known well at 0910 and no anticoagulant use.",
    );
    timeline.push("1010: Initial thrombolysis eligibility review is completed.");
    diagnostics.push(
      { label: "CT angiography", value: "Left middle cerebral artery M1 occlusion", flag: "critical" },
    );
  }

  if (step >= 4) {
    providerOrders.push(
      "Administer prescribed IV thrombolytic after final eligibility and blood-pressure verification.",
      "Activate the endovascular thrombectomy pathway for large-vessel occlusion.",
      "Perform protocol neurologic and blood-pressure checks after thrombolytic therapy.",
      "Avoid antithrombotic medication and unnecessary invasive procedures during the initial post-thrombolytic period.",
    );
    nursingNotes.push(
      "1015: The stroke neurologist discusses the time-sensitive treatment plan with the client and spouse; consent processes are completed per policy.",
    );
    timeline.push("1015: Reperfusion treatment plan is authorized.");
  }

  if (step >= 5) {
    nursingNotes.push(
      "1055: Prescribed IV thrombolytic has been administered. During transport preparation for thrombectomy, the client develops sudden severe headache, nausea, and increasing drowsiness.",
    );
    timeline.push("1055: Acute neurologic deterioration occurs after thrombolytic administration.");
    providerOrders.push(
      "Stop transfer activity, notify the stroke team immediately, and obtain emergency brain imaging for suspected intracranial bleeding.",
    );
    vitals = [
      { label: "Temperature", value: "98.7 F (37.1 C)" },
      { label: "Heart rate", value: "104/min", flag: "high" },
      { label: "Respiratory rate", value: "20/min" },
      { label: "Blood pressure", value: "188/104 mm Hg", flag: "critical" },
      { label: "SpO2", value: "95% on room air" },
    ];
  }

  if (step >= 6) {
    nursingNotes.push(
      "1125: Emergency CT shows no intracranial hemorrhage. Blood pressure is managed per stroke-team orders, and the client proceeds to thrombectomy.",
      "1400: After successful reperfusion, the client is alert, names common objects, lifts the right arm against gravity, and has an NIH Stroke Scale score of 5.",
    );
    timeline.push(
      "1125: Repeat CT excludes intracranial hemorrhage.",
      "1400: Post-reperfusion neurologic reassessment is documented.",
    );
    diagnostics.push(
      { label: "Repeat noncontrast head CT", value: "No intracranial hemorrhage" },
      { label: "Thrombectomy result", value: "Successful reperfusion documented by neurointerventional team" },
    );
    vitals = [
      { label: "Temperature", value: "98.8 F (37.1 C)" },
      { label: "Heart rate", value: "84/min" },
      { label: "Respiratory rate", value: "16/min" },
      { label: "Blood pressure", value: "148/82 mm Hg", flag: "high" },
      { label: "SpO2", value: "97% on room air" },
    ];
  }

  return {
    ...strokeBaseChart,
    patientCaption: `Unfolding NGN record, item ${step} of 6. Review only information available at this point in the case.`,
    nursingNotes,
    unfoldingTimeline: timeline,
    vitals,
    labs,
    diagnostics,
    providerOrders,
  };
}

const strokeDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-adult-ischemic-stroke-ngn",
  title: "Adult Health: Acute Ischemic Stroke",
  references: [NCLEX_REFERENCE, strokeReference],
  sourceIds: [
    "ncsbn-2026-rn-test-plan",
    "aha-asa-acute-ischemic-stroke-2026",
  ],
  evidenceReviewedAt: EVIDENCE_REVIEWED_AT,
  buildChartReview: buildStrokeChartReview,
};

const heartFailureBaseChart: PracticeChartReviewMetadata = {
  patientTitle: "Day 1: Emergency Department",
  patientCaption: "Unfolding cardiopulmonary record. New information appears as the case advances.",
  chiefComplaint: "Severe shortness of breath and inability to lie flat.",
  hpi: [
    "A 74-year-old client with heart failure with reduced ejection fraction reports progressive dyspnea, orthopnea, and bilateral leg swelling for 4 days.",
    "The client slept upright in a recliner last night and became acutely more breathless while walking to the bathroom this morning.",
    "The client missed three doses of furosemide this week because frequent urination interfered with errands and took ibuprofen for knee pain.",
    "The client reports eating canned soup and takeout meals during the past week and denies fever or productive cough.",
  ],
  history: [
    "Heart failure with reduced ejection fraction; most recent left ventricular ejection fraction 30%.",
    "Prior myocardial infarction, hypertension, and chronic kidney disease stage 2.",
    "Usual dry weight documented as 78 kg (172 lb).",
  ],
  medications: [
    "Sacubitril/valsartan, carvedilol, spironolactone, and furosemide.",
    "Ibuprofen taken without prescription for 5 days.",
  ],
  allergies: ["No known medication allergies."],
  nursingNotes: [
    "0615: Client arrives sitting upright, speaks in two- to three-word phrases, and uses accessory muscles to breathe.",
    "0620: Diffuse crackles are heard to the upper lung fields. Jugular venous distention, an S3, and 3+ bilateral lower-extremity edema are present. Skin is cool and diaphoretic.",
  ],
  assessments: [
    "Respiratory: Marked work of breathing, diffuse crackles, and pink-tinged frothy sputum.",
    "Cardiovascular: S3, jugular venous distention, tachycardia, and hypertension.",
    "Peripheral vascular: 3+ symmetric edema to the knees; pedal pulses 1+.",
  ],
  priorityCues: [
    "Severe hypoxemia and respiratory distress with pulmonary and systemic congestion.",
  ],
};

function buildHeartFailureChartReview(caseItemNumber: number): PracticeChartReviewMetadata {
  const step = boundedStep(caseItemNumber);
  const nursingNotes = [...(heartFailureBaseChart.nursingNotes ?? [])];
  const timeline = [
    "0615: Emergency-department triage completed.",
    "0620: Focused cardiopulmonary and perfusion assessment documented.",
  ];
  const labs: NonNullable<PracticeChartReviewMetadata["labs"]> = [];
  const diagnostics: NonNullable<PracticeChartReviewMetadata["diagnostics"]> = [];
  const providerOrders: string[] = [
    "Position upright and begin continuous cardiac and oxygen-saturation monitoring.",
    "Apply supplemental oxygen and escalate respiratory support per protocol and prescription.",
    "Establish peripheral IV access; measure strict intake and output.",
  ];
  let vitals: NonNullable<PracticeChartReviewMetadata["vitals"]> = [
    { label: "Temperature", value: "98.4 F (36.9 C)" },
    { label: "Heart rate", value: "118/min", flag: "high" },
    { label: "Respiratory rate", value: "34/min", flag: "critical" },
    { label: "Blood pressure", value: "178/106 mm Hg", flag: "critical" },
    { label: "SpO2", value: "84% on room air", flag: "critical" },
    { label: "Weight", value: "84.2 kg (185.6 lb), 6.2 kg above dry weight", flag: "high" },
  ];

  if (step >= 2) {
    nursingNotes.push(
      "0628: Oxygen saturation improves to 91% with prescribed respiratory support, but the client remains markedly dyspneic and cannot tolerate a supine position.",
    );
    timeline.push("0630: Initial laboratory, ECG, and chest imaging results become available.");
    labs.push(
      { label: "BNP", value: "1,480 pg/mL", flag: "high" },
      { label: "Sodium", value: "132 mmol/L", flag: "low" },
      { label: "Potassium", value: "4.3 mmol/L" },
      { label: "BUN", value: "32 mg/dL", flag: "high" },
      { label: "Creatinine", value: "1.3 mg/dL (baseline 1.1)", flag: "high" },
      { label: "High-sensitivity troponin", value: "No significant rise on initial result" },
    );
    diagnostics.push(
      { label: "Chest radiograph", value: "Bilateral interstitial and alveolar edema with small pleural effusions", flag: "critical" },
      { label: "12-lead ECG", value: "Sinus tachycardia; no acute ST-segment elevation" },
    );
  }

  if (step >= 3) {
    nursingNotes.push(
      "0635: The nurse reports severe pulmonary congestion, hypertension, hypoxemia, and marked weight gain to the emergency provider.",
    );
    timeline.push("0635: Acute decompensated heart failure with pulmonary edema is prioritized.");
  }

  if (step >= 4) {
    providerOrders.push(
      "Administer prescribed IV loop diuretic promptly.",
      "Administer prescribed IV vasodilator with continuous blood-pressure monitoring while hypertension persists.",
      "Continue noninvasive positive-pressure ventilation as prescribed and tolerated.",
      "Trend urine output, respiratory status, weight, electrolytes, BUN, and creatinine.",
    );
    nursingNotes.push(
      "0640: Noninvasive positive-pressure ventilation is initiated with respiratory therapy. The client is less anxious but remains tachypneic.",
    );
    timeline.push("0640: Respiratory support and decongestion plan begins.");
  }

  if (step >= 5) {
    nursingNotes.push(
      "0900: After prescribed IV diuretic and vasodilator therapy, urine output totals 1,350 mL. Dyspnea and crackles have decreased; blood pressure is 104/66 mm Hg. The client reports lightheadedness.",
    );
    timeline.push("0900: Rapid decongestion is accompanied by new hypotension symptoms.");
    labs.push(
      { label: "Potassium", value: "3.2 mmol/L", flag: "critical" },
      { label: "Creatinine", value: "1.4 mg/dL", flag: "high" },
    );
    providerOrders.push(
      "Stop prescribed vasodilator for symptomatic blood-pressure decline; notify provider and replace potassium as ordered.",
    );
    vitals = [
      { label: "Temperature", value: "98.5 F (36.9 C)" },
      { label: "Heart rate", value: "94/min" },
      { label: "Respiratory rate", value: "22/min", flag: "high" },
      { label: "Blood pressure", value: "104/66 mm Hg" },
      { label: "SpO2", value: "95% with prescribed oxygen" },
    ];
  }

  if (step >= 6) {
    nursingNotes.push(
      "1800: Client speaks in full sentences, rests with the head of bed at 30 degrees, and denies lightheadedness. Crackles are limited to the posterior bases; edema is 1+.",
      "1810: Urine output remains adequate. The client correctly explains daily weights, sodium reduction, prescribed diuretic use, and when to call the heart-failure team.",
    );
    timeline.push(
      "1800: Congestion and perfusion are reassessed.",
      "1810: Self-management understanding is evaluated.",
    );
    labs.push(
      { label: "Potassium", value: "3.9 mmol/L" },
      { label: "Creatinine", value: "1.3 mg/dL", flag: "high" },
    );
    vitals = [
      { label: "Temperature", value: "98.4 F (36.9 C)" },
      { label: "Heart rate", value: "82/min" },
      { label: "Respiratory rate", value: "18/min" },
      { label: "Blood pressure", value: "118/72 mm Hg" },
      { label: "SpO2", value: "95% on 2 L/min nasal cannula" },
      { label: "Weight", value: "81.7 kg (180.1 lb), trending toward dry weight", flag: "high" },
    ];
  }

  return {
    ...heartFailureBaseChart,
    patientCaption: `Unfolding NGN record, item ${step} of 6. Review only information available at this point in the case.`,
    nursingNotes,
    unfoldingTimeline: timeline,
    vitals,
    labs,
    diagnostics,
    providerOrders,
  };
}

const heartFailureDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-adult-adhf-pulmonary-edema-ngn",
  title: "Adult Health: Acute Decompensated Heart Failure With Pulmonary Edema",
  references: [NCLEX_REFERENCE, heartFailureReference],
  sourceIds: [
    "ncsbn-2026-rn-test-plan",
    "aha-acc-hfsa-heart-failure-guideline-2022",
  ],
  evidenceReviewedAt: EVIDENCE_REVIEWED_AT,
  buildChartReview: buildHeartFailureChartReview,
};

const transfusionBaseChart: PracticeChartReviewMetadata = {
  patientTitle: "Day 2: Medical-Surgical Unit",
  patientCaption: "Unfolding transfusion record. New information appears as the case advances.",
  chiefComplaint: "Symptomatic postoperative anemia requiring red blood cell transfusion.",
  hpi: [
    "A 59-year-old client is postoperative day 2 after open sigmoid colectomy and reports fatigue and dizziness when standing.",
    "Morning hemoglobin is 6.8 g/dL; the surgical incision is dry and intact, and there is no evidence of active bleeding.",
    "The provider prescribed one unit of packed red blood cells. Informed consent is documented and a pretransfusion specimen was completed.",
    "The client has received two prior transfusions without a documented reaction.",
  ],
  history: [
    "Colon cancer, hypertension, and iron-deficiency anemia.",
    "Blood type documented in the current blood-bank record as A positive.",
  ],
  allergies: ["Penicillin causes a rash."],
  nursingNotes: [
    "1015: Two qualified staff members complete the bedside blood-product and client identification check per policy. Baseline assessment is unchanged.",
    "1020: Packed red blood cell transfusion begins through dedicated tubing. The nurse remains with the client for close observation.",
  ],
  assessments: [
    "Neurologic: Alert and oriented; reports fatigue.",
    "Respiratory: Lungs clear; respirations unlabored.",
    "Cardiovascular: Regular rhythm; skin warm; no edema.",
    "Genitourinary: Voided 350 mL clear yellow urine at 0945.",
  ],
  medicationAdministrationRecord: [
    "1020: Packed red blood cells initiated at the facility-specified starting rate.",
  ],
  priorityCues: [
    "A blood transfusion has just begun; new symptoms must be evaluated in relation to the transfusion timeline.",
  ],
};

function buildTransfusionChartReview(caseItemNumber: number): PracticeChartReviewMetadata {
  const step = boundedStep(caseItemNumber);
  const nursingNotes = [...(transfusionBaseChart.nursingNotes ?? [])];
  const timeline = [
    "1015: Bedside pretransfusion verification completed.",
    "1020: Packed red blood cell transfusion begins.",
    "1032: Acute symptoms begin 12 minutes after transfusion initiation.",
  ];
  const labs: NonNullable<PracticeChartReviewMetadata["labs"]> = [
    { label: "Pretransfusion hemoglobin", value: "6.8 g/dL", flag: "critical" },
  ];
  const providerOrders: string[] = [
    "Monitor per facility blood-administration and transfusion-reaction policy.",
  ];
  let vitals: NonNullable<PracticeChartReviewMetadata["vitals"]> = [
    { label: "Temperature", value: "101.1 F (38.4 C)", flag: "high" },
    { label: "Heart rate", value: "116/min", flag: "high" },
    { label: "Respiratory rate", value: "24/min", flag: "high" },
    { label: "Blood pressure", value: "88/50 mm Hg", flag: "critical" },
    { label: "SpO2", value: "95% on room air" },
  ];
  nursingNotes.push(
    "1032: After approximately 35 mL has infused, the client develops shaking chills, severe low-back pain, nausea, and a sense of impending doom. Urine in the drainage hat appears dark red-brown.",
  );

  if (step >= 2) {
    nursingNotes.push(
      "1032: Focused assessment shows clear lung sounds, no wheezing or urticaria, no jugular venous distention, and no peripheral edema.",
    );
    timeline.push("1032: Focused reaction assessment is completed.");
  }

  if (step >= 3) {
    nursingNotes.push(
      "1033: The nurse stops the transfusion, disconnects the blood tubing, maintains IV access with new tubing and normal saline per protocol, and calls for immediate assistance.",
    );
    timeline.push("1033: Transfusion-reaction protocol is activated.");
    providerOrders.push(
      "Notify the provider and transfusion service; recheck all client and component identifiers.",
      "Send the blood component and tubing to the transfusion service per policy.",
      "Obtain prescribed postreaction blood and urine specimens.",
      "Monitor hemodynamics and urine output closely; provide supportive treatment as prescribed.",
    );
  }

  if (step >= 4) {
    nursingNotes.push(
      "1045: Transfusion service reports a preliminary ABO discrepancy and begins an urgent compatibility investigation. The client remains hypotensive but is alert.",
    );
    timeline.push("1045: Preliminary laboratory investigation supports immune-mediated hemolysis.");
    labs.push(
      { label: "Direct antiglobulin test", value: "Positive", flag: "critical" },
      { label: "Plasma free hemoglobin", value: "Elevated", flag: "high" },
      { label: "Urinalysis", value: "Hemoglobinuria present", flag: "critical" },
      { label: "LDH", value: "680 units/L", flag: "high" },
      { label: "Haptoglobin", value: "Below reportable range", flag: "low" },
      { label: "Creatinine", value: "1.4 mg/dL (baseline 0.8)", flag: "high" },
    );
  }

  if (step >= 5) {
    nursingNotes.push(
      "1100: Client has oozing at the venipuncture site and urine output is 10 mL over 30 minutes despite prescribed IV fluid. The nurse immediately updates the provider.",
    );
    timeline.push("1100: New renal-perfusion and coagulation cues indicate worsening complications.");
    labs.push(
      { label: "Platelets", value: "84,000/mm3", flag: "low" },
      { label: "Fibrinogen", value: "118 mg/dL", flag: "low" },
      { label: "INR", value: "1.8", flag: "high" },
      { label: "Potassium", value: "5.7 mmol/L", flag: "critical" },
    );
    providerOrders.push(
      "Escalate to critical care; manage shock, hyperkalemia, renal injury, and suspected disseminated intravascular coagulation per prescribed protocols.",
    );
  }

  if (step >= 6) {
    nursingNotes.push(
      "1600: After critical-care treatment, client is alert and denies back pain or nausea. Urine output is 45 mL/hr for the past 2 hours and urine is amber.",
      "1610: No new bleeding is present. The transfusion service confirms an ABO-incompatible component and completes the required reaction documentation.",
    );
    timeline.push(
      "1600: Hemodynamic, renal, and bleeding response is reassessed.",
      "1610: Transfusion-service investigation confirms the reaction mechanism.",
    );
    labs.push(
      { label: "Potassium", value: "4.5 mmol/L" },
      { label: "Creatinine", value: "1.3 mg/dL", flag: "high" },
      { label: "Fibrinogen", value: "205 mg/dL" },
      { label: "Platelets", value: "128,000/mm3", flag: "low" },
    );
    vitals = [
      { label: "Temperature", value: "99.3 F (37.4 C)" },
      { label: "Heart rate", value: "92/min" },
      { label: "Respiratory rate", value: "18/min" },
      { label: "Blood pressure", value: "108/64 mm Hg" },
      { label: "SpO2", value: "97% on room air" },
    ];
  }

  return {
    ...transfusionBaseChart,
    patientCaption: `Unfolding NGN record, item ${step} of 6. Review only information available at this point in the case.`,
    nursingNotes,
    unfoldingTimeline: timeline,
    vitals,
    labs,
    providerOrders,
  };
}

const transfusionDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-adult-acute-hemolytic-transfusion-reaction-ngn",
  title: "Adult Health: Acute Hemolytic Transfusion Reaction",
  references: [
    NCLEX_REFERENCE,
    hemovigilanceReference,
    bloodSafetyReference,
    fdaBloodCircularReference,
  ],
  sourceIds: [
    "ncsbn-2026-rn-test-plan",
    "cdc-nhsn-hemovigilance-protocol-v3-2026",
    "cdc-nhsn-hemovigilance-module-2026",
    "fda-blood-components-circular-guidance-2024",
  ],
  evidenceReviewedAt: EVIDENCE_REVIEWED_AT,
  buildChartReview: buildTransfusionChartReview,
};

const dkaCaseStudyDeck: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(dkaDefinition, {
    id: "codex-nclex-dka-case-01",
    kind: "multi-select",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem: "Which findings require immediate follow-up for a hyperglycemic crisis? Select all that apply.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Select all findings that require immediate follow-up.",
    options: [
      { id: "a", text: "Deep, rapid respirations at 30/min" },
      { id: "b", text: "Large urine ketones" },
      { id: "c", text: "Repeated vomiting and diffuse abdominal pain" },
      { id: "d", text: "Blood pressure 94/58 mm Hg with weak pulses" },
      { id: "e", text: "Home glucose readings above 350 mg/dL" },
      { id: "f", text: "Type 1 diabetes diagnosed at age 13" },
      { id: "g", text: "One DKA admission 4 years ago" },
      { id: "h", text: "No chronic heart failure" },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "The acute combination of marked hyperglycemia, large ketones, vomiting, abdominal pain, Kussmaul respirations, dehydration, tachycardia, and low blood pressure is strongly concerning for diabetic ketoacidosis with volume depletion. These findings require immediate laboratory confirmation and treatment. Type 1 diabetes and a remote DKA episode establish risk, but they are stable history rather than evidence of the client's current physiologic deterioration. The absence of heart failure informs fluid reassessment but does not itself require urgent intervention.",
    rationaleMechanism:
      "Insulin deficiency promotes lipolysis and hepatic ketone production, producing high-anion-gap metabolic acidosis. Respiratory compensation lowers carbon dioxide through deep rapid breathing, while glucose-driven osmotic diuresis causes severe water and electrolyte losses.",
    whyCorrect:
      "The five selected cues connect the defining metabolic process to its immediate respiratory, gastrointestinal, and perfusion consequences. Together they identify an unstable hyperglycemic emergency rather than uncomplicated hyperglycemia.",
    distractorRationales: {
      f: "The diabetes diagnosis explains susceptibility but is not a new cue showing current instability.",
      g: "A remote DKA admission raises recurrence risk but does not establish the severity of today's episode.",
      h: "The absence of heart failure affects treatment context but is not an acute abnormal finding.",
    },
    takeaway: "Recognize DKA as a pattern: hyperglycemia plus ketosis, acidosis compensation, and dehydration.",
    visualRationale: {
      type: "pathway",
      title: "DKA cue cluster",
      nodes: [
        { label: "Insulin deficit", value: "Missed prandial doses during illness" },
        { label: "Ketosis", value: "Large ketones and abdominal symptoms" },
        { label: "Acidosis", value: "Deep rapid respirations" },
        { label: "Volume loss", value: "Thirst, hypotension, weak pulses" },
      ],
      conclusion: "The acute cluster, not the glucose value alone, signals the emergency.",
    },
  }),
  makeVerifiedCaseQuestion(dkaDefinition, {
    id: "codex-nclex-dka-case-02",
    kind: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 4,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem: "For each finding, identify the DKA process it most directly reflects.",
    nclexInstruction: "Select one process for each finding.",
    matrixColumns: [
      "Ketosis/acidosis",
      "Osmotic diuresis",
      "Respiratory compensation",
      "Extracellular potassium shift",
    ],
    matrixRows: [
      { label: "Beta-hydroxybutyrate 5.8 mmol/L and bicarbonate 11 mmol/L", answer: "Ketosis/acidosis" },
      { label: "Thirst, polyuria, BUN 34 mg/dL, and creatinine 1.5 mg/dL", answer: "Osmotic diuresis" },
      { label: "Deep respirations at 30/min", answer: "Respiratory compensation" },
      { label: "Potassium 5.4 mmol/L before insulin despite total-body losses", answer: "Extracellular potassium shift" },
    ],
    correctAnswer: {
      "Beta-hydroxybutyrate 5.8 mmol/L and bicarbonate 11 mmol/L": "Ketosis/acidosis",
      "Thirst, polyuria, BUN 34 mg/dL, and creatinine 1.5 mg/dL": "Osmotic diuresis",
      "Deep respirations at 30/min": "Respiratory compensation",
      "Potassium 5.4 mmol/L before insulin despite total-body losses": "Extracellular potassium shift",
    },
    rationale:
      "Beta-hydroxybutyrate elevation with low bicarbonate reflects ketoacid accumulation. Hyperglycemia causes osmotic diuresis, explaining polyuria, intense thirst, dehydration, and prerenal laboratory changes. Deep rapid respirations are compensation for metabolic acidosis. The initial serum potassium can be high because insulin deficiency, hyperosmolality, and acidosis shift potassium out of cells even while urinary losses produce a total-body deficit. Treatment reverses that shift, so serial potassium monitoring is essential.",
    rationaleMechanism:
      "DKA simultaneously alters acid-base balance, water distribution, renal losses, ventilation, and potassium distribution. Mapping each cue to its mechanism predicts the hazards that can emerge during treatment.",
    whyCorrect:
      "Each selected process is the most direct physiologic explanation for its row and distinguishes measured serum potassium from actual total-body potassium stores.",
    distractorRationales: {
      "ketones::osmotic": "Ketones and low bicarbonate primarily identify ketoacidosis; osmotic diuresis is driven mainly by filtered glucose.",
      "ketones::respiratory": "The laboratory pair measures metabolic acidosis itself, not the ventilatory response to it.",
      "ketones::potassium": "Potassium redistribution does not explain beta-hydroxybutyrate accumulation.",
      "dehydration::ketosis": "Ketosis contributes to illness, but polyuria and prerenal concentration are most directly caused by osmotic water loss.",
      "dehydration::respiratory": "Respiratory compensation does not cause polyuria or prerenal azotemia.",
      "dehydration::potassium": "Potassium shift does not account for the water deficit and elevated BUN.",
      "breathing::ketosis": "Ketosis creates the acid load, but the breathing pattern is the body's compensation for that load.",
      "breathing::osmotic": "Osmotic diuresis causes dehydration, not deep rapid ventilation.",
      "breathing::potassium": "Potassium redistribution can affect rhythm and muscle function but does not produce Kussmaul respirations.",
      "potassium::ketosis": "Ketoacidosis contributes to extracellular shifting, but the high measured potassium is specifically a distribution finding.",
      "potassium::osmotic": "Osmotic diuresis causes potassium loss and would not by itself explain a high initial serum value.",
      "potassium::respiratory": "Respiratory compensation affects carbon dioxide and pH, not the central distinction between serum and total-body potassium.",
    },
    takeaway: "In DKA, a high initial potassium can conceal a dangerous total-body deficit.",
    visualRationale: {
      type: "overview",
      title: "One crisis, four connected processes",
      nodes: [
        { label: "Ketones", value: "Beta-hydroxybutyrate 5.8; bicarbonate 11" },
        { label: "Water loss", value: "Polyuria, thirst, prerenal changes" },
        { label: "Compensation", value: "Deep respirations reduce CO2" },
        { label: "Potassium", value: "High outside cells, depleted overall" },
      ],
      conclusion: "Understanding the mechanism predicts why potassium can fall rapidly with therapy.",
    },
  }),
  makeVerifiedCaseQuestion(dkaDefinition, {
    id: "codex-nclex-dka-case-03",
    kind: "bow-tie",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem: "Complete the bow-tie by selecting the condition, two priority actions, and two parameters to monitor.",
    nclexInstruction: "Select two actions and two monitoring parameters.",
    options: [],
    bowTie: {
      center: {
        id: "dka-condition",
        text: "Diabetic ketoacidosis with dehydration and total-body potassium deficit",
        isCorrect: true,
      },
      leftActions: [
        { id: "dka-fluid", text: "Begin prescribed isotonic IV crystalloid", isCorrect: true },
        { id: "dka-insulin", text: "Prepare prescribed insulin after verifying potassium is safe for initiation", isCorrect: true },
        { id: "dka-bicarb", text: "Give IV sodium bicarbonate immediately for every pH below 7.30", isCorrect: false },
        { id: "dka-fluid-restrict", text: "Restrict fluids because serum sodium is 130 mmol/L", isCorrect: false },
      ],
      rightMonitoring: [
        { id: "dka-k-rhythm", text: "Potassium and cardiac rhythm", isCorrect: true },
        { id: "dka-ketone-ph", text: "Beta-hydroxybutyrate, venous pH, bicarbonate, and glucose", isCorrect: true },
        { id: "dka-a1c-hourly", text: "Hemoglobin A1C every hour", isCorrect: false },
        { id: "dka-weight-yearly", text: "Annual weight trend", isCorrect: false },
      ],
    },
    correctAnswer: {
      center: "dka-condition",
      leftActions: ["dka-fluid", "dka-insulin"],
      rightMonitoring: ["dka-k-rhythm", "dka-ketone-ph"],
    },
    rationale:
      "The glucose, beta-hydroxybutyrate, pH, bicarbonate, anion gap, and dehydration findings establish DKA. Prescribed isotonic fluid restores circulating volume and renal perfusion. Insulin stops ketone production, but potassium must be checked before and during therapy because insulin can rapidly drive potassium into cells. Serial glucose, ketones, acid-base values, potassium, and rhythm show whether treatment is effective and safe. A sodium of 130 mg/dL in marked hyperglycemia does not justify fluid restriction, and bicarbonate is not routine treatment for this degree of acidosis.",
    rationaleMechanism:
      "Fluid treats extracellular depletion, while insulin suppresses lipolysis and ketogenesis. As insulin and acidosis correction move potassium intracellularly, a concealed total-body deficit can become dangerous hypokalemia.",
    whyCorrect:
      "The selected actions treat the two urgent drivers of instability while the selected monitoring detects metabolic resolution and the most immediate treatment-related electrolyte hazard.",
    distractorRationales: {
      "dka-bicarb": "Bicarbonate is not routinely indicated for moderate DKA and can worsen potassium shifts; it requires a narrow protocol-based indication.",
      "dka-fluid-restrict": "The client is clinically volume depleted; the measured sodium must be interpreted in the context of hyperglycemia.",
      "dka-a1c-hourly": "A1C estimates longer-term glycemia and cannot guide hour-to-hour crisis treatment.",
      "dka-weight-yearly": "Annual weight history does not detect immediate response or complications during DKA therapy.",
    },
    takeaway: "Treat DKA with fluid plus insulin, but let potassium determine when insulin is safe.",
    visualRationale: {
      type: "flow",
      title: "DKA stabilization map",
      nodes: [
        { label: "Volume", value: "Isotonic crystalloid restores perfusion" },
        { label: "Ketones", value: "Insulin stops ketogenesis" },
        { label: "Safety gate", value: "Potassium before and during insulin" },
        { label: "Resolution", value: "Ketones and acidosis, not glucose alone" },
      ],
      conclusion: "Glucose can improve before ketoacidosis has resolved.",
    },
  }),
  makeVerifiedCaseQuestion(dkaDefinition, {
    id: "codex-nclex-dka-case-04",
    kind: "ordering",
    category: "Pharmacological and Parenteral Therapies",
    nclexClientNeed: "pharmacological",
    difficulty: 5,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem: "Place the planned DKA interventions in the order the nurse should expect to implement them.",
    nclexInstruction: "Drag the interventions into the correct sequence.",
    options: [
      { id: "a", text: "Begin prescribed isotonic crystalloid and assess perfusion and urine output." },
      { id: "b", text: "Verify the current potassium result and continuous cardiac monitoring." },
      { id: "c", text: "Begin the prescribed insulin infusion when potassium is at a safe level." },
      { id: "d", text: "Add prescribed dextrose-containing fluid when glucose reaches the protocol threshold while insulin continues." },
      { id: "e", text: "Transition to subcutaneous insulin only after ketoacidosis resolves and overlap is prescribed." },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "Initial isotonic fluid supports circulation and renal perfusion. Potassium must then be verified because insulin should not begin when severe hypokalemia is present. Once potassium is safe, insulin suppresses ketogenesis. Dextrose is added when glucose falls to the protocol threshold so insulin can continue clearing ketones without causing hypoglycemia. Subcutaneous transition occurs only after DKA resolution, clinical readiness, and the prescribed overlap that prevents a gap in insulin activity.",
    rationaleMechanism:
      "The sequence protects perfusion first, prevents insulin-triggered dysrhythmia second, and then balances ongoing ketone clearance against hypoglycemia. Overlap prevents rebound ketogenesis as IV insulin is discontinued.",
    whyCorrect:
      "This order follows the physiologic dependencies of DKA therapy rather than treating the glucose number as the only target.",
    distractorRationales: {
      "insulin-before-potassium": "Starting insulin before verifying potassium can precipitate life-threatening hypokalemia and dysrhythmia.",
      "stop-at-normal-glucose": "Stopping insulin when glucose normalizes can leave ketoacidosis untreated; dextrose permits continued insulin.",
      "transition-before-resolution": "Subcutaneous transition before metabolic resolution risks recurrence and an insulin-free gap.",
    },
    takeaway: "Fluids first, potassium safety before insulin, dextrose before insulin must stop, and overlap at transition.",
    visualRationale: {
      type: "timeline",
      title: "Safe DKA treatment sequence",
      items: [
        { label: "1", value: "Restore volume", note: "Isotonic crystalloid and perfusion assessment", highlight: true },
        { label: "2", value: "Check potassium", note: "Cardiac safety gate" },
        { label: "3", value: "Start insulin", note: "Only when potassium is safe" },
        { label: "4", value: "Add dextrose", note: "Continue ketone clearance safely" },
        { label: "5", value: "Overlap transition", note: "After metabolic resolution" },
      ],
      conclusion: "Each step creates the safety conditions for the next.",
    },
  }),
  makeVerifiedCaseQuestion(dkaDefinition, {
    id: "codex-nclex-dka-case-05",
    kind: "mcq",
    category: "Pharmacological and Parenteral Therapies",
    nclexClientNeed: "pharmacological",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem: "Which action should the nurse take first in response to the 1200 findings?",
    nclexInstruction: "Select the most appropriate immediate action.",
    options: [
      { id: "a", text: "Hold the insulin infusion per protocol, maintain cardiac monitoring, notify the provider, and prepare prescribed potassium replacement." },
      { id: "b", text: "Increase the insulin infusion because beta-hydroxybutyrate remains elevated." },
      { id: "c", text: "Discontinue all IV fluids because the glucose is below 250 mg/dL." },
      { id: "d", text: "Administer sodium bicarbonate to correct the potassium level." },
    ],
    correctAnswer: "a",
    rationale:
      "The potassium has fallen to 3.2 mmol/L with premature ventricular contractions and muscle cramping. The immediate priority is to prevent a malignant dysrhythmia: follow the protocol to hold insulin, continue cardiac monitoring, notify the provider, and replace potassium as prescribed. Insulin would drive more potassium into cells and worsen the danger. The client still needs IV fluid and continued DKA treatment; dextrose-containing fluid may be used as prescribed while glucose falls. Sodium bicarbonate does not correct potassium depletion.",
    rationaleMechanism:
      "Insulin activates cellular potassium uptake. In a client with a total-body deficit, continued insulin at a potassium of 3.2 mmol/L can rapidly worsen hypokalemia, impair cardiac repolarization, and provoke ventricular dysrhythmias.",
    whyCorrect:
      "This action directly addresses the new life-threatening treatment complication while preserving the pathway to safely resume definitive DKA therapy.",
    distractorRationales: {
      b: "Increasing insulin would intensify intracellular potassium shift and raise dysrhythmia risk.",
      c: "Glucose improvement does not equal DKA resolution; fluid therapy and ketone-clearing treatment remain necessary.",
      d: "Bicarbonate does not replace depleted potassium and is not indicated for this laboratory pattern.",
    },
    takeaway: "When potassium falls below the insulin safety threshold, potassium correction temporarily outranks ketone clearance.",
    visualRationale: {
      type: "signal",
      title: "Potassium safety stop",
      metrics: [
        { label: "Potassium", value: "3.2 mmol/L", direction: "down", directionLabel: "dangerously falling", range: "3.5-5.0" },
        { label: "Rhythm", value: "Frequent PVCs", direction: "down", directionLabel: "unstable cue" },
        { label: "Ketones", value: "2.1 mmol/L", direction: "down", directionLabel: "improving but unresolved" },
      ],
      conclusion: "Pause the potassium-lowering force, replace potassium, then resume insulin safely.",
    },
  }),
  makeVerifiedCaseQuestion(dkaDefinition, {
    id: "codex-nclex-dka-case-06",
    kind: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 4,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem: "For each reassessment finding, identify whether it supports DKA resolution or requires continued follow-up.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports DKA resolution", "Requires continued follow-up"],
    matrixRows: [
      { label: "Beta-hydroxybutyrate 0.4 mmol/L, venous pH 7.33, and bicarbonate 19 mmol/L", answer: "Supports DKA resolution" },
      { label: "Respirations 18/min and no longer deep; nausea and abdominal pain resolved", answer: "Supports DKA resolution" },
      { label: "Potassium 4.0 mmol/L with no ectopy", answer: "Supports DKA resolution" },
      { label: "Client states, 'I stop all insulin whenever I cannot eat.'", answer: "Requires continued follow-up" },
    ],
    correctAnswer: {
      "Beta-hydroxybutyrate 0.4 mmol/L, venous pH 7.33, and bicarbonate 19 mmol/L": "Supports DKA resolution",
      "Respirations 18/min and no longer deep; nausea and abdominal pain resolved": "Supports DKA resolution",
      "Potassium 4.0 mmol/L with no ectopy": "Supports DKA resolution",
      "Client states, 'I stop all insulin whenever I cannot eat.'": "Requires continued follow-up",
    },
    rationale:
      "Normalized ketone and acid-base values support biochemical resolution, while normal respirations and relief of gastrointestinal symptoms support clinical improvement. Potassium recovery without ectopy indicates that a major treatment hazard is controlled. The statement about stopping all insulin is unsafe and identifies a recurrence risk. Discharge teaching must distinguish basal insulin needs from meal-related dosing and include individualized sick-day glucose and ketone monitoring, hydration guidance, and instructions for contacting the diabetes team.",
    rationaleMechanism:
      "DKA resolves when ketone production is suppressed and acidosis clears, not merely when glucose falls. Ongoing insulin deficiency during illness can restart lipolysis and ketogenesis even when oral intake is poor.",
    whyCorrect:
      "The first three rows demonstrate metabolic, clinical, and electrolyte recovery. The final row exposes a dangerous self-management misconception that could reproduce the precipitating mechanism.",
    distractorRationales: {
      "labs::follow-up": "These ketone and acid-base values meet the expected pattern of metabolic resolution rather than persistent DKA.",
      "symptoms::follow-up": "Resolution of Kussmaul breathing and gastrointestinal symptoms supports recovery when paired with improved laboratory values.",
      "potassium::follow-up": "A potassium of 4.0 mmol/L without ectopy is reassuring, though routine monitoring continues.",
      "teaching::resolved": "Stopping all insulin during illness is unsafe and requires correction before discharge.",
    },
    takeaway: "Evaluate DKA resolution with ketones, acid-base status, symptoms, and a safe prevention plan.",
    visualRationale: {
      type: "compare",
      title: "Resolved crisis versus unresolved risk",
      options: [
        { label: "Ketones and pH", verdict: "correct", note: "Biochemical crisis has resolved" },
        { label: "Breathing and symptoms", verdict: "correct", note: "Clinical acidosis cues have resolved" },
        { label: "Potassium and rhythm", verdict: "correct", note: "Treatment hazard is controlled" },
        { label: "Sick-day belief", verdict: "wrong", note: "Unsafe insulin plan can cause recurrence" },
      ],
      conclusion: "A stable laboratory result is incomplete without a safe plan for the next illness.",
    },
  }),
];

const strokeCaseStudyDeck: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(strokeDefinition, {
    id: "codex-nclex-stroke-case-01",
    kind: "multi-select",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem: "Which findings are the priority cues for a time-sensitive acute stroke response? Select all that apply.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Select all priority cues.",
    options: [
      { id: "a", text: "Sudden right facial droop and right-sided weakness" },
      { id: "b", text: "New severe expressive aphasia" },
      { id: "c", text: "Last known well at 0910 with emergency-department arrival at 0950" },
      { id: "d", text: "Point-of-care glucose 118 mg/dL" },
      { id: "e", text: "No anticoagulant use reported by the client or spouse" },
      { id: "f", text: "Hypertension treated with amlodipine" },
      { id: "g", text: "Hyperlipidemia treated with atorvastatin" },
      { id: "h", text: "No medication allergies" },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "Sudden unilateral motor deficits and aphasia are disabling focal neurologic findings that require immediate stroke activation. A precise last-known-well time establishes the treatment timeline. A normal bedside glucose makes hypoglycemia less likely as a stroke mimic, while anticoagulant status is needed during urgent reperfusion eligibility review. Hypertension and hyperlipidemia are important risk factors, but they do not outrank the acute deficit, time, and mimic-exclusion information. Allergy status is relevant to care but does not establish the stroke emergency.",
    rationaleMechanism:
      "Abrupt loss of function in a specific vascular distribution suggests interruption of cerebral blood flow. Salvageable brain tissue declines over time, so symptom onset, disabling deficits, mimic screening, and bleeding-risk history must be gathered in parallel.",
    whyCorrect:
      "The selected cues answer the immediate questions: Is this a focal neurologic emergency, when did it begin, is glucose causing it, and is there an obvious medication-related treatment barrier?",
    distractorRationales: {
      f: "Hypertension increases stroke risk but is chronic background information rather than the cue that activates the time-sensitive pathway.",
      g: "Hyperlipidemia affects long-term vascular risk, not the first emergency decision.",
      h: "Allergy status should be documented, but it does not identify acute cerebral ischemia or the treatment window.",
    },
    takeaway: "For suspected stroke, identify the disabling focal deficit, exact last-known-well time, glucose, and antithrombotic history immediately.",
    visualRationale: {
      type: "timeline",
      title: "Stroke recognition clock",
      items: [
        { label: "0910", value: "Last known well", note: "Sudden aphasia and right weakness begin", highlight: true },
        { label: "0924", value: "EMS assessment", note: "Focal deficits confirmed" },
        { label: "0950", value: "Stroke alert", note: "Glucose 118; rapid pathway begins" },
      ],
      conclusion: "The clock and disabling deficit move forward together.",
    },
  }),
  makeVerifiedCaseQuestion(strokeDefinition, {
    id: "codex-nclex-stroke-case-02",
    kind: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 4,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem: "For each finding, identify how it affects the initial acute ischemic stroke analysis.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: [
      "Supports acute ischemic stroke",
      "Reduces concern for a mimic",
      "Reduces an identified bleeding barrier",
      "Does not establish eligibility alone",
    ],
    matrixRows: [
      { label: "Persistent aphasia and right hemiparesis", answer: "Supports acute ischemic stroke" },
      { label: "Point-of-care glucose 118 mg/dL", answer: "Reduces concern for a mimic" },
      { label: "Platelets 226,000/mm3, INR 1.0, and no anticoagulant reported", answer: "Reduces an identified bleeding barrier" },
      { label: "Noncontrast CT shows no intracranial hemorrhage", answer: "Does not establish eligibility alone" },
    ],
    correctAnswer: {
      "Persistent aphasia and right hemiparesis": "Supports acute ischemic stroke",
      "Point-of-care glucose 118 mg/dL": "Reduces concern for a mimic",
      "Platelets 226,000/mm3, INR 1.0, and no anticoagulant reported": "Reduces an identified bleeding barrier",
      "Noncontrast CT shows no intracranial hemorrhage": "Does not establish eligibility alone",
    },
    rationale:
      "Persistent disabling focal deficits support acute cerebral ischemia. Normal glucose reduces concern for hypoglycemia as a mimic. Platelet, coagulation, and medication findings reduce identified bleeding barriers but still require the complete eligibility assessment. A noncontrast CT that excludes hemorrhage is essential, yet it does not independently prove ischemic stroke or authorize thrombolysis; the team must integrate time, deficit severity, history, blood pressure, laboratory data, and imaging. This prevents the common error of treating one reassuring result as the entire decision.",
    rationaleMechanism:
      "Acute stroke evaluation is convergent: the neurologic pattern supports ischemia, glucose screens a reversible mimic, bleeding-risk data inform treatment safety, and imaging excludes hemorrhage while the full clinical picture establishes candidacy.",
    whyCorrect:
      "Each row is assigned the narrowest defensible meaning, avoiding both underreaction to disabling deficits and overclaiming what a single test can prove.",
    distractorRationales: {
      "deficit::mimic": "The focal deficits support stroke; they do not by themselves exclude every mimic.",
      "deficit::bleeding": "Neurologic severity does not determine platelet, coagulation, or medication-related bleeding risk.",
      "deficit::eligibility": "Deficits contribute to eligibility but do not establish it without time, imaging, and safety review.",
      "glucose::stroke": "A normal glucose does not prove ischemia; it mainly lowers concern for hypoglycemia as the cause.",
      "glucose::bleeding": "Glucose does not determine hemorrhagic risk from reperfusion therapy.",
      "glucose::eligibility": "A normal glucose is necessary context but cannot establish eligibility alone.",
      "coagulation::stroke": "Normal coagulation data do not prove an ischemic mechanism.",
      "coagulation::mimic": "These findings address bleeding risk, not common neurologic mimics.",
      "coagulation::eligibility": "They remove some barriers but do not replace the complete treatment assessment.",
      "ct::stroke": "Absence of visible hemorrhage does not, by itself, prove that the deficits are ischemic.",
      "ct::mimic": "A normal early CT does not exclude all stroke mimics.",
      "ct::bleeding": "The scan excludes current intracranial blood but does not eliminate every treatment-related bleeding risk.",
    },
    takeaway: "No single stroke test establishes treatment eligibility; integrate deficit, time, mimic screen, bleeding risk, and imaging.",
    visualRationale: {
      type: "overview",
      title: "Four lanes of stroke analysis",
      nodes: [
        { label: "Pattern", value: "Disabling focal deficit" },
        { label: "Mimic screen", value: "Glucose 118 mg/dL" },
        { label: "Bleeding review", value: "Platelets, INR, medications" },
        { label: "Imaging", value: "No hemorrhage; full eligibility still required" },
      ],
      conclusion: "The decision is assembled from all four lanes.",
    },
  }),
  makeVerifiedCaseQuestion(strokeDefinition, {
    id: "codex-nclex-stroke-case-03",
    kind: "bow-tie",
    category: "Management of Care",
    nclexClientNeed: "management_of_care",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem: "Complete the bow-tie by selecting the condition, two priority actions, and two parameters to monitor.",
    nclexInstruction: "Select two actions and two monitoring parameters.",
    options: [],
    bowTie: {
      center: {
        id: "stroke-lvo",
        text: "Acute left middle cerebral artery ischemic stroke with large-vessel occlusion",
        isCorrect: true,
      },
      leftActions: [
        { id: "stroke-reperfusion", text: "Prepare for prescribed IV thrombolysis after final eligibility verification", isCorrect: true },
        { id: "stroke-evt", text: "Activate the endovascular thrombectomy pathway without delaying eligible IV treatment", isCorrect: true },
        { id: "stroke-aspirin", text: "Give aspirin concurrently to strengthen thrombolytic effect", isCorrect: false },
        { id: "stroke-observe", text: "Observe for spontaneous improvement before activating reperfusion pathways", isCorrect: false },
      ],
      rightMonitoring: [
        { id: "stroke-neuro", text: "Serial neurologic status and NIH Stroke Scale findings", isCorrect: true },
        { id: "stroke-bp", text: "Blood pressure and signs of bleeding", isCorrect: true },
        { id: "stroke-lipids", text: "Hourly lipid panel", isCorrect: false },
        { id: "stroke-weight", text: "Daily calf circumference only", isCorrect: false },
      ],
    },
    correctAnswer: {
      center: "stroke-lvo",
      leftActions: ["stroke-reperfusion", "stroke-evt"],
      rightMonitoring: ["stroke-neuro", "stroke-bp"],
    },
    rationale:
      "The sudden disabling left-hemisphere syndrome, absence of hemorrhage, and left M1 occlusion support acute ischemic stroke with large-vessel occlusion. Current stroke guidance supports rapid IV thrombolysis for eligible disabling stroke within the treatment window and urgent endovascular evaluation for appropriate large-vessel occlusion; one pathway should not create avoidable delay in the other. Serial neurologic, blood-pressure, and bleeding assessment detects improvement or treatment complications. Concurrent antithrombotic therapy is not used to enhance thrombolysis, and waiting for spontaneous recovery sacrifices time.",
    rationaleMechanism:
      "IV thrombolysis targets clot dissolution throughout the circulation, while thrombectomy mechanically restores flow through an accessible large-vessel occlusion. Reperfusion can salvage threatened tissue but carries bleeding risk that requires close surveillance.",
    whyCorrect:
      "The center condition matches the vascular syndrome and CTA. The paired actions mobilize both evidence-based reperfusion routes, while monitoring focuses on neurologic response and hemorrhagic safety.",
    distractorRationales: {
      "stroke-aspirin": "Adjuvant antithrombotic medication is not given concurrently to enhance IV thrombolysis because it increases bleeding risk without proven benefit.",
      "stroke-observe": "Disabling deficits in a treatment window require rapid action; observation can forfeit salvageable brain tissue.",
      "stroke-lipids": "Lipids inform secondary prevention, not minute-to-minute reperfusion response.",
      "stroke-weight": "Calf circumference does not measure cerebral reperfusion or post-thrombolytic bleeding.",
    },
    takeaway: "For eligible disabling LVO stroke, mobilize IV and endovascular reperfusion pathways in parallel.",
    visualRationale: {
      type: "flow",
      title: "Parallel reperfusion pathway",
      nodes: [
        { label: "Syndrome", value: "Disabling left-hemisphere deficit" },
        { label: "Imaging", value: "No hemorrhage; left M1 occlusion" },
        { label: "IV pathway", value: "Thrombolysis after final eligibility" },
        { label: "EVT pathway", value: "Immediate thrombectomy activation" },
      ],
      conclusion: "Parallel preparation protects time without skipping safety checks.",
    },
  }),
  makeVerifiedCaseQuestion(strokeDefinition, {
    id: "codex-nclex-stroke-case-04",
    kind: "ordering",
    category: "Management of Care",
    nclexClientNeed: "management_of_care",
    difficulty: 4,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem: "Place the nursing activities in the expected sequence for the authorized reperfusion plan.",
    nclexInstruction: "Drag the activities into the correct sequence.",
    options: [
      { id: "a", text: "Complete the final bedside identity, eligibility, blood-pressure, and medication verification." },
      { id: "b", text: "Administer the prescribed IV thrombolytic using the stroke protocol." },
      { id: "c", text: "Begin protocol neurologic, blood-pressure, and bleeding surveillance." },
      { id: "d", text: "Continue coordinated transfer to the endovascular team for the M1 occlusion." },
      { id: "e", text: "Maintain post-reperfusion precautions and obtain follow-up imaging as ordered." },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "The nurse first completes the final safety verification immediately before administration. The prescribed thrombolytic is then given according to protocol, followed by intensive neurologic, blood-pressure, and bleeding surveillance. Because CTA identified an M1 occlusion, coordination with the endovascular team continues rather than waiting to judge the full IV response. Post-reperfusion precautions and ordered follow-up imaging remain necessary after both therapies. This sequence maintains safety without introducing avoidable treatment delay.",
    rationaleMechanism:
      "Reperfusion benefit is time dependent, but preventable medication and bleeding hazards remain important. A standardized sequence compresses verification, treatment, monitoring, and transfer into one coordinated pathway.",
    whyCorrect:
      "The order preserves the final medication safety check, initiates time-sensitive treatment, and then sustains monitoring and definitive large-vessel management.",
    distractorRationales: {
      "transfer-before-ivt": "When IV thrombolysis is indicated, endovascular transfer preparation should not create an avoidable delay in its administration.",
      "monitor-before-dose": "Baseline assessment is required, but post-thrombolytic surveillance begins after the medication is administered.",
      "wait-for-response": "The team should not wait to see whether IV therapy fully resolves an M1 occlusion before continuing thrombectomy preparation.",
    },
    takeaway: "Verify, treat, monitor, and transfer as one coordinated stroke workflow.",
    visualRationale: {
      type: "timeline",
      title: "Reperfusion workflow",
      items: [
        { label: "1", value: "Final safety check", note: "Identity, eligibility, BP, medications", highlight: true },
        { label: "2", value: "Administer IV therapy", note: "Use stroke protocol" },
        { label: "3", value: "Intensive surveillance", note: "Neurologic, BP, bleeding" },
        { label: "4", value: "Proceed to EVT", note: "Do not wait for complete IV response" },
        { label: "5", value: "Post-treatment precautions", note: "Follow-up imaging and monitoring" },
      ],
      conclusion: "Speed comes from coordination, not omission of safety checks.",
    },
  }),
  makeVerifiedCaseQuestion(strokeDefinition, {
    id: "codex-nclex-stroke-case-05",
    kind: "mcq",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem: "Which action should the nurse take first when the client develops sudden severe headache, nausea, and drowsiness?",
    nclexInstruction: "Select the most appropriate immediate action.",
    options: [
      { id: "a", text: "Stop transfer activity, perform an immediate neurologic and airway assessment, and notify the stroke team for emergency imaging." },
      { id: "b", text: "Give aspirin because the neurologic deficits may be worsening from recurrent ischemia." },
      { id: "c", text: "Lower the systolic blood pressure rapidly to below 140 mm Hg without a provider order." },
      { id: "d", text: "Continue transport without interruption because headache is expected after thrombolysis." },
    ],
    correctAnswer: "a",
    rationale:
      "Sudden severe headache, nausea, drowsiness, and increased blood pressure after thrombolysis are warning signs of possible intracranial hemorrhage. The nurse should stop nonessential movement, assess airway and neurologic status, notify the stroke team immediately, and prepare for emergency brain imaging and treatment orders. Aspirin could worsen bleeding. The nurse should not independently pursue rapid intensive blood-pressure reduction, and the 2026 guideline specifically cautions against intensive systolic lowering below 140 after reperfusion. These symptoms are not an expected finding to ignore.",
    rationaleMechanism:
      "Thrombolysis can destabilize hemostasis and permit intracranial bleeding. Expanding blood can rapidly increase intracranial pressure and impair consciousness, making immediate recognition, imaging, and team-directed reversal or supportive care time critical.",
    whyCorrect:
      "This response addresses airway and neurologic safety while activating the diagnostic pathway that distinguishes hemorrhage from recurrent ischemia or another cause.",
    distractorRationales: {
      b: "Antiplatelet medication can worsen a post-thrombolytic intracranial hemorrhage and should not be given before bleeding is excluded.",
      c: "Abrupt unsupervised blood-pressure reduction can reduce cerebral perfusion; treatment must follow the stroke team's ordered target.",
      d: "Acute headache and declining consciousness after thrombolysis are emergency findings, not routine adverse effects.",
    },
    takeaway: "After thrombolysis, sudden headache or neurologic decline means possible bleeding until emergency imaging proves otherwise.",
    visualRationale: {
      type: "signal",
      title: "Post-thrombolytic danger signal",
      metrics: [
        { label: "Neurologic status", value: "Increasing drowsiness", direction: "down", directionLabel: "acute decline" },
        { label: "Symptom", value: "Sudden severe headache", direction: "up", directionLabel: "new emergency cue" },
        { label: "Blood pressure", value: "188/104 mm Hg", direction: "up", directionLabel: "requires ordered management" },
      ],
      conclusion: "Stop, assess, notify, and image before giving antithrombotic medication.",
    },
  }),
  makeVerifiedCaseQuestion(strokeDefinition, {
    id: "codex-nclex-stroke-case-06",
    kind: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 4,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem: "For each reassessment finding, identify whether it supports neurologic improvement or requires continued follow-up.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports neurologic improvement", "Requires continued follow-up"],
    matrixRows: [
      { label: "NIH Stroke Scale score decreases from 12 to 5", answer: "Supports neurologic improvement" },
      { label: "Client names common objects and lifts the right arm against gravity", answer: "Supports neurologic improvement" },
      { label: "Repeat CT shows no intracranial hemorrhage", answer: "Supports neurologic improvement" },
      { label: "Client coughs after a sip of water before a documented swallow screen", answer: "Requires continued follow-up" },
    ],
    correctAnswer: {
      "NIH Stroke Scale score decreases from 12 to 5": "Supports neurologic improvement",
      "Client names common objects and lifts the right arm against gravity": "Supports neurologic improvement",
      "Repeat CT shows no intracranial hemorrhage": "Supports neurologic improvement",
      "Client coughs after a sip of water before a documented swallow screen": "Requires continued follow-up",
    },
    rationale:
      "A lower NIH Stroke Scale score and improved language and motor function support neurologic response after reperfusion. A repeat CT without hemorrhage is reassuring for a major treatment complication. Coughing with water indicates possible dysphagia and aspiration risk; oral intake should stop until a validated swallow assessment and appropriate plan are completed. Improvement in limb and language function does not guarantee safe swallowing because different neurologic functions recover at different rates.",
    rationaleMechanism:
      "Reperfusion can improve threatened cortical function, but stroke may still impair the coordinated sensory and motor phases of swallowing. Aspiration can remain silent or subtle even as visible motor deficits improve.",
    whyCorrect:
      "The first three findings demonstrate objective neurologic and imaging improvement. The last finding identifies a separate unresolved safety domain that requires immediate aspiration precautions.",
    distractorRationales: {
      "nihss::follow-up": "A fall from 12 to 5 is objective improvement, although residual deficits still need rehabilitation.",
      "function::follow-up": "Improved naming and antigravity movement support recovery rather than deterioration.",
      "ct::follow-up": "No hemorrhage is reassuring after the acute warning episode, while surveillance continues.",
      "cough::improvement": "Coughing with water suggests impaired swallowing and cannot be counted as neurologic recovery.",
    },
    takeaway: "After stroke, evaluate each neurologic domain separately; motor improvement does not prove swallowing safety.",
    visualRationale: {
      type: "compare",
      title: "Reperfusion response and residual risk",
      options: [
        { label: "NIHSS 12 to 5", verdict: "correct", note: "Objective global improvement" },
        { label: "Language and arm strength", verdict: "correct", note: "Functional recovery" },
        { label: "No hemorrhage on CT", verdict: "correct", note: "Major complication not identified" },
        { label: "Cough with water", verdict: "wrong", note: "Unresolved aspiration risk" },
      ],
      conclusion: "Keep NPO until swallowing safety is established.",
    },
  }),
];

const heartFailureCaseStudyDeck: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(heartFailureDefinition, {
    id: "codex-nclex-adhf-case-01",
    kind: "multi-select",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem: "Which findings require immediate follow-up for severe pulmonary congestion? Select all that apply.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Select all findings that require immediate follow-up.",
    options: [
      { id: "a", text: "SpO2 84% on room air with respirations 34/min" },
      { id: "b", text: "Diffuse crackles and pink-tinged frothy sputum" },
      { id: "c", text: "Speaks in two- to three-word phrases while sitting upright" },
      { id: "d", text: "Jugular venous distention, S3, and 3+ leg edema" },
      { id: "e", text: "Weight 6.2 kg above documented dry weight" },
      { id: "f", text: "Left ventricular ejection fraction 30% on a prior study" },
      { id: "g", text: "History of hypertension" },
      { id: "h", text: "No known medication allergies" },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "Severe hypoxemia, tachypnea, limited speech, diffuse crackles, frothy sputum, jugular venous distention, an S3, marked edema, and rapid weight gain show acute respiratory compromise with pulmonary and systemic congestion. These current findings require immediate positioning, oxygenation support, monitoring, and rapid treatment. A prior ejection fraction of 30% explains susceptibility but does not convey the present severity by itself. Hypertension is a chronic risk factor, and allergy status does not identify the immediate threat.",
    rationaleMechanism:
      "Elevated left-sided filling pressure drives fluid into the pulmonary interstitium and alveoli, impairing gas exchange and increasing work of breathing. Elevated systemic venous pressure produces jugular venous distention, edema, and weight gain.",
    whyCorrect:
      "The five selected findings capture both the life-threatening pulmonary consequence and the volume-overload pattern causing it.",
    distractorRationales: {
      f: "Reduced ejection fraction is important history, but the acute oxygenation and congestion findings determine immediate priority.",
      g: "Hypertension contributes to decompensation risk but is not the current respiratory emergency.",
      h: "Allergy status supports medication safety but is not evidence of pulmonary edema.",
    },
    takeaway: "In acute heart failure, prioritize gas-exchange failure first and connect it to the congestion pattern.",
    visualRationale: {
      type: "pathway",
      title: "Congestion to respiratory failure",
      nodes: [
        { label: "Filling pressure rises", value: "JVD, S3, edema, weight gain" },
        { label: "Fluid enters lungs", value: "Diffuse crackles and frothy sputum" },
        { label: "Gas exchange fails", value: "SpO2 84%" },
        { label: "Work increases", value: "RR 34 and fragmented speech" },
      ],
      conclusion: "Pulmonary edema is the immediate threat within a broader volume-overload state.",
    },
  }),
  makeVerifiedCaseQuestion(heartFailureDefinition, {
    id: "codex-nclex-adhf-case-02",
    kind: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 4,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem: "For each finding, identify the clinical domain it most directly supports.",
    nclexInstruction: "Select one domain for each finding.",
    matrixColumns: [
      "Pulmonary congestion",
      "Systemic congestion",
      "Precipitating factor",
      "Perfusion concern",
    ],
    matrixRows: [
      { label: "Bilateral interstitial and alveolar edema on chest radiograph", answer: "Pulmonary congestion" },
      { label: "Jugular venous distention, 3+ edema, and weight 6.2 kg above dry weight", answer: "Systemic congestion" },
      { label: "Missed diuretic doses, high-sodium meals, and ibuprofen use", answer: "Precipitating factor" },
      { label: "Cool diaphoretic skin with weak pedal pulses", answer: "Perfusion concern" },
    ],
    correctAnswer: {
      "Bilateral interstitial and alveolar edema on chest radiograph": "Pulmonary congestion",
      "Jugular venous distention, 3+ edema, and weight 6.2 kg above dry weight": "Systemic congestion",
      "Missed diuretic doses, high-sodium meals, and ibuprofen use": "Precipitating factor",
      "Cool diaphoretic skin with weak pedal pulses": "Perfusion concern",
    },
    rationale:
      "Chest imaging directly confirms pulmonary fluid accumulation. Jugular venous distention, dependent edema, and rapid weight gain show systemic volume congestion. Missed loop diuretic doses, sodium load, and NSAID exposure can promote fluid retention and precipitate decompensation. Cool skin and weak pulses raise concern for impaired forward perfusion even when blood pressure is initially high. Separating congestion from perfusion prevents the nurse from assuming that hypertension guarantees adequate tissue blood flow.",
    rationaleMechanism:
      "Heart-failure decompensation can produce backward pressure and fluid accumulation while forward output becomes insufficient. Precipitants increase sodium and water retention or interrupt the plan that had maintained euvolemia.",
    whyCorrect:
      "Each row maps to a distinct assessment domain needed to define the client's hemodynamic profile and identify reversible contributors.",
    distractorRationales: {
      "xray::systemic": "The radiograph visualizes lung fluid, not peripheral venous congestion.",
      "xray::trigger": "Imaging shows the consequence of decompensation, not what precipitated it.",
      "xray::perfusion": "Pulmonary edema impairs oxygenation but does not directly measure systemic perfusion.",
      "jvd::pulmonary": "JVD, edema, and weight gain primarily demonstrate systemic venous congestion.",
      "jvd::trigger": "These are manifestations, not the behavior or medication exposure that triggered them.",
      "jvd::perfusion": "They indicate volume accumulation rather than directly proving poor forward flow.",
      "trigger::pulmonary": "The behaviors increase congestion risk but are not current lung findings.",
      "trigger::systemic": "The exposures explain why fluid accumulated but are not themselves edema findings.",
      "trigger::perfusion": "They can worsen hemodynamics indirectly but do not directly measure tissue perfusion.",
      "cool::pulmonary": "Cool skin and weak pulses point to forward-flow concerns, not lung fluid.",
      "cool::systemic": "Peripheral edema is congestion; cool skin and weak pulses are perfusion cues.",
      "cool::trigger": "These are current assessment findings, not precipitating behaviors.",
    },
    takeaway: "Assess acute heart failure on two axes: congestion and perfusion, then identify the precipitant.",
    visualRationale: {
      type: "overview",
      title: "Heart-failure assessment grid",
      nodes: [
        { label: "Lungs", value: "Radiographic edema" },
        { label: "Venous volume", value: "JVD, edema, weight gain" },
        { label: "Trigger", value: "Missed diuretic, sodium, NSAID" },
        { label: "Forward flow", value: "Cool skin and weak pulses" },
      ],
      conclusion: "Congestion and hypoperfusion can coexist.",
    },
  }),
  makeVerifiedCaseQuestion(heartFailureDefinition, {
    id: "codex-nclex-adhf-case-03",
    kind: "bow-tie",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem: "Complete the bow-tie by selecting the condition, two priority actions, and two parameters to monitor.",
    nclexInstruction: "Select two actions and two monitoring parameters.",
    options: [],
    bowTie: {
      center: {
        id: "adhf-pulmonary-edema",
        text: "Acute decompensated heart failure with pulmonary edema and hypertensive congestion",
        isCorrect: true,
      },
      leftActions: [
        { id: "adhf-respiratory", text: "Maintain upright positioning and prescribed oxygen or noninvasive ventilatory support", isCorrect: true },
        { id: "adhf-diuretic", text: "Administer the prescribed IV loop diuretic promptly", isCorrect: true },
        { id: "adhf-bolus", text: "Give a rapid 2-liter IV crystalloid bolus", isCorrect: false },
        { id: "adhf-supine", text: "Place the client flat to reduce cardiac workload", isCorrect: false },
      ],
      rightMonitoring: [
        { id: "adhf-resp", text: "Work of breathing, lung sounds, and oxygen saturation", isCorrect: true },
        { id: "adhf-output", text: "Urine output, blood pressure, electrolytes, and renal function", isCorrect: true },
        { id: "adhf-a1c", text: "Hemoglobin A1C every 2 hours", isCorrect: false },
        { id: "adhf-bowel", text: "Bowel sounds as the primary response measure", isCorrect: false },
      ],
    },
    correctAnswer: {
      center: "adhf-pulmonary-edema",
      leftActions: ["adhf-respiratory", "adhf-diuretic"],
      rightMonitoring: ["adhf-resp", "adhf-output"],
    },
    rationale:
      "The client has acute pulmonary edema with severe hypoxemia and marked volume congestion. Upright positioning and prescribed respiratory support improve ventilation and oxygenation while reducing venous return. Prompt prescribed IV loop diuretic is guideline-supported treatment for hospitalized heart failure with significant fluid overload. The nurse monitors respiratory response plus the effects and hazards of decongestion, including urine output, blood pressure, potassium, sodium, BUN, and creatinine. A large crystalloid bolus or supine position would worsen pulmonary hydrostatic pressure.",
    rationaleMechanism:
      "Positive airway pressure can recruit flooded alveoli and reduce cardiac loading conditions, while loop diuresis removes sodium and water to reduce filling pressures. Treatment can also lower blood pressure and electrolytes, requiring close reassessment.",
    whyCorrect:
      "The selected actions address the immediate gas-exchange threat and its congestion driver. The monitoring choices measure both benefit and predictable treatment complications.",
    distractorRationales: {
      "adhf-bolus": "A rapid large-volume bolus would increase filling pressures and can worsen pulmonary edema.",
      "adhf-supine": "Supine positioning increases venous return and worsens orthopnea and respiratory distress.",
      "adhf-a1c": "A1C does not measure acute pulmonary or diuretic response.",
      "adhf-bowel": "Bowel sounds are not the primary indicator of oxygenation, decongestion, or perfusion.",
    },
    takeaway: "Support oxygenation and remove excess volume while watching blood pressure, kidneys, and electrolytes.",
    visualRationale: {
      type: "flow",
      title: "Pulmonary-edema response",
      nodes: [
        { label: "Position and pressure", value: "Improve ventilation and reduce loading" },
        { label: "Diurese", value: "Remove sodium and water" },
        { label: "Measure lungs", value: "SpO2, effort, crackles" },
        { label: "Measure safety", value: "BP, urine, potassium, creatinine" },
      ],
      conclusion: "The treatment target is decongestion without hypoperfusion.",
    },
  }),
  makeVerifiedCaseQuestion(heartFailureDefinition, {
    id: "codex-nclex-adhf-case-04",
    kind: "ordering",
    category: "Pharmacological and Parenteral Therapies",
    nclexClientNeed: "pharmacological",
    difficulty: 4,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem: "Place the interventions in the sequence the nurse should use for the prescribed acute treatment plan.",
    nclexInstruction: "Drag the interventions into the correct sequence.",
    options: [
      { id: "a", text: "Maintain upright positioning, prescribed respiratory support, and continuous monitoring." },
      { id: "b", text: "Verify blood pressure, IV access, baseline urine output, potassium, and renal function." },
      { id: "c", text: "Administer the prescribed IV loop diuretic and prescribed vasodilator while hypertension persists." },
      { id: "d", text: "Reassess dyspnea, lung sounds, oxygen saturation, blood pressure, and urine output frequently." },
      { id: "e", text: "Trend weight, net fluid balance, electrolytes, BUN, and creatinine and report unsafe changes." },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "Immediate respiratory support and monitoring stabilize the most urgent problem. Baseline blood pressure, vascular access, urine output, potassium, and renal function provide medication safety context without delaying urgent care. Prescribed IV diuretic treats congestion, and a prescribed vasodilator may relieve dyspnea in selected clients with adequate blood pressure. The nurse then performs close bedside response assessment and trends cumulative decongestion and laboratory safety. This is a continuous cycle, but the sequence emphasizes stabilization and baseline safety before medication response is interpreted.",
    rationaleMechanism:
      "Diuresis and vasodilation lower filling pressures by different mechanisms. Both can improve pulmonary congestion, but excessive preload or pressure reduction can produce hypotension, kidney injury, and electrolyte loss.",
    whyCorrect:
      "The sequence links each intervention to the assessment needed to determine whether it is effective and still safe.",
    distractorRationales: {
      "medication-before-support": "The client needs immediate oxygenation support and monitoring while medication is prepared.",
      "vasodilator-without-bp": "A vasodilator requires current blood-pressure assessment because symptomatic hypotension can develop quickly.",
      "delay-reassessment": "Waiting until the end of a large diuresis to reassess can miss rapid hypotension or electrolyte-related deterioration.",
    },
    takeaway: "Acute decongestion is an assess-treat-reassess cycle, not a one-time medication task.",
    visualRationale: {
      type: "timeline",
      title: "Safe decongestion sequence",
      items: [
        { label: "1", value: "Support breathing", note: "Upright, oxygen or NIPPV, monitoring", highlight: true },
        { label: "2", value: "Establish baseline", note: "BP, IV, urine, potassium, kidneys" },
        { label: "3", value: "Give ordered therapy", note: "IV diuretic and selected vasodilator" },
        { label: "4", value: "Reassess bedside response", note: "Lungs, SpO2, BP, output" },
        { label: "5", value: "Trend cumulative safety", note: "Weight, balance, electrolytes, renal function" },
      ],
      conclusion: "Every treatment step has a matching safety check.",
    },
  }),
  makeVerifiedCaseQuestion(heartFailureDefinition, {
    id: "codex-nclex-adhf-case-05",
    kind: "mcq",
    category: "Pharmacological and Parenteral Therapies",
    nclexClientNeed: "pharmacological",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem: "Which action should the nurse take first in response to the 0900 findings?",
    nclexInstruction: "Select the most appropriate immediate action.",
    options: [
      { id: "a", text: "Stop the prescribed vasodilator per parameters, maintain safety precautions, reassess perfusion, and notify the provider of symptomatic blood-pressure decline and potassium 3.2 mmol/L." },
      { id: "b", text: "Administer another vasodilator dose because pulmonary crackles remain." },
      { id: "c", text: "Give a rapid 2-liter crystalloid bolus without reassessment because the client is lightheaded." },
      { id: "d", text: "Discontinue all decongestion monitoring because urine output exceeds 1 liter." },
    ],
    correctAnswer: "a",
    rationale:
      "The client has improved congestion but now has lightheadedness with a substantial pressure decline and potassium of 3.2 mmol/L. The nurse should stop the vasodilator according to prescribed parameters, protect the client from falls, reassess perfusion, notify the provider, and prepare to replace potassium as ordered. More vasodilator could worsen hypotension. A large unassessed fluid bolus could recreate pulmonary edema, and monitoring must continue because rapid diuresis can alter blood pressure, renal function, and electrolytes.",
    rationaleMechanism:
      "Vasodilation reduces vascular tone and filling pressures, while loop diuresis reduces intravascular volume and increases urinary potassium loss. Combined effects can shift a congested client toward symptomatic hypotension and dysrhythmia risk.",
    whyCorrect:
      "This response updates treatment to the client's new hemodynamic profile while addressing both perfusion and electrolyte safety.",
    distractorRationales: {
      b: "Persistent mild crackles do not justify worsening symptomatic hypotension with additional vasodilation.",
      c: "An automatic large fluid bolus can worsen cardiogenic pulmonary edema and requires provider-guided reassessment.",
      d: "High urine output is a treatment effect that increases, rather than eliminates, the need for monitoring.",
    },
    takeaway: "When decongestion improves breathing but causes hypotension or hypokalemia, retitrate the plan instead of treating the original profile unchanged.",
    visualRationale: {
      type: "compare",
      title: "Benefit versus overshoot",
      metrics: [
        { label: "Urine output", value: "1,350 mL", direction: "up", directionLabel: "effective diuresis" },
        { label: "Blood pressure", value: "104/66 mm Hg", direction: "down", directionLabel: "symptomatic decline" },
        { label: "Potassium", value: "3.2 mmol/L", direction: "down", directionLabel: "replacement needed", range: "3.5-5.0" },
      ],
      conclusion: "Decongestion is working, but the vasodilator and electrolyte plan need immediate adjustment.",
    },
  }),
  makeVerifiedCaseQuestion(heartFailureDefinition, {
    id: "codex-nclex-adhf-case-06",
    kind: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 4,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem: "For each reassessment finding, identify whether it supports effective decongestion or requires continued follow-up.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports effective decongestion", "Requires continued follow-up"],
    matrixRows: [
      { label: "Speaks in full sentences with respirations 18/min and SpO2 95% on 2 L/min", answer: "Supports effective decongestion" },
      { label: "Crackles limited to posterior bases and edema decreased from 3+ to 1+", answer: "Supports effective decongestion" },
      { label: "Potassium 3.9 mmol/L, blood pressure 118/72 mm Hg, and no lightheadedness", answer: "Supports effective decongestion" },
      { label: "Weight remains 3.7 kg above documented dry weight", answer: "Requires continued follow-up" },
    ],
    correctAnswer: {
      "Speaks in full sentences with respirations 18/min and SpO2 95% on 2 L/min": "Supports effective decongestion",
      "Crackles limited to posterior bases and edema decreased from 3+ to 1+": "Supports effective decongestion",
      "Potassium 3.9 mmol/L, blood pressure 118/72 mm Hg, and no lightheadedness": "Supports effective decongestion",
      "Weight remains 3.7 kg above documented dry weight": "Requires continued follow-up",
    },
    rationale:
      "Improved speech, respiratory rate, oxygenation, lung sounds, edema, potassium, blood pressure, and symptoms show that therapy is improving congestion without current hypoperfusion. Weight still substantially above the documented dry weight indicates residual fluid burden and requires continued assessment and provider-directed decongestion planning. Symptom relief is important but does not prove euvolemia. The nurse should continue daily weights, intake and output, lung and edema assessment, electrolyte and renal monitoring, and self-management teaching.",
    rationaleMechanism:
      "Pulmonary symptoms often improve before total excess body sodium and water are removed. Residual congestion can persist despite better oxygenation and increases risk for recurrent symptoms after discharge.",
    whyCorrect:
      "The first three rows show meaningful clinical and safety improvement; the remaining weight excess prevents premature declaration that the volume goal is complete.",
    distractorRationales: {
      "breathing::follow-up": "This respiratory pattern is a clear improvement from fragmented speech, RR 34, and SpO2 84%.",
      "congestion::follow-up": "Reduced crackles and edema support response, although continued trending remains appropriate.",
      "safety::follow-up": "Normalized potassium and stable pressure without symptoms show correction of the treatment complication.",
      "weight::effective": "A weight still 3.7 kg above dry weight indicates residual congestion, even if breathing feels better.",
    },
    takeaway: "Do not equate symptom relief with euvolemia; compare current weight and examination with the dry baseline.",
    visualRationale: {
      type: "trend",
      title: "Decongestion is substantial but incomplete",
      metrics: [
        { label: "Respiratory rate", value: "34 to 18/min", direction: "down", directionLabel: "improved" },
        { label: "Edema", value: "3+ to 1+", direction: "down", directionLabel: "improved" },
        { label: "Weight excess", value: "+3.7 kg", direction: "down", directionLabel: "residual congestion" },
      ],
      conclusion: "Continue the plan until the clinical volume goal is reached safely.",
    },
  }),
];

const transfusionCaseStudyDeck: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(transfusionDefinition, {
    id: "codex-nclex-ahtr-case-01",
    kind: "multi-select",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem: "Which findings require immediate follow-up as a possible severe transfusion reaction? Select all that apply.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Select all findings that require immediate follow-up.",
    options: [
      { id: "a", text: "Shaking chills and temperature increase to 101.1 F (38.4 C)" },
      { id: "b", text: "Sudden severe low-back pain and nausea" },
      { id: "c", text: "Blood pressure decreases from 124/72 to 88/50 mm Hg" },
      { id: "d", text: "Dark red-brown urine" },
      { id: "e", text: "Symptoms begin 12 minutes after the transfusion starts" },
      { id: "f", text: "Pretransfusion hemoglobin 6.8 g/dL" },
      { id: "g", text: "Postoperative day 2 after colectomy" },
      { id: "h", text: "Penicillin causes a rash" },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "Abrupt fever and rigors, severe back pain, hypotension, hemoglobin-colored urine, and onset during the first minutes of a red-cell transfusion are critical reaction cues. The transfusion must be stopped immediately while the nurse initiates the facility reaction protocol. Anemia explains why blood was prescribed but not the new deterioration. Postoperative status and penicillin allergy are background information and do not explain the tight temporal link between the transfusion and this hemolytic pattern.",
    rationaleMechanism:
      "In an immune acute hemolytic reaction, recipient antibodies bind incompatible donor red cells, activate complement, and cause rapid intravascular hemolysis. Free hemoglobin contributes to dark urine and kidney injury, while inflammatory mediators can produce fever, pain, hypotension, and coagulation activation.",
    whyCorrect:
      "The selected findings combine reaction timing, classic symptoms, hemodynamic instability, and visible evidence of hemolysis.",
    distractorRationales: {
      f: "The low hemoglobin is the indication for transfusion, not a new sign of a reaction.",
      g: "Postoperative status provides clinical context but does not explain sudden symptoms minutes after blood begins.",
      h: "A penicillin rash does not establish an acute reaction to a blood component.",
    },
    takeaway: "During transfusion, sudden fever, pain, hypotension, or dark urine means stop and investigate immediately.",
    visualRationale: {
      type: "timeline",
      title: "Reaction timing and cue cluster",
      items: [
        { label: "1020", value: "RBC transfusion begins", note: "Baseline stable" },
        { label: "1032", value: "Rigors and back pain", note: "Abrupt new symptoms", highlight: true },
        { label: "1032", value: "BP 88/50 and dark urine", note: "Shock and hemolysis cues", highlight: true },
      ],
      conclusion: "The temporal relationship makes this an emergency transfusion reaction until proven otherwise.",
    },
  }),
  makeVerifiedCaseQuestion(transfusionDefinition, {
    id: "codex-nclex-ahtr-case-02",
    kind: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 5,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem: "For each assessment pattern, identify the transfusion reaction it most strongly supports.",
    nclexInstruction: "Select one reaction for each pattern.",
    matrixColumns: [
      "Acute hemolytic reaction",
      "Allergic reaction",
      "Transfusion-associated circulatory overload",
      "Febrile nonhemolytic reaction",
    ],
    matrixRows: [
      { label: "Fever, severe back pain, hypotension, and dark urine during red-cell transfusion", answer: "Acute hemolytic reaction" },
      { label: "Pruritus and urticaria without fever, pain, hypotension, or respiratory compromise", answer: "Allergic reaction" },
      { label: "Dyspnea, hypertension, jugular venous distention, crackles, and pulmonary edema", answer: "Transfusion-associated circulatory overload" },
      { label: "Fever and chills without hemolysis, hypotension, or respiratory findings", answer: "Febrile nonhemolytic reaction" },
    ],
    correctAnswer: {
      "Fever, severe back pain, hypotension, and dark urine during red-cell transfusion": "Acute hemolytic reaction",
      "Pruritus and urticaria without fever, pain, hypotension, or respiratory compromise": "Allergic reaction",
      "Dyspnea, hypertension, jugular venous distention, crackles, and pulmonary edema": "Transfusion-associated circulatory overload",
      "Fever and chills without hemolysis, hypotension, or respiratory findings": "Febrile nonhemolytic reaction",
    },
    rationale:
      "Acute hemolysis is distinguished by pain, hypotension, hemoglobinuria, and other hemolytic findings during or soon after transfusion. An uncomplicated allergic reaction is dominated by pruritus and urticaria. Circulatory overload produces a volume-overload respiratory pattern with hypertension, jugular venous distention, crackles, and edema. A febrile nonhemolytic reaction can produce fever and rigors but lacks evidence of hemolysis. Because severe reactions overlap early, the nurse stops the transfusion first and lets urgent clinical and laboratory evaluation refine the diagnosis.",
    rationaleMechanism:
      "Different blood-component reactions injure through different pathways: red-cell destruction, mast-cell mediator release, hydrostatic fluid overload, or cytokine and leukocyte-mediated fever.",
    whyCorrect:
      "Each pattern uses its strongest discriminator rather than relying on fever alone, which can occur in several transfusion reactions.",
    distractorRationales: {
      "hemolytic::allergic": "Urticaria and pruritus, not back pain and hemoglobinuria, characterize an uncomplicated allergic pattern.",
      "hemolytic::taco": "TACO usually presents with pulmonary congestion and often hypertension, not hemoglobin-colored urine and severe back pain.",
      "hemolytic::febrile": "A febrile nonhemolytic reaction lacks evidence of intravascular hemolysis and shock.",
      "allergic::hemolytic": "Isolated skin findings without fever, pain, or dark urine do not support hemolysis.",
      "allergic::taco": "Pruritus and hives are not hydrostatic volume-overload findings.",
      "allergic::febrile": "An uncomplicated allergic reaction is cutaneous, whereas a febrile reaction centers on fever or rigors.",
      "taco::hemolytic": "Pulmonary edema and JVD support volume overload rather than red-cell destruction.",
      "taco::allergic": "Crackles and JVD are not an isolated histamine-mediated skin reaction.",
      "taco::febrile": "The respiratory volume-overload pattern is more specific than fever or chills.",
      "febrile::hemolytic": "Without hemolysis, pain, or hypotension, a simple febrile pattern does not meet the stronger hemolytic profile.",
      "febrile::allergic": "Fever and rigors without urticaria do not fit an uncomplicated allergic reaction.",
      "febrile::taco": "Absence of respiratory congestion and hypertension argues against TACO.",
    },
    takeaway: "Stop every suspected reaction first; then use hemolysis, skin, volume, and fever patterns to differentiate it.",
    visualRationale: {
      type: "compare",
      title: "Four transfusion-reaction signatures",
      nodes: [
        { label: "Hemolytic", value: "Back pain, hypotension, dark urine" },
        { label: "Allergic", value: "Pruritus and urticaria" },
        { label: "TACO", value: "Hypertension, JVD, pulmonary edema" },
        { label: "Febrile", value: "Fever or rigors without hemolysis" },
      ],
      conclusion: "Fever is nonspecific; the accompanying pattern identifies the danger.",
    },
  }),
  makeVerifiedCaseQuestion(transfusionDefinition, {
    id: "codex-nclex-ahtr-case-03",
    kind: "bow-tie",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem: "Complete the bow-tie by selecting the condition, two priority actions, and two parameters to monitor.",
    nclexInstruction: "Select two actions and two monitoring parameters.",
    options: [],
    bowTie: {
      center: {
        id: "ahtr-condition",
        text: "Suspected acute hemolytic transfusion reaction",
        isCorrect: true,
      },
      leftActions: [
        { id: "ahtr-stop", text: "Stop the transfusion and maintain IV access with new tubing and normal saline per protocol", isCorrect: true },
        { id: "ahtr-notify", text: "Notify the provider and transfusion service and initiate the reaction workup", isCorrect: true },
        { id: "ahtr-slow", text: "Slow the transfusion and reassess after 15 minutes", isCorrect: false },
        { id: "ahtr-discard", text: "Discard the blood bag and tubing in the bedside biohazard container", isCorrect: false },
      ],
      rightMonitoring: [
        { id: "ahtr-hemodynamics", text: "Blood pressure, heart rate, temperature, and mental status", isCorrect: true },
        { id: "ahtr-renal", text: "Urine output, urine color, potassium, creatinine, and coagulation findings", isCorrect: true },
        { id: "ahtr-calories", text: "Daily calorie count as the primary response measure", isCorrect: false },
        { id: "ahtr-incision", text: "Surgical incision length every 5 minutes", isCorrect: false },
      ],
    },
    correctAnswer: {
      center: "ahtr-condition",
      leftActions: ["ahtr-stop", "ahtr-notify"],
      rightMonitoring: ["ahtr-hemodynamics", "ahtr-renal"],
    },
    rationale:
      "The abrupt hemolytic and shock pattern during a red-cell transfusion makes acute hemolytic reaction the leading hypothesis. The transfusion is stopped immediately and must not be restarted. IV access is maintained with new tubing and compatible saline according to protocol, while the provider and transfusion service are notified and the reaction workup begins. Hemodynamics, renal function, urine, potassium, and coagulation are monitored because intravascular hemolysis can cause shock, acute kidney injury, hyperkalemia, and disseminated intravascular coagulation. The component and tubing are preserved for investigation.",
    rationaleMechanism:
      "Stopping the donor-cell exposure limits additional hemolysis. Rapid communication and specimen/product evaluation identify incompatibility while supportive treatment protects perfusion, kidneys, and coagulation.",
    whyCorrect:
      "The selected actions halt the cause and activate definitive evaluation; the monitoring choices target the major life-threatening complications.",
    distractorRationales: {
      "ahtr-slow": "A suspected severe reaction requires complete cessation, not a reduced rate or trial restart.",
      "ahtr-discard": "The component and tubing are retained and sent according to policy because they are essential to the investigation.",
      "ahtr-calories": "Nutrition does not measure acute hemolysis, shock, or renal injury.",
      "ahtr-incision": "The incision remains relevant postoperative data but does not monitor the transfusion reaction.",
    },
    takeaway: "Stop the blood, keep the vein open safely, notify, preserve the product, and monitor shock, kidneys, potassium, and coagulation.",
    visualRationale: {
      type: "flow",
      title: "Acute reaction response",
      nodes: [
        { label: "Stop exposure", value: "Transfusion off; never restart the unit" },
        { label: "Keep access", value: "New tubing and saline per protocol" },
        { label: "Activate", value: "Provider and transfusion service" },
        { label: "Protect organs", value: "Hemodynamics, urine, potassium, coagulation" },
      ],
      conclusion: "The first response both limits injury and preserves the evidence needed to explain it.",
    },
  }),
  makeVerifiedCaseQuestion(transfusionDefinition, {
    id: "codex-nclex-ahtr-case-04",
    kind: "ordering",
    category: "Management of Care",
    nclexClientNeed: "management_of_care",
    difficulty: 4,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem: "Place the transfusion-reaction activities in the order the nurse should perform them.",
    nclexInstruction: "Drag the activities into the correct sequence.",
    options: [
      { id: "a", text: "Stop the transfusion immediately and assess airway, breathing, circulation, and vital signs." },
      { id: "b", text: "Disconnect the blood tubing and maintain IV access with new tubing and normal saline per protocol." },
      { id: "c", text: "Notify the provider and transfusion service and recheck client and component identification." },
      { id: "d", text: "Obtain prescribed postreaction blood and urine specimens." },
      { id: "e", text: "Send the component and tubing to the transfusion service and document the reaction and response per policy." },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "Immediate cessation prevents additional incompatible cells from entering the circulation while the nurse assesses physiologic stability. Safe IV access is maintained with new tubing and saline according to protocol. The provider and transfusion service are then notified and identification is rechecked so clinical treatment and compatibility investigation proceed rapidly. Prescribed blood and urine specimens are obtained, and the component with tubing is returned rather than discarded. Documentation records timing, symptoms, actions, specimens, notifications, and response.",
    rationaleMechanism:
      "This sequence limits exposure first, preserves resuscitation access second, and then coordinates clinical stabilization with the laboratory chain of evidence needed to confirm hemolysis and incompatibility.",
    whyCorrect:
      "The order protects the client before administrative tasks while still preserving the product and specimens required for an accurate investigation.",
    distractorRationales: {
      "notify-before-stop": "Notification is urgent, but the incompatible exposure must be stopped first.",
      "specimens-before-stability": "Specimen collection must not delay cessation, ABC assessment, or maintenance of IV access.",
      "discard-product": "Discarding the unit or tubing destroys evidence needed by the transfusion service.",
    },
    takeaway: "Patient safety first, investigation second, but preserve the blood product throughout.",
    visualRationale: {
      type: "timeline",
      title: "Transfusion-reaction sequence",
      items: [
        { label: "1", value: "Stop and assess", note: "Limit exposure; check ABCs", highlight: true },
        { label: "2", value: "Maintain access", note: "New tubing and saline per protocol" },
        { label: "3", value: "Notify and verify", note: "Provider, blood bank, identifiers" },
        { label: "4", value: "Collect specimens", note: "Postreaction blood and urine" },
        { label: "5", value: "Return and document", note: "Preserve component and full timeline" },
      ],
      conclusion: "Do not let specimen or paperwork tasks delay stopping the transfusion.",
    },
  }),
  makeVerifiedCaseQuestion(transfusionDefinition, {
    id: "codex-nclex-ahtr-case-05",
    kind: "mcq",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem: "Which action should the nurse take first in response to the 1100 findings?",
    nclexInstruction: "Select the most appropriate immediate action.",
    options: [
      { id: "a", text: "Notify the provider and rapid-response or critical-care team immediately while continuing hemodynamic, cardiac, bleeding, and urine-output monitoring." },
      { id: "b", text: "Restart the transfusion because the anemia remains severe." },
      { id: "c", text: "Apply pressure to the venipuncture site and wait for the next routine laboratory draw." },
      { id: "d", text: "Administer a potassium supplement for the potassium of 5.7 mmol/L." },
    ],
    correctAnswer: "a",
    rationale:
      "Oliguria, venipuncture-site oozing, thrombocytopenia, low fibrinogen, elevated INR, hyperkalemia, and rising creatinine indicate worsening acute kidney injury and possible disseminated intravascular coagulation after hemolysis. The nurse immediately escalates care while maintaining continuous assessment and implementing prescribed shock, hyperkalemia, renal, and coagulation treatments. The implicated unit must never be restarted. Local pressure alone does not address systemic coagulation failure, and potassium administration would worsen dangerous hyperkalemia.",
    rationaleMechanism:
      "Free hemoglobin and hypotension injure renal tubules and reduce filtration. Complement and coagulation activation can consume platelets and fibrinogen, while red-cell destruction and reduced renal clearance elevate potassium, creating simultaneous bleeding and dysrhythmia threats.",
    whyCorrect:
      "Immediate escalation mobilizes the critical-care resources needed for multiple evolving organ threats while the nurse maintains the monitoring that guides treatment.",
    distractorRationales: {
      b: "A suspected incompatible unit is permanently stopped; restarting it would add more antigen and accelerate hemolysis.",
      c: "Pressure may limit local bleeding but cannot treat systemic DIC, shock, renal injury, or hyperkalemia.",
      d: "The potassium is already dangerously elevated; supplementation could trigger a fatal dysrhythmia.",
    },
    takeaway: "After acute hemolysis, new oliguria, bleeding, or hyperkalemia signals organ injury that requires immediate escalation.",
    visualRationale: {
      type: "pathway",
      title: "Hemolysis complication cascade",
      nodes: [
        { label: "Red cells lyse", value: "Free hemoglobin and potassium released" },
        { label: "Kidneys threatened", value: "Creatinine rises; urine output falls" },
        { label: "Coagulation consumed", value: "Oozing, platelets 84,000, fibrinogen 118" },
        { label: "Rhythm threatened", value: "Potassium 5.7 mmol/L" },
      ],
      conclusion: "The problem has progressed from a reaction to multisystem instability.",
    },
  }),
  makeVerifiedCaseQuestion(transfusionDefinition, {
    id: "codex-nclex-ahtr-case-06",
    kind: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 4,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem: "For each reassessment finding, identify whether it supports stabilization or requires continued follow-up.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports stabilization", "Requires continued follow-up"],
    matrixRows: [
      { label: "Blood pressure 108/64 mm Hg with heart rate 92/min and clear mentation", answer: "Supports stabilization" },
      { label: "Urine output 45 mL/hr for 2 hours with amber urine", answer: "Supports stabilization" },
      { label: "Potassium 4.5 mmol/L and no new bleeding", answer: "Supports stabilization" },
      { label: "Creatinine remains 1.3 mg/dL compared with baseline 0.8 mg/dL", answer: "Requires continued follow-up" },
    ],
    correctAnswer: {
      "Blood pressure 108/64 mm Hg with heart rate 92/min and clear mentation": "Supports stabilization",
      "Urine output 45 mL/hr for 2 hours with amber urine": "Supports stabilization",
      "Potassium 4.5 mmol/L and no new bleeding": "Supports stabilization",
      "Creatinine remains 1.3 mg/dL compared with baseline 0.8 mg/dL": "Requires continued follow-up",
    },
    rationale:
      "Improved hemodynamics and mentation support recovery from shock. Adequate urine output with clearing urine supports improved renal perfusion and reduced hemoglobinuria. Normal potassium and absence of new bleeding show control of immediate dysrhythmia and coagulation threats. Creatinine remains above baseline, so acute kidney injury has not fully resolved and requires continued urine, fluid, electrolyte, and renal-function monitoring. Stabilization does not erase the confirmed transfusion reaction or the need for permanent documentation and future transfusion precautions.",
    rationaleMechanism:
      "Circulatory recovery restores renal blood flow and limits further ischemic injury, but creatinine can lag behind clinical improvement because damaged nephrons need time to recover.",
    whyCorrect:
      "The first three findings show immediate organ-system stabilization; the residual creatinine elevation identifies incomplete renal recovery.",
    distractorRationales: {
      "hemodynamics::follow-up": "These values and clear mentation are substantially improved from hypotensive shock.",
      "urine::follow-up": "Sustained urine output and clearing color support renal and hemolysis improvement.",
      "potassium::follow-up": "Normalized potassium and no bleeding support control of the immediate complications.",
      "creatinine::stable": "Creatinine remains above baseline and cannot be classified as complete renal recovery.",
    },
    takeaway: "Evaluate both immediate stabilization and delayed organ recovery after a severe transfusion reaction.",
    visualRationale: {
      type: "compare",
      title: "Stabilized now, renal recovery ongoing",
      options: [
        { label: "Hemodynamics", verdict: "correct", note: "Shock findings have improved" },
        { label: "Urine output", verdict: "correct", note: "Renal perfusion is improving" },
        { label: "Potassium and bleeding", verdict: "correct", note: "Immediate complications controlled" },
        { label: "Creatinine", verdict: "partial", note: "Still above baseline; continue follow-up" },
      ],
      conclusion: "Clinical recovery can precede normalization of kidney injury markers.",
    },
  }),
];

export const verifiedAdultAcuteNclexCaseStudyDeck: PracticeQuestion[] = [
  ...dkaCaseStudyDeck,
  ...strokeCaseStudyDeck,
  ...heartFailureCaseStudyDeck,
  ...transfusionCaseStudyDeck,
];
