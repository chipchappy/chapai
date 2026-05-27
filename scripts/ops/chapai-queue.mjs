#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const redisUrl = String(args.get("redis-url") ?? process.env.REDIS_URL ?? "redis://127.0.0.1:6379/0");
const dryRun = args.has("dry-run");

function findRoot() {
  let current = path.resolve(String(args.get("root") ?? process.cwd()));
  for (let index = 0; index < 8; index += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return path.resolve(String(args.get("root") ?? process.cwd()));
}

const root = findRoot();

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function redis(commandArgs) {
  if (dryRun) {
    return { status: 0, stdout: "", stderr: "", command: `redis-cli -u ${redisUrl} ${commandArgs.join(" ")}` };
  }
  const result = spawnSync("redis-cli", ["-u", redisUrl, "--raw", ...commandArgs], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? result.error?.message ?? "",
    command: `redis-cli -u ${redisUrl} ${commandArgs.join(" ")}`,
  };
}

function queueKey(lane) {
  return `chapai:lane:${lane}`;
}

function lanesFromRegistry() {
  const registry = readJson(path.join(root, "config", "employee-registry.json"), { employees: [] });
  return [...new Set((registry.employees ?? []).map((employee) => employee.role ?? employee.id).filter(Boolean))].sort();
}

function enqueue() {
  const lane = String(args.get("lane") ?? "").trim();
  if (!lane) {
    throw new Error("Missing --lane.");
  }
  const type = String(args.get("type") ?? "agent-command");
  const payload = String(args.get("payload-json") ?? "{}");
  JSON.parse(payload);
  const result = redis(["XADD", queueKey(lane), "*", "type", type, "payload", payload, "createdAt", new Date().toISOString()]);
  if (result.status !== 0) {
    throw new Error(result.stderr || `redis-cli exited ${result.status}`);
  }
  return { ok: true, mode: "enqueue", dryRun, lane, type, streamId: result.stdout.trim() || "dry-run" };
}

function ensureGroup(lane, group) {
  const result = redis(["XGROUP", "CREATE", queueKey(lane), group, "0", "MKSTREAM"]);
  if (result.status !== 0 && !/BUSYGROUP/i.test(result.stderr)) {
    throw new Error(result.stderr || `XGROUP CREATE exited ${result.status}`);
  }
}

function parseReadGroup(stdout) {
  const lines = stdout.split(/\r?\n/).filter(Boolean);
  if (lines.length < 6) {
    return null;
  }
  const streamId = lines[1];
  const fields = {};
  for (let index = 2; index < lines.length - 1; index += 2) {
    fields[lines[index]] = lines[index + 1];
  }
  return { streamId, fields };
}

function consume() {
  const lane = String(args.get("lane") ?? "").trim();
  if (!lane) {
    throw new Error("Missing --lane.");
  }
  const group = String(args.get("group") ?? "chapai-workers");
  const consumer = String(args.get("consumer") ?? process.env.HOSTNAME ?? "local-worker");
  ensureGroup(lane, group);
  const result = redis(["XREADGROUP", "GROUP", group, consumer, "COUNT", "1", "BLOCK", "1000", "STREAMS", queueKey(lane), ">"]);
  if (result.status !== 0) {
    throw new Error(result.stderr || `XREADGROUP exited ${result.status}`);
  }
  const message = parseReadGroup(result.stdout);
  if (!message) {
    return { ok: true, mode: "consume", dryRun, lane, message: null };
  }
  const payload = message.fields.payload ? JSON.parse(message.fields.payload) : {};
  const receipt = {
    ok: true,
    lane,
    streamId: message.streamId,
    type: message.fields.type ?? "unknown",
    payload,
    consumedAt: new Date().toISOString(),
    consumer,
  };
  const receiptPath = path.join(root, "config", "queue-results", lane.replace(/[^a-z0-9._-]/gi, "-"), `${message.streamId.replace(/[^a-z0-9._-]/gi, "-")}.json`);
  if (!dryRun) {
    writeJson(receiptPath, receipt);
    redis(["XACK", queueKey(lane), group, message.streamId]);
  }
  return { ...receipt, mode: "consume", dryRun, receiptPath };
}

function status() {
  const lanes = lanesFromRegistry();
  return {
    ok: true,
    mode: "status",
    dryRun,
    redisUrl: redisUrl.replace(/\/\/.*@/, "//redacted@"),
    lanes: lanes.map((lane) => ({
      lane,
      queue: queueKey(lane),
    })),
  };
}

function main() {
  let result;
  if (args.has("enqueue")) {
    result = enqueue();
  } else if (args.has("consume")) {
    result = consume();
  } else {
    result = status();
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
}
