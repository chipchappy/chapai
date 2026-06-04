import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  countByClientNeed,
  countByFormat,
  normalizeText,
  paths,
  readArray,
  readJson,
  resolveNclexClientNeed,
} from "./nclex-wave-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

const outputJsonPath = path.join(repoRoot, "config", "nclex-readiness-topup-plan.json");
const outputTxtPath = path.join(repoRoot, "reports", "nclex-readiness-topup-plan.txt");

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const minUnique = Number(args.get("min-unique") ?? 4000);
const promptCap = Number(args.get("prompt-cap") ?? 420);
const perCategoryMax = Number(args.get("per-category-max") ?? 4);
const avoidDraftFingerprintTop = Number(args.get("avoid-draft-fingerprint-top") ?? 8);

const clientNeedRanges = {
  management_of_care: { min: 15, max: 21, target: 18 },
  safety_infection_control: { min: 10, max: 16, target: 13 },
  health_promotion: { min: 6, max: 12, target: 9 },
  psychosocial: { min: 6, max: 12, target: 9 },
  basic_care_comfort: { min: 6, max: 12, target: 9 },
  pharmacological: { min: 13, max: 19, target: 16 },
  risk_reduction: { min: 9, max: 15, target: 12 },
  physiological_adaptation: { min: 11, max: 17, target: 14 },
};

const questionTypePriority = ["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie"];

