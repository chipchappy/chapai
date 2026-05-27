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

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function countMarkdown(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((file) => file.endsWith(".md")).length;
}

const registry = readJson(path.join(root, "config", "employee-registry.json"), { employees: [] });
const agents = (registry.employees ?? []).map((entry) => entry.id).filter(Boolean);
const vaults = agents.map((agentId) => {
  const vaultRoot = path.join(root, "brains", agentId);
  const manifest = readJson(path.join(vaultRoot, ".chapai-vault.json"), null);
  return {
    agentId,
    exists: fs.existsSync(vaultRoot),
    manifest: Boolean(manifest),
    identity: fs.existsSync(path.join(vaultRoot, "identity.md")),
    canonicalFacts: countMarkdown(path.join(vaultRoot, "facts")),
    skills: countMarkdown(path.join(vaultRoot, "skills")),
    episodes: countMarkdown(path.join(vaultRoot, "episodes")),
    relationships: countMarkdown(path.join(vaultRoot, "relationships")),
    daily: countMarkdown(path.join(vaultRoot, "daily")),
    qdrantCollection: manifest?.qdrantCollection ?? null,
  };
});
const steward = {
  exists: fs.existsSync(path.join(root, "brains", "_steward")),
  stagingFiles: fs.existsSync(path.join(root, "brains", "_steward", "staging")) ? fs.readdirSync(path.join(root, "brains", "_steward", "staging")).length : 0,
  canonicalLedgerFiles: fs.existsSync(path.join(root, "brains", "_steward", "canonical-ledger")) ? fs.readdirSync(path.join(root, "brains", "_steward", "canonical-ledger")).length : 0,
  rejectedFiles: fs.existsSync(path.join(root, "brains", "_steward", "rejected")) ? fs.readdirSync(path.join(root, "brains", "_steward", "rejected")).length : 0,
  quarantineFiles: fs.existsSync(path.join(root, "brains", "_steward", "quarantine")) ? fs.readdirSync(path.join(root, "brains", "_steward", "quarantine")).length : 0,
};

process.stdout.write(`${JSON.stringify({
  ok: true,
  generatedAt: new Date().toISOString(),
  registryAgents: agents.length,
  vaultsPresent: vaults.filter((vault) => vault.exists && vault.manifest).length,
  agentsWithCanonicalEntry: vaults.filter((vault) => vault.canonicalFacts + vault.skills > 0).length,
  steward,
  vaults,
}, null, 2)}\n`);
