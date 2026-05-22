#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// HALT GUARD: respect the gaming-mode pause sentinel. While present, the
// supervisor refuses to start and a running loop self-exits on its next cycle.
// Delete %LOCALAPPDATA%\ChappiAi\gaming-mode.enabled to resume. See scripts/halt-guild-automation.ps1.
const HALT_SENTINEL = path.join(process.env.LOCALAPPDATA || "", "ChappiAi", "gaming-mode.enabled");
function haltedBySentinel() {
  try { return fs.existsSync(HALT_SENTINEL); } catch { return false; }
}
if (haltedBySentinel()) {
  process.stdout.write("[supervisor] gaming-mode sentinel present — halted, not starting.\n");
  process.exit(0);
}

const args = new Set(process.argv.slice(2));
const once = args.has("--once");
const intervalMs = Number([...args].find((arg) => arg.startsWith("--interval-ms="))?.split("=")[1] ?? 300_000);
const defaultTimeoutMs = Number(process.env.CHAPAI_AGENT_STEP_TIMEOUT_MS ?? 45_000);

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
const configDir = path.join(root, "config");
const runId = `agent-supervisor-${new Date().toISOString().replace(/[:.]/g, "-")}`;

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function appendJsonl(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value, fallback = "") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 700 ? `${text.slice(0, 697)}...` : text;
}

function powershellScript(scriptRelativePath, scriptArgs = [], timeoutMs = defaultTimeoutMs) {
  const fullPath = path.join(root, scriptRelativePath);
  if (!fs.existsSync(fullPath)) {
    return { skipped: true, reason: "missing", command: scriptRelativePath };
  }
  const commandArgs = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", fullPath, ...scriptArgs];
  const started = Date.now();
  const result = spawnSync("powershell.exe", commandArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: timeoutMs,
    windowsHide: true,
  });
  const durationMs = Date.now() - started;
  return {
    command: `powershell.exe ${commandArgs.join(" ")}`,
    status: result.status,
    signal: result.signal ?? null,
    timedOut: result.error?.code === "ETIMEDOUT",
    durationMs,
    stdout: normalizeText(result.stdout),
    stderr: normalizeText(result.stderr || result.error?.message),
  };
}

function stateFor(employee) {
  return readJson(path.join(root, employee.statePath ?? ""), {});
}

function brainFor(employee) {
  return readJson(path.join(root, employee.brainPath ?? ""), {});
}

function resolveHeartbeat(employee, laneResult) {
  const state = stateFor(employee);
  const brain = brainFor(employee);
  const latestResult = state.latestResult ?? {};
  const currentTask = state.currentTask ?? {};
  const rawState = String(state.semanticStatus ?? state.status ?? "sleeping");
  const normalized = rawState === "ready" || rawState === "idle" ? "sleeping" : rawState;

  if (laneResult?.timedOut || (laneResult && laneResult.status && laneResult.status !== 0)) {
    return {
      id: employee.heartbeatId ?? employee.id,
      state: "blocked",
      rawState: laneResult.timedOut ? "timeout" : "failed",
      current: `${employee.id} entrypoint did not complete inside the supervisor budget.`,
      blocker: laneResult.stderr || laneResult.stdout || "entrypoint failed or timed out",
      latest: laneResult.timedOut ? "Supervisor bounded the lane to prevent workforce-wide staleness." : "Supervisor captured a lane failure.",
      lastSeenAt: nowIso(),
      lastSeenAgeMinutes: 0,
      staleAfterMinutes: 20,
      source: "local-supervisor",
      nextWakeAt: nowIso(),
    };
  }

  return {
    id: employee.heartbeatId ?? employee.id,
    state: normalized === "running" ? "live" : normalized,
    rawState,
    current: normalizeText(currentTask.title, normalizeText(brain.activeContext?.[0], "Awaiting bounded work.")),
    blocker: normalizeText(state.blocker, "none"),
    latest: normalizeText(latestResult.summary, normalizeText(brain.memoryEvents?.at?.(-1)?.summary, `${employee.nickname ?? employee.id} supervised.`)),
    lastSeenAt: nowIso(),
    lastSeenAgeMinutes: 0,
    staleAfterMinutes: Number(state.staleAfterMinutes ?? 45),
    source: "local-supervisor",
    nextWakeAt: state.nextCheckAt ?? state.nextWakeAt ?? null,
  };
}

