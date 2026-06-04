import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");

const DEFAULT_PLAN = path.join(repoRoot, "config", "nclex-readiness-topup-plan.json");
const DEFAULT_REFINEMENT = path.join(repoRoot, "packages/content/questions/nclex/review/nclex-second-pass-refinement-latest.json");
const DEFAULT_TOPUP = path.join(repoRoot, "packages/content/questions/nclex/review/nclex-top-up-needed.latest.json");
const DEFAULT_CANDIDATES = path.join(repoRoot, "reports", "nclex-live-promotion-candidates-auto.json");
const DEFAULT_OUTPUT_DIR = path.join(repoRoot, "reports", "nclex-worker-queues");

const WORKER_LANES = [
  {
    id: "case-study",
    label: "Case study agent",
    questionTypes: ["case_study"],
    liveTypes: ["case_study"],
  },
  {
    id: "bow-tie",
    label: "Bow-tie agent",
    questionTypes: ["bow_tie"],
    liveTypes: ["bow_tie"],
  },
  {
    id: "ordering",
    label: "Drag-and-drop / ordering agent",
    questionTypes: ["ordering"],
    liveTypes: ["ordering"],
  },
  {
    id: "cloze-dropdown",
    label: "Drop-down cloze agent",
    questionTypes: ["cloze", "cloze_dropdown", "dropdown"],
    liveTypes: ["cloze_dropdown"],
    supportStatus: "extension_needed",
    blocker: "Top-up planner and canonical schema currently do not emit first-class cloze-dropdown bank items. Use as an interaction overlay only until schema/rendering is promoted.",
  },
  {
    id: "matrix-mcq",
    label: "Matrix multiple-choice agent",
    questionTypes: ["matrix"],
    liveTypes: ["matrix"],
    split: "even",
  },
  {
    id: "matrix-mr",
    label: "Matrix multiple-response agent",
    questionTypes: ["matrix"],
    liveTypes: ["matrix"],
    split: "odd",
  },
  {
    id: "highlight-hotspot",
    label: "Highlight / hot-spot agent",
    questionTypes: ["highlight", "hotspot", "highlight_hotspot"],
    liveTypes: ["highlight_hotspot"],
    supportStatus: "extension_needed",
    blocker: "Highlight/hot-spot exists in sample UI but not as a first-class canonical NCLEX bank type.",
  },
  {
    id: "sata",
    label: "Extended multi-response SATA agent",
    questionTypes: ["sata", "extended_multiple_response"],
    liveTypes: ["sata"],
  },
  {
    id: "mcq",
    label: "Traditional multiple-choice agent",
    questionTypes: ["mcq"],
    liveTypes: ["mcq"],
  },
];

function parseArgs(argv) {
  const args = new Map();
  for (const arg of argv) {
    const [rawKey, ...rest] = arg.replace(/^--/, "").split("=");
    args.set(rawKey, rest.length ? rest.join("=") : "true");
  }
  return args;
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}

