import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type OpsOverrideAction =
  | "pause-lane"
  | "drain-queue"
  | "rollback-memory"
  | "force-rebaseline"
  | "kill-agent";

export type OpsOverrideRecord = {
  id: string;
  action: OpsOverrideAction;
  target: string;
  reason: string;
  status: "queued";
  requestedBy: string;
  requestedAt: string;
  source: "ops-dashboard";
};

const ACTIONS = new Set<OpsOverrideAction>([
  "pause-lane",
  "drain-queue",
  "rollback-memory",
  "force-rebaseline",
  "kill-agent",
]);

function workspaceRoot() {
  let current = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) {
      break;
    }
    current = next;
  }
  return process.cwd();
}

function overrideSnapshotPath() {
  return path.join(workspaceRoot(), "config", "ops-overrides.json");
}

function overrideLedgerPath() {
  return path.join(workspaceRoot(), "config", "ops-overrides.jsonl");
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function isOpsOverrideAction(value: string): value is OpsOverrideAction {
  return ACTIONS.has(value as OpsOverrideAction);
}

export function listOpsOverrideActions() {
  return Array.from(ACTIONS);
}

export function readOpsOverrides() {
  return readJson<{ updatedAt: string | null; commands: OpsOverrideRecord[] }>(
    overrideSnapshotPath(),
    { updatedAt: null, commands: [] },
  );
}

export function appendOpsOverride(input: {
  action: OpsOverrideAction;
  target: string;
  reason?: string | null;
  requestedBy: string;
}) {
  const target = input.target.trim();
  if (!target) {
    throw new Error("Target is required.");
  }

  const record: OpsOverrideRecord = {
    id: `ops-${Date.now()}-${randomUUID().slice(0, 8)}`,
    action: input.action,
    target,
    reason: input.reason?.trim() || "Operator command from /ops.",
    status: "queued",
    requestedBy: input.requestedBy,
    requestedAt: new Date().toISOString(),
    source: "ops-dashboard",
  };

  const snapshot = readOpsOverrides();
  const nextSnapshot = {
    updatedAt: record.requestedAt,
    commands: [record, ...snapshot.commands].slice(0, 100),
  };

  writeJson(overrideSnapshotPath(), nextSnapshot);
  fs.appendFileSync(overrideLedgerPath(), `${JSON.stringify(record)}\n`, "utf8");

  return record;
}
