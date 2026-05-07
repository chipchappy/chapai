#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const dryRun = args.has("dry-run");
const once = args.has("once") || dryRun;
const strict = args.has("strict");
const intervalMs = Number(args.get("interval-ms") ?? 30_000);

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
const configDir = path.join(root, "config");
const statePath = path.join(configDir, "watchdog-state.json");
const alertOutbox = path.join(configDir, "telegram-alert-outbox.jsonl");
const overridesPath = path.join(configDir, "ops-overrides.json");
const overridesLedgerPath = path.join(configDir, "ops-overrides.jsonl");

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

function appendJsonl(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

function ageSeconds(iso) {
  if (!iso) return null;
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.round((Date.now() - parsed) / 1000));
}

function safeAgentId(agentId) {
  const id = String(agentId ?? "").trim();
  if (!/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(id)) {
    throw new Error(`Unsafe systemd agent id: ${id}`);
  }
  return id;
}

function unitName(agentId) {
  return `chapai-agent@${safeAgentId(agentId)}.service`;
}

function runCommand(command, commandArgs, options = {}) {
  if (dryRun) {
    return { status: 0, stdout: "", stderr: "", dryRun: true, command: [command, ...commandArgs].join(" ") };
  }
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? result.error?.message ?? "",
    command: [command, ...commandArgs].join(" "),
  };
}

function systemctl(action, agentId) {
  return runCommand("systemctl", [action, unitName(agentId)]);
}

async function sendAlert(text, metadata = {}) {
  const event = {
    id: `watchdog-${Date.now()}`,
    at: nowIso(),
    lane: "alerts",
    text,
    metadata,
  };

  if (!dryRun) {
    appendJsonl(alertOutbox, event);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!dryRun && token && chatId) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
      });
      event.telegramStatus = response.ok ? "sent" : `http-${response.status}`;
    } catch (error) {
      event.telegramStatus = error instanceof Error ? error.message : "send-failed";
    }
  }

  return event;
}

function updateOverrideStatus(snapshot, command, status, note) {
  const updatedAt = nowIso();
  const nextCommand = { ...command, status, updatedAt, note };
  snapshot.commands = snapshot.commands.map((item) => (item.id === command.id ? nextCommand : item));
  snapshot.updatedAt = updatedAt;
  if (!dryRun) {
    appendJsonl(overridesLedgerPath, { ...nextCommand, ledgerEvent: "watchdog-status-update" });
  }
  return nextCommand;
}

function appendQueueIntent(fileName, payload) {
  if (dryRun) {
    return;
  }
  appendJsonl(path.join(configDir, fileName), { ...payload, createdAt: nowIso(), source: "chapai-watchdog" });
}

function applyOverride(command, state) {
  if (state.appliedOverrides?.[command.id]) {
    return { status: "completed", note: "already applied" };
  }

  state.appliedOverrides ??= {};
  state.pausedTargets ??= {};

  if (command.action === "pause-lane") {
    state.pausedTargets[command.target] = { pausedAt: nowIso(), reason: command.reason };
    state.appliedOverrides[command.id] = nowIso();
    return { status: "completed", note: `paused ${command.target}` };
  }

  if (command.action === "kill-agent") {
    const result = systemctl("stop", command.target);
    if (result.status !== 0) {
      return { status: "failed", note: result.stderr || `systemctl stop exited ${result.status}` };
    }
    state.appliedOverrides[command.id] = nowIso();
    return { status: "completed", note: dryRun ? `dry-run stop ${unitName(command.target)}` : `stopped ${unitName(command.target)}` };
  }

  if (command.action === "force-rebaseline") {
    const rebaselineCommand = process.env.CHAPAI_REBASELINE_COMMAND ?? "python3 scripts/export_guild_snapshot.py";
    const result = runCommand("bash", ["-lc", rebaselineCommand]);
    if (result.status !== 0) {
      return { status: "failed", note: result.stderr || `rebaseline exited ${result.status}` };
    }
    state.appliedOverrides[command.id] = nowIso();
    return { status: "completed", note: dryRun ? `dry-run ${rebaselineCommand}` : "guild snapshot re-baselined" };
  }

  if (command.action === "drain-queue") {
    appendQueueIntent("queue-drain-requests.jsonl", {
      target: command.target,
      reason: command.reason,
      commandId: command.id,
    });
    state.appliedOverrides[command.id] = nowIso();
    return { status: "completed", note: `drain request emitted for ${command.target}` };
  }

  if (command.action === "rollback-memory") {
    appendQueueIntent("memory-steward-queue.jsonl", {
      action: "rollback-memory",
      target: command.target,
      reason: command.reason,
      commandId: command.id,
    });
    state.appliedOverrides[command.id] = nowIso();
    return { status: "acknowledged", note: `Memory-Steward rollback request emitted for ${command.target}` };
  }

  return { status: "failed", note: `unsupported action ${command.action}` };
}

