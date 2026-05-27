import "server-only";

import fs from "node:fs";
import path from "node:path";

export type AgentHeartbeatState = "live" | "running" | "sleeping" | "blocked" | "stale" | "stopped";

export type AgentHeartbeatRecord = {
  id: string;
  state: AgentHeartbeatState | string;
  rawState?: string;
  current?: string;
  latest?: string;
  blocker?: string;
  source?: string;
  lastSeenAt?: string;
  lastSeenAgeMinutes?: number;
  staleAfterMinutes?: number;
  nextWakeAt?: string | null;
};

export type AgentHeartbeatSnapshot = {
  generatedAt?: string;
  agents?: AgentHeartbeatRecord[];
};

export type HeartbeatInput = {
  agentId: string;
  state?: AgentHeartbeatState | string;
  current?: string;
  latest?: string;
  blocker?: string;
  source?: string;
  nextWakeAt?: string | null;
  staleAfterSeconds?: number;
};

function workspaceRoot() {
  let current = process.cwd();
  for (let index = 0; index < 6; index += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return process.cwd();
}

function heartbeatPath() {
  return path.join(workspaceRoot(), "config", "agent-heartbeats.json");
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

function parseAgeSeconds(iso?: string | null) {
  if (!iso) {
    return null;
  }
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.max(0, Math.round((Date.now() - parsed) / 1000));
}

export function readAgentHeartbeatSnapshot() {
  return readJson<AgentHeartbeatSnapshot>(heartbeatPath(), { agents: [] });
}

export function recordAgentHeartbeat(input: HeartbeatInput) {
  const now = new Date().toISOString();
  const snapshot = readAgentHeartbeatSnapshot();
  const agents = snapshot.agents ?? [];
  const staleAfterMinutes = Math.max(1, Math.ceil((input.staleAfterSeconds ?? 90) / 60));
  const nextRecord: AgentHeartbeatRecord = {
    id: input.agentId,
    blocker: input.blocker?.trim() || "none",
    source: input.source?.trim() || "runtime-heartbeat",
    staleAfterMinutes,
    lastSeenAt: now,
    lastSeenAgeMinutes: 0,
    rawState: input.state ?? "running",
    state: input.state ?? "running",
    nextWakeAt: input.nextWakeAt ?? null,
    latest: input.latest?.trim() || "Runtime heartbeat received.",
    current: input.current?.trim() || "Runtime heartbeat active.",
  };

  const index = agents.findIndex((agent) => agent.id === input.agentId);
  const nextAgents = index >= 0
    ? agents.map((agent, agentIndex) => (agentIndex === index ? { ...agent, ...nextRecord } : agent))
    : [...agents, nextRecord];

  const nextSnapshot = {
    generatedAt: now,
    agents: nextAgents.sort((left, right) => left.id.localeCompare(right.id)),
  };
  writeJson(heartbeatPath(), nextSnapshot);
  return nextRecord;
}

export function listHeartbeatSupervision() {
  const snapshot = readAgentHeartbeatSnapshot();
  const agents = snapshot.agents ?? [];
  const rows = agents.map((agent) => {
    const ageSeconds = parseAgeSeconds(agent.lastSeenAt);
    const staleAfterSeconds = Math.max(30, Math.round((agent.staleAfterMinutes ?? 2) * 60));
    const missedPings = ageSeconds === null ? null : Math.floor(ageSeconds / 30);
    const missedPingLimit = Math.max(3, Math.ceil(staleAfterSeconds / 30));
    const missing = ageSeconds === null;
    const stale = missing || ageSeconds > staleAfterSeconds;
    const restartDue = missing || (missedPings !== null && missedPings >= missedPingLimit);
    return {
      id: agent.id,
      state: agent.state,
      source: agent.source ?? "unknown",
      lastSeenAt: agent.lastSeenAt ?? null,
      ageSeconds,
      staleAfterSeconds,
      missedPings,
      stale,
      restartDue,
      blocker: agent.blocker ?? "none",
    };
  });

  return {
    generatedAt: snapshot.generatedAt ?? null,
    total: rows.length,
    stale: rows.filter((row) => row.stale).length,
    restartDue: rows.filter((row) => row.restartDue).length,
    live: rows.filter((row) => /live|running/i.test(row.state)).length,
    rows,
  };
}
