import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFingerprintIndex,
  countByClientNeed,
  countByFormat,
  paths,
  readArray,
  readJson,
  writeJson,
} from "./nclex-wave-utils.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const reportFile = path.join(repoRoot, "reports", "nclex-release-readiness-latest.json");

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const minUnique = Number(args.get("min-unique") ?? 4000);
const requireLiveParity = args.has("require-live-parity");
const requireOfficialInteractions = args.has("require-official-interactions");

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

const requiredCoreTypes = ["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie"];
const officialInteractions = [
  "extended_multiple_response",
  "extended_drag_drop",
  "cloze_dropdown",
  "highlight_hotspot",
  "matrix_grid",
  "bow_tie",
  "case_study",
  "ordered_response",
];

function pct(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function normalizeInteraction(value) {
  const raw = String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (["sata", "multiple_response", "select_all"].includes(raw)) return "extended_multiple_response";
  if (["drag_drop", "drag_and_drop", "ordered_response", "ordering"].includes(raw)) return raw === "ordering" ? "ordered_response" : "extended_drag_drop";
  if (["hotspot", "hot_spot", "enhanced_hot_spot", "highlight", "highlighting"].includes(raw)) return "highlight_hotspot";
  if (["cloze", "drop_down", "dropdown", "cloze_dropdown", "pull_down"].includes(raw)) return "cloze_dropdown";
  if (["matrix", "matrix_grid", "grid"].includes(raw)) return "matrix_grid";
  if (["bow_tie", "bowtie"].includes(raw)) return "bow_tie";
  if (["case_study", "case"].includes(raw)) return "case_study";
  return raw;
}

function interactionSet(question) {
  const values = [
    question.ngnInteractionType,
    question.interactionType,
    question.type,
    ...(Array.isArray(question.tags) ? question.tags : []),
  ];
  return values.map(normalizeInteraction).filter(Boolean);
}

function hasDiagram(question) {
  return Boolean(
    question?.visualRationale
      || question?.diagramBlueprint
      || question?.chartReview?.diagram?.nodes?.length,
  );
}

function fail(code, detail, evidence = {}) {
  return { code, detail, evidence };
}

const health = readJson(paths.bankHealthReportFile, {});
const refinement = readJson(path.join(paths.questionsRoot, "nclex", "review", "nclex-second-pass-refinement-latest.json"), {});
const questions = readArray(paths.canonicalNclexLiveFile);
const total = questions.length;
const formatMix = countByFormat(questions);
const clientNeedMix = countByClientNeed(questions);
const fingerprintSummary = (() => {
  const clusters = buildFingerprintIndex(questions);
  const collisionCount = Array.from(clusters.values()).reduce((sum, bucket) => sum + Math.max(0, bucket.length - 1), 0);
  return { uniqueCount: clusters.size, collisionCount };
})();
const approvedUsable = Number(refinement?.summary?.approvedRefinedUsableUnique ?? 0);
const diagramCount = questions.filter(hasDiagram).length;
const coreTypesPresent = requiredCoreTypes.filter((type) => Number(formatMix[type] ?? 0) > 0);
const interactions = new Set(questions.flatMap(interactionSet));
const officialPresent = officialInteractions.filter((type) => interactions.has(type));

const failures = [];

if (total < minUnique) {
  failures.push(fail("unique_count_below_floor", `Canonical bank has ${total} items; floor is ${minUnique}.`, { total, minUnique }));
}

if (approvedUsable < minUnique) {
  failures.push(fail("approved_usable_below_floor", `Second-pass approved usable count is ${approvedUsable}; floor is ${minUnique}.`, { approvedUsable, minUnique }));
}

if (fingerprintSummary.collisionCount > 0) {
  failures.push(fail("duplicate_fingerprint_collisions", "Canonical bank still has duplicate fingerprint collisions.", fingerprintSummary));
}

for (const [key, range] of Object.entries(clientNeedRanges)) {
  const percent = pct(clientNeedMix[key] ?? 0, total);
  if (percent < range.min || percent > range.max) {
    failures.push(fail("client_need_out_of_2026_range", `${key} is ${percent}% but official range is ${range.min}-${range.max}%.`, {
      key,
      count: clientNeedMix[key] ?? 0,
      total,
      percent,
      range,
    }));
  }
}

const missingCoreTypes = requiredCoreTypes.filter((type) => !coreTypesPresent.includes(type));
if (missingCoreTypes.length) {
  failures.push(fail("missing_core_item_types", "Canonical bank is missing required renderable core item types.", { missingCoreTypes, formatMix }));
}

const missingOfficial = officialInteractions.filter((type) => !officialPresent.includes(type));
if (requireOfficialInteractions && missingOfficial.length) {
  failures.push(fail("missing_official_ngn_interactions", "Canonical bank lacks one or more official NGN interaction representations.", {
    missingOfficial,
    officialPresent,
  }));
}

if (diagramCount !== total) {
  failures.push(fail("diagram_coverage_not_uniform", `Diagram or visual-rationale coverage is ${diagramCount}/${total}; required is 100%.`, {
    diagramCount,
    total,
    percent: pct(diagramCount, total),
  }));
}

if (requireLiveParity) {
  const deploymentStatus = String(health?.parity?.deployment?.status ?? "unknown");
  const syncStatus = String(health?.parity?.sync?.status ?? "unknown");
  if (deploymentStatus !== "matched" || syncStatus !== "matched") {
    failures.push(fail("live_parity_not_matched", "Deployment and D1 sync parity must be matched before Telegram completion.", {
      deploymentStatus,
      syncStatus,
      deployedCount: health?.parity?.deployment?.deployedCount ?? null,
      syncedCount: health?.parity?.sync?.syncedCount ?? null,
      canonicalCount: total,
    }));
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  exam: "nclex",
  ok: failures.length === 0,
  thresholds: {
    minUnique,
    requireLiveParity,
    requireOfficialInteractions,
    diagramCoverage: "100%",
    clientNeedSource: "2026 NCLEX-RN Test Plan ranges",
  },
  counts: {
    canonicalUnique: total,
    approvedRefinedUsableUnique: approvedUsable,
    duplicateFingerprintCollisions: fingerprintSummary.collisionCount,
    diagramCount,
  },
  mix: {
    formatMix,
    clientNeedMix,
    clientNeedPct: Object.fromEntries(Object.keys(clientNeedRanges).map((key) => [key, pct(clientNeedMix[key] ?? 0, total)])),
    coreTypesPresent,
    officialInteractionsPresent: officialPresent,
  },
  liveParity: {
    deployment: health?.parity?.deployment ?? null,
    sync: health?.parity?.sync ?? null,
  },
  failures,
  telegramCompletionAllowed: failures.length === 0,
};

writeJson(reportFile, report);
process.stdout.write(`${JSON.stringify({
  ok: report.ok,
  report: path.relative(repoRoot, reportFile).replaceAll("\\", "/"),
  counts: report.counts,
  failures: failures.slice(0, 12),
}, null, 2)}\n`);

process.exit(report.ok ? 0 : 1);
