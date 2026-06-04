import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import {
  CLIENT_NEED_TARGETS,
} from "./nclex-second-pass-refinement-core.mjs";
import { paths, readArray, readJson, writeJson } from "./nclex-wave-utils.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const DEFAULT_REFINEMENT = path.join(repoRoot, "packages/content/questions/nclex/review/nclex-refinement-manifest.latest.json");
const DEFAULT_OUTPUT = path.join(repoRoot, "config", "nclex-readiness-exams.json");
const DEFAULT_REPORT = path.join(repoRoot, "reports", "nclex-readiness-exams-latest.json");

const READINESS_EXAM_IDS = ["nclex-sim-1", "nclex-sim-2", "nclex-sim-3", "nclex-sim-4", "nclex-sim-5"];
const READINESS_EXAM_LENGTH = 85;

function parseArgs(argv) {
  const args = new Map();
  for (const arg of argv) {
    const [rawKey, ...rest] = arg.replace(/^--/, "").split("=");
    args.set(rawKey, rest.length ? rest.join("=") : "true");
  }
  return args;
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle(items, seed) {
  let state = stableHash(seed) || 1;
  const next = [...items];
  const random = () => {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function countBy(items, getKey) {
  const output = {};
  for (const item of items) {
    const key = getKey(item) || "unknown";
    output[key] = (output[key] ?? 0) + 1;
  }
  return output;
}

function normalizeStem(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function manifestById(refinement) {
  const entries = Array.isArray(refinement?.manifest)
    ? refinement.manifest
    : Array.isArray(refinement?.items)
      ? refinement.items
      : [];
  return new Map(entries.map((entry) => [entry.questionId, entry]));
}

function isApprovedForReadiness(question, refinementEntry) {
  if (!refinementEntry) return false;
  if (!["approved", "refined"].includes(refinementEntry.status)) return false;
  if (Number(refinementEntry?.scores?.clinicalAccuracyScore ?? 0) < 75) return false;
  if (Number(refinementEntry?.scores?.qualityScore ?? 0) < 74) return false;
  if (Number(refinementEntry?.scores?.duplicateRiskScore ?? 100) >= 50) return false;
  if (!Array.isArray(question?.references) || question.references.length === 0) return false;
  return true;
}

function targetCountsForLength(length) {
  const entries = Object.entries(CLIENT_NEED_TARGETS);
  const base = Object.fromEntries(entries.map(([key, ratio]) => [key, Math.floor(length * ratio)]));
  let assigned = Object.values(base).reduce((sum, value) => sum + value, 0);
  const remainders = entries
    .map(([key, ratio]) => ({ key, remainder: (length * ratio) - Math.floor(length * ratio) }))
    .sort((a, b) => b.remainder - a.remainder || a.key.localeCompare(b.key));
  for (const item of remainders) {
    if (assigned >= length) break;
    base[item.key] += 1;
    assigned += 1;
  }
  return base;
}

function pickExamQuestions(pool, options) {
  const { length, seed, reservedIds } = options;
  const targets = targetCountsForLength(length);
  const selected = [];
  const usedIds = new Set();
  const usedStems = new Set();
  const buckets = new Map();

  for (const question of pool) {
    const key = question.nclexClientNeed ?? "unknown";
    const bucket = buckets.get(key) ?? [];
    bucket.push(question);
    buckets.set(key, bucket);
  }

  function maybeAdd(question) {
    const stem = normalizeStem(question.stem);
    if (reservedIds.has(question.id) || usedIds.has(question.id) || usedStems.has(stem)) return false;
    selected.push(question);
    usedIds.add(question.id);
    usedStems.add(stem);
    return true;
  }

  for (const [need, target] of Object.entries(targets)) {
    const bucket = seededShuffle(buckets.get(need) ?? [], `${seed}:${need}`);
    for (const question of bucket) {
      if (selected.filter((item) => item.nclexClientNeed === need).length >= target) break;
      maybeAdd(question);
    }
  }

  if (selected.length < length) {
    for (const question of seededShuffle(pool, `${seed}:remainder`)) {
      if (selected.length >= length) break;
      maybeAdd(question);
    }
  }

  return selected.slice(0, length);
}

export function buildReadinessExamManifest({ questions, refinement, minUnique = 5000, allowUnderTarget = false }) {
  const generatedAt = new Date().toISOString();
  const byId = manifestById(refinement);
  const approvedPool = questions.filter((question) => isApprovedForReadiness(question, byId.get(question.id)));
  const blockers = [];

  if (!allowUnderTarget && approvedPool.length < minUnique) {
    blockers.push({
      code: "approved_pool_below_floor",
      detail: `Approved/refined readiness pool has ${approvedPool.length} items; floor is ${minUnique}.`,
      evidence: { approvedPool: approvedPool.length, minUnique },
    });
  }

  const neededForFive = READINESS_EXAM_IDS.length * READINESS_EXAM_LENGTH;
  if (approvedPool.length < neededForFive) {
    blockers.push({
      code: "not_enough_items_for_non_overlapping_exams",
      detail: `Need ${neededForFive} items for five non-overlapping readiness exams; approved pool has ${approvedPool.length}.`,
      evidence: { approvedPool: approvedPool.length, neededForFive },
    });
  }

  const reservedIds = new Set();
  const exams = [];
  for (const id of READINESS_EXAM_IDS) {
    const selected = pickExamQuestions(approvedPool, {
      length: READINESS_EXAM_LENGTH,
      seed: id,
      reservedIds,
    });
    selected.forEach((question) => reservedIds.add(question.id));
    exams.push({
      id,
      exam: "nclex",
      label: `NCLEX Readiness Exam ${id.replace("nclex-sim-", "")}`,
      length: selected.length,
      timeLimitMinutes: 300,
      questionIds: selected.map((question) => question.id),
      mix: {
        clientNeeds: countBy(selected, (question) => question.nclexClientNeed),
        itemTypes: countBy(selected, (question) => question.type),
      },
    });
  }

  const duplicateIds = (() => {
    const counts = countBy(exams.flatMap((exam) => exam.questionIds), (id) => id);
    return Object.entries(counts).filter(([, count]) => count > 1).map(([id]) => id);
  })();

  if (duplicateIds.length) {
    blockers.push({
      code: "readiness_exam_overlap_detected",
      detail: "One or more question IDs appear in more than one readiness exam.",
      evidence: { duplicateIds: duplicateIds.slice(0, 20), duplicateCount: duplicateIds.length },
    });
  }

  return {
    generatedAt,
    exam: "nclex",
    ok: blockers.length === 0,
    policy: {
      source: "approved/refined second-pass NCLEX live bank only",
      minUnique,
      examCount: READINESS_EXAM_IDS.length,
      examLength: READINESS_EXAM_LENGTH,
      noOverlap: true,
      clientNeedTargets: CLIENT_NEED_TARGETS,
    },
    counts: {
      sourceQuestions: questions.length,
      approvedPool: approvedPool.length,
      totalReadinessItems: exams.reduce((sum, exam) => sum + exam.length, 0),
      duplicateIdsAcrossExams: duplicateIds.length,
    },
    blockers,
    exams,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const minUnique = Number(args.get("min-unique") ?? 5000);
  const allowUnderTarget = args.has("allow-under-target");
  const sourcePath = path.resolve(repoRoot, args.get("source") ?? paths.canonicalNclexLiveFile);
  const refinementPath = path.resolve(repoRoot, args.get("refinement") ?? DEFAULT_REFINEMENT);
  const outputPath = path.resolve(repoRoot, args.get("out") ?? DEFAULT_OUTPUT);
  const reportPath = path.resolve(repoRoot, args.get("report") ?? DEFAULT_REPORT);
  const questions = readArray(sourcePath);
  const refinement = readJson(refinementPath, {});
  const manifest = buildReadinessExamManifest({ questions, refinement, minUnique, allowUnderTarget });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  writeJson(outputPath, manifest);
  writeJson(reportPath, {
    generatedAt: manifest.generatedAt,
    ok: manifest.ok,
    counts: manifest.counts,
    blockers: manifest.blockers,
    exams: manifest.exams.map((exam) => ({
      id: exam.id,
      length: exam.length,
      mix: exam.mix,
    })),
  });

  process.stdout.write(`${JSON.stringify({
    ok: manifest.ok,
    output: path.relative(repoRoot, outputPath).replaceAll("\\", "/"),
    report: path.relative(repoRoot, reportPath).replaceAll("\\", "/"),
    counts: manifest.counts,
    blockers: manifest.blockers,
  }, null, 2)}\n`);

  if (!manifest.ok && !allowUnderTarget) {
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
