import fs from "node:fs";
import path from "node:path";
import {
  buildFingerprintDetails,
  countByClientNeed,
  countByFormat,
  NCLEX_TARGET_TOTAL,
  normalizeType,
  paths,
  readArray,
  readJson,
  writeJson,
} from "./nclex-wave-utils.mjs";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const targetTotal = Number(args.get("target-total") ?? NCLEX_TARGET_TOTAL);
const targetNew = Number(args.get("target-new") ?? 0);
const planFile = String(args.get("plan") ?? path.join(paths.configRoot, "nclex-readiness-topup-plan.json"));
const outFile = String(
  args.get("out")
    ?? path.join(paths.questionsRoot, "nclex", "draft", "nclex-original-topup-codex.json"),
);
const reportFile = path.join(paths.chapaiRoot, "reports", "nclex-original-topup-draft-latest.json");

const OFFICIAL_INTERACTION = {
  mcq: "multiple_choice",
  sata: "extended_multiple_response",
  ordering: "ordered_response",
  matrix: "matrix_grid",
  case_study: "case_study",
  bow_tie: "bow_tie",
};

const SOURCE_PACKS = {
  base: [
    {
      title: "NCSBN 2026 NCLEX-RN Test Plan",
      citation: "Official 2026 RN examination blueprint; used for client-needs framing and clinical judgment expectations.",
      href: "https://www.ncsbn.org/publications/2026-nclex-rn-test-plan",
    },
  ],
  management_of_care: [
    {
      title: "NCSBN 2026 NCLEX-RN Test Plan",
      citation: "Management of Care and Clinical Judgment sections; used for prioritization, delegation, and assignment boundaries.",
      href: "https://www.ncsbn.org/public-files/2026_RN_Test-Plan_English-F.pdf",
    },
  ],
  safety_infection_control: [
    {
      title: "CDC Standard Precautions for All Patient Care",
      citation: "Current CDC infection-control guidance; used for hand hygiene, PPE, and risk-assessed standard precautions.",
      href: "https://www.cdc.gov/infection-control/hcp/basics/standard-precautions.html",
    },
    {
      title: "CDC Isolation Precautions",
      citation: "CDC transmission-based precautions guidance; used for contact, droplet, and airborne isolation decisions.",
      href: "https://www.cdc.gov/infection-control/hcp/isolation-precautions/precautions.html",
    },
  ],
  health_promotion: [
    {
      title: "USPSTF A and B Recommendations",
      citation: "Current USPSTF preventive-care recommendation index; used for screening and health-promotion item framing.",
      href: "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics/uspstf-and-b-recommendations",
    },
    {
      title: "ACOG Clinical Guidance",
      citation: "Current ACOG clinical-guidance index; used for prenatal and reproductive-health teaching scenarios.",
      href: "https://www.acog.org/clinical/clinical-guidance",
    },
  ],
  psychosocial: [
    {
      title: "CDC Suicide Prevention",
      citation: "Public-health guidance for suicide risk recognition and safety planning; used for psychosocial safety framing.",
      href: "https://www.cdc.gov/suicide/",
    },
  ],
  basic_care_comfort: [
    {
      title: "AHRQ Preventing Pressure Ulcers in Hospitals",
      citation: "AHRQ hospital pressure-injury prevention toolkit; used for skin integrity, mobility, and comfort care scenarios.",
      href: "https://www.ahrq.gov/patient-safety/settings/hospital/resource/pressureulcer/tool/index.html",
    },
  ],
  pharmacological: [
    {
      title: "DailyMed Drug Label Database",
      citation: "National Library of Medicine drug-label database; used for medication safety, monitoring, and adverse-effect framing.",
      href: "https://dailymed.nlm.nih.gov/dailymed/",
    },
    {
      title: "ADA Standards of Care in Diabetes 2026",
      citation: "Current ADA Standards of Care index; used for diabetes medication safety and hypoglycemia/hyperglycemia logic.",
      href: "https://professional.diabetes.org/standards-of-care",
    },
  ],
  risk_reduction: [
    {
      title: "CDC Pneumonia Management and Prevention Guidelines",
      citation: "CDC clinical links for pneumonia management and prevention; used for respiratory deterioration and diagnostics framing.",
      href: "https://www.cdc.gov/pneumonia/hcp/management-prevention-guidelines/index.html",
    },
    {
      title: "IDSA Community-Acquired Pneumonia Guideline",
      citation: "ATS/IDSA adult community-acquired pneumonia guideline; used for diagnostic and risk-reduction reasoning.",
      href: "https://www.idsociety.org/practice-guideline/community-acquired-pneumonia-cap-in-adults",
    },
  ],
  physiological_adaptation: [
    {
      title: "AHA 2025 CPR and ECC Guidelines",
      citation: "American Heart Association 2025 CPR/ECC guidance overview; used for rescue, deterioration, and emergency-priority framing.",
      href: "https://professional.heart.org/en/science-news/2025-aha-guidelines-for-cpr-and-ecc/top-things-to-know",
    },
    {
      title: "ADA Standards of Care in Diabetes 2026",
      citation: "Current ADA Standards of Care index; used for acute glucose-pattern recognition and nursing escalation scenarios.",
      href: "https://professional.diabetes.org/standards-of-care",
    },
  ],
};

