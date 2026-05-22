export type ExamItemType = "indicated-grid" | "highlight";

export interface RationaleBullet {
  bold: string;
  body: string;
  choiceRef: number;
}

export interface ItemRationale {
  framing: string;
  indicated: RationaleBullet[];
  notIndicated: RationaleBullet[];
  keyTakeaway: string[];
  diagrams?: string[];
}

export interface CaseStudyExhibit {
  label: string;
  kind: "notes" | "table";
  rows?: Array<{ label: string; value: string }>;
  notes?: Array<{ time: string; text: string }>;
}

export interface CaseStudyContext {
  appliesTo: number;
  stem: string;
  exhibits: CaseStudyExhibit[];
}

export interface IndicatedGridRow {
  id: string;
  text: string;
  correct: "indicated" | "not-indicated";
}

export interface HighlightSegment {
  id: string;
  label: string;
  correct: boolean;
}

export interface BaseExamItem {
  id: string;
  type: ExamItemType;
  title: string;
  prompt: string;
  caseStudy: CaseStudyContext;
  rationale: ItemRationale;
  timeSpentSeconds?: number;
  avgPointsScored: number;
  maxPoints: number;
  scoringRule: string;
}

export interface IndicatedGridItem extends BaseExamItem {
  type: "indicated-grid";
  rows: IndicatedGridRow[];
}

export interface HighlightItem extends BaseExamItem {
  type: "highlight";
  bodySystemRows: Array<{ system: string; findings: HighlightSegment[] }>;
}

export type ExamItem = IndicatedGridItem | HighlightItem;

const dvtCase: CaseStudyContext = {
  appliesTo: 6,
  stem: "The nurse is caring for a 61-year-old female client in the emergency department.",
  exhibits: [
    {
      label: "Nurses' Notes",
      kind: "notes",
      notes: [
        {
          time: "0615",
          text:
            "A 61-year-old client comes to the emergency department reporting shortness of breath. She states that she had to stop and sit down while getting ready for work this morning because she suddenly felt like she could not catch her breath. She denies any cough, fever, palpitations, or lightheadedness. She denies any recent sick contacts but notes that she recently injured her leg in a minor bicycle accident.",
        },
        {
          time: "0645",
          text:
            "Client placed on 2 L/min nasal cannula; reports relief of dyspnea. CT pulmonary angiography and right lower extremity doppler ultrasound complete. Client now being admitted with a diagnosis of deep vein thrombosis and pulmonary embolism, with plans to initiate an IV heparin drip once admitted to the floor.",
        },
      ],
    },
    {
      label: "Vital Signs",
      kind: "table",
      rows: [
        { label: "T", value: "99.9 F (37.7 C)" },
        { label: "P", value: "118" },
        { label: "RR", value: "24" },
        { label: "BP", value: "108/56" },
        { label: "Pulse oximetry reading", value: "89% on room air" },
      ],
    },
    {
      label: "Orders",
      kind: "notes",
      notes: [
        { time: "0700", text: "Admit to telemetry. Start heparin protocol after baseline coagulation studies. Oxygen to maintain SpO2 above 92%." },
      ],
    },
  ],
};