async function sweep() {
  const registry = readJson(path.join(configDir, "employee-registry.json"), { employees: [] });
  const heartbeatFile = readJson(path.join(configDir, "agent-heartbeats.json"), { agents: [] });
  const heartbeatMap = new Map((heartbeatFile.agents ?? []).map((agent) => [agent.id, agent]));
  const overrides = readJson(overridesPath, { updatedAt: null, commands: [] });
  const state = readJson(statePath, { agents: {}, pausedTargets: {}, appliedOverrides: {}, updatedAt: null });
  const actions = [];
  const alerts = [];

  for (const command of overrides.commands ?? []) {
    if (command.status !== "queued") continue;
    const result = applyOverride(command, state);
    updateOverrideStatus(overrides, command, result.status, result.note);
    actions.push({ type: "override", commandId: command.id, action: command.action, target: command.target, ...result });
  }

  for (const employee of registry.employees ?? []) {
    const heartbeat = heartbeatMap.get(employee.heartbeatId ?? employee.id);
    const agentId = employee.id;
    const source = heartbeat?.source ?? "missing";
    const supervisable = strict || (heartbeat && !["brain-only", "employee-loader"].includes(source));
    const age = ageSeconds(heartbeat?.lastSeenAt);
    const staleAfterSeconds = Math.max(90, Math.round((heartbeat?.staleAfterMinutes ?? 1.5) * 60));
    const missedPings = age === null ? null : Math.floor(age / 30);
    const stale = age === null || age > staleAfterSeconds || (missedPings !== null && missedPings >= 3);
    const paused = Boolean(state.pausedTargets?.[agentId] || state.pausedTargets?.[employee.role]);

    state.agents[agentId] ??= { failures: 0, lastRestartAt: null, nextRestartAfter: null, lastStatus: "unknown" };
    const agentState = state.agents[agentId];

    if (!supervisable) {
      agentState.lastStatus = "not-supervised";
      continue;
    }

    if (!stale || paused) {
      agentState.lastStatus = paused ? "paused" : "healthy";
      if (!stale) {
        agentState.failures = 0;
        agentState.nextRestartAfter = null;
      }
      continue;
    }

    const backoffReady = !agentState.nextRestartAfter || Date.parse(agentState.nextRestartAfter) <= Date.now();
    if (!backoffReady) {
      agentState.lastStatus = "backoff";
      continue;
    }

    const result = systemctl("restart", agentId);
    const success = result.status === 0;
    agentState.failures = success ? agentState.failures + 1 : agentState.failures + 1;
    agentState.lastRestartAt = nowIso();
    const delaySeconds = Math.min(900, Math.max(30, 2 ** Math.min(agentState.failures, 5) * 30));
    agentState.nextRestartAfter = new Date(Date.now() + delaySeconds * 1000).toISOString();
    agentState.lastStatus = success ? "restarted" : "restart-failed";

    const action = {
      type: "restart",
      agentId,
      unit: unitName(agentId),
      ageSeconds: age,
      missedPings,
      status: dryRun ? "planned" : success ? "completed" : "failed",
      note: dryRun
        ? "dry-run restart after missing 3 heartbeat intervals"
        : success
          ? "restart issued after missing 3 heartbeat intervals"
          : result.stderr || `systemctl exited ${result.status}`,
    };
    actions.push(action);
    alerts.push(await sendAlert(`ChapAI watchdog ${action.status}: ${agentId} ${action.note}`, action));
  }

  state.updatedAt = nowIso();
  if (!dryRun) {
    writeJson(statePath, state);
    writeJson(overridesPath, overrides);
  }

  return {
    ok: true,
    dryRun,
    strict,
    generatedAt: nowIso(),
    agents: (registry.employees ?? []).length,
    heartbeatCount: (heartbeatFile.agents ?? []).length,
    actions,
    alerts,
  };
}

async function main() {
  do {
    const result = await sweep();
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (once) break;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  } while (true);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