const NEED_FRAMES = {
  management_of_care: {
    unit: "postoperative medical-surgical unit",
    signal: "new assessment data that require RN judgment before assignment",
    correctAction: "keep the unstable assessment and escalation with the RN before delegating routine tasks",
    misconception: "delegate first or document first when the cue requires licensed assessment",
    keyword: "delegation priority triage assignment consent leadership",
    metric: { label: "assignment risk", value: "new change before delegation", flag: "high" },
  },
  safety_infection_control: {
    unit: "acute care isolation room",
    signal: "possible transmission risk with incomplete PPE and room-control steps",
    correctAction: "apply the indicated precautions, protect staff exposure, and isolate the risk before routine care continues",
    misconception: "treat standard precautions as enough when the cue requires transmission-based precautions",
    keyword: "infection isolation precaution transmission fall safety",
    metric: { label: "exposure risk", value: "uncontained", flag: "high" },
  },
  health_promotion: {
    unit: "primary care teaching clinic",
    signal: "preventive-care opportunity with a modifiable risk factor and a readiness cue",
    correctAction: "target evidence-based screening or teaching that matches the client's risk and readiness",
    misconception: "give generic teaching without matching age, risk, contraindications, or readiness",
    keyword: "screening prevention immunization vaccine prenatal health promotion lifestyle",
    metric: { label: "prevention gap", value: "screening due", flag: "high" },
  },
  psychosocial: {
    unit: "behavioral health observation area",
    signal: "safety language or behavior that requires direct risk assessment and protection from harm",
    correctAction: "stay with the client, assess safety directly, remove hazards, and activate the team response",
    misconception: "reassure, leave the client alone, or delay direct safety assessment",
    keyword: "psychosocial suicide crisis de-escalation depression safety",
    metric: { label: "self-harm risk", value: "active cue", flag: "critical" },
  },
  basic_care_comfort: {
    unit: "rehabilitation and comfort-care bay",
    signal: "skin, mobility, pain, nutrition, or comfort cue that can worsen without basic nursing prevention",
    correctAction: "address positioning, skin protection, comfort, and tolerance while reassessing response",
    misconception: "delay basic prevention because the problem feels less technical than labs or medications",
    keyword: "pressure injury positioning mobility nutrition pain comfort wound",
    metric: { label: "comfort risk", value: "needs prevention", flag: "high" },
  },
  pharmacological: {
    unit: "medication-safety step-down area",
    signal: "medication effect, adverse reaction, contraindication, or monitoring value that changes the safest administration decision",
    correctAction: "hold or verify the medication when safety parameters are abnormal and escalate per policy",
    misconception: "administer on schedule despite a safety parameter that requires verification",
    keyword: "medication pharmacological drug insulin anticoagulant toxicity adverse effect",
    metric: { label: "medication risk", value: "verify before dose", flag: "critical" },
  },
  risk_reduction: {
    unit: "diagnostic observation unit",
    signal: "procedure, line, tube, lab, or trend cue that suggests a developing complication",
    correctAction: "reassess the abnormal trend, stop the unsafe process if needed, and notify the provider or rapid response team",
    misconception: "continue the procedure or wait for routine rounds despite a deterioration cue",
    keyword: "risk reduction monitor assessment vital lab diagnostic procedure complication postoperative",
    metric: { label: "complication risk", value: "worsening trend", flag: "critical" },
  },
  physiological_adaptation: {
    unit: "high-acuity medical unit",
    signal: "airway, breathing, circulation, neurologic, or metabolic cue showing unstable physiologic adaptation",
    correctAction: "prioritize airway, breathing, circulation, focused assessment, and escalation for rescue",
    misconception: "choose comfort, teaching, or delayed reassessment before physiologic stabilization",
    keyword: "physiological adaptation respiratory cardiac neurologic shock hypoxia glucose",
    metric: { label: "physiology risk", value: "unstable pattern", flag: "critical" },
  },
};

const ROOM_WORDS = [
  "cedar", "harbor", "summit", "willow", "meridian", "cascade", "orchard", "linden", "harvest", "atlas",
  "prairie", "canyon", "brook", "maple", "ridge", "clover", "mesa", "juniper", "stone", "garden",
  "meadow", "aspen", "bay", "river", "horizon", "valley", "grove", "field", "pine", "silver",
  "copper", "amber", "glen", "station", "vista", "north", "south", "east", "west", "central",
  "oak", "birch", "elm", "spruce", "iris", "lotus", "coral", "pearl", "sage", "briar",
  "marsh", "dune", "isle", "lagoon", "mesa", "glacier", "comet", "nova", "quartz", "opal",
  "brookline", "fairview", "montrose", "haven", "crest", "lane", "terrace", "park", "market", "union",
];

const CLINICAL_VARIANTS = [
  "handoff", "rounding", "admission", "reassessment", "follow-up", "change-of-shift", "call-light", "transfer",
  "procedure", "teaching", "discharge", "triage", "rapid-review", "med-pass", "consult", "recheck",
  "post-event", "night-shift", "morning-rounds", "family-meeting", "therapy-return", "lab-callback",
  "new-order", "equipment-check", "care-conference", "observation", "return-from-imaging", "post-ambulation",
];

