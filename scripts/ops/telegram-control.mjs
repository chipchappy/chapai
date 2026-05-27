#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const schemaVersion = "chapai.connector.event.v1";
const runId = String(args.get("run-id") ?? `phase5-${new Date().toISOString().replace(/[:.]/g, "-")}`);
const validateOnly = args.has("validate");
const dryRun = args.has("dry-run");
const reset = args.has("reset");
const supportedCommands = [
  "/goal",
  "/goals",
  "/pause",
  "/resume",
  "/approve",
  "/reject",
  "/deny",
  "/reply",
  "/brain",
  "/kill",
  "/status",
];

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
const connectorRoot = path.join(root, "connectors", "telegram");
const statePath = path.join(connectorRoot, "control-state.json");

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function sha(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function stableHash(value) {
  return sha(value).slice(0, 16);
}

function nowIso() {
  return new Date().toISOString();
}

function appendJsonl(filePath, value) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function writeJson(filePath, value) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function event(eventType, payload, options = {}) {
  const emittedAt = nowIso();
  return {
    event_id: sha(`telegram:${eventType}:${runId}:${JSON.stringify(payload)}`),
    schema_version: schemaVersion,
    source: "telegram",
    event_type: eventType,
    emitted_at: emittedAt,
    observed_at: options.observedAt ?? emittedAt,
    connector_run_id: runId,
    taint: options.taint ?? "operator_text",
    allowed_uses: options.allowedUses ?? ["dashboard", "audit", "operator-control"],
    provenance: {
      tool: "scripts/ops/telegram-control.mjs",
      cwd: normalizePath(path.relative(root, process.cwd()) || "."),
      host_hash: stableHash(os.hostname()),
      platform: os.platform(),
    },
    payload,
  };
}

function sanitizeIdentifier(value) {
  if (value === undefined || value === null || value === "") return null;
  return stableHash(value);
}

function splitCommand(text) {
  const trimmed = String(text ?? "").trim();
  const match = trimmed.match(/^(\S+)(?:\s+([\s\S]*))?$/);
  if (!match) return { command: "", args: "" };
  const command = match[1].split("@")[0].toLowerCase();
  return { command, args: (match[2] ?? "").trim() };
}

function parseCommand(text) {
  const { command, args } = splitCommand(text);
  const parts = args.split(/\s+/).filter(Boolean);
  const restAfterFirst = args.slice(parts[0]?.length ?? 0).trim();

  if (!command.startsWith("/")) {
    return invalid("not-command", "Telegram control messages must start with a slash command.");
  }
  if (!supportedCommands.includes(command)) {
    return invalid(command, `Unsupported command. Supported: ${supportedCommands.join(", ")}.`);
  }

  switch (command) {
    case "/goal":
      return args
        ? ok(command, "create-goal", { text: args }, { intent: "goal" })
        : invalid(command, "Goal text is required.");
    case "/goals":
      return ok(command, "list-goals", {}, { replyOnly: true });
    case "/pause":
      return parts[0]
        ? ok(command, "pause-lane", { target: parts[0], reason: restAfterFirst || "Telegram operator pause." }, { intent: "ops-override" })
        : invalid(command, "Pause target is required.");
    case "/resume":
      return parts[0]
        ? ok(command, "resume-lane", { target: parts[0], reason: restAfterFirst || "Telegram operator resume." }, { intent: "ops-intent" })
        : invalid(command, "Resume target is required.");
    case "/approve":
      return parts[0]
        ? ok(command, "approve-outbound", { messageId: parts[0] }, { intent: "approval-decision" })
        : invalid(command, "Approval message id is required.");
    case "/reject":
    case "/deny":
      return parts[0]
        ? ok(command, "reject-outbound", { messageId: parts[0], reason: restAfterFirst || "Rejected by Telegram operator." }, { intent: "approval-decision" })
        : invalid(command, "Rejected message id is required.");
    case "/reply":
      return parts[0] && restAfterFirst
        ? ok(command, "agent-reply", { agentId: parts[0], text: restAfterFirst }, { intent: "agent-instruction", requiresApproval: true })
        : invalid(command, "Reply requires an agent id and instruction text.");
    case "/brain":
      return parts[0]
        ? ok(command, "brain-dump", { agentId: parts[0] }, { replyOnly: true })
        : invalid(command, "Brain target agent is required.");
    case "/kill":
      return parts[0]
        ? ok(command, "kill-agent", { target: parts[0] }, { intent: "ops-override", requiresConfirmation: true })
        : invalid(command, "Kill target agent is required.");
    case "/status":
      return ok(command, "swarm-status", {}, { replyOnly: true });
    default:
      return invalid(command, "Unhandled command.");
  }
}

function ok(command, action, payload, options = {}) {
  return {
    ok: true,
    command,
    action,
    payload,
    intent: options.intent ?? null,
    replyOnly: Boolean(options.replyOnly),
    requiresApproval: Boolean(options.requiresApproval),
    requiresConfirmation: Boolean(options.requiresConfirmation),
  };
}

function invalid(command, reason) {
  return {
    ok: false,
    command,
    action: "reject-command",
    payload: {},
    intent: null,
    replyOnly: true,
    requiresApproval: false,
    requiresConfirmation: false,
    reason,
  };
}

function normalizeRecord(record, index) {
  const text = typeof record === "string" ? record : String(record.text ?? record.command ?? "");
  const observedAt = typeof record === "object" && record !== null && record.received_at ? String(record.received_at) : nowIso();
  const messageId = typeof record === "object" && record !== null && record.message_id ? String(record.message_id) : `local-${index + 1}`;
  const chatId = typeof record === "object" && record !== null && record.chat_id ? String(record.chat_id) : "local-operator-chat";
  const userId = typeof record === "object" && record !== null && record.user_id ? String(record.user_id) : "local-operator";
  const thread = typeof record === "object" && record !== null && record.thread ? String(record.thread) : "orchestrator";
  return {
    text: text.trim(),
    observedAt,
    messageId,
    chatIdHash: sanitizeIdentifier(chatId),
    userIdHash: sanitizeIdentifier(userId),
    thread,
  };
}

function readInputRecords() {
  if (args.has("command")) {
    return [{ text: String(args.get("command")), message_id: "cli-command", chat_id: "local-operator-chat", user_id: "local-operator" }];
  }
  const input = args.get("input");
  if (!input) return [];
  const inputPath = path.resolve(root, String(input));
  return fs.readFileSync(inputPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function replyFor(parsed) {
  if (!parsed.ok) return `Command rejected: ${parsed.reason}`;
  if (parsed.requiresConfirmation) return `${parsed.command} queued for confirmation; no destructive action was taken.`;
  if (parsed.requiresApproval) return `${parsed.command} queued for operator approval before any outbound action.`;
  if (parsed.intent) return `${parsed.command} accepted as ${parsed.action}; intent recorded.`;
  return `${parsed.command} accepted; dashboard response queued.`;
}

function clearTelegramStreams() {
  if (!reset || dryRun || !fs.existsSync(connectorRoot)) return;
  for (const file of fs.readdirSync(connectorRoot)) {
    if (file.endsWith(".jsonl") || file === "control-state.json") {
      fs.rmSync(path.join(connectorRoot, file), { force: true });
    }
  }
}

function handleRecords(records) {
  clearTelegramStreams();
  const written = [];
  records.forEach((record, index) => {
    const normalized = normalizeRecord(record, index);
    const parsed = parseCommand(normalized.text);
    const basePayload = {
      message_id: normalized.messageId,
      chat_id_hash: normalized.chatIdHash,
      user_id_hash: normalized.userIdHash,
      thread: normalized.thread,
    };
    const messageEvent = event("message_received", {
      ...basePayload,
      text_sha256: sha(normalized.text),
      text_preview: normalized.text.slice(0, 120),
    }, { observedAt: normalized.observedAt });
    const commandEvent = event("command_received", {
      ...basePayload,
      command: parsed.command,
      action: parsed.action,
      ok: parsed.ok,
      reason: parsed.ok ? null : parsed.reason,
      requires_approval: parsed.requiresApproval,
      requires_confirmation: parsed.requiresConfirmation,
      intent: parsed.intent,
      command_payload: parsed.payload,
    }, { observedAt: normalized.observedAt });
    const outboundEvent = event("outbound_queued", {
      ...basePayload,
      channel: "telegram",
      delivery_status: "queued_only",
      approval_required: false,
      text: replyFor(parsed),
    }, { taint: "system_generated" });

    appendJsonl(path.join(connectorRoot, "message_received.jsonl"), messageEvent);
    appendJsonl(path.join(connectorRoot, "command_received.jsonl"), commandEvent);
    appendJsonl(path.join(connectorRoot, "outbound_queued.jsonl"), outboundEvent);
    written.push(messageEvent, commandEvent, outboundEvent);

    if (parsed.intent) {
      const intentEvent = event("control_intent", {
        ...basePayload,
        command: parsed.command,
        action: parsed.action,
        intent: parsed.intent,
        status: parsed.requiresConfirmation ? "confirmation_required" : "queued",
        payload: parsed.payload,
      });
      appendJsonl(path.join(connectorRoot, "control_intent.jsonl"), intentEvent);
      written.push(intentEvent);
    }
  });
  const summary = summarizeTelegramStreams();
  writeJson(statePath, summary);
  return { written, summary };
}

function readJsonl(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
      .filter((entry) => entry.line)
      .map((entry) => {
        try {
          return { lineNumber: entry.lineNumber, event: JSON.parse(entry.line) };
        } catch {
          return { lineNumber: entry.lineNumber, event: null };
        }
      });
  } catch {
    return [];
  }
}

function telegramFiles() {
  if (!fs.existsSync(connectorRoot)) return [];
  return fs.readdirSync(connectorRoot)
    .filter((file) => file.endsWith(".jsonl"))
    .map((file) => path.join(connectorRoot, file));
}

function validateStreams() {
  const failures = [];
  let files = 0;
  let events = 0;
  for (const filePath of telegramFiles()) {
    files += 1;
    for (const row of readJsonl(filePath)) {
      events += 1;
      const parsed = row.event;
      const relative = normalizePath(path.relative(root, filePath));
      if (!parsed) {
        failures.push(`${relative}:${row.lineNumber} invalid json`);
        continue;
      }
      for (const key of ["event_id", "schema_version", "source", "event_type", "emitted_at", "observed_at", "connector_run_id", "taint", "allowed_uses", "provenance", "payload"]) {
        if (parsed[key] === undefined) failures.push(`${relative}:${row.lineNumber} missing ${key}`);
      }
      if (parsed.schema_version !== schemaVersion) failures.push(`${relative}:${row.lineNumber} schema mismatch`);
      if (parsed.source !== "telegram") failures.push(`${relative}:${row.lineNumber} wrong source`);
      if (parsed.event_type === "command_received" && !parsed.payload?.command) failures.push(`${relative}:${row.lineNumber} missing command payload`);
    }
  }
  return { ok: failures.length === 0, files, events, failures };
}

function summarizeTelegramStreams() {
  const files = telegramFiles();
  const rows = files.flatMap((filePath) => readJsonl(filePath).map((row) => ({ ...row, filePath })));
  const valid = rows.filter((row) => row.event && row.event.schema_version === schemaVersion && row.event.source === "telegram");
  const commands = valid.filter((row) => row.event.event_type === "command_received").map((row) => row.event);
  const intents = valid.filter((row) => row.event.event_type === "control_intent").map((row) => row.event);
  const outbound = valid.filter((row) => row.event.event_type === "outbound_queued").map((row) => row.event);
  const byCommand = {};
  for (const command of commands) {
    const key = command.payload?.command ?? "unknown";
    byCommand[key] = (byCommand[key] ?? 0) + 1;
  }
  return {
    generatedAt: nowIso(),
    source: "telegram",
    files: files.length,
    events: valid.length,
    commands: commands.length,
    acceptedCommands: commands.filter((item) => item.payload?.ok).length,
    rejectedCommands: commands.filter((item) => !item.payload?.ok).length,
    outboundQueued: outbound.length,
    controlIntents: intents.length,
    pendingApproval: intents.filter((item) => item.payload?.intent === "approval-decision" || item.payload?.intent === "agent-instruction").length,
    confirmationRequired: intents.filter((item) => item.payload?.status === "confirmation_required").length,
    supportedCommands,
    byCommand,
    latest: valid
      .sort((left, right) => Date.parse(right.event.emitted_at) - Date.parse(left.event.emitted_at))
      .slice(0, 10)
      .map((row) => ({
        eventId: row.event.event_id,
        type: row.event.event_type,
        at: row.event.emitted_at,
        command: row.event.payload?.command ?? null,
        action: row.event.payload?.action ?? null,
        status: row.event.payload?.status ?? row.event.payload?.delivery_status ?? null,
      })),
  };
}

function writeProof(result) {
  const proof = args.get("proof");
  if (!proof) return;
  writeJson(path.resolve(root, String(proof)), result);
}

if (validateOnly) {
  const validation = validateStreams();
  const summary = summarizeTelegramStreams();
  const result = { ok: validation.ok, runId, validation, summary };
  writeProof(result);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(validation.ok ? 0 : 1);
}

const records = readInputRecords();
if (records.length === 0) {
  const result = { ok: false, runId, error: "No Telegram records supplied. Use --input=<jsonl> or --command=\"/status\"." };
  writeProof(result);
  process.stderr.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(1);
}

const { written, summary } = handleRecords(records);
const validation = dryRun ? { ok: true, files: 0, events: written.length, failures: [] } : validateStreams();
const result = {
  ok: validation.ok,
  dryRun,
  runId,
  inputRecords: records.length,
  eventsWritten: written.length,
  connectorRoot: normalizePath(path.relative(root, connectorRoot)),
  summary,
  validation,
};
writeProof(result);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exit(validation.ok ? 0 : 1);
