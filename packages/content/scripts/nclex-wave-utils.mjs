import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const chapaiRoot = path.resolve(packageRoot, "..", "..");

export const paths = {
  scriptDir,
  packageRoot,
  chapaiRoot,
  questionsRoot: path.join(packageRoot, "questions"),
  configRoot: path.join(chapaiRoot, "config"),
  rawNclexLiveFile: path.join(packageRoot, "questions", "nclex", "live", "reviewed-curated-live.json"),
  canonicalNclexLiveFile: path.join(packageRoot, "questions", "nclex", "live", "reviewed-curated-live.unique.json"),
  draftNclexFile: path.join(packageRoot, "questions", "nclex", "draft", "generated-nemoclaw-batches.json"),
  curationReportFile: path.join(chapaiRoot, "config", "live-curation-latest.json"),
  reviewReportFile: path.join(chapaiRoot, "config", "content-review-latest.json"),
  syncReportFile: path.join(chapaiRoot, "config", "nclex-reviewed-live-rebuild-latest.json"),
  canonicalizationReportFile: path.join(chapaiRoot, "config", "nclex-canonicalization-latest.json"),
  bankHealthReportFile: path.join(chapaiRoot, "config", "nclex-bank-health-latest.json"),
  wavePromotionManifestFile: path.join(chapaiRoot, "config", "nclex-wave-promotion-latest.json"),
  livePromotionCandidatesFile: path.join(chapaiRoot, "config", "live-promotion-candidates.json"),
  livePromotionCandidatesAutoFile: path.join(chapaiRoot, "config", "live-promotion-candidates.auto.json"),
};

function choosePreferredPromotionCandidatesFile() {
  const primary = paths.livePromotionCandidatesFile;
  const auto = paths.livePromotionCandidatesAutoFile;
  if (!fs.existsSync(auto)) return primary;
  if (!fs.existsSync(primary)) return auto;

  try {
    const autoMtime = fs.statSync(auto).mtimeMs;
    const primaryMtime = fs.statSync(primary).mtimeMs;
    return autoMtime >= primaryMtime ? auto : primary;
  } catch {
    return primary;
  }
}

const FORMAT_KEYS = ["mcq", "sata", "case_study", "bow_tie", "ordering", "matrix"];
export const NCLEX_TARGET_TOTAL = 5000;
export const NCLEX_TARGET_COUNTS = {
  management_of_care: 900,
  safety_infection_control: 650,
  health_promotion: 450,
  psychosocial: 450,
  basic_care_comfort: 450,
  pharmacological: 800,
  risk_reduction: 600,
  physiological_adaptation: 700,
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

export function readArray(filePath) {
  const value = readJson(filePath, []);
  return Array.isArray(value) ? value : [];
}

export function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function loadSeedClientNeedMap() {
  const seedFiles = [
    path.join(paths.questionsRoot, "nclex", "draft", "nclex-diversity-seeds.json"),
    path.join(paths.questionsRoot, "nclex", "draft", "nclex-ngn-diversity-seeds.json"),
  ];
  const map = new Map();

  for (const filePath of seedFiles) {
    for (const item of readArray(filePath)) {
      const category = String(item?.category ?? "").trim();
      if (!category || map.has(category)) {
        continue;
      }
      const explicit = String(item?.nclexClientNeed ?? "").trim();
      map.set(category, explicit || inferNclexClientNeedFromText([item?.category, item?.subcategory, ...(Array.isArray(item?.tags) ? item.tags : [])].join(" ")));
    }
  }

  return map;
}

export function normalizeText(value, { stripNumbers = false } = {}) {
  const base = String(value ?? "");
  const withNumberPolicy = stripNumbers ? base.replace(/\b\d+(?:\.\d+)?\b/g, " ") : base;
  return withNumberPolicy
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeAnswer(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean).sort().join("|");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, entry]) => `${normalizeText(key)}:${normalizeText(entry)}`)
      .sort()
      .join("|");
  }

  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim().toLowerCase()).sort().join("|");
    }
  } catch {
    // keep raw form
  }

  if (raw.includes(",")) {
    return raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .sort()
      .join("|");
  }

  return raw.toLowerCase();
}