function normalizeType(value) {
  return String(value ?? "mcq").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function getPromptItems(plan) {
  const prompts = plan?.promptPlan?.prompts;
  return Array.isArray(prompts) ? prompts : [];
}

function promptBelongsToLane(prompt, lane, globalIndex) {
  const type = normalizeType(prompt?.questionType);
  if (!lane.questionTypes.includes(type)) {
    return false;
  }
  if (lane.split === "even") {
    return globalIndex % 2 === 0;
  }
  if (lane.split === "odd") {
    return globalIndex % 2 === 1;
  }
  return true;
}

function countBy(items, getKey) {
  const output = {};
  for (const item of items) {
    const key = getKey(item) || "unknown";
    output[key] = (output[key] ?? 0) + 1;
  }
  return output;
}

function summarizeQueue(lane, prompts, options) {
  const maxItems = options.maxItemsPerLane;
  const queueItems = prompts.slice(0, maxItems).map(({ prompt, globalIndex }) => ({
    queueId: `${lane.id}-${String(globalIndex + 1).padStart(5, "0")}`,
    sourcePromptIndex: globalIndex,
    clientNeed: prompt.clientNeed,
    category: prompt.category,
    subcategory: prompt.subcategory,
    questionType: prompt.questionType,
    scenarioAngle: prompt.scenarioAngle,
    prompt: prompt.prompt,
    promotionGate: "source_pass + deterministic_second_pass + clinical_accuracy_review + dual_model_review + coordinator_promotion",
  }));

  return {
    laneId: lane.id,
    label: lane.label,
    generatedAt: options.generatedAt,
    status: prompts.length ? "ready_for_worker_review" : lane.supportStatus ?? "no_prompts_available",
    blocker: prompts.length ? null : lane.blocker ?? "No prompt-plan items currently target this lane.",
    queuePolicy: {
      source: "config/nclex-readiness-topup-plan.json",
      promotion: "Do not write directly to live bank. Promote only through the coordinator after all quality gates pass.",
      citations: "Do not invent citations. Unverified references keep the item in needs_review.",
    },
    counts: {
      totalPromptsInLane: prompts.length,
      materializedQueueItems: queueItems.length,
      omittedForSize: Math.max(0, prompts.length - queueItems.length),
      byClientNeed: countBy(prompts, ({ prompt }) => prompt.clientNeed),
      byQuestionType: countBy(prompts, ({ prompt }) => normalizeType(prompt.questionType)),
    },
    items: queueItems,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const planPath = path.resolve(repoRoot, args.get("plan") ?? DEFAULT_PLAN);
  const refinementPath = path.resolve(repoRoot, args.get("refinement") ?? DEFAULT_REFINEMENT);
  const topUpPath = path.resolve(repoRoot, args.get("top-up") ?? DEFAULT_TOPUP);
  const candidatesPath = path.resolve(repoRoot, args.get("candidates") ?? DEFAULT_CANDIDATES);
  const outputDir = path.resolve(repoRoot, args.get("out-dir") ?? DEFAULT_OUTPUT_DIR);
  const maxItemsPerLane = Math.max(0, Number(args.get("max-items-per-lane") ?? 120));
  const generatedAt = new Date().toISOString();

  const plan = readJson(planPath, {});
  const refinement = readJson(refinementPath, {});
  const topUp = readJson(topUpPath, {});
  const candidates = readJson(candidatesPath, {});
  const promptItems = getPromptItems(plan).map((prompt, globalIndex) => ({ prompt, globalIndex }));

  fs.mkdirSync(outputDir, { recursive: true });

  const laneReports = [];
  for (const lane of WORKER_LANES) {
    const lanePrompts = promptItems.filter((entry) => promptBelongsToLane(entry.prompt, lane, entry.globalIndex));
    const report = summarizeQueue(lane, lanePrompts, { generatedAt, maxItemsPerLane });
    const filePath = path.join(outputDir, `${lane.id}.json`);
    writeJson(filePath, report);
    laneReports.push({
      laneId: lane.id,
      label: lane.label,
      status: report.status,
      report: rel(filePath),
      totalPromptsInLane: report.counts.totalPromptsInLane,
      materializedQueueItems: report.counts.materializedQueueItems,
      blocker: report.blocker,
    });
  }

  const coordinatorReport = {
    generatedAt,
    exam: "nclex",
    target: {
      approvedRefinedUnique: 5000,
      readinessExams: 5,
      readinessExamLength: 85,
    },
    current: {
      approvedRefinedUsableUnique: refinement?.summary?.approvedRefinedUsableUnique ?? null,
      sourceCount: refinement?.summary?.sourceCount ?? null,
      remainingTo5000: refinement?.summary?.remainingTo5000 ?? null,
      topUpNeeded: refinement?.summary?.topUpNeeded ?? null,
      eligibleDraftNonCollidingCandidates: candidates?.eligibleNonColliding ?? null,
      currentlySelectedDraftCandidates: candidates?.selected ?? null,
    },
    sourceFiles: {
      plan: rel(planPath),
      refinement: rel(refinementPath),
      topUp: rel(topUpPath),
      candidates: rel(candidatesPath),
    },
    qualityPolicy: [
      "No blind bulk batching.",
      "Every worker output remains a candidate until deterministic refinement, clinical accuracy review, NGN mechanics validation, rationale/citation validation, and dual-model review pass.",
      "Items with unverified citations must stay needs_review.",
      "Live promotion and readiness exam finalization stay blocked until the 5,000 approved/refined unique gate passes.",
    ],
    deficits: {
      itemDeficits: topUp?.itemDeficits ?? [],
      clientNeedDeficits: topUp?.clientNeedDeficits ?? [],
      generatedPromptCount: plan?.promptPlan?.promptCount ?? promptItems.length,
      generatedPromptsByNeed: plan?.promptPlan?.promptCountsByNeed ?? {},
      unfilledByNeed: plan?.promptPlan?.unfilledByNeed ?? {},
    },
    laneReports,
  };

  const coordinatorPath = path.join(outputDir, "coordinator.json");
  writeJson(coordinatorPath, coordinatorReport);
  process.stdout.write(`${JSON.stringify({
    ok: true,
    coordinator: rel(coordinatorPath),
    lanes: laneReports.map((lane) => ({
      laneId: lane.laneId,
      totalPromptsInLane: lane.totalPromptsInLane,
      status: lane.status,
    })),
  }, null, 2)}\n`);
}

main();
