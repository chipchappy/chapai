import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFingerprintDetails,
  buildFingerprintIndex,
  buildNclexBankHealthReport,
  paths,
  readArray,
  readJson,
  writeJson,
} from "./nclex-wave-utils.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const chapaiRoot = path.resolve(packageRoot, "..", "..");

function parseArgs(argv) {
  const options = {};
  for (const arg of argv) {
    if (arg.startsWith("--max=")) {
      options.max = Number(arg.slice("--max=".length));
    } else if (arg.startsWith("--out=")) {
      options.outFile = arg.slice("--out=".length);
    } else if (arg.startsWith("--phase6=")) {
      options.phase6File = arg.slice("--phase6=".length);
    } else if (arg.startsWith("--draft=")) {
      options.draftFile = arg.slice("--draft=".length);
    } else if (arg.startsWith("--canonical=")) {
      options.canonicalFile = arg.slice("--canonical=".length);
    } else if (arg.startsWith("--report=")) {
      options.reportFile = arg.slice("--report=".length);
    }
  }
  return options;
}

function clampMax(value, fallback) {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}

function buildDeficitMap({ phase6Truth, bankHealthMix, readinessReport }) {
  const deficits = {};

  const topNeeds = Array.isArray(phase6Truth?.topClientNeedDeficits) ? phase6Truth.topClientNeedDeficits : [];
  for (const entry of topNeeds) {
    const key = String(entry?.key || "").trim();
    if (!key) continue;
    deficits[key] = Math.max(Number(entry?.deficit ?? 0), 0);
  }

  const readinessFailures = Array.isArray(readinessReport?.failures) ? readinessReport.failures : [];
  const canonicalTotal = Math.max(
    Number(readinessReport?.counts?.canonicalUnique ?? 0),
    Number(readinessReport?.counts?.approvedRefinedUsableUnique ?? 0),
    0,
  );

  for (const failure of readinessFailures) {
    if (failure?.code !== "client_need_out_of_2026_range") continue;
    const key = String(failure?.evidence?.key ?? "").trim();
    if (!key) continue;

    const targetPct = Number(failure?.evidence?.range?.target ?? NaN);
    const current = Number(failure?.evidence?.count ?? 0);
    if (!Number.isFinite(targetPct) || canonicalTotal <= 0) continue;

    const desired = Math.ceil((canonicalTotal * targetPct) / 100);
    const delta = Math.max(desired - current, 0);
    if (delta <= 0) continue;

    deficits[key] = Math.max(deficits[key] ?? 0, delta);
  }

  if (Object.keys(deficits).length === 0) {
    const targetCounts = {
      management_of_care: 900,
      safety_infection_control: 650,
      health_promotion: 450,
      psychosocial: 450,
      basic_care_comfort: 450,
      pharmacological: 800,
      risk_reduction: 600,
      physiological_adaptation: 700,
    };

    for (const [key, target] of Object.entries(targetCounts)) {
      const current = Number(bankHealthMix?.clientNeedMix?.[key] ?? 0);
      deficits[key] = Math.max(target - current, 0);
    }
  }

  return deficits;
}

function normalizeNeedKey(key) {
  return String(key || "").trim();
}

function ensureQuestionMinimums(question) {
  if (!question || typeof question !== "object") return false;
  if (String(question.exam || "").trim() !== "nclex") return false;
  if (!String(question.id || "").trim()) return false;
  if (!String(question.category || "").trim()) return false;
  if (!String(question.stem || "").trim()) return false;
  if (!String(question.rationale || "").trim()) return false;
  if (!Array.isArray(question.options) || question.options.length < 2) return false;
  if (question.answer == null) return false;
  return true;
}

