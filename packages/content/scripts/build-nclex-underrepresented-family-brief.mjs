import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const chapaiRoot = path.resolve(__dirname, "..", "..", "..");

const canonicalPath = path.join(
  chapaiRoot,
  "packages",
  "content",
  "questions",
  "nclex",
  "live",
  "reviewed-curated-live.unique.json",
);
const seedsPath = path.join(
  chapaiRoot,
  "packages",
  "content",
  "questions",
  "nclex",
  "draft",
  "nclex-diversity-seeds.json",
);
const ngnSeedsPath = path.join(
  chapaiRoot,
  "packages",
  "content",
  "questions",
  "nclex",
  "draft",
  "nclex-ngn-diversity-seeds.json",
);
const outputJsonPath = path.join(chapaiRoot, "config", "nclex-underrepresented-family-prompts.json");
const outputTxtPath = path.join(chapaiRoot, "reports", "nclex-underrepresented-family-brief.txt");

const focusCatalog = [
  {
    category: "ectopic_pregnancy_rupture",
    subcategory: "Ruptured ectopic pregnancy",
    questionTypes: ["case_study", "sata", "matrix", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "early pregnancy with unilateral pain, shoulder pain, and shock clues",
      "triage after positive pregnancy test with unstable bleeding",
    ],
  },
  {
    category: "placental_abruption_pain",
    subcategory: "Placental abruption",
    questionTypes: ["case_study", "sata", "matrix", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "painful dark bleeding with rigid uterus",
      "late-pregnancy trauma with fetal distress",
    ],
  },
  {
    category: "cord_prolapse_positioning",
    subcategory: "Umbilical cord prolapse",
    questionTypes: ["bow_tie", "sata", "ordering", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "variable decelerations after rupture of membranes",
      "manual elevation of presenting part and knee-chest positioning",
    ],
  },
  {
    category: "newborn_hypoglycemia_jitteriness",
    subcategory: "Newborn hypoglycemia",
    questionTypes: ["case_study", "sata", "matrix", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "jittery newborn of diabetic parent",
      "poor feeding with low temperature and low glucose",
    ],
  },
  {
    category: "neonatal_sepsis_instability",
    subcategory: "Neonatal sepsis",
    questionTypes: ["bow_tie", "case_study", "sata", "matrix", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "temperature instability and poor feeding",
      "lethargy with respiratory changes in the newborn",
    ],
  },
  {
    category: "pyloric_stenosis_projectile_vomiting",
    subcategory: "Pyloric stenosis",
    questionTypes: ["case_study", "bow_tie", "sata", "matrix", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "projectile vomiting and olive-shaped mass",
      "metabolic alkalosis clues in infant vomiting",
    ],
  },
  {
    category: "intussusception_currant_jelly",
    subcategory: "Intussusception",
    questionTypes: ["case_study", "bow_tie", "sata", "matrix", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "episodic pain with currant jelly stool",
      "drawing knees to chest between crying spells",
    ],
  },
  {
    category: "status_epilepticus_benzo_first",
    subcategory: "Status epilepticus",
    questionTypes: ["case_study", "bow_tie", "sata", "ordering", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "ongoing seizure beyond 5 minutes",
      "airway positioning plus first-line medication sequence",
    ],
  },
  {
    category: "pulmonary_embolism_post_op",
    subcategory: "Postoperative pulmonary embolism",
    questionTypes: ["bow_tie", "case_study", "sata", "matrix", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "sudden dyspnea, pleuritic pain, tachycardia after surgery",
      "priority oxygenation and escalation cues",
    ],
  },
  {
    category: "heparin_induced_thrombocytopenia",
    subcategory: "Heparin-induced thrombocytopenia",
    questionTypes: ["bow_tie", "case_study", "sata", "matrix", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "platelet fall after heparin exposure with new thrombosis concern",
      "stop-heparin-first logic without using generic aPTT toxicity",
    ],
  },
  {
    category: "tumor_lysis_syndrome",
    subcategory: "Tumor lysis syndrome",
    questionTypes: ["case_study", "sata", "matrix", "ordering", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "post-chemotherapy electrolyte collapse",
      "hyperkalemia and renal injury escalation",
    ],
  },
  {
    category: "serotonin_syndrome",
    subcategory: "Serotonin syndrome",
    questionTypes: ["bow_tie", "case_study", "sata", "matrix", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "SSRI plus MAOI interaction",
      "agitation, hyperreflexia, fever, diarrhea pattern recognition",
    ],
  },
  {
    category: "neuroleptic_malignant_syndrome",
    subcategory: "Neuroleptic malignant syndrome",
    questionTypes: ["case_study", "sata", "matrix", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "rigidity, fever, autonomic instability after antipsychotic therapy",
      "distinguish from serotonin syndrome",
    ],
  },
  {
    category: "transsphenoidal_csf_leak",
    subcategory: "Transsphenoidal surgery complication",
    questionTypes: ["case_study", "bow_tie", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "clear drainage and postop positioning restrictions",
      "CSF leak recognition after pituitary surgery",
    ],
  },
  {
    category: "pheochromocytoma_crisis",
    subcategory: "Pheochromocytoma hypertensive crisis",
    questionTypes: ["case_study", "sata", "matrix", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "episodic severe hypertension, headache, diaphoresis",
      "medication and escalation priority",
    ],
  },
  {
    category: "acute_rejection_transplant",
    subcategory: "Transplant rejection",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "new kidney transplant with fever, tenderness, decreased urine",
      "which finding requires immediate report",
    ],
  },
  {
    category: "organophosphate_poisoning",
    subcategory: "Organophosphate poisoning",
    questionTypes: ["bow_tie", "sata", "matrix", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "SLUDGE symptoms with field exposure",
      "decontamination and antidote order logic",
    ],
  },
  {
    category: "burn_inhalation_stridor",
    subcategory: "Burn inhalation injury",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "facial burns with soot and hoarseness",
      "airway-first action before visible decompensation",
    ],
  },
  {
    category: "severe_hyponatremia_seizure",
    subcategory: "Severe hyponatremia",
    questionTypes: ["bow_tie", "case_study", "sata", "ordering", "matrix", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "confusion and seizure risk from sodium crash",
      "hypertonic saline escalation logic",
    ],
  },
  {
    category: "amniotic_fluid_embolism",
    subcategory: "Amniotic fluid embolism",
    questionTypes: ["bow_tie", "sata", "ordering", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "sudden hypoxia and hypotension during labor or immediately postpartum",
      "recognition and resuscitation priority",
    ],
  },
  {
    category: "postpartum_hemorrhage_boggy_fundus",
    subcategory: "Postpartum hemorrhage from uterine atony",
    questionTypes: ["bow_tie", "sata", "ordering", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "variant scenario with clots, bladder distention, or delayed atony",
      "avoid repeating the same boggy-fundus wording",
    ],
  },
  {
    category: "placenta_previa_bleeding",
    subcategory: "Placenta previa",
    questionTypes: ["bow_tie", "case_study", "sata", "matrix", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "third-trimester painless bleeding with fetal monitoring priority",
      "avoid vaginal exam and differentiate from abruption",
    ],
  },
  {
    category: "dka_fluid_priority",
    subcategory: "Diabetic ketoacidosis",
    questionTypes: ["bow_tie", "case_study", "sata", "ordering", "matrix", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "adult DKA with perfusion compromise",
      "sequence fluids -> potassium check -> insulin",
    ],
  },
  {
    category: "anaphylaxis_epinephrine_first",
    subcategory: "Anaphylaxis",
    questionTypes: ["bow_tie", "sata", "ordering", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "medication-triggered anaphylaxis with wheeze and swelling",
      "sequence stop trigger, epinephrine, airway support",
    ],
  },
  {
    category: "autonomic_dysreflexia_bladder",
    subcategory: "Autonomic dysreflexia",
    questionTypes: ["bow_tie", "sata", "ordering", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "severe hypertension in high spinal cord injury",
      "remove trigger and positioning sequence",
    ],
  },
  {
    category: "magnesium_sulfate_toxicity",
    subcategory: "Magnesium sulfate toxicity",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "postpartum client with low respirations and absent reflexes",
      "link urine output decline to rising toxicity risk",
    ],
  },
  {
    category: "malignant_hyperthermia_initial",
    subcategory: "Malignant hyperthermia",
    questionTypes: ["bow_tie", "case_study", "ordering", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "post-anesthesia rigidity with rising end-tidal CO2",
      "recognize early clues before extreme fever dominates the stem",
    ],
  },
  {
    category: "hyperkalemia_ecg_emergency",
    subcategory: "Hyperkalemia emergency",
    questionTypes: ["case_study", "sata", "matrix", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "peaked T waves with acute kidney injury",
      "distinguish urgent membrane stabilization from slower cleanup steps",
    ],
  },
  {
    category: "epiglottitis_airway_protection",
    subcategory: "Epiglottitis airway emergency",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "drooling child with muffled voice and stridor",
      "avoid throat stimulation while protecting the airway",
    ],
  },
  {
    category: "blood_transfusion_reaction",
    subcategory: "Transfusion reaction",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "chills and low-back pain shortly after blood starts",
      "stop-the-blood-first logic under pressure",
    ],
  },
  {
    category: "compartment_syndrome_warning",
    subcategory: "Compartment syndrome",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "casted limb with pain out of proportion",
      "neurovascular decline after fracture immobilization",
    ],
  },
  {
    category: "opioid_oversedation",
    subcategory: "Opioid oversedation",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "post-op client difficult to arouse with low respirations",
      "airway and naloxone priorities before routine reassessment",
    ],
  },
  {
    category: "acute_angle_glaucoma",
    subcategory: "Acute angle-closure glaucoma",
    questionTypes: ["case_study", "sata", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "severe eye pain with halos and nausea",
      "protect vision by treating this as an urgent pressure problem",
    ],
  },
  {
    category: "adrenal_crisis_hypotension",
    subcategory: "Adrenal crisis",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "vomiting, hypotension, and hyponatremia in adrenal insufficiency",
      "shock logic when steroids were missed or stress rose quickly",
    ],
  },
  {
    category: "digoxin_toxicity",
    subcategory: "Digoxin toxicity",
    questionTypes: ["case_study", "sata", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "nausea with yellow halos and bradycardia",
      "recognize toxicity clues before focusing on routine heart-failure symptoms",
    ],
  },
  {
    category: "epidural_hypotension_fetal",
    subcategory: "Epidural-related fetal compromise",
    questionTypes: ["bow_tie", "case_study", "ordering", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "maternal hypotension after epidural with late decelerations",
      "link maternal position and perfusion rescue to fetal recovery",
    ],
  },
  {
    category: "late_deceleration_rescue",
    subcategory: "Late deceleration rescue",
    questionTypes: ["bow_tie", "case_study", "ordering", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "recurrent late decelerations during oxytocin infusion",
      "intrauterine resuscitation sequence before drift into monitoring-only thinking",
    ],
  },
  {
    category: "peritoneal_dialysis_peritonitis",
    subcategory: "Peritoneal dialysis peritonitis",
    questionTypes: ["case_study", "sata", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "cloudy outflow with abdominal pain during PD",
      "distinguish urgent infection concern from routine catheter discomfort",
    ],
  },
  {
    category: "sickle_cell_acute_chest",
    subcategory: "Acute chest syndrome",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "sickle cell client with fever, chest pain, and falling oxygenation",
      "separate acute chest syndrome from simple pain crisis thinking",
    ],
  },
  {
    category: "thyroidectomy_stridor",
    subcategory: "Post-thyroidectomy airway compromise",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "new stridor after thyroid surgery",
      "airway-first rescue when neck swelling threatens ventilation",
    ],
  },
  {
    category: "tracheostomy_dislodgement",
    subcategory: "Tracheostomy dislodgement",
    questionTypes: ["bow_tie", "case_study", "ordering", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "fresh trach accidentally dislodged",
      "mature versus fresh tract rescue logic under pressure",
    ],
  },
  {
    category: "chest_tube_air_leak",
    subcategory: "Chest tube air leak",
    questionTypes: ["case_study", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "continuous bubbling in the water-seal chamber",
      "isolate system leak versus expected tidaling without disconnecting the client from safety",
    ],
  },
  {
    category: "hellp_syndrome",
    subcategory: "HELLP syndrome",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "epigastric pain and worsening blood pressure in late pregnancy",
      "link liver pain and low platelets to maternal emergency escalation",
    ],
  },
  {
    category: "myasthenic_crisis_airway",
    subcategory: "Myasthenic crisis",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "worsening bulbar weakness with rising respiratory effort",
      "differentiate airway fatigue from anxiety or simple medication timing issues",
    ],
  },
  {
    category: "tension_pneumothorax_decompensation",
    subcategory: "Tension pneumothorax",
    questionTypes: ["bow_tie", "case_study", "ordering", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "sudden hypotension and unilateral absent breath sounds after central line placement",
      "recognize the obstructive-shock pattern before the client arrests",
    ],
  },
  {
    category: "pericardial_tamponade_pressure",
    subcategory: "Pericardial tamponade",
    questionTypes: ["case_study", "bow_tie", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "muffled heart sounds with jugular venous distention and falling blood pressure",
      "link pulsus paradoxus and shock to impaired cardiac filling",
    ],
  },
  {
    category: "fat_embolism_long_bone_fracture",
    subcategory: "Fat embolism syndrome",
    questionTypes: ["case_study", "bow_tie", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "long-bone fracture followed by hypoxia, confusion, and petechiae",
      "separate fat embolism from simple pain or atelectasis thinking",
    ],
  },
  {
    category: "neutropenic_fever_sepsis",
    subcategory: "Neutropenic fever",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "post-chemotherapy fever with profound neutropenia",
      "treat this as sepsis risk even when the client still looks fairly stable",
    ],
  },
  {
    category: "cauda_equina_bladder_retention",
    subcategory: "Cauda equina syndrome",
    questionTypes: ["case_study", "bow_tie", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "new urinary retention and saddle anesthesia with severe back pain",
      "recognize spinal cord compression urgency instead of routine sciatica care",
    ],
  },
  {
    category: "postpartum_preeclampsia_headache",
    subcategory: "Postpartum preeclampsia",
    questionTypes: ["bow_tie", "case_study", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "postpartum headache with vision change and severe blood pressure elevation",
      "move from postpartum discharge assumptions into seizure-prevention thinking",
    ],
  },
  {
    category: "right_ventricular_mi_nitrate_drop",
    subcategory: "Right ventricular infarction",
    questionTypes: ["case_study", "bow_tie", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "inferior STEMI with hypotension that worsens after nitrates",
      "recognize preload dependence and the danger of reflex vasodilation",
    ],
  },
  {
    category: "meningococcal_sepsis_petechiae",
    subcategory: "Meningococcal sepsis",
    questionTypes: ["sata", "bow_tie", "case_study", "mcq"],
    diagramWorthiness: false,
    scenarioAngles: [
      "fever with petechial rash and rapid hemodynamic decline",
      "infection-control plus sepsis-escalation clues under time pressure",
    ],
  },
  {
    category: "myxedema_coma_hypothermia",
    subcategory: "Myxedema coma",
    questionTypes: ["case_study", "bow_tie", "sata", "mcq"],
    diagramWorthiness: true,
    scenarioAngles: [
      "older adult with hypothermia, bradycardia, and declining mental status",
      "recognize endocrine collapse instead of simple winter exposure or sedation",
    ],
  },
];

