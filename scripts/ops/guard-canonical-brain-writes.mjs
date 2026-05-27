#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function findRoot() {
  let current = process.cwd();
  for (let index = 0; index < 8; index += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) return current;
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return process.cwd();
}

const root = findRoot();
const brainRoot = path.join(root, "brains");
const failures = [];

function parseFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return Object.fromEntries(match[1].split(/\r?\n/).flatMap((line) => {
    const separator = line.indexOf(":");
    if (separator === -1) return [];
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    try {
      return [[key, JSON.parse(value)]];
    } catch {
      return [[key, value.replace(/^"|"$/g, "")]];
    }
  }));
}

function listCanonicalFiles() {
  if (!fs.existsSync(brainRoot)) return [];
  return fs.readdirSync(brainRoot).flatMap((agentId) => {
    if (agentId === "agents" || agentId === "org" || agentId.startsWith("_")) return [];
    const agentRoot = path.join(brainRoot, agentId);
    if (!fs.statSync(agentRoot).isDirectory()) return [];
    return ["facts", "skills"].flatMap((folder) => {
      const dir = path.join(agentRoot, folder);
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir)
        .filter((file) => file.endsWith(".md"))
        .map((file) => ({ agentId, folder, filePath: path.join(dir, file) }));
    });
  });
}

for (const entry of listCanonicalFiles()) {
  const fields = parseFrontmatter(entry.filePath);
  const relative = path.relative(root, entry.filePath);
  const required = ["id", "agent_id", "status", "kind", "source_agent", "source_run_id", "tool_used", "confidence", "ingested_at", "fingerprint"];
  const missing = required.filter((key) => fields[key] === undefined || fields[key] === "");
  if (missing.length) {
    failures.push(`${relative}: missing ${missing.join(", ")}`);
  }
  if (fields.agent_id !== entry.agentId) {
    failures.push(`${relative}: agent_id ${JSON.stringify(fields.agent_id)} does not match vault ${entry.agentId}`);
  }
  if (fields.status !== "canonical") {
    failures.push(`${relative}: status must be canonical`);
  }
  if (!["fact", "skill"].includes(String(fields.kind))) {
    failures.push(`${relative}: kind must be fact or skill`);
  }
  if (entry.folder === "facts" && fields.kind !== "fact") {
    failures.push(`${relative}: facts directory requires kind fact`);
  }
  if (entry.folder === "skills" && fields.kind !== "skill") {
    failures.push(`${relative}: skills directory requires kind skill`);
  }
  if (Number(fields.confidence) < 0.65) {
    failures.push(`${relative}: confidence below canonical floor`);
  }
  const stewardMarked = fields.source_agent === "memory-steward" || fields.promoted_by === "memory-steward" || fields.reviewer === "memory-steward";
  if (!stewardMarked) {
    failures.push(`${relative}: canonical entry lacks Memory-Steward writer marker`);
  }
}

if (failures.length) {
  process.stderr.write(`Canonical brain guard failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(`${JSON.stringify({
  ok: true,
  checkedAt: new Date().toISOString(),
  canonicalFiles: listCanonicalFiles().length,
}, null, 2)}\n`);
