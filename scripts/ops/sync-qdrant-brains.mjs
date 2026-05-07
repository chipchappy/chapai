#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const dryRun = args.has("dry-run");
const vectorSize = Number(args.get("size") ?? 64);
const qdrantUrl = String(args.get("url") ?? process.env.QDRANT_URL ?? "http://127.0.0.1:6333").replace(/\/$/, "");
const apiKey = process.env.QDRANT_API_KEY;

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

function slug(value) {
  return String(value ?? "agent").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 80) || "agent";
}

function collectionName(agentId) {
  return `chapai_${slug(agentId)}_brain`;
}

function hashVector(text) {
  const vector = Array.from({ length: vectorSize }, () => 0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  for (const token of tokens) {
    const digest = crypto.createHash("sha256").update(token).digest();
    const index = digest[0] % vectorSize;
    const sign = digest[1] % 2 === 0 ? 1 : -1;
    vector[index] += sign * (1 + Math.min(token.length, 16) / 16);
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / norm).toFixed(6)));
}

function pointId(agentId, relativePath) {
  return crypto.createHash("sha256").update(`${agentId}:${relativePath}`).digest("hex").slice(0, 32);
}

function markdownText(content) {
  return content.replace(/^---[\s\S]*?---\s*/, "").trim();
}

function listVaultDocs(agentId) {
  const vaultRoot = path.join(root, "brains", agentId);
  const docs = [];
  for (const subdir of ["facts", "skills", "episodes", "relationships", "daily"]) {
    const dir = path.join(vaultRoot, subdir);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".md"))) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, "utf8");
      const relativePath = path.relative(vaultRoot, filePath).replaceAll("\\", "/");
      docs.push({
        id: pointId(agentId, relativePath),
        vector: hashVector(markdownText(content)),
        payload: {
          agent_id: agentId,
          path: relativePath,
          text: markdownText(content).slice(0, 4000),
          indexed_at: new Date().toISOString(),
          projection: "hashing-vector-v1",
        },
      });
    }
  }
  return docs;
}

async function qdrant(pathname, init) {
  const headers = { "content-type": "application/json" };
  if (apiKey) headers["api-key"] = apiKey;
  const response = await fetch(`${qdrantUrl}${pathname}`, { headers, ...init });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Qdrant ${pathname} failed ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

async function syncCollection(agentId, points) {
  const collection = collectionName(agentId);
  if (dryRun) {
    return { agentId, collection, points: points.length, status: "dry-run" };
  }
  await qdrant(`/collections/${collection}`, {
    method: "PUT",
    body: JSON.stringify({ vectors: { size: vectorSize, distance: "Cosine" } }),
  });
  if (points.length > 0) {
    await qdrant(`/collections/${collection}/points?wait=true`, {
      method: "PUT",
      body: JSON.stringify({ points }),
    });
  }
  return { agentId, collection, points: points.length, status: "indexed" };
}

async function main() {
  const brainRoot = path.join(root, "brains");
  const agentIds = fs.readdirSync(brainRoot)
    .filter((name) => !name.startsWith("_") && fs.existsSync(path.join(brainRoot, name, ".chapai-vault.json")))
    .filter((name) => fs.statSync(path.join(brainRoot, name)).isDirectory())
    .sort();
  const results = [];
  for (const agentId of agentIds) {
    results.push(await syncCollection(agentId, listVaultDocs(agentId)));
  }
  process.stdout.write(`${JSON.stringify({ ok: true, dryRun, qdrantUrl, vectorSize, agents: results.length, results }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
