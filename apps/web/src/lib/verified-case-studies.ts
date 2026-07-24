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

const sepsisReferences: CaseReference[] = [
  NCLEX_REFERENCE,
  {
    title: "Surviving Sepsis Campaign Adult Guidelines",
    citation: "SCCM and ESICM, 2026",
    href: "https://www.sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines",
  },
  {
    title: "Caring for Patients with Sepsis",
    citation: "Centers for Disease Control and Prevention, 2025",
    href: "https://www.cdc.gov/sepsis/hcp/clinical-care/index.html",
  },
];

const sepsisBaseChart: PracticeChartReviewMetadata = {
  patientTitle: "Day 1: Emergency Department",
  patientCaption: "Unfolding emergency-department record. New information appears as the case advances.",
  chiefComplaint: "Fever, weakness, and new confusion after urinary symptoms.",
  hpi: [
    "A 72-year-old client developed urinary frequency, dysuria, and right flank discomfort 3 days ago.",
    "The client's daughter reports shaking chills, poor oral intake, and increasing weakness over the past 24 hours.",
    "The client was independent and fully oriented at baseline but became confused this morning and could not state the date.",
    "The client denies chest pain, unilateral weakness, recent surgery, and recent hospitalization.",
  ],
  history: [
    "Type 2 diabetes mellitus treated with metformin.",
    "Hypertension treated with lisinopril.",
    "Baseline serum creatinine documented as 0.9 mg/dL 2 months ago.",
    "No baseline cognitive impairment and no known heart failure.",
  ],
  allergies: ["No known medication allergies."],
  nursingNotes: [
    "1410: Client arrives by wheelchair, appears acutely ill, and is lethargic but arouses to voice. Client is oriented to person and place but not time.",
    "1415: Skin is warm and flushed. Right costovertebral-angle and suprapubic tenderness are present. Urine specimen is cloudy and malodorous.",
  ],
  assessments: [
    "Neurologic: Follows simple commands; new disorientation to time.",
    "Cardiovascular: Tachycardic with weak peripheral pulses and capillary refill of 4 seconds.",
    "Respiratory: Tachypneic; breath sounds clear bilaterally.",
    "Genitourinary: Dysuria, urinary frequency, cloudy urine, and right flank tenderness.",
  ],
  priorityCues: [
    "Suspected urinary infection with fever, new confusion, hypotension, tachycardia, tachypnea, and delayed capillary refill.",
  ],
};

const sepsisInitialVitals: NonNullable<PracticeChartReviewMetadata["vitals"]> = [
  { label: "Temperature", value: "102.4 F (39.1 C)", flag: "high" },
  { label: "Heart rate", value: "126/min", flag: "critical" },
  { label: "Respiratory rate", value: "28/min", flag: "high" },
  { label: "Blood pressure", value: "86/48 mm Hg (MAP 61)", flag: "critical" },
  { label: "SpO2", value: "94% on room air" },
];

function buildSepsisChartReview(caseItemNumber: number): PracticeChartReviewMetadata {
  const step = Math.max(1, Math.min(6, caseItemNumber));
  const nursingNotes = [...(sepsisBaseChart.nursingNotes ?? [])];
  const timeline = [
    "1410: Emergency-department triage completed.",
    "1415: Focused neurologic, perfusion, and genitourinary assessment documented.",
  ];
  const labs: NonNullable<PracticeChartReviewMetadata["labs"]> = [];
  const providerOrders: string[] = [
    "Place client on continuous cardiac, oxygen-saturation, and frequent blood-pressure monitoring.",
    "Establish two peripheral IV access sites.",
  ];

  if (step >= 2) {
    nursingNotes.push("1425: Extremities are now cool. Peripheral pulses remain weak and capillary refill is 4 seconds. Urine output since arrival is 10 mL.");
    timeline.push("1425: Initial laboratory and urinalysis results become available.");
    labs.push(
      { label: "WBC", value: "18,400/mm3", flag: "high" },
      { label: "Serum lactate", value: "4.2 mmol/L", flag: "critical" },
      { label: "Creatinine", value: "1.7 mg/dL (baseline 0.9)", flag: "high" },
      { label: "Glucose", value: "218 mg/dL", flag: "high" },
      { label: "Urinalysis", value: "positive nitrites, leukocyte esterase, and pyuria", flag: "high" },
    );
  }

  if (step >= 3) {
    nursingNotes.push("1430: The nurse notifies the emergency provider and initiates the facility sepsis response for suspected urinary infection with acute hypoperfusion.");
    timeline.push("1430: Sepsis response activated.");
  }

  if (step >= 4) {
    providerOrders.push(
      "Obtain two sets of blood cultures and a urine culture without delaying antimicrobial therapy.",
      "Administer prescribed broad-spectrum IV antimicrobial therapy promptly after cultures are collected.",
      "Administer prescribed isotonic crystalloid bolus with frequent reassessment.",
      "Repeat serum lactate and trend urine output and other perfusion findings.",
    );
    timeline.push("1435: Cultures, antimicrobial therapy, crystalloid resuscitation, and repeat perfusion assessment are ordered.");
  }

  if (step >= 5) {
    nursingNotes.push(
      "1530: Prescribed initial crystalloid resuscitation is complete. Blood pressure is 82/44 mm Hg (MAP 57), capillary refill is 4 seconds, and the client remains confused. Breath sounds remain clear.",
    );
    providerOrders.push(
      "Begin norepinephrine infusion per facility protocol and titrate to the prescribed MAP target.",
      "Transfer to intensive care when a bed is available.",
    );
    timeline.push("1530: Hypotension and hypoperfusion persist after initial crystalloid resuscitation.");
  }

  if (step >= 6) {
    nursingNotes.push(
      "1700: Norepinephrine is infusing. Client is alert and correctly states name, location, and date. MAP is 68 mm Hg, capillary refill is 2 seconds, and urine output is 45 mL in the past hour.",
      "1710: New fine crackles are heard at both posterior lung bases and SpO2 is 89% on room air. The nurse raises the head of the bed, applies oxygen per protocol, and notifies the provider.",
    );
    labs.push({ label: "Repeat serum lactate", value: "2.3 mmol/L", flag: "high" });
    timeline.push("1700: Perfusion improves.", "1710: New respiratory finding requires continued reassessment.");
  }

  return {
    ...sepsisBaseChart,
    patientCaption: `Unfolding NGN record, item ${step} of 6. Review only information available at this point in the case.`,
    nursingNotes,
    unfoldingTimeline: timeline,
    vitals: step >= 6
      ? [
        { label: "Temperature", value: "100.9 F (38.3 C)", flag: "high" },
        { label: "Heart rate", value: "98/min" },
        { label: "Respiratory rate", value: "24/min", flag: "high" },
        { label: "Blood pressure", value: "104/50 mm Hg (MAP 68)" },
        { label: "SpO2", value: "89% on room air", flag: "critical" },
      ]
      : sepsisInitialVitals,
    labs,
    providerOrders,
  };
}

const sepsisDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-sepsis-urinary-ngn",
  title: "Adult Health: Sepsis with Acute Hypoperfusion",
  references: sepsisReferences,
  sourceIds: ["ncsbn-2026-rn-test-plan", "sccm-ssc-adult-2026", "cdc-sepsis-clinical-care-2025"],
  evidenceReviewedAt: "2026-07-23",
  buildChartReview: buildSepsisChartReview,
};

const sepsisCaseStudyDeck: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(sepsisDefinition, {
    id: "codex-nclex-sepsis-case-01",
    kind: "multi-select",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem: "Click to highlight the findings that require immediate follow-up for possible sepsis and impaired perfusion.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Click to highlight every finding that requires immediate follow-up.",
    options: [
      { id: "a", text: "New disorientation to time" },
      { id: "b", text: "Temperature 102.4 F (39.1 C)" },
      { id: "c", text: "Heart rate 126/min" },
      { id: "d", text: "Blood pressure 86/48 mm Hg" },
      { id: "e", text: "Respiratory rate 28/min" },
      { id: "f", text: "Type 2 diabetes mellitus" },
      { id: "g", text: "Takes lisinopril for hypertension" },
      { id: "h", text: "Denies recent surgery" },
    ],
    highlightRows: [
      { label: "Neurologic", text: "New disorientation to time", optionId: "a" },
      { label: "Vital signs", text: "Temperature 102.4 F (39.1 C)", optionId: "b" },
      { label: "Vital signs", text: "Heart rate 126/min", optionId: "c" },
      { label: "Vital signs", text: "Blood pressure 86/48 mm Hg", optionId: "d" },
      { label: "Vital signs", text: "Respiratory rate 28/min", optionId: "e" },
      { label: "History", text: "Type 2 diabetes mellitus", optionId: "f" },
      { label: "Medications", text: "Takes lisinopril for hypertension", optionId: "g" },
      { label: "History", text: "Denies recent surgery", optionId: "h" },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "The acute cluster of fever, new mental-status change, tachycardia, tachypnea, and marked hypotension demands immediate sepsis evaluation and resuscitation. The urinary symptoms provide a plausible infectious source, while confusion and low blood pressure signal possible organ dysfunction and impaired perfusion. Diabetes increases infection risk, but it is chronic background information rather than the change requiring the first response. Lisinopril use and the absence of recent surgery also do not explain the full time-sensitive pattern. On NCLEX cue-recognition items, prioritize new physiologic instability over stable history.",
    rationaleMechanism:
      "An infection can trigger a dysregulated systemic response that causes vasodilation, endothelial dysfunction, and maldistributed blood flow. Falling vascular tone and impaired tissue perfusion produce hypotension, delayed capillary refill, altered mentation, and eventual organ injury.",
    whyCorrect:
      "These five findings are simultaneous acute changes that connect suspected infection to respiratory compensation, circulatory failure, and neurologic dysfunction. Their combination is more urgent than any one isolated risk factor.",
    distractorRationales: {
      f: "Diabetes increases infection susceptibility, but it is a chronic risk factor rather than an acute sign of current hypoperfusion.",
      g: "Lisinopril can affect blood pressure, but the medication history does not account for fever, confusion, tachycardia, tachypnea, and urinary infection cues together.",
      h: "The absence of recent surgery does not reduce the urgency of the client's current infection and perfusion abnormalities.",
    },
    takeaway: "Cluster infection cues with new organ or perfusion changes; do not let chronic history outrank instability.",
    visualRationale: {
      type: "pathway",
      title: "From infection to urgent perfusion risk",
      nodes: [
        { label: "Likely source", value: "Dysuria, flank tenderness, cloudy urine" },
        { label: "System response", value: "Fever, tachycardia, tachypnea" },
        { label: "Perfusion failure", value: "BP 86/48 and delayed refill" },
        { label: "Organ cue", value: "New confusion" },
      ],
      conclusion: "The source plus acute perfusion and organ cues makes immediate escalation necessary.",
    },
  }),
  makeVerifiedCaseQuestion(sepsisDefinition, {
    id: "codex-nclex-sepsis-case-02",
    kind: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 4,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem: "For each finding, click to identify the clinical pattern it most directly supports.",
    nclexInstruction: "Select one pattern for each finding.",
    matrixColumns: ["Suspected infection source", "Impaired perfusion", "Acute organ dysfunction"],
    matrixRows: [
      { label: "Right flank tenderness with nitrites, leukocyte esterase, and pyuria", answer: "Suspected infection source" },
      { label: "Capillary refill 4 seconds with weak peripheral pulses", answer: "Impaired perfusion" },
      { label: "New disorientation to time", answer: "Acute organ dysfunction" },
      { label: "Creatinine 1.7 mg/dL from baseline 0.9 mg/dL", answer: "Acute organ dysfunction" },
      { label: "Serum lactate 4.2 mmol/L with hypotension", answer: "Impaired perfusion" },
    ],
    correctAnswer: {
      "Right flank tenderness with nitrites, leukocyte esterase, and pyuria": "Suspected infection source",
      "Capillary refill 4 seconds with weak peripheral pulses": "Impaired perfusion",
      "New disorientation to time": "Acute organ dysfunction",
      "Creatinine 1.7 mg/dL from baseline 0.9 mg/dL": "Acute organ dysfunction",
      "Serum lactate 4.2 mmol/L with hypotension": "Impaired perfusion",
    },
    rationale:
      "The urinalysis and flank tenderness localize the likely infection to the urinary tract. Delayed capillary refill, weak pulses, hypotension, and elevated lactate support inadequate tissue perfusion. New confusion and a creatinine rise from the documented baseline show acute neurologic and renal dysfunction. No single laboratory value proves sepsis, so the nurse must connect source, perfusion, and organ-response data. The strongest analysis is the pattern formed across the record, not a diagnosis based on fever or lactate alone.",
    rationaleMechanism:
      "Systemic vasodilation and endothelial injury reduce effective circulating volume and microvascular oxygen delivery. The brain and kidneys may show dysfunction early through altered mentation, oliguria, and rising creatinine.",
    whyCorrect:
      "Each row is assigned to the most direct relationship in this record: source evidence identifies infection, bedside circulation findings identify perfusion failure, and a change in brain or kidney function identifies organ dysfunction.",
    distractorRationales: {
      "single-marker": "A single biomarker should not be used to rule sepsis in or out; the complete clinical pattern and serial reassessment are required.",
      "baseline-error": "A creatinine value must be compared with baseline. The increase from 0.9 to 1.7 mg/dL is a new renal change, not stable chronic disease.",
    },
    takeaway: "Analyze sepsis in three linked layers: source, perfusion, and organ response.",
    visualRationale: {
      type: "compare",
      title: "Three-layer sepsis analysis",
      nodes: [
        { label: "Source", value: "Urinary symptoms and pyuria" },
        { label: "Perfusion", value: "Hypotension, weak pulses, lactate" },
        { label: "Organs", value: "Confusion and creatinine rise" },
      ],
      conclusion: "A coherent multi-system pattern is stronger than any isolated abnormal value.",
    },
  }),
  makeVerifiedCaseQuestion(sepsisDefinition, {
    id: "codex-nclex-sepsis-case-03",
    kind: "bow-tie",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem: "Complete the bow-tie by selecting the condition the client is most likely experiencing, two actions the nurse should anticipate, and two parameters the nurse should monitor most closely.",
    nclexInstruction: "Select the center condition, two actions, and two monitoring parameters.",
    options: [],
    bowTie: {
      center: {
        id: "sepsis-hypoperfusion",
        text: "Sepsis with acute hypoperfusion from a suspected urinary infection",
        isCorrect: true,
      },
      leftActions: [
        { id: "sepsis-culture-antimicrobial", text: "Obtain ordered cultures promptly and begin prescribed IV antimicrobial therapy without avoidable delay", isCorrect: true },
        { id: "sepsis-crystalloid", text: "Administer the prescribed isotonic crystalloid bolus with frequent reassessment", isCorrect: true },
        { id: "sepsis-antipyretic-only", text: "Treat the fever and reassess the client in 2 hours", isCorrect: false },
        { id: "sepsis-oral-fluid", text: "Encourage oral fluids instead of establishing IV access", isCorrect: false },
      ],
      rightMonitoring: [
        { id: "sepsis-map", text: "Mean arterial pressure and other bedside perfusion findings", isCorrect: true },
        { id: "sepsis-urine-lactate", text: "Urine output and serial lactate trend", isCorrect: true },
        { id: "sepsis-a1c", text: "Hemoglobin A1c", isCorrect: false },
        { id: "sepsis-weight", text: "Weekly body weight", isCorrect: false },
      ],
    },
    correctAnswer: {
      center: "sepsis-hypoperfusion",
      leftActions: ["sepsis-culture-antimicrobial", "sepsis-crystalloid"],
      rightMonitoring: ["sepsis-map", "sepsis-urine-lactate"],
    },
    rationale:
      "The most defensible priority hypothesis is sepsis with acute hypoperfusion from a urinary source. Current guidance treats sepsis as a medical emergency: cultures should be collected as soon as possible and ideally before antimicrobials, but obtaining them must not create avoidable treatment delay. Prescribed crystalloid resuscitation addresses sepsis-induced hypoperfusion and requires frequent reassessment. MAP, capillary refill, mentation, urine output, and serial lactate help show whether perfusion is improving. Fever treatment alone and oral fluids do not address shock physiology, while A1c and weekly weight are not immediate response measures.",
    rationaleMechanism:
      "The priority is restoring effective circulation while treating the infection driving the systemic response. Source treatment and hemodynamic support occur in parallel, followed by repeated evaluation for benefit and fluid-related harm.",
    whyCorrect:
      "The selected center integrates the likely urinary source with current hypoperfusion without overstating a single test. The selected actions treat both cause and circulation, and the selected parameters directly measure organ perfusion and response.",
    distractorRationales: {
      "sepsis-antipyretic-only": "Lowering temperature may improve comfort but does not treat the infection or restore circulation.",
      "sepsis-oral-fluid": "This unstable client needs urgent monitored IV therapy; oral intake is not an adequate substitute.",
      "sepsis-a1c": "A1c reflects longer-term glycemic exposure and will not show the immediate response to resuscitation.",
      "sepsis-weight": "Weekly weight is not sensitive to minute-to-minute perfusion changes during an emergency.",
    },
    takeaway: "In suspected sepsis, treat infection and hypoperfusion in parallel, then reassess perfusion repeatedly.",
    visualRationale: {
      type: "flow",
      title: "Priority response map",
      nodes: [
        { label: "Condition", value: "Infection plus acute hypoperfusion" },
        { label: "Treat source", value: "Cultures and prompt prescribed antimicrobials" },
        { label: "Support circulation", value: "Crystalloid with reassessment" },
        { label: "Measure response", value: "MAP, urine output, mentation, lactate" },
      ],
      conclusion: "Cause, circulation, and response must be managed as one time-sensitive sequence.",
    },
  }),
  makeVerifiedCaseQuestion(sepsisDefinition, {
    id: "codex-nclex-sepsis-case-04",
    kind: "multi-select",
    category: "Management of Care",
    nclexClientNeed: "management_of_care",
    difficulty: 4,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem: "Which actions should the nurse include in the immediate plan of care? Select all that apply.",
    nclexInstruction: "Select all actions that should be implemented now.",
    options: [
      { id: "a", text: "Collect the ordered blood cultures promptly before antimicrobial administration when this does not delay therapy." },
      { id: "b", text: "Administer the prescribed broad-spectrum IV antimicrobial therapy promptly." },
      { id: "c", text: "Administer the prescribed isotonic crystalloid bolus and reassess perfusion and lung findings frequently." },
      { id: "d", text: "Trend urine output, mental status, capillary refill, blood pressure, and serum lactate." },
      { id: "e", text: "Wait for final culture identification before starting antimicrobial therapy." },
      { id: "f", text: "Limit reassessment until the entire fluid bolus is complete." },
    ],
    correctAnswer: ["a", "b", "c", "d"],
    rationale:
      "Immediate care combines rapid microbiologic sampling, prescribed antimicrobial treatment, hemodynamic support, and frequent response assessment. Blood cultures are ideally obtained before antimicrobials, but the nurse should not create an avoidable treatment delay. Crystalloid administration is not a one-time task: blood pressure, capillary refill, mentation, urine output, oxygenation, and lung sounds must be reassessed for benefit or harm. Serial lactate may help guide resuscitation when interpreted with the bedside picture. Waiting for final culture results or postponing reassessment allows infection and hypoperfusion to progress.",
    rationaleMechanism:
      "Antimicrobials target the suspected infection, while IV crystalloid supports circulating volume. Reassessment detects persistent shock, improving organ perfusion, or intolerance such as pulmonary congestion.",
    whyCorrect:
      "The four selected actions are concurrent parts of an urgent sepsis response and directly address diagnosis, source treatment, circulation, and evaluation.",
    distractorRationales: {
      e: "Final culture identification may take days. In probable sepsis with hypotension, waiting would create a dangerous delay in prescribed empiric treatment.",
      f: "Fluid response and signs of overload must be assessed during resuscitation, not only after the entire amount is infused.",
    },
    takeaway: "A sepsis plan is simultaneous: sample, treat, support, and reassess.",
    visualRationale: {
      type: "timeline",
      title: "Immediate sepsis workstream",
      items: [
        { label: "Recognize and escalate", value: "Activate the facility response", highlight: true },
        { label: "Sample and treat", value: "Cultures without avoidable antimicrobial delay" },
        { label: "Support perfusion", value: "Prescribed crystalloid" },
        { label: "Reassess", value: "Bedside perfusion, urine output, lactate, lungs" },
      ],
      conclusion: "These actions overlap; they are not a wait-for-one-before-starting-the-next checklist.",
    },
  }),
  makeVerifiedCaseQuestion(sepsisDefinition, {
    id: "codex-nclex-sepsis-case-05",
    kind: "mcq",
    category: "Pharmacological and Parenteral Therapies",
    nclexClientNeed: "pharmacological",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem: "Which action should the nurse take first in response to the persistent hypotension and new prescription?",
    nclexInstruction: "Select the most appropriate immediate action.",
    options: [
      { id: "a", text: "Initiate the prescribed norepinephrine per facility protocol while continuing close hemodynamic and IV-site monitoring." },
      { id: "b", text: "Delay vasopressor therapy until a central venous catheter is inserted." },
      { id: "c", text: "Administer repeated unprescribed fluid boluses until the blood pressure normalizes." },
      { id: "d", text: "Place the client flat and reassess the blood pressure in 30 minutes." },
    ],
    correctAnswer: "a",
    rationale:
      "The client remains hypotensive with persistent hypoperfusion after the prescribed initial crystalloid resuscitation. The nurse should initiate the ordered first-line norepinephrine using the facility's safe administration protocol, verify compatible access and pump settings, monitor the IV site, and continuously reassess MAP and organ perfusion. Current sepsis guidance advises against delaying needed vasopressor support solely to obtain central access. Additional fluid must be individualized and prescribed because repeated boluses without reassessment can cause harm. Positioning and waiting do not treat ongoing shock physiology.",
    rationaleMechanism:
      "Norepinephrine increases vascular tone and supports arterial pressure when vasodilation persists after initial volume resuscitation. Restoring MAP helps improve organ perfusion while infection treatment continues.",
    whyCorrect:
      "This action implements the time-sensitive prescription, follows current first-line vasopressor guidance, and includes the monitoring needed for both therapeutic response and infusion complications.",
    distractorRationales: {
      b: "Current guidance supports beginning vasopressors through appropriate peripheral access rather than delaying restoration of MAP solely for central access.",
      c: "Further fluids require individualized reassessment and a prescription; indiscriminate boluses can worsen pulmonary edema or other fluid-related harm.",
      d: "A position change and delayed reassessment do not correct persistent sepsis-related vasodilation and hypoperfusion.",
    },
    takeaway: "Persistent hypotension after initial fluid resuscitation requires prompt prescribed vasopressor support, not passive waiting.",
    visualRationale: {
      type: "pathway",
      title: "When pressure stays low after fluids",
      nodes: [
        { label: "Reassess", value: "MAP 57, refill 4 seconds, confusion persists" },
        { label: "Interpret", value: "Ongoing shock physiology" },
        { label: "Act", value: "Start prescribed norepinephrine safely" },
        { label: "Trend", value: "MAP, mentation, urine output, IV site" },
      ],
      conclusion: "The intervention is justified by persistent hypoperfusion, not by a blood-pressure number alone.",
    },
  }),
  makeVerifiedCaseQuestion(sepsisDefinition, {
    id: "codex-nclex-sepsis-case-06",
    kind: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 4,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem: "For each reassessment finding, click to indicate whether it supports improved perfusion or requires continued immediate follow-up.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports improved perfusion", "Requires immediate follow-up"],
    matrixRows: [
      { label: "MAP increases from 57 to 68 mm Hg", answer: "Supports improved perfusion" },
      { label: "Urine output is 45 mL in the past hour", answer: "Supports improved perfusion" },
      { label: "Client becomes fully oriented and capillary refill improves to 2 seconds", answer: "Supports improved perfusion" },
      { label: "Serum lactate decreases from 4.2 to 2.3 mmol/L", answer: "Supports improved perfusion" },
      { label: "New bilateral crackles with SpO2 89% on room air", answer: "Requires immediate follow-up" },
    ],
    correctAnswer: {
      "MAP increases from 57 to 68 mm Hg": "Supports improved perfusion",
      "Urine output is 45 mL in the past hour": "Supports improved perfusion",
      "Client becomes fully oriented and capillary refill improves to 2 seconds": "Supports improved perfusion",
      "Serum lactate decreases from 4.2 to 2.3 mmol/L": "Supports improved perfusion",
      "New bilateral crackles with SpO2 89% on room air": "Requires immediate follow-up",
    },
    rationale:
      "The higher MAP, adequate hourly urine output, restored orientation, faster capillary refill, and falling lactate collectively support improved tissue perfusion. Improvement is multi-dimensional; no single number should end reassessment. New crackles with hypoxemia are an acute respiratory change and may indicate fluid intolerance, pulmonary edema, or another evolving problem. The nurse should address oxygenation, stop or adjust infusions only as authorized, and notify the provider according to the client's condition and protocol. A mixed response means the circulation is improving while a new threat still requires action.",
    rationaleMechanism:
      "Effective resuscitation improves pressure and end-organ blood flow, but IV fluid and critical illness can also contribute to pulmonary complications. Evaluation must look for both intended effects and new harm.",
    whyCorrect:
      "The four improving findings measure different organs and perfusion domains. The respiratory change is classified separately because it represents new instability despite hemodynamic improvement.",
    distractorRationales: {
      "map-only": "A MAP at target is reassuring but does not make new hypoxemia or crackles safe to ignore.",
      "lactate-only": "A falling lactate supports response, but serial lactate must be interpreted with bedside perfusion and respiratory findings.",
    },
    takeaway: "Evaluate the whole response: better perfusion does not cancel a new airway or breathing problem.",
    visualRationale: {
      type: "compare",
      title: "Response versus new risk",
      nodes: [
        { label: "Circulation", value: "MAP, refill, mentation, and urine output improve" },
        { label: "Metabolic trend", value: "Lactate falls" },
        { label: "New problem", value: "Crackles and hypoxemia emerge" },
        { label: "Next move", value: "Support oxygenation and escalate" },
      ],
      conclusion: "Clinical judgment continues after the target blood pressure is reached.",
    },
  }),
];

