import type { CjmmStep, Exam, NclexClientNeed } from "@/lib/types";

export type StudyResourceKind = "official" | "clinical-reference" | "video" | "tool";

export interface StudyResource {
  kind: StudyResourceKind;
  title: string;
  href: string;
  source: string;
  topic: string;
  free: true;
  why: string;
}

type ResourceQuestion = {
  exam: Exam | "nclex" | "ccrn";
  category: string;
  stem: string;
  rationale: string;
  deepRationale?: string;
  takeaway?: string;
  nclexClientNeed?: string;
};

export type StudyResourceRecommendationInput = {
  exam?: Exam | "nclex" | "ccrn";
  category?: string | null;
  categoryLabel?: string | null;
  nclexClientNeed?: NclexClientNeed | string | null;
  cjmmStep?: CjmmStep | string | null;
  difficulty?: number | null;
  limit?: number;
};

const CORE_NCLEX_RESOURCES: StudyResource[] = [
  {
    kind: "official",
    title: "NCSBN 2026 NCLEX-RN test plan",
    href: "https://www.nclex.com/test-plans",
    source: "NCSBN / NCLEX",
    topic: "NCLEX exam blueprint",
    free: true,
    why: "Use this to map every miss back to the official client-need and clinical-judgment blueprint.",
  },
  {
    kind: "official",
    title: "NCSBN NGN sample questions and exam preview",
    href: "https://www.nclex.com/prepare",
    source: "NCSBN / NCLEX",
    topic: "NGN item format",
    free: true,
    why: "Use this to compare Clarity's case-study flow against official free NGN examples.",
  },
];

const TOPIC_RESOURCES: Array<{ match: RegExp; resources: StudyResource[] }> = [
  {
    match: /\b(pulmonary embol|embolus|dvt|venous thromboembol|vte|pleuritic|thrombo|heparin)\b/i,
    resources: [
      {
        kind: "clinical-reference",
        title: "Pulmonary embolism overview",
        href: "https://medlineplus.gov/pulmonaryembolism.html",
        source: "MedlinePlus / NIH",
        topic: "Pulmonary embolism and DVT",
        free: true,
        why: "Anchors dyspnea, pleuritic chest pain, tachycardia, VTE risks, and anticoagulant treatment in a public NIH resource.",
      },
      {
        kind: "video",
        title: "Free PE/DVT NCLEX video search",
        href: "https://www.youtube.com/results?search_query=pulmonary+embolism+DVT+NCLEX+RegisteredNurseRN",
        source: "YouTube public search",
        topic: "Pulmonary embolism NCLEX review",
        free: true,
        why: "Use this when a visual walkthrough of Virchow's triad, DVT, PE symptoms, or heparin safety would help the pattern stick.",
      },
    ],
  },
  {
    match: /\b(sepsis|septic|infection|lactate|qsofa|shock)\b/i,
    resources: [
      {
        kind: "clinical-reference",
        title: "About sepsis",
        href: "https://www.cdc.gov/sepsis/about/index.html",
        source: "CDC",
        topic: "Sepsis recognition",
        free: true,
        why: "Use this to reinforce early recognition, worsening vital signs, infection clues, and prompt escalation.",
      },
      {
        kind: "video",
        title: "Free sepsis NCLEX video search",
        href: "https://www.youtube.com/results?search_query=sepsis+NCLEX+RegisteredNurseRN",
        source: "YouTube public search",
        topic: "Sepsis NCLEX review",
        free: true,
        why: "Use this for a short visual review of infection, perfusion, lactate, fluids, antibiotics, and shock priorities.",
      },
    ],
  },
  {
    match: /\b(burn|rule of nines|partial thickness|full thickness|fluid resuscitation)\b/i,
    resources: [
      {
        kind: "clinical-reference",
        title: "Burns health topic",
        href: "https://medlineplus.gov/burns.html",
        source: "MedlinePlus / NIH",
        topic: "Burn depth and burn care",
        free: true,
        why: "Use this to stabilize burn staging, airway risk, infection prevention, and fluid-loss reasoning.",
      },
      {
        kind: "video",
        title: "Free burn staging NCLEX video search",
        href: "https://www.youtube.com/results?search_query=burns+rule+of+nines+NCLEX+RegisteredNurseRN",
        source: "YouTube public search",
        topic: "Burn staging NCLEX review",
        free: true,
        why: "Use this with the burn diagram when depth, surface area, or immediate priorities are the weak point.",
      },
    ],
  },
  {
    match: /\b(hyponatremia|sodium|siadh|fluid restriction|seizure)\b/i,
    resources: [
      {
        kind: "clinical-reference",
        title: "Sodium blood test and abnormal sodium context",
        href: "https://medlineplus.gov/lab-tests/sodium-blood-test/",
        source: "MedlinePlus / NIH",
        topic: "Sodium balance",
        free: true,
        why: "Use this to connect sodium values to neuro risk and safe monitoring language.",
      },
      {
        kind: "video",
        title: "Free hyponatremia/SIADH NCLEX video search",
        href: "https://www.youtube.com/results?search_query=hyponatremia+SIADH+NCLEX+RegisteredNurseRN",
        source: "YouTube public search",
        topic: "Hyponatremia and SIADH NCLEX review",
        free: true,
        why: "Use this when the miss involves sodium, fluid restriction, neuro checks, seizure risk, or ADH physiology.",
      },
    ],
  },
  {
    match: /\b(heart failure|myocardial infarction|chest pain|fluid overload|crackles|edema|cardiac)\b/i,
    resources: [
      {
        kind: "clinical-reference",
        title: "Heart failure health topic",
        href: "https://medlineplus.gov/heartfailure.html",
        source: "MedlinePlus / NIH",
        topic: "Heart failure",
        free: true,
        why: "Use this for crackles, edema, dyspnea, fluid overload, and patient-teaching connections.",
      },
      {
        kind: "video",
        title: "Free heart failure NCLEX video search",
        href: "https://www.youtube.com/results?search_query=heart+failure+NCLEX+RegisteredNurseRN",
        source: "YouTube public search",
        topic: "Heart failure NCLEX review",
        free: true,
        why: "Use this when a visual flow from preload, congestion, oxygenation, and nursing priorities would help.",
      },
    ],
  },
  {
    match: /\b(delegat|priorit|uap|lpn|stable|unstable|assignment)\b/i,
    resources: [
      {
        kind: "tool",
        title: "NCLEX test plan: management of care and clinical judgment",
        href: "https://www.nclex.com/test-plans",
        source: "NCSBN / NCLEX",
        topic: "Delegation and prioritization",
        free: true,
        why: "Use the official blueprint to connect delegation misses to RN scope, safety, and clinical judgment.",
      },
      {
        kind: "video",
        title: "Free delegation/prioritization NCLEX video search",
        href: "https://www.youtube.com/results?search_query=delegation+prioritization+NCLEX+RegisteredNurseRN",
        source: "YouTube public search",
        topic: "Delegation and prioritization NCLEX review",
        free: true,
        why: "Use this for RN/LPN/UAP scope drills and unstable-versus-stable decision patterns.",
      },
    ],
  },
];

