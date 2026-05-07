#!/usr/bin/env node
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const schemaVersion = "chapai.connector.event.v1";
const runId = String(args.get("run-id") ?? `phase4-${new Date().toISOString().replace(/[:.]/g, "-")}`);
const sourceArg = String(args.get("source") ?? "all");
const maxFiles = Number(args.get("max-files") ?? 80);
const dryRun = args.has("dry-run");
const validateOnly = args.has("validate");

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
const outRoot = path.resolve(root, String(args.get("out") ?? "connectors"));

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readFileHash(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function writeEvent(event) {
  if (dryRun) return;
  const dir = path.join(outRoot, event.source);
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, `${event.event_type}.jsonl`), `${JSON.stringify(event)}\n`, "utf8");
}

function event(source, eventType, payload, options = {}) {
  const emittedAt = new Date().toISOString();
  return {
    event_id: sha(`${source}:${eventType}:${runId}:${JSON.stringify(payload)}`),
    schema_version: schemaVersion,
    source,
    event_type: eventType,
    emitted_at: emittedAt,
    observed_at: options.observedAt ?? emittedAt,
    connector_run_id: runId,
    taint: options.taint ?? "local_metadata",
    allowed_uses: options.allowedUses ?? ["routing", "dashboard", "audit"],
    provenance: {
      tool: "scripts/connectors/chapai-data-layer.mjs",
      cwd: normalizePath(path.relative(root, process.cwd()) || "."),
      host_hash: sha(os.hostname()).slice(0, 16),
      platform: os.platform(),
    },
    payload,
  };
}

function gitTrackedFiles() {
  try {
    return execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function isSafeMetadataPath(relativePath) {
  const normalized = normalizePath(relativePath).toLowerCase();
  const blockedFragments = [
    ".env",
    ".dev.vars",
    "access-key",
    "access_key",
    "secret",
    "cookie",
    "token",
    "credential",
    "private-key",
    "private_key",
    "node_modules/",
    ".next/",
    ".open-next/",
    ".git/",
  ];
  return !blockedFragments.some((fragment) => normalized.includes(fragment));
}

function localFsEvents() {
  return gitTrackedFiles()
    .filter(isSafeMetadataPath)
    .slice(0, maxFiles)
    .flatMap((relativePath) => {
      const filePath = path.join(root, relativePath);
      try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) return [];
        return [event("local-fs", "file_indexed", {
          relative_path: normalizePath(relativePath),
          extension: path.extname(relativePath).toLowerCase(),
          bytes: stat.size,
          mtime: stat.mtime.toISOString(),
          content_sha256: readFileHash(filePath),
        })];
      } catch {
        return [];
      }
    });
}

function hostMetricEvents() {
  const cpus = os.cpus();
  return [event("hetzner-vps", "metric_sample", {
    runtime_host_class: process.env.HETZNER_SERVER_ID ? "hetzner" : "local-validation-host",
    uptime_seconds: Math.round(os.uptime()),
    cpu_count: cpus.length,
    cpu_model_hash: sha(cpus[0]?.model ?? "unknown").slice(0, 16),
    load_average: os.loadavg(),
    total_memory_bytes: os.totalmem(),
    free_memory_bytes: os.freemem(),
    platform: os.platform(),
    release: os.release(),
  }, {
    allowedUses: ["dashboard", "audit", "capacity-planning"],
  })];
}

function validateStreams() {
  if (!fs.existsSync(outRoot)) return { ok: true, files: 0, events: 0, failures: [] };
  const failures = [];
  let files = 0;
  let events = 0;
  for (const source of fs.readdirSync(outRoot)) {
    const sourceDir = path.join(outRoot, source);
    if (!fs.statSync(sourceDir).isDirectory()) continue;
    for (const file of fs.readdirSync(sourceDir).filter((name) => name.endsWith(".jsonl"))) {
      files += 1;
      const filePath = path.join(sourceDir, file);
      fs.readFileSync(filePath, "utf8").split(/\r?\n/).forEach((line, index) => {
        if (!line.trim()) return;
        events += 1;
        try {
          const parsed = JSON.parse(line);
          for (const key of ["event_id", "schema_version", "source", "event_type", "emitted_at", "connector_run_id", "taint", "provenance", "payload"]) {
            if (parsed[key] === undefined) failures.push(`${normalizePath(path.relative(root, filePath))}:${index + 1} missing ${key}`);
          }
          if (parsed.schema_version !== schemaVersion) failures.push(`${normalizePath(path.relative(root, filePath))}:${index + 1} schema mismatch`);
        } catch {
          failures.push(`${normalizePath(path.relative(root, filePath))}:${index + 1} invalid json`);
        }
      });
    }
  }
  return { ok: failures.length === 0, files, events, failures };
}

if (validateOnly) {
  const validation = validateStreams();
  process.stdout.write(`${JSON.stringify(validation, null, 2)}\n`);
  process.exit(validation.ok ? 0 : 1);
}

const selected = sourceArg === "all" ? ["local-fs", "hetzner-vps"] : sourceArg.split(",").map((item) => item.trim()).filter(Boolean);
const produced = [];
if (selected.includes("local-fs")) produced.push(...localFsEvents());
if (selected.includes("hetzner-vps") || selected.includes("host-metrics")) produced.push(...hostMetricEvents());
for (const item of produced) writeEvent(item);

const validation = dryRun ? { ok: true, files: 0, events: produced.length, failures: [] } : validateStreams();
process.stdout.write(`${JSON.stringify({
  ok: validation.ok,
  dryRun,
  runId,
  outRoot: normalizePath(path.relative(root, outRoot) || "."),
  produced: produced.length,
  validation,
}, null, 2)}\n`);
process.exit(validation.ok ? 0 : 1);