function lanePlan() {
  return [
    { agentId: "hermes", script: "scripts/run-hermes-router.ps1" },
    { agentId: "claude-code", script: "scripts/run-claude-employee.ps1", timeoutMs: 45_000 },
    { agentId: "social-studio", script: "scripts/run-social-studio.ps1" },
    { agentId: "social-studio", script: "scripts/run-social-dispatch.ps1" },
    { agentId: "outreach-email", script: "scripts/run-outreach-email-lane.ps1" },
    { agentId: "outreach-email", script: "scripts/run-email-dispatch.ps1" },
    { agentId: "mobile-product", script: "scripts/run-mobile-product-lane.ps1" },
    { agentId: "growth-orchestrator", script: "scripts/run-growth-orchestrator.ps1" },
    { agentId: "scout", script: "scripts/run-scout-lane.ps1" },
    { agentId: "gemini-audit", script: "scripts/run-gemini-audit-lane.ps1" },
    { agentId: "antigravity", script: "scripts/run-antigravity-lane.ps1" },
    { agentId: "orchestrator", script: "scripts/run-core-codex-lane.ps1", args: ["-EmployeeId", "orchestrator"] },
    { agentId: "frontend", script: "scripts/run-core-codex-lane.ps1", args: ["-EmployeeId", "frontend"] },
    { agentId: "backend", script: "scripts/run-core-codex-lane.ps1", args: ["-EmployeeId", "backend"] },
    { agentId: "content", script: "scripts/run-core-codex-lane.ps1", args: ["-EmployeeId", "content"] },
    { agentId: "manager", script: "scripts/run-manager-lane.ps1" },
    { agentId: "maintenance", script: "scripts/run-brain-maintenance.ps1", timeoutMs: 120_000 },
    { agentId: "snapshot", script: "scripts/export_guild_snapshot.ps1", timeoutMs: 120_000 },
    { agentId: "snapshot", script: "scripts/export-unified-agent-guild-state.ps1", timeoutMs: 120_000 },
  ];
}

function runCycle() {
  if (haltedBySentinel()) {
    process.stdout.write("[supervisor] gaming-mode sentinel present — halting mid-loop.\n");
    process.exit(0);
  }
  const startedAt = nowIso();
  const registry = readJson(path.join(configDir, "employee-registry.json"), { employees: [] });
  const employees = registry.employees ?? [];
  const resultsByAgent = new Map();
  const invocations = [];

  for (const step of lanePlan()) {
    const result = powershellScript(step.script, step.args ?? [], step.timeoutMs ?? defaultTimeoutMs);
    const event = {
      runId,
      at: nowIso(),
      agentId: step.agentId,
      script: step.script,
      timeoutMs: step.timeoutMs ?? defaultTimeoutMs,
      ...result,
    };
    invocations.push(event);
    appendJsonl(path.join(configDir, "agent-invocation-ledger.jsonl"), event);
    if (step.agentId !== "maintenance" && step.agentId !== "snapshot") {
      const previous = resultsByAgent.get(step.agentId);
      if (!previous || result.timedOut || (result.status && result.status !== 0)) {
        resultsByAgent.set(step.agentId, result);
      }
    }
  }

  const heartbeats = employees.map((employee) => resolveHeartbeat(employee, resultsByAgent.get(employee.id)));
  writeJson(path.join(configDir, "agent-heartbeats.json"), {
    generatedAt: nowIso(),
    agents: heartbeats.sort((left, right) => left.id.localeCompare(right.id)),
  });

  const failures = invocations.filter((item) => item.timedOut || (item.status && item.status !== 0));
  const state = {
    ok: failures.length === 0,
    runId,
    startedAt,
    completedAt: nowIso(),
    intervalMs,
    invocationCount: invocations.length,
    failureCount: failures.length,
    failures: failures.map((item) => ({
      agentId: item.agentId,
      script: item.script,
      status: item.status,
      timedOut: item.timedOut,
      stderr: item.stderr,
    })),
    heartbeatCount: heartbeats.length,
  };
  writeJson(path.join(configDir, "agent-supervisor-state.json"), state);
  process.stdout.write(`${JSON.stringify(state)}\n`);
  return state;
}

async function main() {
  do {
    runCycle();
    if (once) break;
    await new Promise((resolve) => setTimeout(resolve, Math.max(60_000, intervalMs)));
  } while (true);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
