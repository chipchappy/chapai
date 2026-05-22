#!/usr/bin/env node
/**
 * Hermes router — the messenger between the Claude and Codex lanes.
 *
 * Hermes does NOT run a model of its own. It reads routing requests from
 * config/hermes-queue.json and relays each one into the queue of the lane that
 * actually holds the subscription-authed model:
 *   • route "claude" → config/claude-employee-queue.json   (Claude Code, subscription OAuth)
 *   • route "codex"  → config/<codexAgent>-queue.json      (Codex CLI, ChatGPT session)
 *
 * This lets every agent "communicate" through one bus: drop a message on the
 * Hermes queue addressed to claude or codex, and Hermes delivers it.
 *
 * SAFETY: this script is invoked by run-hermes-router.ps1, which is gated by the
 * gaming-mode sentinel — so while the swarm is halted, Hermes never runs. Even if
 * run directly, it only moves queue entries; it never edits app/site files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const chapaiRoot = path.resolve(here, "..", "..");
const configDir = path.join(chapaiRoot, "config");

const HERMES_QUEUE = path.join(configDir, "hermes-queue.json");
const HERMES_STATE = path.join(configDir, "hermes-state.json");
const CLAUDE_QUEUE = path.join(configDir, "claude-employee-queue.json");

// Default codex lane that receives codex-routed work when a task omits codexAgent.
const DEFAULT_CODEX_AGENT = "orchestrator";
const VALID_CODEX_AGENTS = new Set(["orchestrator", "frontend", "backend", "content", "manager"]);

function nowIso() {
  return new Date().toISOString();
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

/** Infer a route when a task didn't specify one. Design/review → claude; build/code → codex. */
function inferRoute(task) {
  if (task.route === "claude" || task.route === "codex") return task.route;
  const hint = `${task.kind ?? ""} ${task.title ?? ""}`.toLowerCase();
  if (/(design|review|audit|copy|rationale|critique|ux)/.test(hint)) return "claude";
  return "codex";
}

function codexQueueFor(task) {
  const agent = VALID_CODEX_AGENTS.has(task.codexAgent) ? task.codexAgent : DEFAULT_CODEX_AGENT;
  return { agent, file: path.join(configDir, `${agent}-queue.json`) };
}

function deliver(targetFile, normalizedTask) {
  const target = readJson(targetFile, { tasks: [] });
  if (!Array.isArray(target.tasks)) target.tasks = [];
  target.tasks.push(normalizedTask);
  writeJson(targetFile, target);
}

function main() {
  const queue = readJson(HERMES_QUEUE, { tasks: [] });
  const tasks = Array.isArray(queue.tasks) ? queue.tasks : [];
  const state = readJson(HERMES_STATE, { routedTotal: 0, lastRunAt: null, runs: 0 });

  let routedThisRun = 0;

  for (const task of tasks) {
    if (task.status && task.status !== "pending") continue;

    const route = inferRoute(task);
    const targetTaskId = `hermes-${task.id ?? Math.random().toString(36).slice(2)}-${Date.now()}`;
    const normalized = {
      id: targetTaskId,
      title: task.title ?? "Hermes-routed task",
      goal: task.goal ?? task.title ?? "",
      prompt: task.prompt ?? "",
      kind: task.kind ?? "hermes-routed",
      status: "pending",
      priority: typeof task.priority === "number" ? task.priority : 0,
      readOnly: task.readOnly === true,
      maxBudgetUsd: typeof task.maxBudgetUsd === "number" ? task.maxBudgetUsd : 1.0,
      contextFiles: Array.isArray(task.contextFiles) ? task.contextFiles : [],
      routedBy: "hermes",
      routedFrom: task.from ?? "hermes-queue",
      createdAt: nowIso(),
    };

    let routedTo;
    if (route === "claude") {
      deliver(CLAUDE_QUEUE, normalized);
      routedTo = "claude";
    } else {
      const { agent, file } = codexQueueFor(task);
      deliver(file, normalized);
      routedTo = `codex:${agent}`;
    }

    task.status = "routed";
    task.routedTo = routedTo;
    task.routedAt = nowIso();
    task.targetTaskId = targetTaskId;
    routedThisRun += 1;
  }

  writeJson(HERMES_QUEUE, { ...queue, tasks });
  writeJson(HERMES_STATE, {
    routedTotal: (state.routedTotal ?? 0) + routedThisRun,
    routedThisRun,
    runs: (state.runs ?? 0) + 1,
    lastRunAt: nowIso(),
  });

  console.log(`[hermes-router] routed ${routedThisRun} message(s).`);
}

main();