const CLIENT_NEED_RESOURCES: Record<string, StudyResource[]> = {
  management_of_care: [
    {
      kind: "tool",
      title: "Clarity delegation question set",
      href: "/free/nclex-delegation-questions",
      source: "Clarity NCLEX",
      topic: "Delegation and scope",
      free: true,
      why: "Use this when missed answers involve RN scope, assignment safety, or deciding what can be delegated.",
    },
    {
      kind: "tool",
      title: "Clarity prioritization question set",
      href: "/free/nclex-prioritization-questions",
      source: "Clarity NCLEX",
      topic: "Prioritization",
      free: true,
      why: "Use this to drill unstable-versus-stable decisions, ABCs, and first nursing action logic.",
    },
  ],
  safety_infection_control: [
    {
      kind: "tool",
      title: "Clarity safety question set",
      href: "/free/nclex-safety-questions",
      source: "Clarity NCLEX",
      topic: "Safety and infection control",
      free: true,
      why: "Use this for infection precautions, fall risk, isolation, restraint safety, and environment-of-care misses.",
    },
  ],
  health_promotion: [
    {
      kind: "tool",
      title: "Clarity NCLEX practice questions",
      href: "/free/nclex-practice-questions",
      source: "Clarity NCLEX",
      topic: "Health promotion",
      free: true,
      why: "Use this to reinforce screening, prevention, developmental teaching, and routine follow-up decisions.",
    },
  ],
  psychosocial: [
    {
      kind: "clinical-reference",
      title: "Mental health health topics",
      href: "https://medlineplus.gov/mentalhealth.html",
      source: "MedlinePlus / NIH",
      topic: "Psychosocial integrity",
      free: true,
      why: "Use this for public, non-proprietary review of anxiety, depression, crisis, and therapeutic communication context.",
    },
    {
      kind: "tool",
      title: "Clarity NCLEX practice questions",
      href: "/free/nclex-practice-questions",
      source: "Clarity NCLEX",
      topic: "Psychosocial practice",
      free: true,
      why: "Use this to keep psychosocial misses tied to NCLEX-style answer choices rather than passive reading only.",
    },
  ],
  basic_care_comfort: [
    {
      kind: "tool",
      title: "Clarity NCLEX practice questions",
      href: "/free/nclex-practice-questions",
      source: "Clarity NCLEX",
      topic: "Basic care and comfort",
      free: true,
      why: "Use this for positioning, mobility, nutrition, pain, tubes, wounds, and comfort-care fundamentals.",
    },
  ],
  pharmacological: [
    {
      kind: "tool",
      title: "Clarity pharmacology drug cards",
      href: "/study/pharmacology",
      source: "Clarity NCLEX",
      topic: "Pharmacology",
      free: true,
      why: "Use this for medication safety, adverse effects, contraindications, priority labs, and nursing assessments.",
    },
    {
      kind: "tool",
      title: "Clarity pharmacology question set",
      href: "/free/nclex-pharmacology-questions",
      source: "Clarity NCLEX",
      topic: "Pharmacology practice",
      free: true,
      why: "Use this to turn medication review into NCLEX-style answer selection practice.",
    },
    {
      kind: "tool",
      title: "Dosage calculator",
      href: "/tools/dosage-calculator",
      source: "Clarity NCLEX",
      topic: "Medication calculation",
      free: true,
      why: "Use this when medication misses include dose setup, unit conversion, or safe calculation steps.",
    },
    {
      kind: "clinical-reference",
      title: "Drug information",
      href: "https://medlineplus.gov/druginformation.html",
      source: "MedlinePlus / NIH",
      topic: "Drug monographs",
      free: true,
      why: "Use this as the public source for drug names, indications, warnings, and patient-teaching context.",
    },
  ],
  risk_reduction: [
    {
      kind: "tool",
      title: "Clarity lab values question set",
      href: "/free/nclex-lab-values-questions",
      source: "Clarity NCLEX",
      topic: "Labs and risk reduction",
      free: true,
      why: "Use this when misses involve abnormal labs, diagnostics, complications, or monitoring after procedures.",
    },
    {
      kind: "tool",
      title: "NCLEX lab values guide",
      href: "/nclex-lab-values",
      source: "Clarity NCLEX",
      topic: "Lab interpretation",
      free: true,
      why: "Use this to turn isolated lab-value misses into threshold, trend, and priority-action review.",
    },
  ],
  physiological_adaptation: [
    {
      kind: "tool",
      title: "Clarity respiratory question set",
      href: "/free/nclex-respiratory-questions",
      source: "Clarity NCLEX",
      topic: "Physiological adaptation",
      free: true,
      why: "Use this for airway, oxygenation, perfusion, shock, and acute deterioration priorities.",
    },
    {
      kind: "tool",
      title: "Clarity cardiac question set",
      href: "/free/nclex-cardiac-questions",
      source: "Clarity NCLEX",
      topic: "Cardiac adaptation",
      free: true,
      why: "Use this for chest pain, dysrhythmia, heart failure, perfusion, and unstable cardiac cue recognition.",
    },
  ],
};