const postpartumReferences: CaseReference[] = [
  NCLEX_REFERENCE,
  {
    title: "Consolidated Guidelines for the Prevention, Diagnosis and Treatment of Postpartum Haemorrhage",
    citation: "WHO, FIGO, and ICM, 2025",
    href: "https://www.who.int/publications/i/item/9789240115637",
  },
  {
    title: "Postpartum Haemorrhage Quick Card",
    citation: "World Health Organization, updated November 2025",
    href: "https://cdn.who.int/media/docs/default-source/integrated-health-services-%28ihs%29/csy/pph-quick-card.pdf",
  },
  {
    title: "Postpartum Hemorrhage Practice Bulletin No. 183",
    citation: "American College of Obstetricians and Gynecologists, reaffirmed 2024",
    href: "https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2017/10/postpartum-hemorrhage",
  },
];

const postpartumBaseChart: PracticeChartReviewMetadata = {
  patientTitle: "Day 1: Labor and Delivery",
  patientCaption: "Unfolding immediate postpartum record. New information appears as the case advances.",
  chiefComplaint: "Heavy vaginal bleeding and lightheadedness after vaginal birth.",
  hpi: [
    "A 29-year-old gravida 2 para 2 client had a spontaneous vaginal birth at 0920 after a prolonged labor augmented with oxytocin.",
    "The newborn weighs 4.1 kg (9 lb 1 oz). The placenta delivered spontaneously and appears intact.",
    "The client had no antepartum bleeding, hypertensive disorder, known coagulopathy, or anticoagulant use.",
    "Admission hemoglobin was 11.2 g/dL, and the client is blood type O positive.",
  ],
  history: [
    "One prior uncomplicated vaginal birth.",
    "No surgical history and no known bleeding disorder.",
    "Prenatal course notable for mild iron-deficiency anemia treated with oral iron.",
  ],
  allergies: ["No known medication allergies."],
  nursingNotes: [
    "0940: Client reports feeling lightheaded. A pad is saturated, a continuous vaginal trickle is present, and several large clots are expelled.",
    "0942: Fundus is boggy, above the umbilicus, and displaced to the right. Bladder is palpable. Skin is pale and cool.",
  ],
  assessments: [
    "Neurologic: Alert and answers questions appropriately; reports lightheadedness.",
    "Cardiovascular: Tachycardic; peripheral pulses are rapid and weak.",
    "Uterus: Boggy, enlarged, and displaced right of midline.",
    "Lochia: Heavy rubra with large clots and continued flow.",
  ],
  priorityCues: [
    "Heavy postpartum bleeding with a boggy displaced uterus, tachycardia, hypotension, pallor, and lightheadedness.",
  ],
};

