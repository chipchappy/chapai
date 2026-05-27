#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const dryRun = args.has("dry-run");
const now = new Date();
const nowIso = now.toISOString();

function findRoot() {
  let current = path.resolve(String(args.get("root") ?? process.cwd()));
  for (let index = 0; index < 8; index += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) return current;
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return path.resolve(String(args.get("root") ?? process.cwd()));
}

const root = findRoot();
const stewardRoot = path.join(root, "brains", "_steward");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonl(filePath, value) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function readJsonlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(".jsonl"))
    .flatMap((file) => {
      const filePath = path.join(dir, file);
      return fs.readFileSync(filePath, "utf8")
        .split(/\r?\n/)
        .map((line, index) => ({ line: line.trim(), filePath, lineNumber: index + 1 }))
        .filter((entry) => entry.line)
        .map((entry) => {
          try {
            return { ...entry, payload: JSON.parse(entry.line) };
          } catch {
            return { ...entry, payload: null, parseError: "invalid json" };
          }
        });
    });
}

function readJsonlPath(inputPath) {
  if (!fs.existsSync(inputPath)) return [];
  if (fs.statSync(inputPath).isDirectory()) return readJsonlFiles(inputPath);
  return fs.readFileSync(inputPath, "utf8")
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), filePath: inputPath, lineNumber: index + 1 }))
    .filter((entry) => entry.line)
    .map((entry) => {
      try {
        return { ...entry, payload: JSON.parse(entry.line) };
      } catch {
        return { ...entry, payload: null, parseError: "invalid json" };
      }
    });
}

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function slug(value) {
  return String(value ?? "entry").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "entry";
}

function frontmatter(fields) {
  return `---\n${Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n")}\n---\n\n`;
}

function daysSince(iso) {
  const parsed = Date.parse(iso ?? "");
  if (Number.isNaN(parsed)) return 0;
  return (Date.now() - parsed) / 86_400_000;
}

function normalizeCandidate(raw, source) {
  if (!raw || typeof raw !== "object") {
    return { error: "candidate is not an object", source };
  }
  const targetAgent = String(raw.target_agent ?? raw.targetAgent ?? raw.agent_id ?? raw.agentId ?? "").trim();
  const sourceAgent = String(raw.source_agent ?? raw.sourceAgent ?? "").trim();
  const sourceRunId = String(raw.source_run_id ?? raw.sourceRunId ?? raw.runId ?? "").trim();
  const toolUsed = String(raw.tool_used ?? raw.toolUsed ?? raw.tool ?? "").trim();
  const text = String(raw.text ?? raw.summary ?? raw.memory ?? raw.skill ?? "").replace(/\s+/g, " ").trim();
  const kind = String(raw.kind ?? (raw.skill ? "skill" : "fact")).trim();
  const confidence = Number(raw.confidence ?? 0);
  const roiScore = Number(raw.roi_score ?? raw.roiScore ?? 0);
  const nativeBaselineScore = Number(raw.native_baseline_score ?? raw.nativeBaselineScore ?? 0);
  const firstSeenAt = String(raw.first_seen_at ?? raw.firstSeenAt ?? raw.ingested_at ?? raw.ingestedAt ?? nowIso);
  return {
    id: String(raw.id ?? `candidate-${sha(`${targetAgent}:${text}`).slice(0, 16)}`),
    targetAgent,
    sourceAgent,
    sourceRunId,
    toolUsed,
    text,
    kind,
    confidence,
    roiScore,
    nativeBaselineScore,
    firstSeenAt,
    source,
    raw,
    fingerprint: sha(`${targetAgent}:${kind}:${text.toLowerCase()}`),
  };
}

function allCanonicalFingerprints() {
  const fingerprints = new Set();
  const brainRoot = path.join(root, "brains");
  if (!fs.existsSync(brainRoot)) return fingerprints;
  for (const agentDir of fs.readdirSync(brainRoot)) {
    const full = path.join(brainRoot, agentDir);
    if (!fs.statSync(full).isDirectory() || agentDir.startsWith("_")) continue;
    for (const subdir of ["facts", "skills"]) {
      const dir = path.join(full, subdir);
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".md"))) {
        const content = fs.readFileSync(path.join(dir, file), "utf8");
        const explicit = content.match(/fingerprint:\s*"([^"]+)"/)?.[1];
        fingerprints.add(explicit ?? sha(content.replace(/^---[\s\S]*?---\s*/, "").trim().toLowerCase()));
      }
    }
  }
  return fingerprints;
}

