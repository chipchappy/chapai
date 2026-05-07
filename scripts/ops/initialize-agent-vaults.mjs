#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

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
const runId = String(args.get("run-id") ?? `stage3-${new Date().toISOString().replace(/[:.]/g, "-")}`);
const today = new Date().toISOString().slice(0, 10);
const dryRun = args.has("dry-run");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeFileIfMissing(filePath, content) {
  if (fs.existsSync(filePath)) return "kept";
  if (!dryRun) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
  }
  return "created";
}

function writeJson(filePath, value) {
  if (!dryRun) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }
}

function slug(value) {
  return String(value ?? "entry").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "entry";
}

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function frontmatter(fields) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(fields)) {
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

function agentFromEntry(entry) {
  const brainPath = path.isAbsolute(entry.brainPath ?? "")
    ? entry.brainPath
    : path.join(root, entry.brainPath ?? `brains/agents/${entry.id}.json`);
  const brain = readJson(brainPath, {});
  return {
    id: entry.id,
    displayName: brain.displayName ?? entry.nickname ?? entry.id,
    role: brain.role ?? entry.role ?? "Guild lane",
    runtime: brain.runtime ?? entry.runtime ?? "codex",
    mission: brain.mission ?? `Operate the ${entry.role ?? "guild"} lane with truthful telemetry.`,
    goals: Array.isArray(brain.goals) ? brain.goals : (entry.goals ?? []),
    workflowContract: Array.isArray(brain.workflowContract) ? brain.workflowContract : (entry.workflowContract ?? []),
    skills: Array.isArray(brain.skills) ? brain.skills : [],
    durableMemory: Array.isArray(brain.durableMemory) ? brain.durableMemory : [],
    activeContext: Array.isArray(brain.activeContext) ? brain.activeContext : [],
  };
}

function qdrantCollection(agentId) {
  return `chapai_${slug(agentId).replaceAll("-", "_")}_brain`;
}

function list(values) {
  return values.length ? values.map((item) => `- ${item}`).join("\n") : "- none recorded";
}

function buildVault(agent) {
  const vaultRoot = path.join(root, "brains", agent.id);
  const provenance = {
    source_agent: "memory-steward",
    source_run_id: runId,
    tool_used: "initialize-agent-vaults",
    confidence: 0.9,
    ingested_at: new Date().toISOString(),
  };
  const canonicalFactId = `fact-${agent.id}-identity-seed`;
  const coreSkill = agent.skills[0] ?? "truthful status reporting";
  const skillId = `skill-${agent.id}-${slug(coreSkill)}`;
  const files = [];

  for (const dir of ["skills", "facts", "episodes", "relationships", "daily"]) {
    if (!dryRun) fs.mkdirSync(path.join(vaultRoot, dir), { recursive: true });
  }

  files.push({
    path: path.join(vaultRoot, "identity.md"),
    content: `${frontmatter({ agent_id: agent.id, status: "identity", ...provenance })}# ${agent.displayName}\n\nRole: ${agent.role}\nRuntime: ${agent.runtime}\n\n## Mission\n${agent.mission}\n\n## Voice\nDirect, compact, evidence-led, and scoped to the assigned lane.\n\n## Principles\n${list(agent.workflowContract.length ? agent.workflowContract : ["Keep work bounded to the assigned lane.", "Report blockers clearly.", "Promote only reusable learnings."])}\n\n## Do\n${list(agent.goals.length ? agent.goals : ["Advance the lane goal with durable handoffs."])}\n\n## Do Not\n- Write canonical memory directly from runtime output.\n- Import another agent's learning without Memory-Steward review.\n- Treat stale telemetry as live state.\n`,
  });
  files.push({
    path: path.join(vaultRoot, "short_term_context.md"),
    content: `${frontmatter({ agent_id: agent.id, status: "scratch", ...provenance })}# Short-Term Context\n\n${list(agent.activeContext.slice(0, 8))}\n`,
  });
  files.push({
    path: path.join(vaultRoot, "working_scratchpad.md"),
    content: `${frontmatter({ agent_id: agent.id, status: "scratch", source_agent: agent.id, source_run_id: runId, tool_used: "initialize-agent-vaults", confidence: 0.7, ingested_at: provenance.ingested_at })}# Working Scratchpad\n\nEphemeral notes belong here. Memory-Steward must promote reusable findings before they become canonical.\n`,
  });
  files.push({
    path: path.join(vaultRoot, "open_questions.md"),
    content: `${frontmatter({ agent_id: agent.id, status: "open_questions", ...provenance })}# Open Questions\n\n- What is the next bounded task that most improves the ${agent.role} lane?\n- Which memory candidates beat the native baseline after review?\n- Which stale assumptions should be retired from this agent's lane?\n`,
  });
  files.push({
    path: path.join(vaultRoot, "facts", `${canonicalFactId}.md`),
    content: `${frontmatter({ id: canonicalFactId, agent_id: agent.id, status: "canonical", kind: "fact", ...provenance, fingerprint: sha(`${agent.id}:${agent.role}:${agent.mission}`) })}# Canonical Seed Fact\n\n${agent.displayName} owns the ${agent.role} lane and should keep durable memory separate from short-term context and scratchpad work.\n`,
  });
  files.push({
    path: path.join(vaultRoot, "skills", `${skillId}.md`),
    content: `${frontmatter({ id: skillId, agent_id: agent.id, status: "canonical", kind: "skill", ...provenance, fingerprint: sha(`${agent.id}:${coreSkill}`) })}# ${coreSkill}\n\nReusable lane skill seeded from the existing JSON brain. Future skill edits must include provenance and Memory-Steward promotion.\n`,
  });
  files.push({
    path: path.join(vaultRoot, "episodes", `${today}-stage3-bootstrap.md`),
    content: `${frontmatter({ agent_id: agent.id, status: "episode", ...provenance })}# Stage 3 Bootstrap\n\nCreated the per-agent vault layout for identity, short-term context, scratchpad, long-term facts, crystallized skills, relationships, open questions, and daily journal.\n`,
  });
  files.push({
    path: path.join(vaultRoot, "relationships", "operator.md"),
    content: `${frontmatter({ agent_id: agent.id, status: "relationship", relationship: "operator", ...provenance })}# Operator\n\nThe operator receives concise Telegram/dashboard updates, approvals, blockers, and high-leverage decisions. No public outbound action is allowed without approval history or explicit override.\n`,
  });
  files.push({
    path: path.join(vaultRoot, "relationships", "memory-steward.md"),
    content: `${frontmatter({ agent_id: agent.id, status: "relationship", relationship: "memory-steward", ...provenance })}# Memory-Steward\n\nMemory-Steward is the only canonical writer. This agent submits candidates to staging and waits for schema, dedup, ROI, and cross-lane quarantine gates.\n`,
  });
  files.push({
    path: path.join(vaultRoot, "daily", `${today}.md`),
    content: `${frontmatter({ agent_id: agent.id, status: "daily", ...provenance })}# ${today}\n\n- Stage 3 vault created.\n- Canonical seed fact present.\n- Qdrant collection target: ${qdrantCollection(agent.id)}.\n`,
  });

  const statuses = files.map((file) => ({ path: path.relative(root, file.path), status: writeFileIfMissing(file.path, file.content) }));
  const manifest = {
    agentId: agent.id,
    displayName: agent.displayName,
    role: agent.role,
    runtime: agent.runtime,
    vaultVersion: 1,
    generatedAt: provenance.ingested_at,
    sourceRunId: runId,
    qdrantCollection: qdrantCollection(agent.id),
    canonicalSeedEntries: [canonicalFactId, skillId],
    pathways: {
      shortTermContext: "short_term_context.md",
      workingScratchpad: "working_scratchpad.md",
      longTermMemory: "facts/",
      crystallizedSkills: "skills/",
    },
  };
  writeJson(path.join(vaultRoot, ".chapai-vault.json"), manifest);
  return { agentId: agent.id, files: statuses, manifest };
}

const registry = readJson(path.join(root, "config", "employee-registry.json"), { employees: [] });
const agents = (registry.employees ?? []).filter((entry) => entry.id).map(agentFromEntry);
agents.push({
  id: "memory-steward",
  displayName: "Memory-Steward",
  role: "Memory Steward",
  runtime: "codex",
  mission: "Promote only proven, provenance-bearing memories into canonical agent vaults.",
  goals: ["Enforce schema validity.", "Deduplicate memory.", "Require ROI over native baseline.", "Quarantine cross-lane imports for 14 days."],
  workflowContract: ["No agent writes canonical memory directly.", "Every canonical entry carries source_agent, source_run_id, tool_used, confidence, and ingested_at."],
  skills: ["provenance-gated promotion"],
  durableMemory: ["Brains never write to each other directly."],
  activeContext: ["Stage 3 memory gate online"],
});

const results = agents.map(buildVault);
const stewardRoot = path.join(root, "brains", "_steward");
for (const dir of ["staging", "canonical-ledger", "rejected", "quarantine"]) {
  if (!dryRun) fs.mkdirSync(path.join(stewardRoot, dir), { recursive: true });
}
writeFileIfMissing(path.join(stewardRoot, "README.md"), `# Memory-Steward\n\nOnly Memory-Steward writes canonical entries into per-agent vaults.\n\nPromotion gates:\n- schema valid\n- deduplicated fingerprint\n- ROI greater than native baseline\n- cross-lane imports wait 14 days\n- provenance required on every canonical entry\n`);

process.stdout.write(`${JSON.stringify({ ok: true, dryRun, runId, agents: results.length, results }, null, 2)}\n`);