export function normalizeOptions(options, { stripNumbers = false } = {}) {
  if (!Array.isArray(options)) {
    return "";
  }

  return options
    .map((option) => normalizeText(typeof option === "string" ? option : option?.text, { stripNumbers }))
    .filter(Boolean)
    .sort()
    .join("|");
}

export function normalizeType(type) {
  const raw = String(type || "mcq").trim().toLowerCase();
  if (raw === "bow-tie") return "bow_tie";
  if (raw === "drag-drop") return "drag_drop";
  return FORMAT_KEYS.includes(raw) ? raw : "mcq";
}

export function normalizeCategory(category) {
  return String(category || "").trim().toLowerCase();
}

export function normalizeDifficultyBand(value) {
  const difficulty = Number(value);
  if (!Number.isFinite(difficulty)) {
    return "unknown";
  }
  if (difficulty <= 2) return "low";
  if (difficulty === 3) return "mid";
  return "high";
}

export function inferNclexClientNeedFromText(rawText) {
  const text = String(rawText || "").toLowerCase();
  if (!text) {
    return "physiological_adaptation";
  }

  if (/(deleg|scope|assignment|triage|consent|ethic|abuse|chain[_ ]of[_ ]command|advance[_ ]directive|discharge|reporting|emtala|organ[_ ]donation|leadership|priority[_ ]triage)/.test(text)) return "management_of_care";
  if (/(infection|isolation|precaution|fall|restraint|tb|mrsa|c[_ ]?diff|sharps|airborne|latex|hazmat|timeout|fire[_ ]safety|contact[_ ]precautions|transmission)/.test(text)) return "safety_infection_control";
  if (/(screen|immuniz|vaccine|well[_ ]child|prenatal|breastfeed|contracept|milestone|health[_ ]promotion|lifestyle|smoking[_ ]cessation|cancer[_ ]screening|gestational[_ ]diabetes[_ ]screening|osteoporosis|prevent(ion|ative)|risk[_ ]factor)/.test(text)) return "health_promotion";
  if (/(psych|suicid|grief|ptsd|assault|autism|depress|schizoph|withdrawal|anorexia|domestic[_ ]violence|crisis[_ ]intervention|opioid[_ ]use[_ ]disorder|acute[_ ]psychosis|de[_ ]escalation)/.test(text)) return "psychosocial";
  // Order matters: avoid over-assigning broad "basic care" keywords when a
  // record is clearly medication- or diagnostics-heavy.
  if (/(insulin|heparin|warfarin|digoxin|drug|medication|anticoagul|pharm|toxic|overdose|antidote|aminoglycoside|chemotherapy|lithium|magnesium[_ ]sulfate|nitroglycerin|leucovorin|serotonin[_ ]syndrome|neuroleptic[_ ]malignant|antibiotic|opioid|benzodiazep|beta[_ -]?block|ace[_ -]?inhib|statin)/.test(text)) return "pharmacological";
  if (/(risk|monitor|assessment|reassess|vital|lab|labs|chest[_ ]tube|abg|ecg|ekg|catheter|central[_ ]line|contrast|biopsy|dialysis|procedure|complication|reduction|lumbar[_ ]puncture|cardiac[_ ]catheterization|peritoneal[_ ]dialysis|transfusion|air[_ ]leak|peritonitis|diagnostic|post[_ -]?op|postoperative)/.test(text)) return "risk_reduction";
  if (/(ostomy|feeding|tube|pain|rom|pressure[_ ]inj|sleep|nutrition|comfort|postmortem|wound[_ ]vac|palliative|ng[_ ]tube|enteral|immobility|perioperative[_ ]npo|hygiene|mobility|positioning)/.test(text)) return "basic_care_comfort";
  return "physiological_adaptation";
}