function reject(candidate, reason) {
  const record = { ...candidate, status: "rejected", rejectedReason: reason, reviewedAt: nowIso, reviewer: "memory-steward" };
  writeJsonl(path.join(stewardRoot, "rejected", `${nowIso.slice(0, 10)}.jsonl`), record);
  return record;
}

function quarantine(candidate, reason) {
  const record = { ...candidate, status: "quarantine", quarantineReason: reason, reviewedAt: nowIso, reviewer: "memory-steward" };
  writeJsonl(path.join(stewardRoot, "quarantine", `${candidate.targetAgent}.jsonl`), record);
  return record;
}

function promote(candidate) {
  const agentRoot = path.join(root, "brains", candidate.targetAgent);
  const folder = candidate.kind === "skill" ? "skills" : "facts";
  const filePath = path.join(agentRoot, folder, `${slug(candidate.id)}.md`);
  const provenance = {
    id: candidate.id,
    agent_id: candidate.targetAgent,
    status: "canonical",
    kind: candidate.kind === "skill" ? "skill" : "fact",
    promoted_by: "memory-steward",
    promoted_at: nowIso,
    source_agent: candidate.sourceAgent,
    source_run_id: candidate.sourceRunId,
    tool_used: candidate.toolUsed,
    confidence: candidate.confidence,
    ingested_at: nowIso,
    fingerprint: candidate.fingerprint,
  };
  const title = candidate.kind === "skill" ? "Canonical Skill" : "Canonical Fact";
  if (!dryRun) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${frontmatter(provenance)}# ${title}\n\n${candidate.text}\n`, "utf8");
  }
  const record = { ...candidate, status: "canonical", promotedAt: nowIso, path: path.relative(root, filePath), reviewer: "memory-steward" };
  writeJsonl(path.join(stewardRoot, "canonical-ledger", `${nowIso.slice(0, 10)}.jsonl`), record);
  return record;
}

function review(candidate, fingerprints) {
  const required = [
    ["targetAgent", candidate.targetAgent],
    ["sourceAgent", candidate.sourceAgent],
    ["sourceRunId", candidate.sourceRunId],
    ["toolUsed", candidate.toolUsed],
    ["text", candidate.text],
  ];
  const missing = required.filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) return reject(candidate, `missing required provenance: ${missing.join(", ")}`);
  if (!["fact", "skill", "workflow", "domain_fact"].includes(candidate.kind)) return reject(candidate, `unsupported kind: ${candidate.kind}`);
  if (!Number.isFinite(candidate.confidence) || candidate.confidence < 0.65) return reject(candidate, "confidence below 0.65");
  if (!Number.isFinite(candidate.roiScore) || !Number.isFinite(candidate.nativeBaselineScore) || candidate.roiScore <= candidate.nativeBaselineScore) {
    return reject(candidate, "ROI does not beat native baseline");
  }
  if (fingerprints.has(candidate.fingerprint)) return reject(candidate, "duplicate fingerprint");
  if (candidate.sourceAgent !== candidate.targetAgent && candidate.sourceAgent !== "memory-steward" && daysSince(candidate.firstSeenAt) < 14) {
    return quarantine(candidate, "cross-lane import must age 14 days before canonical promotion");
  }
  fingerprints.add(candidate.fingerprint);
  return promote(candidate);
}

for (const dir of ["staging", "canonical-ledger", "rejected", "quarantine"]) {
  if (!dryRun) fs.mkdirSync(path.join(stewardRoot, dir), { recursive: true });
}

const explicitFile = args.get("candidates");
const rows = explicitFile
  ? readJsonlPath(path.resolve(String(explicitFile)))
  : readJsonlFiles(path.join(stewardRoot, "staging"));
const fingerprints = allCanonicalFingerprints();
const reviewed = rows.map((row) => {
  const candidate = normalizeCandidate(row.payload, { file: path.relative(root, row.filePath), line: row.lineNumber });
  return candidate.error ? reject(candidate, candidate.error) : review(candidate, fingerprints);
});

process.stdout.write(`${JSON.stringify({
  ok: true,
  dryRun,
  reviewed: reviewed.length,
  canonical: reviewed.filter((item) => item.status === "canonical").length,
  quarantine: reviewed.filter((item) => item.status === "quarantine").length,
  rejected: reviewed.filter((item) => item.status === "rejected").length,
}, null, 2)}\n`);