const postpartumInitialVitals: NonNullable<PracticeChartReviewMetadata["vitals"]> = [
  { label: "Temperature", value: "98.6 F (37.0 C)" },
  { label: "Heart rate", value: "116/min", flag: "critical" },
  { label: "Respiratory rate", value: "22/min", flag: "high" },
  { label: "Blood pressure", value: "92/54 mm Hg", flag: "critical" },
  { label: "SpO2", value: "98% on room air" },
];

function buildPostpartumChartReview(caseItemNumber: number): PracticeChartReviewMetadata {
  const step = Math.max(1, Math.min(6, caseItemNumber));
  const nursingNotes = [...(postpartumBaseChart.nursingNotes ?? [])];
  const timeline = [
    "0920: Spontaneous vaginal birth.",
    "0940: Heavy bleeding and lightheadedness recognized.",
    "0942: Boggy displaced uterus and palpable bladder documented.",
  ];
  const labs: NonNullable<PracticeChartReviewMetadata["labs"]> = [
    { label: "Admission hemoglobin", value: "11.2 g/dL" },
    { label: "Admission platelets", value: "226,000/mm3" },
  ];
  const providerOrders: string[] = [
    "Continue objective measurement of cumulative blood loss.",
    "Maintain continuous maternal assessment and activate the facility postpartum hemorrhage response when criteria are met.",
  ];

  if (step >= 2) {
    nursingNotes.push("0944: Calibrated collection drape shows cumulative blood loss of 650 mL and bleeding continues. The placenta is inspected and appears complete.");
    timeline.push("0944: Objective cumulative blood loss reaches 650 mL.");
  }

  if (step >= 3) {
    nursingNotes.push("0945: The nurse calls for assistance, begins firm fundal massage, and asks a second nurse to activate the postpartum hemorrhage protocol.");
    timeline.push("0945: Hemorrhage response activated; uterine atony is the leading cause.");
  }

  if (step >= 4) {
    nursingNotes.push("0948: Bladder is emptied with a straight catheter. Fundus moves to midline and begins to firm, but bleeding remains heavier than expected.");
    providerOrders.push(
      "Administer prescribed oxytocic medication and tranexamic acid per postpartum hemorrhage protocol.",
      "Maintain large-bore IV access and administer prescribed isotonic crystalloid.",
      "Obtain CBC, coagulation studies, and type and crossmatch.",
      "Perform genital-tract examination and escalate care if bleeding persists.",
    );
    timeline.push("0948: Initial uterine measures completed; coordinated hemorrhage bundle is ordered.");
  }

  if (step >= 5) {
    nursingNotes.push(
      "0955: Fundus is firm and midline. An additional 180 mL of bright-red blood is collected over 7 minutes, with a continuous trickle despite the firm uterus.",
    );
    timeline.push("0955: Persistent bright-red bleeding continues after uterine tone improves.");
  }

  if (step >= 6) {
    nursingNotes.push(
      "1025: Obstetric examination identified a cervical laceration, which was repaired. Fundus remains firm and midline; lochia is now scant.",
      "1115: Client is alert with heart rate 88/min, blood pressure 108/66 mm Hg, capillary refill 2 seconds, and urine output 40 mL in the past hour. Client reports fatigue and mild dizziness when first sitting upright.",
    );
    labs.push(
      { label: "Post-treatment hemoglobin", value: "8.4 g/dL", flag: "low" },
      { label: "Platelets", value: "198,000/mm3" },
      { label: "INR", value: "1.1" },
    );
    timeline.push("1025: Cervical laceration repaired.", "1115: Bleeding controlled; anemia symptoms require continued follow-up.");
  }

  return {
    ...postpartumBaseChart,
    patientCaption: `Unfolding NGN record, item ${step} of 6. Review only information available at this point in the case.`,
    nursingNotes,
    unfoldingTimeline: timeline,
    vitals: step >= 6
      ? [
        { label: "Temperature", value: "98.4 F (36.9 C)" },
        { label: "Heart rate", value: "88/min" },
        { label: "Respiratory rate", value: "18/min" },
        { label: "Blood pressure", value: "108/66 mm Hg" },
        { label: "SpO2", value: "99% on room air" },
      ]
      : postpartumInitialVitals,
    labs,
    providerOrders,
    intakeOutput: step >= 6 ? ["Urine output: 40 mL during the most recent hour."] : [],
  };
}