function pct(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function slugTitle(value) {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function ceilDiv(a, b) {
  if (!b) return 0;
  return Math.floor((a + b - 1) / b);
}

async function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function buildCategoryIndex(questions) {
  const categoryCounts = new Map();
  const categoryTypeCounts = new Map();

  for (const question of questions) {
    const category = String(question?.category ?? "").trim();
    const type = String(question?.type ?? "mcq").trim().toLowerCase();
    if (!category) continue;
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    const key = `${category}::${type}`;
    categoryTypeCounts.set(key, (categoryTypeCounts.get(key) ?? 0) + 1);
  }

  return { categoryCounts, categoryTypeCounts };
}

function normalizeSeed(seed) {
  if (!seed || typeof seed !== "object") return null;
  const category = String(seed.category ?? "").trim();
  if (!category) return null;

  const subcategory = String(seed.subcategory ?? "").trim() || undefined;
  const scenarioAngles = [
    seed.scenario,
    seed.additionalInfo,
    ...(Array.isArray(seed.tags) ? seed.tags : []),
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .slice(0, 4);

  const inferredClientNeed = resolveNclexClientNeed(seed);
  return {
    category,
    subcategory,
    inferredClientNeed: inferredClientNeed || null,
    scenarioAngles,
    diagramWorthiness: Boolean(seed.visualRationale || seed.diagramBlueprint),
    defaultType: String(seed.type ?? "").trim().toLowerCase() || "mcq",
  };
}

function choosePromptTypes({ category, categoryTypeCounts }) {
  const missingCore = questionTypePriority.filter((type) => {
    if (type === "mcq") return false;
    return (categoryTypeCounts.get(`${category}::${type}`) ?? 0) === 0;
  });
  const preferred = [
    ...missingCore,
    ...questionTypePriority.filter((type) => !missingCore.includes(type)),
  ];
  return { preferred, missingCore };
}

function buildPrompt({ clientNeed, seed, questionType, scenarioAngle, uniqueSeed, avoidPatterns }) {
  const angle = scenarioAngle ? `Scenario angle: ${scenarioAngle}.` : "";
  const avoidBlock = Array.isArray(avoidPatterns) && avoidPatterns.length
    ? [
      "Avoid overused draft patterns (do NOT generate these):",
      ...avoidPatterns.map((pattern) => `- ${pattern}`),
    ].join("\n")
    : "";
  return [
    `Generate a clinically distinct NCLEX ${questionType} item.`,
    `Client-need target: ${clientNeed}.`,
    `Family: ${seed.subcategory ? `${seed.subcategory} (${seed.category})` : seed.category}.`,
    angle,
    `Uniqueness seed: ${uniqueSeed}.`,
    avoidBlock,
    "Hard constraints:",
    "- Must not reuse an existing stem or option set; create a new vignette with new bedside clues, vitals, and context.",
    "- Include a concise rationale plus a deeper expandable rationale with readable citations (no fabricated URLs).",
    "- Include a diagram/visual rationale blueprint when prudent for the scenario.",
    "- Ensure the interaction matches official shapes (SATA, ordered response, matrix grid, case study, bow-tie, etc.).",
  ]
    .filter(Boolean)
    .join("\n");
}

const canonical = readArray(paths.canonicalNclexLiveFile);
const total = canonical.length;
const formatMix = countByFormat(canonical);
const clientNeedMix = countByClientNeed(canonical);
const { categoryCounts, categoryTypeCounts } = buildCategoryIndex(canonical);

const seeds = [
  ...(await readJsonFile(path.join(paths.questionsRoot, "nclex", "draft", "nclex-diversity-seeds.json"), [])),
  ...(await readJsonFile(path.join(paths.questionsRoot, "nclex", "draft", "nclex-ngn-diversity-seeds.json"), [])),
]
  .map(normalizeSeed)
  .filter(Boolean);

function cueFromDuplicateFingerprint(value) {
  const text = String(value ?? "");
  const parts = text.split("::");
  return parts.length ? parts[parts.length - 1] : "";
}

function summarizeAvoidPattern(cluster) {
  const familyKey = String(cluster?.familyKey ?? "").trim();
  const cue = cueFromDuplicateFingerprint(cluster?.duplicateFingerprint);
  const cueShort = cue.length > 96 ? `${cue.slice(0, 96)}…` : cue;
  if (familyKey && cueShort) return `${familyKey} | cue=${cueShort}`;
  if (familyKey) return familyKey;
  return cueShort;
}

function buildAvoidPatternsByNeed(bankHealth) {
  const clusters = bankHealth?.draftFingerprints?.clusters;
  if (!Array.isArray(clusters) || avoidDraftFingerprintTop <= 0) return new Map();

  const map = new Map(Object.keys(clientNeedRanges).map((key) => [key, []]));
  for (const cluster of clusters) {
    const fp = String(cluster?.duplicateFingerprint ?? "");
    const need = fp.split("::")[0];
    if (!map.has(need)) continue;
    map.get(need).push(cluster);
  }

  for (const [need, list] of map.entries()) {
    map.set(
      need,
      list
        .slice()
        .sort((a, b) => (Number(b?.count ?? 0) - Number(a?.count ?? 0)))
        .slice(0, avoidDraftFingerprintTop)
        .map(summarizeAvoidPattern)
        .filter(Boolean),
    );
  }

  return map;
}

const bankHealth = await readJson(path.join(repoRoot, "config", "nclex-bank-health-latest.json"), null);
const avoidPatternsByNeed = buildAvoidPatternsByNeed(bankHealth);

const seedsByClientNeed = new Map(Object.keys(clientNeedRanges).map((key) => [key, []]));
for (const seed of seeds) {
  const clientNeed = seed.inferredClientNeed;
  if (clientNeed && seedsByClientNeed.has(clientNeed)) {
    seedsByClientNeed.get(clientNeed).push(seed);
  }
}

function buildFallbackSeeds({ clientNeed, categoryCounts }) {
  const avoidNeed = clientNeed !== "physiological_adaptation" ? "physiological_adaptation" : null;

  return seeds
    .filter((seed) => {
      if (!avoidNeed) return true;
      return seed.inferredClientNeed !== avoidNeed;
    })
    .slice()
    .sort((a, b) => {
      const countA = categoryCounts.get(a.category) ?? 0;
      const countB = categoryCounts.get(b.category) ?? 0;
      const inferredA = a.inferredClientNeed ? 1 : 0;
      const inferredB = b.inferredClientNeed ? 1 : 0;
      return countA - countB
        || inferredA - inferredB
        || a.category.localeCompare(b.category);
    });
}

const targetCounts = Object.fromEntries(
  Object.entries(clientNeedRanges).map(([key, range]) => [key, Math.round((minUnique * range.target) / 100)]),
);

const deficits = Object.fromEntries(
  Object.keys(clientNeedRanges).map((key) => [key, Math.max(0, (targetCounts[key] ?? 0) - (clientNeedMix[key] ?? 0))]),
);

const uniqueNeeded = Math.max(0, minUnique - total);

const planPrompts = [];
const promptCountsByNeed = Object.fromEntries(Object.keys(clientNeedRanges).map((key) => [key, 0]));
const promptCountsByNeedCategory = new Map();
const unfilledByNeed = Object.fromEntries(Object.keys(clientNeedRanges).map((key) => [key, 0]));
const seedCoverageByNeed = Object.fromEntries(Object.keys(clientNeedRanges).map((key) => [key, 0]));
const warnings = [];
const warningKeys = new Set();

const needsByPriority = Object.entries(deficits)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([key]) => key);

for (const clientNeed of needsByPriority) {
  if (planPrompts.length >= promptCap) break;
  const remaining = deficits[clientNeed] ?? 0;
  if (!remaining) continue;

  const primary = (seedsByClientNeed.get(clientNeed) ?? [])
    .slice()
    .sort((a, b) => {
      const countA = categoryCounts.get(a.category) ?? 0;
      const countB = categoryCounts.get(b.category) ?? 0;
      return countA - countB || a.category.localeCompare(b.category);
    });

  seedCoverageByNeed[clientNeed] = primary.length;

  const passes = [
    { name: "primary", list: primary },
    { name: "fallback", list: buildFallbackSeeds({ clientNeed, categoryCounts }) },
  ];

  for (const pass of passes) {
    if (planPrompts.length >= promptCap) break;
    if (promptCountsByNeed[clientNeed] >= remaining) break;

    for (const seed of pass.list) {
      if (planPrompts.length >= promptCap) break;
      if (promptCountsByNeed[clientNeed] >= remaining) break;

      const categoryKey = `${clientNeed}::${seed.category}`;
      const already = promptCountsByNeedCategory.get(categoryKey) ?? 0;
      if (already >= perCategoryMax) continue;

      const { preferred } = choosePromptTypes({ category: seed.category, categoryTypeCounts });
      const baseLabel = normalizeText(seed.subcategory ?? seed.category).slice(0, 48) || normalizeText(seed.category).slice(0, 48);

      while (
        planPrompts.length < promptCap
        && promptCountsByNeed[clientNeed] < remaining
        && (promptCountsByNeedCategory.get(categoryKey) ?? 0) < perCategoryMax
      ) {
        const nextIndex = promptCountsByNeedCategory.get(categoryKey) ?? 0;
        const questionType = preferred[nextIndex % preferred.length] ?? seed.defaultType ?? "mcq";
        const scenarioAngle =
          seed.scenarioAngles?.[nextIndex]
          ?? seed.scenarioAngles?.[nextIndex % Math.max(1, seed.scenarioAngles.length)]
          ?? `fresh ${baseLabel} vignette with new bedside clues`;

        const uniqueSeed = `mix-2026:${clientNeed}:${seed.category}:${nextIndex + 1}:${pass.name}`;
        planPrompts.push({
          clientNeed,
          category: seed.category,
          subcategory: seed.subcategory,
          seedInferredClientNeed: seed.inferredClientNeed,
          seedPass: pass.name,
          questionType,
          diagramWorthiness: seed.diagramWorthiness,
          scenarioAngle,
          prompt: buildPrompt({
            clientNeed,
            seed,
            questionType,
            scenarioAngle,
            uniqueSeed,
            avoidPatterns: avoidPatternsByNeed.get(clientNeed) ?? [],
          }),
        });

        promptCountsByNeed[clientNeed] += 1;
        promptCountsByNeedCategory.set(categoryKey, nextIndex + 1);
      }
    }
  }

  const unfilled = Math.max(0, remaining - (promptCountsByNeed[clientNeed] ?? 0));
  unfilledByNeed[clientNeed] = unfilled;
  if (unfilled > 0) {
    const key = `prompt_plan_unfilled_need::${clientNeed}`;
    warningKeys.add(key);
    warnings.push({
      code: "prompt_plan_unfilled_need",
      clientNeed,
      remainingNeeded: remaining,
      plannedPrompts: promptCountsByNeed[clientNeed] ?? 0,
      unfilled,
      seedCoverage: seedCoverageByNeed[clientNeed] ?? 0,
      detail: "Not enough seed families (or per-category cap) to allocate prompts for this client-need deficit. Add/expand seed families for this need.",
    });
  }
}

for (const [clientNeed, remaining] of Object.entries(deficits)) {
  if (!remaining) continue;

  if (!seedCoverageByNeed[clientNeed]) {
    seedCoverageByNeed[clientNeed] = (seedsByClientNeed.get(clientNeed) ?? []).length;
  }

  const planned = promptCountsByNeed[clientNeed] ?? 0;
  const unfilled = Math.max(0, remaining - planned);
  unfilledByNeed[clientNeed] = unfilled;
  if (unfilled === 0) continue;

  const warnKey = `prompt_plan_unfilled_need::${clientNeed}`;
  if (warningKeys.has(warnKey)) continue;

  warnings.push({
    code: "prompt_plan_unfilled_need",
    clientNeed,
    remainingNeeded: remaining,
    plannedPrompts: planned,
    unfilled,
    seedCoverage: seedCoverageByNeed[clientNeed] ?? 0,
    detail: planPrompts.length >= promptCap
      ? "Prompt cap reached before fully allocating this client-need deficit. Increase --prompt-cap to cover remaining needs."
      : "Not enough seed families (or per-category cap) to allocate prompts for this client-need deficit. Add/expand seed families for this need.",
  });
}

const payload = {
  generatedAt: new Date().toISOString(),
  exam: "nclex",
  goal: {
    minUnique,
    promptCap,
    perCategoryMax,
    clientNeedRanges,
  },
  current: {
    canonicalUnique: total,
    formatMix,
    clientNeedMix,
    clientNeedPct: Object.fromEntries(Object.keys(clientNeedRanges).map((key) => [key, pct(clientNeedMix[key] ?? 0, total)])),
  },
  targetsAtFloor: {
    clientNeedTargetCounts: targetCounts,
  },
  deficits: {
    uniqueNeeded,
    clientNeedTargetDeficits: deficits,
  },
  promptPlan: {
    promptCount: planPrompts.length,
    promptCountsByNeed,
    unfilledByNeed,
    seedCoverageByNeed,
    warnings,
    prompts: planPrompts,
  },
  notes: [
    "This plan does not generate questions; it produces prompt briefs to fill 2026 client-need deficits.",
    "If promptCount is far below uniqueNeeded, increase --prompt-cap and/or widen seed catalog before running generation.",
    "Live parity mismatches require an approved deploy + D1 sync step; this plan is local-only.",
  ],
};

const lines = [
  "NCLEX READINESS TOP-UP PLAN (LOCAL-ONLY)",
  `Generated: ${payload.generatedAt}`,
  "",
  `Current canonical unique: ${total}`,
  `Unique needed to reach floor (${minUnique}): ${uniqueNeeded}`,
  "",
  "Client-need mix (current %):",
  ...Object.keys(clientNeedRanges).map((key) => `- ${key}: ${pct(clientNeedMix[key] ?? 0, total)}% (count=${clientNeedMix[key] ?? 0}) target=${clientNeedRanges[key].target}%`),
  "",
  `Prompt cap: ${promptCap} (generated ${planPrompts.length})`,
  "",
  "Top prompts (first 12):",
];

for (const item of planPrompts.slice(0, 12)) {
  lines.push(
    "",
    `- ${slugTitle(item.category)} | need=${item.clientNeed} | type=${item.questionType} | live=${categoryCounts.get(item.category) ?? 0}`,
    `  Angle: ${item.scenarioAngle}`,
    `  Diagram: ${item.diagramWorthiness ? "yes" : "no"}`,
  );
}

await mkdir(path.dirname(outputJsonPath), { recursive: true });
await mkdir(path.dirname(outputTxtPath), { recursive: true });
await writeFile(outputJsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
await writeFile(outputTxtPath, `${lines.join("\n")}\n`, "utf8");

process.stdout.write(`${JSON.stringify({
  outputJsonPath: path.relative(repoRoot, outputJsonPath).replaceAll("\\", "/"),
  outputTxtPath: path.relative(repoRoot, outputTxtPath).replaceAll("\\", "/"),
  minUnique,
  uniqueNeeded,
  generatedPrompts: planPrompts.length,
  promptCap,
  byNeed: promptCountsByNeed,
  unfilledByNeed,
  seedCoverageByNeed,
  warningsCount: warnings.length,
}, null, 2)}\n`);