export function resolveNclexClientNeed(question, seedMap = loadSeedClientNeedMap()) {
  const explicit = String(question?.nclexClientNeed || "").trim();
  if (explicit) {
    return explicit;
  }

  const rawCategory = String(question?.category || "").trim();
  const category = normalizeCategory(rawCategory);
  if (rawCategory && seedMap.has(rawCategory)) {
    return seedMap.get(rawCategory);
  }
  if (category && seedMap.has(category)) {
    return seedMap.get(category);
  }

  // Many items have broad `category` labels (e.g. "pediatric_nursing") that are
  // insufficient to infer 2026 NCLEX-RN client-need mix. Include the scenario
  // text so inference can split Physiological Integrity sub-buckets accurately.
  const blob = [
    question?.category,
    question?.subcategory,
    ...(Array.isArray(question?.tags) ? question.tags : []),
    question?.speedCue,
    question?.takeaway,
    question?.scenarioTitle,
    question?.additionalInfo,
    question?.scenario,
    question?.stem,
  ].join(" ");

  return inferNclexClientNeedFromText(blob);
}

export function selectDecisiveCue(question) {
  const candidates = [
    question?.speedCue,
    question?.takeaway,
    question?.scenarioTitle,
    question?.additionalInfo,
    question?.scenario,
    question?.stem,
  ];

  for (const candidate of candidates) {
    const text = normalizeText(candidate, { stripNumbers: true });
    if (text) {
      return text;
    }
  }

  return "";
}

export function buildFamilyKey(question, seedMap = loadSeedClientNeedMap()) {
  const category = normalizeText(question?.category || "unknown");
  const subcategory = normalizeText(question?.subcategory || question?.category || "unknown");
  const type = normalizeType(question?.type);
  const difficultyBand = normalizeDifficultyBand(question?.difficulty);
  return [category, subcategory, type, difficultyBand].join("::");
}

export function buildAngleSignature(question) {
  return [
    selectDecisiveCue(question),
    normalizeText(question?.scenarioTitle || "", { stripNumbers: true }),
    normalizeText(question?.scenario || "", { stripNumbers: true }),
    normalizeText(question?.additionalInfo || "", { stripNumbers: true }),
    normalizeText(question?.stem || "", { stripNumbers: true }),
    normalizeOptions(question?.options, { stripNumbers: true }),
  ]
    .filter(Boolean)
    .join("::");
}

export function buildDuplicateFingerprint(question, seedMap = loadSeedClientNeedMap()) {
  return [
    resolveNclexClientNeed(question, seedMap),
    buildFamilyKey(question, seedMap),
    normalizeType(question?.type),
    buildAngleSignature(question),
    selectDecisiveCue(question),
  ].join("::");
}

export function buildFingerprintDetails(question, seedMap = loadSeedClientNeedMap()) {
  const clientNeed = resolveNclexClientNeed(question, seedMap);
  const familyKey = buildFamilyKey(question, seedMap);
  const angleSignature = buildAngleSignature(question);
  const decisiveCue = selectDecisiveCue(question);
  const duplicateFingerprint = buildDuplicateFingerprint(question, seedMap);

  return {
    clientNeed,
    familyKey,
    angleSignature,
    decisiveCue,
    duplicateFingerprint,
    questionType: normalizeType(question?.type),
    difficultyBand: normalizeDifficultyBand(question?.difficulty),
  };
}

export function buildFingerprintIndex(questions, seedMap = loadSeedClientNeedMap()) {
  const clusters = new Map();

  for (const question of questions) {
    const details = buildFingerprintDetails(question, seedMap);
    const bucket = clusters.get(details.duplicateFingerprint) ?? [];
    bucket.push({
      id: String(question?.id || ""),
      ...details,
      duplicateRisk: false,
    });
    clusters.set(details.duplicateFingerprint, bucket);
  }

  return clusters;
}