function slugTitle(text) {
  return text
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

const canonical = await readJson(canonicalPath, []);
const seeds = [
  ...(await readJson(seedsPath, [])),
  ...(await readJson(ngnSeedsPath, [])),
];
const catalogByCategory = new Map(focusCatalog.map((item) => [item.category, item]));

for (const seed of seeds) {
  const category = String(seed?.category || "").trim();
  if (!category || catalogByCategory.has(category)) {
    continue;
  }

  const scenarioAngles = [seed?.scenario, seed?.additionalInfo]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .slice(0, 2);

  catalogByCategory.set(category, {
    category,
    subcategory: String(seed?.subcategory || category).trim(),
    questionTypes: [String(seed?.type || "mcq").trim().toLowerCase()],
    diagramWorthiness: Boolean(seed?.visualRationale),
    scenarioAngles: scenarioAngles.length > 0 ? scenarioAngles : [`fresh ${category.replaceAll("_", " ")} vignette with new bedside clues`],
  });
}

const catalog = Array.from(catalogByCategory.values());

const countByCategory = new Map();
const countByCategoryType = new Map();
for (const question of canonical) {
  const category = String(question?.category || "").trim();
  const questionType = String(question?.type || "mcq").trim().toLowerCase();
  if (!category) continue;
  countByCategory.set(category, (countByCategory.get(category) || 0) + 1);
  const typeKey = `${category}::${questionType}`;
  countByCategoryType.set(typeKey, (countByCategoryType.get(typeKey) || 0) + 1);
}

const seededCategories = new Set(seeds.map((item) => String(item?.category || "").trim()).filter(Boolean));

const prompts = catalog
  .map((item) => {
    const currentLiveCount = countByCategory.get(item.category) || 0;
    const seeded = seededCategories.has(item.category);
    const missingPreferredTypes = item.questionTypes.filter(
      (questionType) =>
        questionType !== "mcq" && (countByCategoryType.get(`${item.category}::${questionType}`) || 0) === 0,
    );
    const preferredQuestionTypes = [
      ...missingPreferredTypes,
      ...item.questionTypes.filter((questionType) => !missingPreferredTypes.includes(questionType)),
    ];
      return {
        ...item,
        currentLiveCount,
        seeded,
        missingPreferredTypes,
        preferredQuestionTypes,
        priority:
          currentLiveCount === 0
            ? 1
            : currentLiveCount === 1 || missingPreferredTypes.length >= 2
              ? 2
              : missingPreferredTypes.length >= 1 && currentLiveCount <= 5
                ? 3
                : currentLiveCount <= 3
                  ? 3
                  : 4,
        prompt: `Generate a clinically distinct NCLEX ${preferredQuestionTypes.join("/")} item in ${item.subcategory}. Prefer ${preferredQuestionTypes[0]} first for this family. Use a new vignette and distractor structure, not a rephrase of any existing stem. Include a fast clue cluster, a concise rationale, and an expandable deep rationale with readable citations.`,
      };
  })
  .sort((a, b) =>
    a.priority - b.priority ||
    a.currentLiveCount - b.currentLiveCount ||
    b.missingPreferredTypes.length - a.missingPreferredTypes.length ||
    Number(a.seeded) - Number(b.seeded) ||
    a.category.localeCompare(b.category),
  );

const payload = {
  generatedAt: new Date().toISOString(),
  sourceFile: "packages/content/questions/nclex/live/reviewed-curated-live.unique.json",
  seededCategoryCount: seededCategories.size,
  prompts,
};

const lines = [
  "CURRENT UNDERREPRESENTED NCLEX FAMILY BRIEF",
  "Use the highest-priority families first.",
  "Do not rewrite existing stems. Create distinctly new scenarios inside these families.",
  "Prefer families with currentLiveCount 0 or 1 before generic imported backlog categories.",
  "",
];

for (const item of prompts.slice(0, 18)) {
  lines.push(
    `- [P${item.priority}] ${slugTitle(item.category)} | live=${item.currentLiveCount} | seeded=${item.seeded ? "yes" : "no"}`,
    `  Focus: ${item.subcategory}.`,
    `  Prefer: ${item.preferredQuestionTypes.join(", ")}${item.missingPreferredTypes.length ? ` | missing live type(s): ${item.missingPreferredTypes.join(", ")}` : ""}`,
    `  Prompt: ${item.prompt}`,
    `  Scenario angles: ${item.scenarioAngles.join("; ")}`,
    `  Diagram when prudent: ${item.diagramWorthiness ? "yes" : "no"}`,
    "",
  );
}

await mkdir(path.dirname(outputJsonPath), { recursive: true });
await mkdir(path.dirname(outputTxtPath), { recursive: true });
await writeFile(outputJsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
await writeFile(outputTxtPath, `${lines.join("\n")}\n`, "utf8");

console.log(JSON.stringify({
  outputJsonPath,
  outputTxtPath,
  promptCount: prompts.length,
  topPromptCategories: prompts.slice(0, 10).map((item) => item.category),
}, null, 2));
