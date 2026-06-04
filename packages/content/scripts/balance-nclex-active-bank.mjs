import path from "node:path";
import {
  buildFingerprintDetails,
  countByFormat,
  NCLEX_TARGET_TOTAL,
  normalizeType,
  paths,
  readArray,
  readJson,
  writeJson,
} from "./nclex-wave-utils.mjs";

const reportFile = path.join(paths.reportsRoot ?? path.join(paths.chapaiRoot, "reports"), "nclex-active-bank-balance-latest.json");
const retiredFile = path.join(paths.reportsRoot ?? path.join(paths.chapaiRoot, "reports"), "nclex-balanced-retired-extras.json");

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const targetTotal = Number(args.get("target-total") ?? NCLEX_TARGET_TOTAL);
const targetByNeed = {
  management_of_care: 899,
  safety_infection_control: 650,
  health_promotion: 450,
  psychosocial: 450,
  basic_care_comfort: 481,
  pharmacological: 770,
  risk_reduction: 600,
  physiological_adaptation: 700,
};
const requiredCoreTypes = ["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie"];
const requiredInteractions = [
  "extended_multiple_response",
  "extended_drag_drop",
  "cloze_dropdown",
  "highlight_hotspot",
  "matrix_grid",
  "bow_tie",
  "case_study",
  "ordered_response",
];

function normalizeInteraction(value) {
  const raw = String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (["sata", "multiple_response", "select_all"].includes(raw)) return "extended_multiple_response";
  if (["drag_drop", "drag_and_drop", "ordering", "ordered_response"].includes(raw)) return raw === "ordering" ? "ordered_response" : "extended_drag_drop";
  if (["hotspot", "hot_spot", "enhanced_hot_spot", "highlight", "highlighting"].includes(raw)) return "highlight_hotspot";
  if (["cloze", "drop_down", "dropdown", "cloze_dropdown", "pull_down"].includes(raw)) return "cloze_dropdown";
  if (["matrix", "matrix_grid", "grid"].includes(raw)) return "matrix_grid";
  if (["bow_tie", "bowtie"].includes(raw)) return "bow_tie";
  if (["case_study", "case"].includes(raw)) return "case_study";
  return raw;
}

function interactionsFor(question) {
  return [
    question.ngnInteractionType,
    question.interactionType,
    question.type,
    ...(Array.isArray(question.tags) ? question.tags : []),
  ].map(normalizeInteraction).filter(Boolean);
}

function pct(count, total) {
  return total ? Math.round((count / total) * 1000) / 10 : 0;
}

function clientNeed(question) {
  const explicit = String(question?.nclexClientNeed ?? "").trim();
  return explicit || "physiological_adaptation";
}

function sourceScore(question) {
  const source = String(question.sourcePath ?? "").toLowerCase();
  if (source.includes("nclex-original-topup-codex")) return 15;
  if (String(question.sourceStage ?? "") === "live") return 12;
  if (source.includes("diversity-seeds")) return 10;
  return 0;
}

function qualityScore(question, manifestById) {
  const manifest = manifestById.get(String(question.id));
  const scores = manifest?.scores ?? {};
  const base = Number(scores.qualityScore ?? 85);
  const rationale = Number(scores.rationaleQualityScore ?? 0) / 10;
  const citation = Number(scores.citationQualityScore ?? 0) / 10;
  const clinical = Number(scores.clinicalAccuracyScore ?? 0) / 10;
  const visual = question.visualRationale || question.diagramBlueprint || question.chartReview?.diagram?.nodes?.length ? 5 : 0;
  const chart = question.chartReview?.hpi?.length || question.chartReview?.notes?.length ? 4 : 0;
  return base + rationale + citation + clinical + visual + chart + sourceScore(question);
}

function compareCandidates(manifestById) {
  return (left, right) => {
    const scoreDelta = qualityScore(right, manifestById) - qualityScore(left, manifestById);
    if (scoreDelta !== 0) return scoreDelta;
    const typeDelta = normalizeType(left.type).localeCompare(normalizeType(right.type));
    if (typeDelta !== 0) return typeDelta;
    return String(left.id).localeCompare(String(right.id));
  };
}

function countNeeds(questions) {
  const counts = Object.fromEntries(Object.keys(targetByNeed).map((need) => [need, 0]));
  for (const question of questions) {
    const need = clientNeed(question);
    if (need in counts) counts[need] += 1;
  }
  return counts;
}

function selectOne(pool, selectedIds, needCounts, predicate) {
  const candidate = pool
    .filter((question) => !selectedIds.has(String(question.id)))
    .filter((question) => needCounts[clientNeed(question)] < targetByNeed[clientNeed(question)])
    .filter(predicate)
    [0];
  if (!candidate) return null;
  selectedIds.add(String(candidate.id));
  needCounts[clientNeed(candidate)] += 1;
  return candidate;
}

const activeQuestions = readArray(paths.canonicalNclexLiveFile);
const retiredQuestions = (() => {
  const value = readJson(retiredFile, {});
  return Array.isArray(value) ? value : Array.isArray(value.questions) ? value.questions : [];
})();
const topupDraftQuestions = readArray(path.join(paths.questionsRoot, "nclex", "draft", "nclex-original-topup-codex.json"));
const poolById = new Map();
for (const question of [...activeQuestions, ...retiredQuestions, ...topupDraftQuestions]) {
  if (question?.exam === "nclex") {
    const id = String(question.id);
    if (!poolById.has(id)) {
      poolById.set(id, question);
    }
  }
}
const questions = [...poolById.values()];
const manifest = readJson(path.join(paths.questionsRoot, "nclex", "review", "nclex-refinement-manifest.latest.json"), {});
const manifestById = new Map((manifest.items ?? []).map((item) => [String(item.questionId), item]));
const blockedIds = new Set(
  (manifest.items ?? [])
    .filter((item) => !["approved", "refined"].includes(String(item.status)))
    .map((item) => String(item.questionId)),
);

