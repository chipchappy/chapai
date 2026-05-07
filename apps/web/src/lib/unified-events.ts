import "server-only";

import fs from "node:fs";
import path from "node:path";

type ConnectorEvent = {
  event_id?: string;
  schema_version?: string;
  source?: string;
  event_type?: string;
  emitted_at?: string;
  observed_at?: string;
  connector_run_id?: string;
  taint?: string;
  allowed_uses?: string[];
  payload?: Record<string, unknown>;
};

function workspaceRoot() {
  let current = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return process.cwd();
}

function readJsonl(filePath: string) {
  try {
    return fs.readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
      .filter((entry) => entry.line)
      .map((entry) => {
        try {
          return { lineNumber: entry.lineNumber, event: JSON.parse(entry.line) as ConnectorEvent };
        } catch {
          return { lineNumber: entry.lineNumber, event: null };
        }
      });
  } catch {
    return [];
  }
}

function listConnectorFiles(root: string) {
  const connectorRoot = path.join(root, "connectors");
  if (!fs.existsSync(connectorRoot)) return [];
  return fs.readdirSync(connectorRoot).flatMap((source) => {
    const sourceDir = path.join(connectorRoot, source);
    if (!fs.statSync(sourceDir).isDirectory()) return [];
    return fs.readdirSync(sourceDir)
      .filter((file) => file.endsWith(".jsonl"))
      .map((file) => path.join(sourceDir, file));
  });
}

function validEvent(event: ConnectorEvent | null) {
  return Boolean(
    event
    && event.event_id
    && event.schema_version === "chapai.connector.event.v1"
    && event.source
    && event.event_type
    && event.emitted_at
    && event.connector_run_id
    && event.taint
    && event.payload,
  );
}

function newer(left?: string, right?: string) {
  if (!left) return right;
  if (!right) return left;
  return Date.parse(left) >= Date.parse(right) ? left : right;
}

export function getUnifiedEventSummary() {
  const root = workspaceRoot();
  const files = listConnectorFiles(root);
  const rows = files.flatMap((filePath) => readJsonl(filePath).map((row) => ({ ...row, filePath })));
  const valid = rows.filter((row) => validEvent(row.event));
  const invalid = rows.length - valid.length;
  const bySource = new Map<string, {
    source: string;
    events: number;
    eventTypes: Set<string>;
    latestAt: string | null;
    taints: Set<string>;
  }>();

  for (const row of valid) {
    const event = row.event as Required<Pick<ConnectorEvent, "source" | "event_type" | "emitted_at" | "taint">>;
    const existing = bySource.get(event.source) ?? {
      source: event.source,
      events: 0,
      eventTypes: new Set<string>(),
      latestAt: null,
      taints: new Set<string>(),
    };
    existing.events += 1;
    existing.eventTypes.add(event.event_type);
    existing.taints.add(event.taint);
    existing.latestAt = newer(existing.latestAt ?? undefined, event.emitted_at) ?? null;
    bySource.set(event.source, existing);
  }

  const latest = valid
    .map((row) => row.event as ConnectorEvent)
    .sort((left, right) => Date.parse(right.emitted_at ?? "") - Date.parse(left.emitted_at ?? ""))
    .slice(0, 8)
    .map((event) => ({
      id: event.event_id ?? "unknown",
      source: event.source ?? "unknown",
      type: event.event_type ?? "unknown",
      emittedAt: event.emitted_at ?? null,
      taint: event.taint ?? "unknown",
      runId: event.connector_run_id ?? "unknown",
      summary: summarizePayload(event),
    }));

  return {
    files: files.length,
    events: valid.length,
    invalid,
    sources: Array.from(bySource.values()).map((row) => ({
      source: row.source,
      events: row.events,
      eventTypes: Array.from(row.eventTypes).sort(),
      latestAt: row.latestAt,
      taints: Array.from(row.taints).sort(),
    })).sort((left, right) => right.events - left.events || left.source.localeCompare(right.source)),
    latest,
    health: invalid > 0 ? "attention" : valid.length > 0 ? "live" : "missing",
  };
}

function summarizePayload(event: ConnectorEvent) {
  const payload = event.payload ?? {};
  if (typeof payload.relative_path === "string") {
    return payload.relative_path;
  }
  if (typeof payload.runtime_host_class === "string") {
    return `${payload.runtime_host_class} / ${payload.cpu_count ?? "?"} cpu / ${formatBytes(Number(payload.free_memory_bytes ?? 0))} free`;
  }
  return Object.keys(payload).slice(0, 4).join(", ") || "payload recorded";
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "n/a";
  if (value >= 1_073_741_824) return `${Math.round(value / 1_073_741_824)}GB`;
  if (value >= 1_048_576) return `${Math.round(value / 1_048_576)}MB`;
  return `${Math.round(value / 1024)}KB`;
}