export function countByFormat(questions) {
  const counts = Object.fromEntries([...FORMAT_KEYS, "other"].map((key) => [key, 0]));
  for (const question of questions) {
    const type = normalizeType(question?.type);
    counts[type] = (counts[type] || 0) + 1;
  }
  return counts;
}

export function countByClientNeed(questions, seedMap = loadSeedClientNeedMap()) {
  const counts = Object.fromEntries(Object.keys(NCLEX_TARGET_COUNTS).map((key) => [key, 0]));
  for (const question of questions) {
    const key = resolveNclexClientNeed(question, seedMap);
    if (key in counts) {
      counts[key] += 1;
    }
  }
  return counts;
}

export function countByRawCategory(questions) {
  const counts = {};
  for (const question of questions) {
    const category = normalizeCategory(question?.category);
    if (!category) {
      continue;
    }
    counts[category] = (counts[category] || 0) + 1;
  }
  return counts;
}

export function buildThinFamilies(questions) {
  const categoryCounts = new Map();
  const categoryTypeCounts = new Map();

  for (const question of questions) {
    const category = normalizeCategory(question?.category);
    if (!category) continue;
    const type = normalizeType(question?.type);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    const typeKey = `${category}::${type}`;
    categoryTypeCounts.set(typeKey, (categoryTypeCounts.get(typeKey) || 0) + 1);
  }

  return Array.from(categoryCounts.entries())
    .map(([family, liveCount]) => ({
      family,
      liveCount,
      missingPreferredTypes: ["case_study", "bow_tie", "sata", "ordering", "matrix"].filter(
        (type) => !categoryTypeCounts.get(`${family}::${type}`),
      ),
    }))
    .filter((item) => item.liveCount < 3 || item.missingPreferredTypes.length > 0)
    .sort((left, right) => left.liveCount - right.liveCount || left.family.localeCompare(right.family))
    .slice(0, 20);
}

export function summarizeFingerprintClusters(clusterMap) {
  const clusters = Array.from(clusterMap.entries())
    .map(([duplicateFingerprint, entries]) => {
      const first = entries[0] ?? {};
      return {
        duplicateFingerprint,
        familyKey: String(first.familyKey || ""),
        angleSignature: String(first.angleSignature || ""),
        count: entries.length,
        questionIds: entries.map((entry) => String(entry.id || "")).filter(Boolean),
        duplicateRisk: entries.length > 1,
      };
    })
    .sort((left, right) => right.count - left.count || left.familyKey.localeCompare(right.familyKey));

  return {
    uniqueCount: clusters.length,
    collisionCount: clusters.reduce((sum, cluster) => sum + Math.max(cluster.count - 1, 0), 0),
    collisionRate: clusters.length > 0 ? Math.round(((clusters.reduce((sum, cluster) => sum + Math.max(cluster.count - 1, 0), 0)) / (clusters.reduce((sum, cluster) => sum + cluster.count, 0))) * 1000) / 10 : 0,
    maxClusterSize: clusters.reduce((max, cluster) => Math.max(max, cluster.count), 0),
    clusters,
  };
}

export function countChartReviewCoverage(questions) {
  const coverage = {
    chartReview: 0,
    hpi: 0,
    timeline: 0,
    labs: 0,
    orders: 0,
    diagnostics: 0,
    notes: 0,
    diagram: 0,
    tutorPrompts: 0,
  };

  for (const question of questions) {
    const chart = question?.chartReview;
    if (!chart) {
      continue;
    }

    const hasAny =
      chart.hpi?.length
      || chart.timeline?.length
      || chart.labs?.length
      || chart.orders?.length
      || chart.diagnostics?.length
      || chart.notes?.length;

    if (hasAny) coverage.chartReview += 1;
    if (chart.hpi?.length) coverage.hpi += 1;
    if (chart.timeline?.length) coverage.timeline += 1;
    if (chart.labs?.length) coverage.labs += 1;
    if (chart.orders?.length) coverage.orders += 1;
    if (chart.diagnostics?.length) coverage.diagnostics += 1;
    if (chart.notes?.length) coverage.notes += 1;
    if (chart.diagram?.nodes?.length) coverage.diagram += 1;
    if (chart.tutorPrompts?.length) coverage.tutorPrompts += 1;
  }

  return coverage;
}

