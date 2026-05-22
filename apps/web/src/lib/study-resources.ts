import type { Exam } from "@/lib/types";

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

function resourceKey(resource: StudyResource) {
  return `${resource.kind}:${resource.href}`;
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

  const seen = new Set<string>();
  return resources.filter((resource) => {
    const key = resourceKey(resource);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}