export const sampleExamItems: ExamItem[] = [
  {
    id: "sample-indicated-grid",
    type: "indicated-grid",
    title: "Item 1 of 2",
    caseStudy: dvtCase,
    prompt:
      "For each potential nursing intervention, select whether the intervention is indicated or not indicated for the client's current condition.",
    rows: [
      { id: "oxygen", text: "Maintain oxygen therapy and reassess respiratory status.", correct: "indicated" },
      { id: "ambulation", text: "Encourage independent ambulation to reduce venous stasis.", correct: "not-indicated" },
      { id: "bleeding", text: "Assess for bleeding before and after anticoagulation is started.", correct: "indicated" },
      { id: "massage", text: "Massage the painful lower extremity to improve circulation.", correct: "not-indicated" },
    ],
    maxPoints: 4,
    avgPointsScored: 2.75,
    scoringRule: "0 / 1 Scoring",
    rationale: {
      framing:
        "Care for a client with suspected DVT and pulmonary embolism prioritizes oxygenation, anticoagulation safety, and prevention of clot movement.",
      indicated: [
        {
          bold: "Maintain oxygen therapy and reassess respiratory status",
          body: "because dyspnea, tachypnea, and low oxygen saturation indicate impaired gas exchange that requires close follow-up.",
          choiceRef: 1,
        },
        {
          bold: "Assess for bleeding before and after anticoagulation is started",
          body: "because heparin increases bleeding risk and baseline findings help detect early complications.",
          choiceRef: 3,
        },
      ],
      notIndicated: [
        {
          bold: "Encourage independent ambulation",
          body: "is not appropriate before stabilization because movement may worsen symptoms and should follow provider direction.",
          choiceRef: 2,
        },
        {
          bold: "Massage the painful lower extremity",
          body: "is contraindicated because manipulating the limb may dislodge a thrombus.",
          choiceRef: 4,
        },
      ],
      keyTakeaway: [
        "Pulmonary embolism care starts with oxygenation and hemodynamic monitoring.",
        "Anticoagulation requires bleeding surveillance and baseline labs.",
        "Do not massage or manipulate an extremity with suspected thrombus.",
      ],
      diagrams: ["burn-staging"],
    },
  },
  {
    id: "sample-highlight",
    type: "highlight",
    title: "Item 2 of 2",
    caseStudy: dvtCase,
    prompt: "Click to highlight the findings that require immediate follow-up by the nurse.",
    bodySystemRows: [
      {
        system: "Neurological",
        findings: [{ id: "anxious", label: "Alert; oriented to person, place, and time; slightly anxious", correct: false }],
      },
      {
        system: "Pulmonary",
        findings: [
          { id: "dyspnea", label: "Reports dyspnea", correct: true },
          { id: "crackles", label: "lung sounds diminished with fine crackles in bilateral bases", correct: true },
          { id: "pleuritic", label: "sharp chest pain on inspiration", correct: true },
          { id: "smoker", label: "former 10-year smoker", correct: false },
        ],
      },
      {
        system: "Cardiovascular",
        findings: [
          { id: "regular", label: "Regular rhythm; S1 and S2 present with no murmurs", correct: false },
          { id: "hypertension", label: "history of hypertension", correct: false },
        ],
      },
      {
        system: "Extremities",
        findings: [
          { id: "edema", label: "pitting lower extremity edema extending to thigh", correct: true },
          { id: "worsening-pain", label: "the pain and swelling are getting worse", correct: true },
        ],
      },
      {
        system: "Psychosocial",
        findings: [{ id: "desk", label: "works long hours at a crowded call center", correct: false }],
      },
    ],
    maxPoints: 5,
    avgPointsScored: 2.35,
    scoringRule: "+/- Scoring",
    rationale: {
      framing:
        "Sudden-onset dyspnea, tachypnea, adventitious lung sounds, pleuritic pain, and unilateral extremity swelling require immediate follow-up.",
      indicated: [
        {
          bold: "Dyspnea, fine crackles, and sharp chest pain on inspiration",
          body: "suggest acute cardiopulmonary compromise and possible pulmonary embolism.",
          choiceRef: 1,
        },
        {
          bold: "Pitting lower extremity edema and worsening pain",
          body: "support concern for deep vein thrombosis and require prompt escalation.",
          choiceRef: 2,
        },
      ],
      notIndicated: [
        {
          bold: "Slightly anxious",
          body: "may be related to dyspnea but is not the priority over objective cardiopulmonary findings.",
          choiceRef: 3,
        },
        {
          bold: "Former smoking, hypertension, and sedentary work",
          body: "are risk factors but do not require the same immediate follow-up as active respiratory compromise.",
          choiceRef: 4,
        },
      ],
      keyTakeaway: [
        "Immediate follow-up is driven by current instability, not only historical risk factors.",
        "Pleural chest pain, dyspnea, tachycardia, hypoxemia, and unilateral edema cluster around PE/DVT concern.",
      ],
    },
  },
];