export function loadNclexCandidatePayload(filePath = paths.livePromotionCandidatesFile) {
  const payload = readJson(filePath, {});
  const candidates = Array.isArray(payload) ? payload : Array.isArray(payload?.candidates) ? payload.candidates : Array.isArray(payload?.reviewedItems) ? payload.reviewedItems : [];

  return {
    payload,
    candidates,
    batchId: String(payload?.batchId || payload?.generatedBy?.batchId || "").trim(),
    sourceLane: String(payload?.examFocus || payload?.generatedBy?.runtime || payload?.generatedBy?.agentId || "nclex").trim(),
    finalGateRule: String(payload?.finalGateRule || "").trim(),
    generatedAt: String(payload?.generatedAt || ""),
  };
}

export function buildNclexBankHealthReport({
  rawLiveFile = paths.rawNclexLiveFile,
  canonicalLiveFile = paths.canonicalNclexLiveFile,
  draftFile = paths.draftNclexFile,
  reviewReportFile = paths.reviewReportFile,
  curationReportFile = paths.curationReportFile,
  syncReportFile = paths.syncReportFile,
  bankHealthFile = paths.bankHealthReportFile,
  waveTargets = [389, 650, 950, 1300, 1650, 2000, 3000, 4000, NCLEX_TARGET_TOTAL],
  targetCount = NCLEX_TARGET_TOTAL,
} = {}) {
  const seedMap = loadSeedClientNeedMap();
  const rawLive = readArray(rawLiveFile);
  const canonicalLive = readArray(canonicalLiveFile);
  const draftLive = readArray(draftFile);
  const reviewReport = readJson(reviewReportFile, {});
  const curationReport = readJson(curationReportFile, {});
  const syncReport = readJson(syncReportFile, {});

  const rawClusters = buildFingerprintIndex(rawLive, seedMap);
  const canonicalClusters = buildFingerprintIndex(canonicalLive, seedMap);
  const draftClusters = buildFingerprintIndex(draftLive, seedMap);
  const rawFingerprintSummary = summarizeFingerprintClusters(rawClusters);
  const canonicalFingerprintSummary = summarizeFingerprintClusters(canonicalClusters);
  const draftFingerprintSummary = summarizeFingerprintClusters(draftClusters);
  const formatMix = countByFormat(canonicalLive);
  const clientNeedMix = countByClientNeed(canonicalLive, seedMap);
  const rawCategoryMix = countByRawCategory(canonicalLive);
  const chartReviewCoverage = countChartReviewCoverage(canonicalLive);
  const thinFamilies = buildThinFamilies(canonicalLive);
  const promotedCount = Number(curationReport?.promotedCount ?? reviewReport?.scorecard?.strictPromotionReady ?? 0);
  const deployedCount = Number(curationReport?.byExam?.nclex?.total ?? canonicalLive.length ?? 0);
  const syncedCount = Number(syncReport?.canonicalUniqueCount ?? canonicalLive.length ?? 0);
  const uniqueCount = canonicalLive.length;

  return {
    generatedAt: new Date().toISOString(),
    exam: "nclex",
    sourceFiles: {
      rawLive: path.relative(chapaiRoot, rawLiveFile).replaceAll("\\", "/"),
      canonicalLive: path.relative(chapaiRoot, canonicalLiveFile).replaceAll("\\", "/"),
      reviewReport: path.relative(chapaiRoot, reviewReportFile).replaceAll("\\", "/"),
      curationReport: path.relative(chapaiRoot, curationReportFile).replaceAll("\\", "/"),
      syncReport: path.relative(chapaiRoot, syncReportFile).replaceAll("\\", "/"),
    },
    counts: {
      rawLive: rawLive.length,
      eligibleLive: rawLive.length,
      canonicalLive: uniqueCount,
      duplicateFamiliesCollapsed: rawLive.length - uniqueCount,
      duplicateFingerprintsCollapsed: rawFingerprintSummary.collisionCount,
      draftLive: draftLive.length,
      draftUniqueFingerprints: draftFingerprintSummary.uniqueCount,
      draftFingerprintCollisionCount: draftFingerprintSummary.collisionCount,
      draftMaxFingerprintClusterSize: draftFingerprintSummary.maxClusterSize,
      promotedCount,
    },
    mix: {
      formatMix,
      clientNeedMix,
      rawCategoryMix,
      chartReviewCoverage,
      thinFamilies,
    },
    fingerprints: {
      uniqueCount: canonicalFingerprintSummary.uniqueCount,
      collisionCount: canonicalFingerprintSummary.collisionCount,
      collisionRate: canonicalFingerprintSummary.collisionRate,
      maxClusterSize: canonicalFingerprintSummary.maxClusterSize,
      clusters: canonicalFingerprintSummary.clusters.slice(0, 50),
    },
    draftFingerprints: {
      uniqueCount: draftFingerprintSummary.uniqueCount,
      collisionCount: draftFingerprintSummary.collisionCount,
      collisionRate: draftFingerprintSummary.collisionRate,
      maxClusterSize: draftFingerprintSummary.maxClusterSize,
      clusters: draftFingerprintSummary.clusters.slice(0, 20).map((cluster) => {
        const ids = Array.isArray(cluster?.questionIds) ? cluster.questionIds : [];
        return {
          ...cluster,
          questionIds: ids.slice(0, 12),
          questionIdsTruncated: ids.length > 12,
          questionIdCount: ids.length,
        };
      }),
    },
    rollout: {
      targetCount,
      remainingToTarget: Math.max(targetCount - uniqueCount, 0),
      progressPct: targetCount > 0 ? Math.min(100, Math.round((uniqueCount / targetCount) * 100)) : 0,
      waveTargets,
    },
    parity: {
      deployment: {
        status: deployedCount === uniqueCount ? "matched" : deployedCount > 0 ? "mismatch" : "unknown",
        deployedCount: Number.isFinite(deployedCount) ? deployedCount : null,
        canonicalCount: uniqueCount,
        source: path.relative(chapaiRoot, curationReportFile).replaceAll("\\", "/"),
      },
      sync: {
        status: syncedCount === uniqueCount ? "matched" : syncedCount > 0 ? "mismatch" : "unknown",
        syncedCount: Number.isFinite(syncedCount) ? syncedCount : null,
        canonicalCount: uniqueCount,
        source: path.relative(chapaiRoot, syncReportFile).replaceAll("\\", "/"),
      },
    },
  };
}