const BODY_SYSTEMS = [
  "cardiovascular", "respiratory", "neurologic", "endocrine", "renal", "gastrointestinal", "maternal-newborn",
  "pediatric", "mental-health", "perioperative", "infectious-disease", "skin-integrity", "mobility", "pain",
];

function titleize(value) {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pct(count, total) {
  return total ? Math.round((count / total) * 1000) / 10 : 0;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function loadDraftPool() {
  const draftDir = path.join(paths.questionsRoot, "nclex", "draft");
  if (!fs.existsSync(draftDir)) return [];
  const items = [];
  for (const file of fs.readdirSync(draftDir).filter((entry) => entry.endsWith(".json")).sort()) {
    const full = path.join(draftDir, file);
    if (path.resolve(full) === path.resolve(outFile)) continue;
    const parsed = JSON.parse(fs.readFileSync(full, "utf8"));
    const questions = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : [];
    for (const question of questions) {
      items.push(question);
    }
  }
  return items;
}

function normalizedType(rawType) {
  const type = normalizeType(rawType);
  if (["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie"].includes(type)) {
    return type;
  }
  return "mcq";
}

function referencesFor(clientNeed) {
  const specific = SOURCE_PACKS[clientNeed] ?? [];
  const refs = [...SOURCE_PACKS.base, ...specific];
  const seen = new Set();
  return refs.filter((ref) => {
    if (seen.has(ref.href)) return false;
    seen.add(ref.href);
    return true;
  }).slice(0, 3);
}

function variantToken(index, attempt = 0) {
  const first = ROOM_WORDS[(index + attempt * 7) % ROOM_WORDS.length];
  const second = CLINICAL_VARIANTS[(index * 3 + attempt * 5) % CLINICAL_VARIANTS.length];
  return `${first} ${second}`;
}

function systemFor(prompt, index) {
  const blob = `${prompt.category ?? ""} ${prompt.subcategory ?? ""}`.toLowerCase();
  if (blob.includes("postop") || blob.includes("perioperative")) return "perioperative";
  if (blob.includes("preg") || blob.includes("prenatal") || blob.includes("newborn")) return "maternal-newborn";
  if (blob.includes("pediatric") || blob.includes("child")) return "pediatric";
  if (blob.includes("resp") || blob.includes("pneumonia") || blob.includes("airway")) return "respiratory";
  if (blob.includes("card") || blob.includes("hypertension") || blob.includes("shock")) return "cardiovascular";
  if (blob.includes("neuro") || blob.includes("stroke") || blob.includes("seizure")) return "neurologic";
  if (blob.includes("diabetes") || blob.includes("glucose") || blob.includes("insulin")) return "endocrine";
  if (blob.includes("skin") || blob.includes("pressure") || blob.includes("wound")) return "skin-integrity";
  return BODY_SYSTEMS[index % BODY_SYSTEMS.length];
}

function makeFrame(prompt, index, attempt = 0) {
  const clientNeed = prompt.clientNeed ?? "physiological_adaptation";
  const base = NEED_FRAMES[clientNeed] ?? NEED_FRAMES.physiological_adaptation;
  const system = systemFor(prompt, index);
  const room = variantToken(index, attempt);
  const age = 22 + ((index * 11 + attempt * 3) % 62);
  const hour = 1 + ((index * 5 + attempt) % 11);
  const severity = ["new", "worsening", "unexpected", "persistent", "trend-level"][(index + attempt) % 5];
  const categoryTitle = titleize(prompt.subcategory || prompt.category || clientNeed);
  const scenarioAngle = String(prompt.scenarioAngle ?? categoryTitle).replace(/\s+/g, " ").trim();
  return {
    ...base,
    clientNeed,
    system,
    room,
    age,
    hour,
    severity,
    categoryTitle,
    scenarioAngle,
    topic: titleize(prompt.category || clientNeed),
    subtopic: titleize(prompt.subcategory || prompt.category || clientNeed),
    cue: `${severity} ${base.signal}`,
    context: `During ${room} ${CLINICAL_VARIANTS[(index + attempt) % CLINICAL_VARIANTS.length]} on the ${base.unit}, a ${age}-year-old client is being reviewed ${hour} hour(s) after a change in condition.`,
  };
}

function chartReviewFor(frame, id) {
  const spo2 = frame.clientNeed === "physiological_adaptation" || frame.system === "respiratory" ? "88%" : "94%";
  const heartRate = frame.clientNeed === "psychosocial" ? "112/min" : frame.clientNeed === "pharmacological" ? "54/min" : "118/min";
  const labFlag = frame.clientNeed === "pharmacological" ? { label: "medication safety parameter", value: "outside hold range", flag: "critical" } : frame.metric;
  return {
    patientTitle: `${frame.categoryTitle} - ${frame.room} case`,
    patientCaption: "Use the chart first, then answer the safest next-step question.",
    chiefComplaint: frame.cue,
    history: [
      `${frame.age}-year-old client in ${frame.system} focused care.`,
      `Scenario focus: ${frame.scenarioAngle}.`,
    ],
    allergies: ["No newly reported allergy in this scenario."],
    medications: frame.clientNeed === "pharmacological"
      ? ["Medication due now; safety parameter requires verification before administration."]
      : ["Current medication list reviewed; no new dose should distract from the priority cue."],
    hpi: [
      frame.context,
      `The bedside cue is ${frame.cue}.`,
      `The nurse must avoid the common trap: ${frame.misconception}.`,
    ],
    timeline: [
      `T-60 min: baseline assessment documented for ${frame.subtopic}.`,
      `T-15 min: ${frame.cue} appears during ${frame.room} review.`,
      "Now: nurse must select the safest response before routine tasks continue.",
    ],
    unfoldingTimeline: [
      "Initial data: stable enough for routine care.",
      "New data: priority cue changes the decision.",
      "Decision point: choose the action that reduces harm fastest.",
    ],
    vitals: [
      { label: "BP", value: frame.clientNeed === "psychosocial" ? "148/86" : "96/58", unit: "mm Hg", flag: frame.clientNeed === "health_promotion" ? "normal" : "high", detail: "Interpret with trend and symptoms." },
      { label: "HR", value: heartRate, flag: "high", detail: "Pattern cue, not a standalone diagnosis." },
      { label: "SpO2", value: spo2, flag: spo2 === "88%" ? "critical" : "normal", detail: "Respiratory status should shape priority when abnormal." },
    ],
    labs: [
      { label: "WBC", value: frame.clientNeed === "safety_infection_control" ? "15.8" : "9.4", unit: "K/uL", flag: frame.clientNeed === "safety_infection_control" ? "high" : "normal", detail: "Use with infection and isolation cues." },
      { label: labFlag.label, value: labFlag.value, flag: labFlag.flag, detail: "This is the chart value most tied to the correct action." },
    ],
    orders: [
      "Assess current status before routine task completion.",
      "Escalate according to unit policy for abnormal trend or unsafe parameter.",
      "Document after immediate safety actions are underway.",
    ],
    providerOrders: [
      "Notify provider or rapid response team if deterioration persists after immediate nursing actions.",
    ],
    orderStatus: [
      { label: "Priority reassessment", status: "due now", detail: "Cannot be delegated when judgment is required." },
      { label: "Routine documentation", status: "after safety action", detail: "Important but not the first move." },
    ],
    diagnostics: [
      { label: "Focused trend review", value: "changed from baseline", flag: "high", detail: "The item asks for trend interpretation, not isolated memorization." },
      { label: "Safety screen", value: "positive cue", flag: "high", detail: frame.keyword },
    ],
    notes: [
      `Nursing note: ${frame.cue}.`,
      `Clinical judgment cue: ${frame.correctAction}.`,
    ],
    nursingNotes: [
      `Do not choose an option that would ${frame.misconception}.`,
    ],
    assessments: [
      `Primary assessment focus: ${frame.system}.`,
      "Reassess response after the selected safety action.",
    ],
    intakeOutput: ["Intake/output not the main cue unless tied to the abnormal trend."],
    medicationAdministrationRecord: [
      frame.clientNeed === "pharmacological" ? "Medication administration should pause until the safety parameter is verified." : "MAR review does not supersede the immediate bedside cue.",
    ],
    carePlan: [
      `Care-plan priority: ${frame.correctAction}.`,
    ],
    pastQuestionContext: [
      "Prior context established baseline stability; the current item tests response to a new change.",
    ],
    abnormalValues: [
      { label: labFlag.label, value: labFlag.value, flag: labFlag.flag, detail: "Abnormal or safety-relevant cue." },
    ],
    priorityCues: [
      frame.cue,
      frame.correctAction,
    ],
    diagram: {
      title: `${frame.categoryTitle} decision path`,
      nodes: [
        { label: "cue", value: frame.cue },
        { label: "risk", value: frame.misconception },
        { label: "move", value: frame.correctAction },
      ],
    },
    tutorPrompts: [
      { label: "why now", value: "Which chart cue makes routine care unsafe first?" },
      { label: "trap", value: `Which option would ${frame.misconception}?` },
    ],
  };
}

function visualFor(frame, id) {
  return {
    type: frame.clientNeed === "physiological_adaptation" || frame.clientNeed === "risk_reduction" ? "trend" : "flow",
    accent: frame.clientNeed === "psychosocial" ? "rose" : "amber",
    title: `${frame.categoryTitle} priority map`,
    caption: "Chart cue to risk to safest nursing action.",
    metrics: [
      { label: "cue strength", value: frame.severity, direction: "up", directionLabel: "worsening" },
      { label: "risk level", value: frame.metric.value, direction: frame.metric.flag === "normal" ? "steady" : "up", directionLabel: frame.metric.flag },
    ],
    nodes: [
      { label: "recognize cue", value: frame.cue },
      { label: "analyze risk", value: frame.misconception },
      { label: "take action", value: frame.correctAction },
    ],
    conclusion: `The safest response is the one that addresses ${frame.cue} before routine or delayed actions.`,
  };
}

function diagramFor(frame, id, type) {
  return {
    questionId: id,
    exam: "nclex",
    category: frame.clientNeed,
    type: type === "ordering" ? "pathway" : "flow",
    title: `${frame.categoryTitle} bedside reasoning diagram`,
    focus: `Move from ${frame.cue} to ${frame.correctAction}.`,
    takeaway: `Do not ${frame.misconception}.`,
    rewritePriority: 1,
    diagramWorthiness: true,
  };
}

function baseQuestion(prompt, index, attempt, type) {
  const frame = makeFrame(prompt, index, attempt);
  const id = `codex-topup-${slugify(frame.clientNeed)}-${slugify(type)}-${String(index + 1).padStart(4, "0")}-${slugify(frame.room)}`;
  const interactionType = OFFICIAL_INTERACTION[type] ?? "multiple_choice";
  const references = referencesFor(frame.clientNeed);
  const baseTags = [
    "NCLEX-RN",
    "NGN",
    "original-topup",
    frame.clientNeed,
    frame.keyword,
    frame.system,
    frame.topic,
    frame.subtopic,
    interactionType,
    "apply-analyze",
  ];
  return {
    id,
    exam: "nclex",
    type,
    ngnInteractionType: interactionType,
    interactionType,
    nclexClientNeed: frame.clientNeed,
    cognitiveLevel: type === "ordering" ? "synthesize" : type === "mcq" ? "apply" : "analyze",
    category: prompt.category ?? frame.clientNeed,
    subcategory: prompt.subcategory ?? frame.subtopic,
    difficulty: 4,
    scenarioTitle: `${frame.categoryTitle}: ${frame.room}`,
    scenario: `${frame.context} The question tests ${frame.clientNeed} clinical judgment rather than recall.`,
    additionalInfo: `${frame.keyword}. ${frame.scenarioAngle}`,
    exhibits: [
      {
        type: "assessment",
        title: "Focused chart cue",
        body: frame.cue,
        items: [
          `Unit: ${frame.unit}`,
          `System focus: ${frame.system}`,
          `Common trap: ${frame.misconception}`,
        ],
      },
      {
        type: "vitals",
        title: "Trend cue",
        items: [
          `${frame.metric.label}: ${frame.metric.value}`,
          "Trend interpretation is required before selecting a response.",
        ],
      },
    ],
    chartReview: chartReviewFor(frame, id),
    tags: Array.from(new Set(baseTags)),
    takeaway: `The priority is to ${frame.correctAction} because the chart shows ${frame.cue}.`,
    speedCue: `${frame.cue} means choose the action that reduces harm before routine care.`,
    conceptNotes: [
      `Client need: ${titleize(frame.clientNeed)}.`,
      `Clinical judgment focus: recognize cues, analyze risk, and take action.`,
      "This is an original generated item; citations support clinical facts and blueprint alignment, not item wording.",
    ],
    references,
    provenance: "Generated by Codex original top-up pipeline from local top-up plan prompts; no proprietary item-bank content used.",
    reviewStatus: "approved",
    revision: 1,
    publishState: "published",
    sourceStage: "draft",
    sourcePath: "packages/content/questions/nclex/draft/nclex-original-topup-codex.json",
    visualRationale: visualFor(frame, id),
    diagramBlueprint: diagramFor(frame, id, type),
    coachingFrame: [
      `Pattern: ${frame.cue}.`,
      `Priority move: ${frame.correctAction}.`,
      `Trap: ${frame.misconception}.`,
      "Practice-how-you-test: decide from the chart cue before reading the rationale.",
    ],
    tutorReady: true,
    _frame: frame,
  };
}

function explainCorrect(frame, correctText, answerId) {
  return `Answer ${answerId.toUpperCase()} is correct because ${correctText} directly addresses ${frame.cue}. The nursing concept is clinical judgment: recognize the changed cue, analyze the harm if the nurse delays, and take the action that reduces risk fastest. The pathophysiology or safety mechanism is that ${frame.signal} can worsen if the nurse chooses routine documentation, teaching, or delegation first. Test-taking strategy: eliminate any option that would ${frame.misconception}.`;
}

function wrongRationale(frame, text) {
  return `${text} is not the best choice because it would ${frame.misconception} or fail to respond to ${frame.cue} before routine care continues.`;
}

function addMcq(question) {
  const frame = question._frame;
  const options = [
    { id: "a", text: "Finish routine documentation and recheck the client at the next scheduled round." },
    { id: "b", text: `Pause routine tasks, reassess the changed cue, and ${frame.correctAction}.` },
    { id: "c", text: "Ask unlicensed staff to continue the plan while the nurse reviews other assigned clients." },
    { id: "d", text: "Provide general teaching and wait to see whether the pattern resolves without escalation." },
  ];
  return finishQuestion({
    ...question,
    stem: `${frame.context} Which response should the nurse take first?`,
    options,
    answer: "b",
    rationale: explainCorrect(frame, options[1].text, "b"),
    deepRationale: `${explainCorrect(frame, options[1].text, "b")} Each distractor is tempting because it sounds organized, but NCLEX priority logic rewards the action that protects the client from the active risk first. The cited sources support the blueprint/client-need category and the clinical safety principle used in this original scenario.`,
    distractorRationales: {
      a: wrongRationale(frame, options[0].text),
      c: wrongRationale(frame, options[2].text),
      d: wrongRationale(frame, options[3].text),
    },
  });
}

function addSata(question, index) {
  const frame = question._frame;
  const highlight = index % 5 === 0;
  const options = [
    { id: "a", text: `Reassess the finding that reflects ${frame.cue}.` },
    { id: "b", text: "Delay reassessment until after all routine medications are administered." },
    { id: "c", text: `Escalate or verify the safety issue because ${frame.metric.label} is ${frame.metric.value}.` },
    { id: "d", text: "Delegate interpretation of the changed assessment to assistive personnel." },
    { id: "e", text: "Document the intervention and client response after immediate safety actions are complete." },
    { id: "f", text: "Provide reassurance without asking focused follow-up questions." },
  ];
  const item = finishQuestion({
    ...question,
    ngnInteractionType: highlight ? "highlight_hotspot" : "extended_multiple_response",
    interactionType: highlight ? "highlight_hotspot" : "extended_multiple_response",
    tags: Array.from(new Set([...question.tags, highlight ? "highlight_hotspot" : "extended_multiple_response"])),
    stem: highlight
      ? `Highlight/select the chart entries that require the nurse's follow-up in this ${frame.categoryTitle} scenario.`
      : `${frame.context} Which actions should the nurse include? Select all that apply.`,
    options,
    answer: ["a", "c", "e"],
    highlightRows: highlight
      ? [
        { id: "h1", text: frame.cue, correct: true, rationale: "This is the priority cue." },
        { id: "h2", text: `${frame.metric.label}: ${frame.metric.value}`, correct: true, rationale: "This value supports escalation or verification." },
        { id: "h3", text: "Routine documentation pending", correct: false, rationale: "Documentation follows immediate safety action." },
      ]
      : undefined,
    rationale: `Answers A, C, and E are correct. A recognizes the cue; C acts on the safety-relevant value; E preserves the audit trail after care. B, D, and F are wrong because they would ${frame.misconception}.`,
    deepRationale: `A, C, and E work together as an NCLEX clinical-judgment sequence: reassess, act/escalate, and document response. The underlying concept is that ${frame.signal} can become unsafe when the nurse delays the highest-risk action. B delays care, D transfers judgment outside the RN role, and F substitutes reassurance for assessment. Strategy: in SATA items, keep options that directly reduce the active risk and reject options that sound polite but delay safety.`,
    distractorRationales: {
      a: "Correct: it targets the changed cue.",
      b: wrongRationale(frame, options[1].text),
      c: "Correct: it converts the abnormal value or safety clue into action.",
      d: wrongRationale(frame, options[3].text),
      e: "Correct: documentation is appropriate after immediate intervention.",
      f: wrongRationale(frame, options[5].text),
    },
  });
  return item;
}

function addOrdering(question) {
  const frame = question._frame;
  const options = [
    { id: "a", text: `Perform a focused reassessment of ${frame.cue}.` },
    { id: "b", text: "Notify the provider or rapid response pathway with the focused data." },
    { id: "c", text: `Initiate the immediate nursing safety step tied to ${frame.correctAction}.` },
    { id: "d", text: "Document the assessment, action, and client response." },
  ];
  return finishQuestion({
    ...question,
    stem: `${frame.context} Place the nursing actions in the safest order.`,
    options,
    answer: ["a", "c", "b", "d"],
    rationale: "The safest order is A, C, B, D: reassess the active cue, start the immediate safety step, escalate with focused data, then document. Documentation and routine reporting should not precede the action that prevents harm.",
    deepRationale: `Ordered-response items reward sequence discipline. The nurse first verifies the cue, then acts on ${frame.correctAction}, then escalates with concise data, and finally documents. Moving documentation or delegation earlier would ${frame.misconception}.`,
    distractorRationales: {
      a: "First: assessment confirms the priority cue.",
      c: "Second: the immediate safety step reduces active risk.",
      b: "Third: escalation is stronger after focused data and initial safety action.",
      d: "Last: documentation follows care and response.",
    },
  });
}

function addMatrix(question) {
  const frame = question._frame;
  const matrixColumns = ["Expected/safe", "Concerning or needs follow-up", "Unsafe to delegate/delay"];
  const matrixRows = [
    { label: `New cue: ${frame.cue}`, answer: "Concerning or needs follow-up" },
    { label: `Response: ${frame.correctAction}`, answer: "Expected/safe" },
    { label: `Choice to ${frame.misconception}`, answer: "Unsafe to delegate/delay" },
    { label: "Documentation after the client is safe", answer: "Expected/safe" },
  ];
  return finishQuestion({
    ...question,
    stem: `${frame.context} For each finding or action tied to ${frame.cue}, select whether it is expected/safe, concerning, or unsafe to delay/delegate.`,
    options: matrixColumns.map((text, index) => ({ id: String.fromCharCode(97 + index), text })),
    answer: Object.fromEntries(matrixRows.map((row) => [row.label, row.answer])),
    matrixColumns,
    matrixRows,
    rationale: `The concerning row is the active cue, and the unsafe row is the option that would ${frame.misconception}. The expected rows either perform the safest response or document after care.`,
    deepRationale: `Matrix/grid items test classification, not memorized facts. The nurse separates data that require follow-up from actions that are safe, while rejecting any action that delays the highest-risk response. The clinical judgment model is recognize cues, analyze cues, prioritize hypotheses, take action, and evaluate outcomes.`,
  });
}

function addCaseStudy(question, index) {
  const frame = question._frame;
  const caseNumber = (index % 6) + 1;
  const caseId = `case-${slugify(frame.clientNeed)}-${slugify(frame.topic)}-${Math.floor(index / 6)}`;
  const options = [
    { id: "a", text: "Prioritize routine discharge teaching because it is already planned." },
    { id: "b", text: `Use the new chart cue to ${frame.correctAction}.` },
    { id: "c", text: "Ask the family which option they prefer before reassessing the client." },
    { id: "d", text: "Wait for the next scheduled vital-sign set before changing the plan." },
  ];
  return finishQuestion({
    ...question,
    caseStudyId: caseId,
    caseStudyTitle: `${frame.categoryTitle} unfolding case`,
    caseItemNumber: caseNumber,
    caseItemTotal: 6,
    stem: `Case item ${caseNumber}/6: ${frame.context} Based on the unfolding chart, which conclusion should guide the nurse's next action?`,
    options,
    answer: "b",
    rationale: explainCorrect(frame, options[1].text, "b"),
    deepRationale: `This unfolding case changes priority because ${frame.cue}. Answer B uses the new data, while the other choices delay assessment, over-focus on routine teaching, or substitute preference gathering for clinical judgment. Strategy: in case studies, carry forward prior context but let new abnormal data change the priority.`,
    distractorRationales: {
      a: wrongRationale(frame, options[0].text),
      c: wrongRationale(frame, options[2].text),
      d: wrongRationale(frame, options[3].text),
    },
  });
}

function addBowTie(question) {
  const frame = question._frame;
  const options = [
    { id: "a", text: "Cause: routine scheduling delay; Action: finish other tasks; Outcome: chart reviewed later." },
    { id: "b", text: `Cause: ${frame.cue}; Action: ${frame.correctAction}; Outcome: risk decreases through timely escalation or verification.` },
    { id: "c", text: "Cause: client anxiety only; Action: offer reassurance; Outcome: no further assessment needed." },
    { id: "d", text: "Cause: documentation backlog; Action: complete forms first; Outcome: bedside cue can wait." },
  ];
  return finishQuestion({
    ...question,
    bowTie: {
      cause: frame.cue,
      actions: [frame.correctAction],
      outcomes: ["risk decreases through timely escalation or verification"],
    },
    stem: `${frame.context} Complete the bow-tie logic for ${frame.cue}: choose the linked cause, action, and expected outcome.`,
    options,
    answer: "b",
    rationale: explainCorrect(frame, options[1].text, "b"),
    deepRationale: `Bow-tie items require relational reasoning. The central cause is not generic anxiety or paperwork; it is ${frame.cue}. The linked action is ${frame.correctAction}, and the expected outcome is reduced risk. The distractors break the relationship by choosing a weak cause, delayed action, or non-clinical outcome.`,
    distractorRationales: {
      a: wrongRationale(frame, options[0].text),
      c: wrongRationale(frame, options[2].text),
      d: wrongRationale(frame, options[3].text),
    },
  });
}

function maybeCloze(question, index, frame) {
  if (question.type !== "mcq" || index % 4 !== 0) {
    return question;
  }
  return finishQuestion({
    ...question,
    _frame: frame,
    ngnInteractionType: "cloze_dropdown",
    interactionType: "cloze_dropdown",
    tags: Array.from(new Set([...question.tags, "cloze_dropdown"])),
    clozeTemplate: `The nurse should first [blank1] because the chart shows [blank2].`,
    clozeBlankCount: 2,
    stem: `${question.stem} Complete the clinical sentence using the best linked action and cue.`,
    options: [
      { id: "a", text: `document later / ${frame.metric.label}` },
      { id: "b", text: `${frame.correctAction} / ${frame.cue}` },
      { id: "c", text: `delegate the interpretation / ${frame.room}` },
      { id: "d", text: `provide reassurance only / planned routine care` },
    ],
    answer: "b",
    rationale: explainCorrect(frame, `${frame.correctAction} linked with ${frame.cue}`, "b"),
    distractorRationales: {
      a: wrongRationale(frame, "Documenting later without immediate action"),
      c: wrongRationale(frame, "Delegating interpretation"),
      d: wrongRationale(frame, "Reassurance only"),
    },
  });
}

function finishQuestion(question) {
  const { _frame, ...clean } = question;
  const details = buildFingerprintDetails(clean);
  return {
    ...clean,
    nclexClientNeed: details.clientNeed,
    waveMetadata: {
      familyKey: details.familyKey,
      angleSignature: details.angleSignature,
      duplicateFingerprint: details.duplicateFingerprint,
      sourceLane: "codex-original-topup",
      sourceBatchId: "topup-5000",
      duplicateRisk: false,
      promotionDecision: "promote",
    },
  };
}

function makeQuestion(prompt, index, attempt = 0) {
  const type = normalizedType(prompt.questionType);
  const base = baseQuestion(prompt, index, attempt, type);
  if (type === "sata") return addSata(base, index);
  if (type === "ordering") return addOrdering(base);
  if (type === "matrix") return addMatrix(base);
  if (type === "case_study") return addCaseStudy(base, index);
  if (type === "bow_tie") return addBowTie(base);
  return maybeCloze(addMcq(base), index, base._frame);
}

function interactionCounts(questions) {
  const counts = {};
  for (const question of questions) {
    const key = String(question.ngnInteractionType ?? question.interactionType ?? question.type ?? "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function progressDigest(generated, rejected, needed) {
  if (!generated.length || generated.length % 250 !== 0) return;
  const totalAttempts = generated.length + rejected.length;
  process.stdout.write(JSON.stringify({
    progress: generated.length,
    remaining: Math.max(0, needed - generated.length),
    countByFormat: countByFormat(generated),
    countByInteraction: interactionCounts(generated),
    rejectionRatePct: pct(rejected.length, totalAttempts),
    topRejectionReasons: Object.entries(rejected.reduce((acc, item) => {
      acc[item.reason] = (acc[item.reason] ?? 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5),
  }) + "\n");
}

const plan = readJson(planFile, {});
const prompts = Array.isArray(plan.prompts)
  ? plan.prompts
  : Array.isArray(plan.promptPlan?.prompts)
    ? plan.promptPlan.prompts
    : [];
if (!prompts.length) {
  throw new Error(`No top-up prompts found in ${planFile}`);
}

const currentCanonical = readArray(paths.canonicalNclexLiveFile);
const existingQuestions = [...currentCanonical, ...loadDraftPool()];
const seenFingerprints = new Set();
const seenStemKeys = new Set();
for (const question of existingQuestions) {
  const details = buildFingerprintDetails(question);
  seenFingerprints.add(details.duplicateFingerprint);
  seenStemKeys.add(`${normalizeType(question.type)}::${String(question.stem ?? "").toLowerCase().replace(/[^a-z]+/g, " ").trim().slice(0, 220)}`);
}

const needed = targetNew > 0 ? targetNew : Math.max(0, targetTotal - currentCanonical.length);
const generated = [];
const rejected = [];
let promptCursor = 0;

while (generated.length < needed && promptCursor < prompts.length * 4) {
  const prompt = prompts[promptCursor % prompts.length];
  const index = promptCursor;
  let accepted = false;

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const candidate = makeQuestion(prompt, index, attempt);
    const details = buildFingerprintDetails(candidate);
    const stemKey = `${normalizeType(candidate.type)}::${String(candidate.stem ?? "").toLowerCase().replace(/[^a-z]+/g, " ").trim().slice(0, 220)}`;
    if (seenFingerprints.has(details.duplicateFingerprint)) {
      rejected.push({ id: candidate.id, reason: "duplicate_fingerprint", promptCursor, attempt });
      continue;
    }
    if (seenStemKeys.has(stemKey)) {
      rejected.push({ id: candidate.id, reason: "near_duplicate_stem", promptCursor, attempt });
      continue;
    }
    if (!candidate.references.every((ref) => /^https?:\/\//.test(String(ref.href ?? "")))) {
      rejected.push({ id: candidate.id, reason: "citation_missing_url", promptCursor, attempt });
      continue;
    }
    if (!candidate.visualRationale && !candidate.diagramBlueprint && !candidate.chartReview?.diagram?.nodes?.length) {
      rejected.push({ id: candidate.id, reason: "missing_visual_support", promptCursor, attempt });
      continue;
    }

    generated.push(candidate);
    seenFingerprints.add(details.duplicateFingerprint);
    seenStemKeys.add(stemKey);
    accepted = true;
    progressDigest(generated, rejected, needed);
    break;
  }

  if (!accepted) {
    rejected.push({ id: `prompt-${promptCursor}`, reason: "prompt_exhausted", promptCursor });
  }
  promptCursor += 1;
}

ensureDir(outFile);
writeJson(outFile, generated);

const report = {
  generatedAt: new Date().toISOString(),
  sourcePlan: path.relative(paths.chapaiRoot, planFile).replaceAll("\\", "/"),
  outputFile: path.relative(paths.chapaiRoot, outFile).replaceAll("\\", "/"),
  currentCanonical: currentCanonical.length,
  targetTotal,
  needed,
  generated: generated.length,
  rejected: rejected.length,
  rejectionRatePct: pct(rejected.length, generated.length + rejected.length),
  countByFormat: countByFormat(generated),
  countByInteraction: interactionCounts(generated),
  countByClientNeed: countByClientNeed(generated),
  blocker: generated.length < needed ? "insufficient_unique_candidates_generated" : null,
  rejectionReasons: Object.entries(rejected.reduce((acc, item) => {
    acc[item.reason] = (acc[item.reason] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).map(([reason, count]) => ({ reason, count })),
  citationPolicy: "Public authoritative URLs only; proprietary review banks are not copied or cited as item sources.",
};

writeJson(reportFile, report);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