const eligible = questions.filter((question) => question?.exam === "nclex" && !blockedIds.has(String(question.id)));
const metaById = new Map();
for (const question of eligible) {
  const id = String(question.id);
  metaById.set(id, {
    id,
    need: clientNeed(question),
    type: normalizeType(question.type),
    interactions: interactionsFor(question),
    score: qualityScore(question, manifestById),
  });
}
const availableByNeed = countNeeds(eligible);
const shortages = Object.entries(targetByNeed)
  .filter(([need, target]) => (availableByNeed[need] ?? 0) < target)
  .map(([need, target]) => ({ need, target, available: availableByNeed[need] ?? 0 }));

if (shortages.length) {
  throw new Error(`Cannot balance active bank; shortages: ${JSON.stringify(shortages)}`);
}

const selectedIds = new Set();
const needCounts = Object.fromEntries(Object.keys(targetByNeed).map((need) => [need, 0]));
const selected = [];
const sortedEligible = [...eligible].sort((left, right) => {
  const leftMeta = metaById.get(String(left.id));
  const rightMeta = metaById.get(String(right.id));
  const scoreDelta = (rightMeta?.score ?? 0) - (leftMeta?.score ?? 0);
  if (scoreDelta !== 0) return scoreDelta;
  const typeDelta = (leftMeta?.type ?? "").localeCompare(rightMeta?.type ?? "");
  if (typeDelta !== 0) return typeDelta;
  return String(left.id).localeCompare(String(right.id));
});
const byNeed = new Map();
for (const need of Object.keys(targetByNeed)) {
  byNeed.set(need, sortedEligible.filter((question) => metaById.get(String(question.id))?.need === need));
}

for (const interaction of requiredInteractions) {
  const picked = selectOne(
    sortedEligible,
    selectedIds,
    needCounts,
    (question) => metaById.get(String(question.id))?.interactions.includes(interaction),
  );
  if (picked) selected.push(picked);
}

for (const type of requiredCoreTypes) {
  const picked = selectOne(
    sortedEligible,
    selectedIds,
    needCounts,
    (question) => metaById.get(String(question.id))?.type === type,
  );
  if (picked) selected.push(picked);
}

for (const [need, target] of Object.entries(targetByNeed)) {
  for (const candidate of byNeed.get(need) ?? []) {
    if (selectedIds.has(String(candidate.id))) continue;
    if (needCounts[need] >= target) break;
    selectedIds.add(String(candidate.id));
    needCounts[need] += 1;
    selected.push(candidate);
  }
}

if (selected.length !== targetTotal) {
  throw new Error(`Active selection expected ${targetTotal}; got ${selected.length}.`);
}

const selectedFingerprints = new Set();
const duplicateIds = [];
for (const question of selected) {
  const fingerprint = question.waveMetadata?.duplicateFingerprint ?? buildFingerprintDetails(question).duplicateFingerprint;
  if (selectedFingerprints.has(fingerprint)) duplicateIds.push(question.id);
  selectedFingerprints.add(fingerprint);
}

if (duplicateIds.length) {
  throw new Error(`Balanced selection still has duplicate fingerprints: ${duplicateIds.slice(0, 10).join(", ")}`);
}

const sortedSelected = selected.sort((left, right) => {
  const leftMeta = metaById.get(String(left.id));
  const rightMeta = metaById.get(String(right.id));
  const needDelta = (leftMeta?.need ?? "").localeCompare(rightMeta?.need ?? "");
  if (needDelta !== 0) return needDelta;
  const typeDelta = (leftMeta?.type ?? "").localeCompare(rightMeta?.type ?? "");
  if (typeDelta !== 0) return typeDelta;
  return String(left.id).localeCompare(String(right.id));
});
const retired = questions.filter((question) => !selectedIds.has(String(question.id)));

writeJson(paths.rawNclexLiveFile, sortedSelected);
writeJson(paths.canonicalNclexLiveFile, sortedSelected);
writeJson(retiredFile, {
  generatedAt: new Date().toISOString(),
  reason: "Surplus candidates preserved outside the active 5,000-item balanced bank.",
  count: retired.length,
  questions: retired,
});

const interactions = new Set(sortedSelected.flatMap(interactionsFor));
const report = {
  generatedAt: new Date().toISOString(),
  targetTotal,
  selected: sortedSelected.length,
  retired: retired.length,
  blockedIds: [...blockedIds],
  countByFormat: countByFormat(sortedSelected),
  countByClientNeed: countNeeds(sortedSelected),
  pctByClientNeed: Object.fromEntries(Object.entries(countNeeds(sortedSelected)).map(([need, count]) => [need, pct(count, sortedSelected.length)])),
  officialInteractionsPresent: requiredInteractions.filter((interaction) => interactions.has(interaction)),
  officialInteractionsMissing: requiredInteractions.filter((interaction) => !interactions.has(interaction)),
  outputFiles: {
    rawLive: path.relative(paths.chapaiRoot, paths.rawNclexLiveFile).replaceAll("\\", "/"),
    canonicalLive: path.relative(paths.chapaiRoot, paths.canonicalNclexLiveFile).replaceAll("\\", "/"),
    retired: path.relative(paths.chapaiRoot, retiredFile).replaceAll("\\", "/"),
  },
};

writeJson(reportFile, report);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