const CJMM_RESOURCES: Record<string, StudyResource[]> = {
  "recognize-cues": [
    {
      kind: "tool",
      title: "Clarity NGN case studies",
      href: "/free/nclex-case-studies",
      source: "Clarity NCLEX",
      topic: "Recognize cues",
      free: true,
      why: "Use this to practice finding the vital sign, lab, assessment, and history cues that should change priority.",
    },
  ],
  "analyze-cues": [
    {
      kind: "tool",
      title: "Clarity NGN matrix questions",
      href: "/free/nclex-matrix-questions",
      source: "Clarity NCLEX",
      topic: "Analyze cues",
      free: true,
      why: "Use this to connect multiple cues to likely complications, expected findings, and unsafe assumptions.",
    },
  ],
  "prioritize-hypotheses": [
    {
      kind: "tool",
      title: "Clarity prioritization question set",
      href: "/free/nclex-prioritization-questions",
      source: "Clarity NCLEX",
      topic: "Prioritize hypotheses",
      free: true,
      why: "Use this when the miss is deciding which problem is most urgent after the cues are identified.",
    },
  ],
  "generate-solutions": [
    {
      kind: "tool",
      title: "Clarity NGN question set",
      href: "/free/nclex-ngn-questions",
      source: "Clarity NCLEX",
      topic: "Generate solutions",
      free: true,
      why: "Use this to practice selecting interventions that match the actual priority rather than a plausible side issue.",
    },
  ],
  "take-actions": [
    {
      kind: "tool",
      title: "Clarity prioritization question set",
      href: "/free/nclex-prioritization-questions",
      source: "Clarity NCLEX",
      topic: "Take actions",
      free: true,
      why: "Use this to drill first action, safety escalation, and interventions that cannot wait.",
    },
  ],
  "evaluate-outcomes": [
    {
      kind: "tool",
      title: "Clarity NGN case studies",
      href: "/free/nclex-case-studies",
      source: "Clarity NCLEX",
      topic: "Evaluate outcomes",
      free: true,
      why: "Use this to practice checking whether the intervention improved the clinical problem that mattered most.",
    },
  ],
};