export function buildNclexWavePromotionManifest({
  candidateFile = choosePreferredPromotionCandidatesFile(),
  canonicalLiveFile = paths.canonicalNclexLiveFile,
  bankHealthFile = paths.bankHealthReportFile,
  outputFile = paths.wavePromotionManifestFile,
} = {}) {
  const seedMap = loadSeedClientNeedMap();
  const { candidates, batchId, sourceLane, finalGateRule } = loadNclexCandidatePayload(candidateFile);
  const canonicalLive = readArray(canonicalLiveFile);
  const canonicalClusters = buildFingerprintIndex(canonicalLive, seedMap);
  const canonicalFingerprintSet = new Set(canonicalClusters.keys());
  const manifestClusterMap = new Map();
  const entries = [];

  for (const candidate of candidates) {
    const details = buildFingerprintDetails(candidate, seedMap);
    const entry = {
      id: String(candidate?.id || ""),
      exam: "nclex",
      category: String(candidate?.category || ""),
      subcategory: String(candidate?.subcategory || "").trim() || undefined,
      type: details.questionType,
      nclexClientNeed: details.clientNeed,
      familyKey: details.familyKey,
      angleSignature: details.angleSignature,
      decisiveCue: details.decisiveCue,
      duplicateFingerprint: details.duplicateFingerprint,
      sourceBatchId: String(candidate?.sourceBatchId || batchId || "").trim() || undefined,
      sourceLane: String(candidate?.sourceLane || sourceLane || "").trim() || undefined,
      duplicateRisk: false,
      promotionDecision: "hold_review",
    };

    const bucket = manifestClusterMap.get(details.duplicateFingerprint) ?? [];
    bucket.push(entry);
    manifestClusterMap.set(details.duplicateFingerprint, bucket);
    entries.push(entry);
  }

  const clusters = Array.from(manifestClusterMap.entries())
    .map(([duplicateFingerprint, bucket]) => ({
      duplicateFingerprint,
      familyKey: bucket[0]?.familyKey || "",
      angleSignature: bucket[0]?.angleSignature || "",
      count: bucket.length,
      questionIds: bucket.map((entry) => entry.id).filter(Boolean),
      duplicateRisk: bucket.length > 1 || canonicalFingerprintSet.has(duplicateFingerprint),
    }))
    .filter((cluster) => cluster.count > 1 || canonicalFingerprintSet.has(cluster.duplicateFingerprint))
    .sort((left, right) => right.count - left.count || left.familyKey.localeCompare(right.familyKey));

  let liveCollisionCount = 0;
  for (const entry of entries) {
    const existingPeers = canonicalClusters.get(entry.duplicateFingerprint) ?? [];
    const manifestPeers = manifestClusterMap.get(entry.duplicateFingerprint) ?? [];
    const duplicateRisk = existingPeers.length > 0 || manifestPeers.length > 1;
    entry.duplicateRisk = duplicateRisk;
    entry.promotionDecision = duplicateRisk ? "hold_duplicate" : "promote";
    if (existingPeers.length > 0) {
      liveCollisionCount += 1;
    }
  }

  const uniqueFingerprintCount = manifestClusterMap.size;
  const duplicateFingerprintCount = entries.length - uniqueFingerprintCount;
  const promotableCount = entries.filter((entry) => entry.promotionDecision === "promote").length;
  const heldDuplicateCount = entries.length - promotableCount;
  const intraBatchCollisionCount = clusters.filter((cluster) => cluster.count > 1).reduce((sum, cluster) => sum + cluster.count - 1, 0);
  const bankHealth = readJson(bankHealthFile, buildNclexBankHealthReport());
  const rawLiveCount = Number(bankHealth?.counts?.rawLive ?? canonicalLive.length);
  const canonicalLiveCount = Number(bankHealth?.counts?.canonicalLive ?? canonicalLive.length);
  const duplicateFamiliesCollapsed = Number(bankHealth?.counts?.duplicateFamiliesCollapsed ?? Math.max(rawLiveCount - canonicalLiveCount, 0));
  const duplicateFingerprintsCollapsed = Number(bankHealth?.counts?.duplicateFingerprintsCollapsed ?? duplicateFingerprintCount);

  return {
    generatedAt: new Date().toISOString(),
    exam: "nclex",
    sourceFiles: {
      candidateFile: path.relative(chapaiRoot, candidateFile).replaceAll("\\", "/"),
      canonicalLive: path.relative(chapaiRoot, canonicalLiveFile).replaceAll("\\", "/"),
      bankHealth: path.relative(chapaiRoot, bankHealthFile).replaceAll("\\", "/"),
    },
    batchId,
    sourceLane: sourceLane || undefined,
    finalGateRule: finalGateRule || undefined,
    bankSnapshot: {
      rawLiveCount,
      canonicalLiveCount,
      duplicateFamiliesCollapsed,
      duplicateFingerprintsCollapsed,
    },
    summary: {
      candidateCount: entries.length,
      uniqueFingerprintCount,
      duplicateFingerprintCount,
      promotableCount,
      heldDuplicateCount,
      intraBatchCollisionCount,
      liveCollisionCount,
    },
    clusters,
    candidates: entries,
  };
}