const postpartumDefinition: VerifiedCaseDefinition = {
  id: "codex-nclex-postpartum-hemorrhage-ngn",
  title: "Maternal-Newborn: Postpartum Hemorrhage",
  references: postpartumReferences,
  sourceIds: ["ncsbn-2026-rn-test-plan", "who-pph-guideline-2025", "who-pph-quick-card-2025", "acog-pb183-reaffirmed-2024"],
  evidenceReviewedAt: "2026-07-23",
  buildChartReview: buildPostpartumChartReview,
};

const postpartumCaseStudyDeck: PracticeQuestion[] = [
  makeVerifiedCaseQuestion(postpartumDefinition, {
    id: "codex-nclex-pph-case-01",
    kind: "multi-select",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    difficulty: 4,
    caseItemNumber: 1,
    cjmmStep: "recognize-cues",
    clinicalJudgmentSkill: "Recognize cues",
    stem: "Click to highlight the findings that require immediate follow-up by the nurse.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Click to highlight every finding that requires immediate follow-up.",
    options: [
      { id: "a", text: "Continuous vaginal trickle with large clots" },
      { id: "b", text: "Boggy uterus above the umbilicus and displaced right" },
      { id: "c", text: "Heart rate 116/min" },
      { id: "d", text: "Blood pressure 92/54 mm Hg" },
      { id: "e", text: "Lightheadedness with pale, cool skin" },
      { id: "f", text: "Newborn weight 4.1 kg" },
      { id: "g", text: "Blood type O positive" },
      { id: "h", text: "One prior uncomplicated vaginal birth" },
    ],
    highlightRows: [
      { label: "Bleeding", text: "Continuous vaginal trickle with large clots", optionId: "a" },
      { label: "Uterus", text: "Boggy uterus above the umbilicus and displaced right", optionId: "b" },
      { label: "Vital signs", text: "Heart rate 116/min", optionId: "c" },
      { label: "Vital signs", text: "Blood pressure 92/54 mm Hg", optionId: "d" },
      { label: "Perfusion", text: "Lightheadedness with pale, cool skin", optionId: "e" },
      { label: "Birth history", text: "Newborn weight 4.1 kg", optionId: "f" },
      { label: "Laboratory", text: "Blood type O positive", optionId: "g" },
      { label: "Obstetric history", text: "One prior uncomplicated vaginal birth", optionId: "h" },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "Ongoing heavy bleeding with clots, a boggy displaced uterus, tachycardia, hypotension, pallor, cool skin, and lightheadedness indicate postpartum hemorrhage with compromised circulation. These are current changes requiring immediate response. The large newborn and prolonged labor increase the likelihood of uterine atony, but risk factors do not outrank active bleeding and hypovolemia. Blood type and prior birth history matter for planning but are not acute deterioration cues. On a recognition item, select the findings that show what is happening now before selecting facts that explain why it happened.",
    rationaleMechanism:
      "After placental separation, uterine contraction compresses open vessels at the placental site. When the uterus remains atonic, those vessels are not effectively compressed and rapid blood loss can cause hypovolemia and shock.",
    whyCorrect:
      "The five selected findings connect active blood loss, failure of uterine contraction, and systemic perfusion compromise. Together they justify immediate hemorrhage response rather than routine postpartum observation.",
    distractorRationales: {
      f: "A large newborn contributes to uterine overdistension and atony risk, but it is not itself an acute deterioration finding.",
      g: "Blood type is necessary for transfusion planning, but it does not indicate the client's current hemodynamic status.",
      h: "Prior obstetric history is background information and does not outweigh present bleeding and perfusion changes.",
    },
    takeaway: "In postpartum hemorrhage, recognize active bleeding and hypovolemia first; use risk factors to explain the cause second.",
    visualRationale: {
      type: "pathway",
      title: "Atony to hypovolemia",
      nodes: [
        { label: "Tone fails", value: "Boggy enlarged uterus" },
        { label: "Bleeding continues", value: "Trickle, clots, saturated pad" },
        { label: "Compensation", value: "Heart rate 116/min" },
        { label: "Perfusion falls", value: "BP 92/54, pallor, lightheadedness" },
      ],
      conclusion: "The pattern is active hemorrhage, not expected lochia.",
    },
  }),
  makeVerifiedCaseQuestion(postpartumDefinition, {
    id: "codex-nclex-pph-case-02",
    kind: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 4,
    caseItemNumber: 2,
    cjmmStep: "analyze-cues",
    clinicalJudgmentSkill: "Analyze cues",
    stem: "For each assessment pattern, click to identify the postpartum hemorrhage cause it most strongly supports.",
    nclexInstruction: "Select one cause for each assessment pattern.",
    matrixColumns: ["Tone", "Trauma", "Tissue", "Thrombin"],
    matrixRows: [
      { label: "Boggy enlarged uterus after a prolonged labor", answer: "Tone" },
      { label: "Firm uterus with persistent bright-red bleeding", answer: "Trauma" },
      { label: "Placenta appears incomplete with continued bleeding", answer: "Tissue" },
      { label: "Oozing from IV sites with petechiae and abnormal coagulation results", answer: "Thrombin" },
    ],
    correctAnswer: {
      "Boggy enlarged uterus after a prolonged labor": "Tone",
      "Firm uterus with persistent bright-red bleeding": "Trauma",
      "Placenta appears incomplete with continued bleeding": "Tissue",
      "Oozing from IV sites with petechiae and abnormal coagulation results": "Thrombin",
    },
    rationale:
      "The four-T framework organizes postpartum hemorrhage causes. Tone refers to uterine atony and is supported by a boggy enlarged uterus, especially after uterine overdistension or prolonged labor. Trauma is suggested when bright-red bleeding persists despite a firm uterus. Tissue refers to retained placental material that prevents effective contraction. Thrombin refers to impaired coagulation and may present as diffuse oozing, petechiae, or abnormal coagulation studies. The client's current boggy displaced fundus and intact-appearing placenta make tone the leading initial hypothesis, while ongoing reassessment must remain open to another cause.",
    rationaleMechanism:
      "Each cause produces bleeding through a different mechanism: inadequate vessel compression, damaged tissue, retained placental material, or failed clot formation. Uterine tone is therefore a high-yield discriminator.",
    whyCorrect:
      "Each row contains the most characteristic bedside pattern for one of the four causes and helps the nurse avoid treating every postpartum hemorrhage as atony.",
    distractorRationales: {
      "tone-only": "Atony is common, but a firm uterus with continuing bright-red bleeding should redirect assessment toward trauma.",
      "lab-delay": "Hemorrhage treatment should not wait for laboratory confirmation when active bleeding and abnormal vital signs are present.",
    },
    takeaway: "Use the four Ts, then let uterine tone and the bleeding pattern narrow the cause.",
    visualRationale: {
      type: "compare",
      title: "Four causes, four discriminators",
      nodes: [
        { label: "Tone", value: "Boggy enlarged uterus" },
        { label: "Trauma", value: "Firm uterus, bright-red flow" },
        { label: "Tissue", value: "Incomplete placenta" },
        { label: "Thrombin", value: "Diffuse oozing or coagulopathy" },
      ],
      conclusion: "Recheck the cause whenever the bleeding pattern changes.",
    },
  }),
  makeVerifiedCaseQuestion(postpartumDefinition, {
    id: "codex-nclex-pph-case-03",
    kind: "bow-tie",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    difficulty: 5,
    caseItemNumber: 3,
    cjmmStep: "prioritize-hypotheses",
    clinicalJudgmentSkill: "Prioritize hypotheses",
    stem: "Complete the bow-tie by selecting the most likely condition, two immediate actions, and two parameters to monitor.",
    nclexInstruction: "Select the center condition, two actions, and two monitoring parameters.",
    options: [],
    bowTie: {
      center: {
        id: "pph-atony",
        text: "Postpartum hemorrhage primarily caused by uterine atony",
        isCorrect: true,
      },
      leftActions: [
        { id: "pph-massage", text: "Perform firm fundal massage and call for assistance", isCorrect: true },
        { id: "pph-oxytocic", text: "Administer the prescribed oxytocic medication while the hemorrhage response proceeds", isCorrect: true },
        { id: "pph-observe", text: "Observe for another 30 minutes because postpartum lochia is expected", isCorrect: false },
        { id: "pph-leave", text: "Leave the client to obtain supplies before activating help", isCorrect: false },
      ],
      rightMonitoring: [
        { id: "pph-loss-tone", text: "Objective blood loss, bleeding flow, and uterine tone", isCorrect: true },
        { id: "pph-vitals-perfusion", text: "Blood pressure, pulse, mental status, skin, and urine output", isCorrect: true },
        { id: "pph-newborn", text: "Newborn weight trend", isCorrect: false },
        { id: "pph-bowel", text: "Maternal bowel sounds", isCorrect: false },
      ],
    },
    correctAnswer: {
      center: "pph-atony",
      leftActions: ["pph-massage", "pph-oxytocic"],
      rightMonitoring: ["pph-loss-tone", "pph-vitals-perfusion"],
    },
    rationale:
      "The boggy enlarged uterus after prolonged labor and birth of a large newborn makes uterine atony the leading cause of this active postpartum hemorrhage. Immediate fundal massage promotes contraction while help and the hemorrhage response are activated; prescribed oxytocic therapy supports sustained uterine tone. The nurse must objectively track blood loss and flow, uterine tone, vital signs, mentation, skin perfusion, and urine output because visible blood loss can underestimate physiologic impact. Routine observation or leaving an unstable client delays care, and newborn weight or bowel sounds do not measure maternal response.",
    rationaleMechanism:
      "Fundal massage and oxytocic medication increase myometrial contraction, which compresses placental-site vessels. Simultaneous perfusion monitoring identifies whether blood loss is progressing toward shock.",
    whyCorrect:
      "The center condition fits the current tone findings and risk profile. The actions directly restore uterine contraction, while the monitoring choices measure both ongoing hemorrhage and systemic response.",
    distractorRationales: {
      "pph-observe": "Heavy bleeding with hypotension and tachycardia is not expected lochia and cannot be safely observed without intervention.",
      "pph-leave": "The nurse should call for help while remaining with the unstable client and begin immediate measures.",
      "pph-newborn": "Newborn weight helps explain atony risk but does not monitor the mother's response to treatment.",
      "pph-bowel": "Bowel sounds are not an immediate indicator of hemorrhage control or perfusion recovery.",
    },
    takeaway: "For a boggy postpartum uterus: massage, mobilize help, give prescribed uterotonic therapy, and quantify the response.",
    visualRationale: {
      type: "flow",
      title: "Atony response map",
      nodes: [
        { label: "Condition", value: "Boggy uterus with active hemorrhage" },
        { label: "Hands-on action", value: "Fundal massage and assistance" },
        { label: "Medication action", value: "Prescribed oxytocic therapy" },
        { label: "Response", value: "Tone, blood loss, vital signs, urine output" },
      ],
      conclusion: "Treatment and measurement begin together.",
    },
  }),
  makeVerifiedCaseQuestion(postpartumDefinition, {
    id: "codex-nclex-pph-case-04",
    kind: "multi-select",
    category: "Management of Care",
    nclexClientNeed: "management_of_care",
    difficulty: 4,
    caseItemNumber: 4,
    cjmmStep: "generate-solutions",
    clinicalJudgmentSkill: "Generate solutions",
    stem: "Which interventions should the nurse include in the coordinated postpartum hemorrhage response? Select all that apply.",
    nclexInstruction: "Select all interventions that apply.",
    options: [
      { id: "a", text: "Continue uterine massage and frequent tone assessment." },
      { id: "b", text: "Administer prescribed oxytocic medication and tranexamic acid per protocol." },
      { id: "c", text: "Maintain IV access and administer prescribed isotonic crystalloid." },
      { id: "d", text: "Continue objective blood-loss measurement and prepare for examination of the genital tract." },
      { id: "e", text: "Escalate care promptly if bleeding persists or the cause cannot be controlled." },
      { id: "f", text: "Wait for the hemoglobin result before continuing hemorrhage treatment." },
      { id: "g", text: "Treat only the uterine atony and omit evaluation for trauma once the fundus firms." },
    ],
    correctAnswer: ["a", "b", "c", "d", "e"],
    rationale:
      "A coordinated postpartum hemorrhage response treats hemorrhage as a bundle rather than a single intervention. Uterine massage, prescribed oxytocic medication, tranexamic acid, IV fluid support, objective blood-loss measurement, genital-tract examination, and escalation are performed rapidly according to the facility protocol and the client's condition. Laboratory testing supports management but must not delay treatment of active bleeding and abnormal vital signs. A uterus that firms does not prove the hemorrhage is controlled; persistent bleeding should trigger reassessment for trauma, retained tissue, or coagulopathy.",
    rationaleMechanism:
      "The bundle simultaneously improves uterine tone, reduces clot breakdown, supports circulating volume, searches for another bleeding source, and accelerates definitive care when first measures fail.",
    whyCorrect:
      "The five selected interventions cover all immediate domains needed for safe hemorrhage control and ongoing reassessment rather than relying on fundal massage alone.",
    distractorRationales: {
      f: "Hemoglobin may not immediately reflect the full acute blood loss, and waiting for the result delays life-saving treatment.",
      g: "Persistent bleeding with a firm fundus points away from atony alone and requires evaluation for another cause, especially trauma.",
    },
    takeaway: "Postpartum hemorrhage care is a bundle: tone, medication, volume, examination, measurement, and escalation.",
    visualRationale: {
      type: "pathway",
      title: "Coordinated hemorrhage bundle",
      nodes: [
        { label: "Contract", value: "Massage and prescribed oxytocic" },
        { label: "Stabilize", value: "IV access, crystalloid, TXA as ordered" },
        { label: "Find cause", value: "Objective loss and genital-tract examination" },
        { label: "Escalate", value: "Definitive care if bleeding persists" },
      ],
      conclusion: "No single element replaces the rest of the response.",
    },
  }),
  makeVerifiedCaseQuestion(postpartumDefinition, {
    id: "codex-nclex-pph-case-05",
    kind: "mcq",
    category: "Physiological Adaptation",
    nclexClientNeed: "physiological_adaptation",
    difficulty: 5,
    caseItemNumber: 5,
    cjmmStep: "take-actions",
    clinicalJudgmentSkill: "Take action",
    stem: "The fundus is now firm and midline, but bright-red bleeding continues. Which action should the nurse take first?",
    nclexInstruction: "Select the most appropriate immediate action.",
    options: [
      { id: "a", text: "Continue the hemorrhage response, notify the obstetric provider, and prepare for prompt genital-tract examination." },
      { id: "b", text: "Repeat fundal massage as the only intervention until the bleeding stops." },
      { id: "c", text: "Document the bleeding as expected lochia because the uterus is firm." },
      { id: "d", text: "Discontinue IV access because uterine atony has resolved." },
    ],
    correctAnswer: "a",
    rationale:
      "Persistent bright-red bleeding despite a firm midline uterus shifts concern from atony alone toward genital-tract trauma or another source. The nurse should continue the active hemorrhage response, notify the obstetric provider, maintain stabilization measures, and prepare for prompt examination and definitive treatment. Repeating massage as the only action ignores the changed cue pattern. Heavy continuing blood loss is not expected lochia, and IV access remains essential for medication, fluid, laboratory sampling, and possible blood products.",
    rationaleMechanism:
      "Once uterine contraction is restored, placental-site vessel compression should reduce atony-related bleeding. Continued bright-red flow with firm tone suggests bleeding from injured tissue that requires direct evaluation and repair.",
    whyCorrect:
      "This action updates the working hypothesis when new information appears and moves the client toward identification and control of a potentially traumatic source.",
    distractorRationales: {
      b: "Massage treats poor uterine tone; it cannot repair a cervical or vaginal laceration when the uterus is already firm.",
      c: "Continued brisk bright-red bleeding with prior hypovolemia is abnormal and requires escalation.",
      d: "The client still has active hemorrhage and needs reliable IV access for ongoing resuscitation and treatment.",
    },
    takeaway: "When the fundus firms but bleeding continues, change the hypothesis and search for trauma.",
    visualRationale: {
      type: "flow",
      title: "Use the response to update the cause",
      nodes: [
        { label: "Before treatment", value: "Boggy uterus suggests tone" },
        { label: "After treatment", value: "Fundus becomes firm" },
        { label: "Persistent cue", value: "Bright-red bleeding continues" },
        { label: "New priority", value: "Evaluate trauma and escalate" },
      ],
      conclusion: "The current assessment, not the original diagnosis, determines the next action.",
    },
  }),
  makeVerifiedCaseQuestion(postpartumDefinition, {
    id: "codex-nclex-pph-case-06",
    kind: "matrix",
    category: "Reduction of Risk Potential",
    nclexClientNeed: "risk_reduction",
    difficulty: 4,
    caseItemNumber: 6,
    cjmmStep: "evaluate-outcomes",
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem: "For each reassessment finding, click to indicate whether it supports hemorrhage control or requires continued follow-up.",
    nclexInstruction: "Select one interpretation for each finding.",
    matrixColumns: ["Supports hemorrhage control", "Requires continued follow-up"],
    matrixRows: [
      { label: "Fundus remains firm and midline with scant lochia", answer: "Supports hemorrhage control" },
      { label: "Heart rate 88/min and blood pressure 108/66 mm Hg", answer: "Supports hemorrhage control" },
      { label: "Urine output 40 mL in the past hour with capillary refill 2 seconds", answer: "Supports hemorrhage control" },
      { label: "Hemoglobin 8.4 g/dL with fatigue and dizziness on sitting", answer: "Requires continued follow-up" },
    ],
    correctAnswer: {
      "Fundus remains firm and midline with scant lochia": "Supports hemorrhage control",
      "Heart rate 88/min and blood pressure 108/66 mm Hg": "Supports hemorrhage control",
      "Urine output 40 mL in the past hour with capillary refill 2 seconds": "Supports hemorrhage control",
      "Hemoglobin 8.4 g/dL with fatigue and dizziness on sitting": "Requires continued follow-up",
    },
    rationale:
      "A firm midline uterus, scant lochia, normalized heart rate and blood pressure, adequate urine output, and brisk capillary refill support control of active hemorrhage and improved perfusion. The low hemoglobin with fatigue and positional dizziness still requires assessment, fall precautions, symptom-guided activity, and provider-directed anemia management. Hemorrhage control does not mean recovery is complete. The nurse should continue trending bleeding, vital signs, functional symptoms, and laboratory results while preparing education and follow-up appropriate to the treatment plan.",
    rationaleMechanism:
      "Stopping the bleeding restores hemodynamic stability, but lost red-cell mass reduces oxygen-carrying capacity and can produce fatigue, dizziness, and activity intolerance after circulation stabilizes.",
    whyCorrect:
      "The first three findings show local bleeding control and systemic perfusion recovery. The anemia findings identify a residual problem that needs continued management rather than evidence of active recurrent hemorrhage by themselves.",
    distractorRationales: {
      "vitals-only": "Normal vital signs are reassuring but do not eliminate symptomatic anemia or the need for continued postpartum surveillance.",
      "hemoglobin-only": "A low hemoglobin requires follow-up, but it should be interpreted with bleeding, symptoms, hemodynamics, and the treatment plan.",
    },
    takeaway: "Separate hemorrhage control from complete recovery; continue managing anemia and functional safety.",
    visualRationale: {
      type: "compare",
      title: "Bleeding controlled, recovery ongoing",
      nodes: [
        { label: "Local control", value: "Firm uterus and scant lochia" },
        { label: "Perfusion recovery", value: "Stable vital signs and urine output" },
        { label: "Residual issue", value: "Hemoglobin 8.4 with symptoms" },
        { label: "Next care", value: "Anemia follow-up and fall prevention" },
      ],
      conclusion: "Stable circulation and symptomatic anemia can coexist.",
    },
  }),
];

export const verifiedAdditionalNclexCaseStudyDeck: PracticeQuestion[] = [
  ...sepsisCaseStudyDeck,
  ...postpartumCaseStudyDeck,
];