const DIFFICULTY_RESOURCES: Record<number, StudyResource[]> = {
  4: [
    {
      kind: "official",
      title: "NCSBN NGN sample questions and exam preview",
      href: "https://www.nclex.com/prepare",
      source: "NCSBN / NCLEX",
      topic: "Hard NGN practice",
      free: true,
      why: "Use official examples to calibrate difficult clinical-judgment wording against the source exam style.",
    },
  ],
  5: [
    {
      kind: "official",
      title: "NCSBN NGN sample questions and exam preview",
      href: "https://www.nclex.com/prepare",
      source: "NCSBN / NCLEX",
      topic: "Hard NGN practice",
      free: true,
      why: "Use official examples to calibrate difficult clinical-judgment wording against the source exam style.",
    },
    {
      kind: "tool",
      title: "Timed NCLEX practice exam",
      href: "/quiz?mode=practice-exam&practiceExam=nclex-sim-1",
      source: "Clarity NCLEX",
      topic: "Readiness under time",
      free: true,
      why: "Use this when high-difficulty misses may be partly timing, endurance, or prioritization under pressure.",
    },
  ],
};

function resourceKey(resource: StudyResource) {
  return `${resource.kind}:${resource.href}`;
}

function uniqueResources(resources: StudyResource[], limit = 6) {
  const seen = new Set<string>();
  return resources.filter((resource) => {
    const key = resourceKey(resource);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

function normalizeResourceKey(value: string | null | undefined) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (normalized === "reduction_of_risk" || normalized === "reduction_of_risk_potential") return "risk_reduction";
  if (normalized === "pharmacological_and_parenteral" || normalized === "pharmacological_parenteral") return "pharmacological";
  if (normalized === "safety_and_infection_control") return "safety_infection_control";
  if (normalized === "basic_care_and_comfort") return "basic_care_comfort";
  if (normalized === "psychosocial_integrity") return "psychosocial";
  if (normalized === "health_promotion_and_maintenance") return "health_promotion";
  return normalized;
}

export function getStudyResourcesForQuestion(question: ResourceQuestion): StudyResource[] {
  const haystack = [
    question.exam,
    question.category,
    question.nclexClientNeed,
    question.stem,
    question.rationale,
    question.deepRationale,
    question.takeaway,
  ]
    .filter(Boolean)
    .join(" ");

  const resources = [
    ...CORE_NCLEX_RESOURCES,
    ...TOPIC_RESOURCES.filter((entry) => entry.match.test(haystack)).flatMap((entry) => entry.resources),
  ];

  return uniqueResources(resources);
}

export function getStudyResourcesForWeakArea(input: StudyResourceRecommendationInput): StudyResource[] {
  const categoryKey = normalizeResourceKey(input.nclexClientNeed ?? input.category);
  const cjmmKey = String(input.cjmmStep ?? "").trim().toLowerCase();
  const difficulty = Number(input.difficulty ?? 0);
  const haystack = [
    input.exam ?? "nclex",
    input.category,
    input.categoryLabel,
    input.nclexClientNeed,
    input.cjmmStep,
    difficulty > 0 ? `level ${difficulty}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return uniqueResources(
    [
      ...CORE_NCLEX_RESOURCES,
      ...(CLIENT_NEED_RESOURCES[categoryKey] ?? []),
      ...(CJMM_RESOURCES[cjmmKey] ?? []),
      ...(DIFFICULTY_RESOURCES[difficulty] ?? []),
      ...TOPIC_RESOURCES.filter((entry) => entry.match.test(haystack)).flatMap((entry) => entry.resources),
    ],
    input.limit ?? 6,
  );
}