function summarizeSelected(selected) {
  const byNeed = {};
  const byType = {};

  for (const question of selected) {
    const need = String(question?.nclexClientNeed || "unknown").trim() || "unknown";
    const type = String(question?.type || "mcq").trim() || "mcq";
    byNeed[need] = (byNeed[need] || 0) + 1;
    byType[type] = (byType[type] || 0) + 1;
  }

  return { byNeed, byType };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const maxCandidates = clampMax(options.max, 600);

  const outFile = options.outFile
    ? path.resolve(chapaiRoot, options.outFile)
    : path.resolve(chapaiRoot, "config", "live-promotion-candidates.auto.json");

  const reportFile = options.reportFile
    ? path.resolve(chapaiRoot, options.reportFile)
    : path.resolve(chapaiRoot, "reports", "nclex-live-promotion-candidates-auto.json");

  const phase6File = options.phase6File
    ? path.resolve(chapaiRoot, options.phase6File)
    : path.resolve(chapaiRoot, "connectors", "nclex-saas", "phase6-state.json");

  const draftFile = options.draftFile ? path.resolve(chapaiRoot, options.draftFile) : paths.draftNclexFile;
  const canonicalFile = options.canonicalFile ? path.resolve(chapaiRoot, options.canonicalFile) : paths.canonicalNclexLiveFile;

  const phase6 = readJson(phase6File, {});
  const phase6Truth = phase6?.truth ?? {};
  const bankHealth = buildNclexBankHealthReport();
  const readinessReport = readJson(path.resolve(chapaiRoot, "reports", "nclex-release-readiness-latest.json"), {});

  const draft = readArray(draftFile);
  const canonicalLive = readArray(canonicalFile);
  const canonicalClusters = buildFingerprintIndex(canonicalLive);
  const canonicalFingerprintSet = new Set(canonicalClusters.keys());

  const deficits = buildDeficitMap({ phase6Truth, bankHealthMix: bankHealth?.mix, readinessReport });
  const remainingDeficits = { ...deficits };
  const anyDeficitLeft = () => Object.values(remainingDeficits).some((value) => Number(value) > 0);

  const eligible = [];
  for (const question of draft) {
    if (!ensureQuestionMinimums(question)) continue;
    const details = buildFingerprintDetails(question);
    if (canonicalFingerprintSet.has(details.duplicateFingerprint)) continue;
    eligible.push({ question, details });
  }

  eligible.sort((left, right) => {
    const needLeft = normalizeNeedKey(left.details.clientNeed);
    const needRight = normalizeNeedKey(right.details.clientNeed);
    const scoreLeft = Math.max(Number(remainingDeficits?.[needLeft] ?? 0), 0);
    const scoreRight = Math.max(Number(remainingDeficits?.[needRight] ?? 0), 0);
    if (scoreRight !== scoreLeft) return scoreRight - scoreLeft;
    return String(left.question.id).localeCompare(String(right.question.id));
  });

  const pickedFingerprintSet = new Set();
  const selected = [];

  for (const { question, details } of eligible) {
    if (selected.length >= maxCandidates) break;
    if (pickedFingerprintSet.has(details.duplicateFingerprint)) continue;

    const needKey = normalizeNeedKey(details.clientNeed);
    const deficit = Math.max(Number(remainingDeficits?.[needKey] ?? 0), 0);
    if (deficit <= 0 && anyDeficitLeft()) continue;

    pickedFingerprintSet.add(details.duplicateFingerprint);
    selected.push({
      ...question,
      nclexClientNeed: details.clientNeed,
      duplicateFingerprint: details.duplicateFingerprint,
      familyKey: details.familyKey,
      angleSignature: details.angleSignature,
      decisiveCue: details.decisiveCue,
      sourceBatchId: String(question?.sourceBatchId || "draft-auto").trim() || "draft-auto",
      sourceLane: "nclex",
    });

    if (deficit > 0) {
      remainingDeficits[needKey] = deficit - 1;
    }
  }

  const selectionSummary = summarizeSelected(selected);
  const payload = {
    generatedAt: new Date().toISOString(),
    batchId: `auto-draft-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    examFocus: "nclex",
    finalGateRule: "AUTO_FROM_DRAFT: non-duplicate fingerprint filter only; requires human review before promotion.",
    sourceFiles: {
      draft: path.relative(chapaiRoot, draftFile).replaceAll("\\", "/"),
      canonical: path.relative(chapaiRoot, canonicalFile).replaceAll("\\", "/"),
      phase6: path.relative(chapaiRoot, phase6File).replaceAll("\\", "/"),
    },
    selection: {
      maxCandidates,
      canonicalFingerprints: canonicalFingerprintSet.size,
      draftTotal: draft.length,
      eligibleNonColliding: eligible.length,
      selected: selected.length,
      remainingDeficits,
      byNeed: selectionSummary.byNeed,
      byType: selectionSummary.byType,
    },
    candidates: selected,
  };

  writeJson(outFile, payload);
  writeJson(reportFile, payload.selection);
  process.stdout.write(`${JSON.stringify({ ok: true, outFile: path.relative(chapaiRoot, outFile).replaceAll("\\\\", "/"), reportFile: path.relative(chapaiRoot, reportFile).replaceAll("\\\\", "/"), selected: payload.selection.selected }, null, 2)}\\n`);
}

main();
