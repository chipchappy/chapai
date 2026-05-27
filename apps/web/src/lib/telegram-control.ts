import "server-only";

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const schemaVersion = "chapai.connector.event.v1";

export const telegramSupportedCommands = [
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
  "/profit",
  "/learned",
  "/approvals",
  "/status",
] as const;

export type TelegramCommandAction =
  | "create-goal"
  | "list-goals"
  | "pause-lane"
  | "resume-lane"
  | "approve-outbound"
  | "reject-outbound"
  | "agent-reply"
  | "brain-dump"
  | "kill-agent"
  | "profit-radar"
  | "learning-digest"
  | "list-approvals"
  | "swarm-status"
  | "reject-command";

export type TelegramParsedCommand = {
  ok: boolean;
  command: string;
  action: TelegramCommandAction;
  payload: Record<string, string>;
  intent: string | null;
  replyOnly: boolean;
  requiresApproval: boolean;
  requiresConfirmation: boolean;
  reason?: string;
};

export type TelegramControlMessage = {
  text: string;
  messageId: string;
  chatId: string;
  userId: string;
  thread?: string;
  receivedAt?: string;
  runId?: string;
};

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
  for (let index = 0; index < 6; index += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) return current;
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return process.cwd();
}

function sha(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableHash(value: string) {
  return sha(value).slice(0, 16);
}

function normalizePath(filePath: string) {
  return filePath.split(path.sep).join("/");
}

function connectorRoot() {
  return path.join(workspaceRoot(), "connectors", "telegram");
}

function appendJsonl(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function event(eventType: string, payload: Record<string, unknown>, options: {
  runId: string;
  observedAt?: string;
  taint?: string;
  allowedUses?: string[];
}) {
  const emittedAt = new Date().toISOString();
  return {
    event_id: sha(`telegram:${eventType}:${options.runId}:${JSON.stringify(payload)}`),
    schema_version: schemaVersion,
    source: "telegram",
    event_type: eventType,
    emitted_at: emittedAt,
    observed_at: options.observedAt ?? emittedAt,
    connector_run_id: options.runId,
    taint: options.taint ?? "operator_text",
    allowed_uses: options.allowedUses ?? ["dashboard", "audit", "operator-control"],
    provenance: {
      tool: "apps/web/src/lib/telegram-control.ts",
      cwd: normalizePath(path.relative(workspaceRoot(), process.cwd()) || "."),
      host_hash: stableHash(os.hostname()),
      platform: os.platform(),
    },
    payload,
  };
}

function splitCommand(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/^(\S+)(?:\s+([\s\S]*))?$/);
  if (!match) return { command: "", args: "" };
  return {
    command: match[1].split("@")[0].toLowerCase(),
    args: (match[2] ?? "").trim(),
  };
}

export function parseTelegramCommand(text: string): TelegramParsedCommand {
  const { command, args } = splitCommand(text);
  const parts = args.split(/\s+/).filter(Boolean);
  const restAfterFirst = args.slice(parts[0]?.length ?? 0).trim();

  if (!command.startsWith("/")) {
    return invalid("not-command", "Telegram control messages must start with a slash command.");
  }
  if (!telegramSupportedCommands.includes(command as (typeof telegramSupportedCommands)[number])) {
    return invalid(command, `Unsupported command. Supported: ${telegramSupportedCommands.join(", ")}.`);
  }

  switch (command) {
    case "/goal":
      return args ? ok(command, "create-goal", { text: args }, { intent: "goal" }) : invalid(command, "Goal text is required.");
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
      return parts[0] ? ok(command, "approve-outbound", { messageId: parts[0] }, { intent: "approval-decision" }) : invalid(command, "Approval message id is required.");
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
      return parts[0] ? ok(command, "brain-dump", { agentId: parts[0] }, { replyOnly: true }) : invalid(command, "Brain target agent is required.");
    case "/kill":
      return parts[0] ? ok(command, "kill-agent", { target: parts[0] }, { intent: "ops-override", requiresConfirmation: true }) : invalid(command, "Kill target agent is required.");
    case "/profit":
      return ok(command, "profit-radar", {}, { replyOnly: true });
    case "/learned":
      return ok(command, "learning-digest", {}, { replyOnly: true });
    case "/approvals":
      return ok(command, "list-approvals", {}, { replyOnly: true });
    case "/status":
      return ok(command, "swarm-status", {}, { replyOnly: true });
    default:
      return invalid(command, "Unhandled command.");
  }
}

function ok(command: string, action: TelegramCommandAction, payload: Record<string, string>, options: {
  intent?: string;
  replyOnly?: boolean;
  requiresApproval?: boolean;
  requiresConfirmation?: boolean;
} = {}): TelegramParsedCommand {
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

function invalid(command: string, reason: string): TelegramParsedCommand {
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

function replyFor(parsed: TelegramParsedCommand) {
  if (!parsed.ok) return `Command rejected: ${parsed.reason}`;
  if (parsed.requiresConfirmation) return `${parsed.command} queued for confirmation; no destructive action was taken.`;
  if (parsed.requiresApproval) return `${parsed.command} queued for operator approval before any outbound action.`;
  if (parsed.action === "list-goals") return "/goals accepted; current goal directive summary queued.";
  if (parsed.action === "profit-radar") return "/profit accepted; profit radar summary queued.";
  if (parsed.action === "learning-digest") return "/learned accepted; learning and skill growth summary queued.";
  if (parsed.action === "list-approvals") return "/approvals accepted; approval queue summary queued.";
  if (parsed.intent) return `${parsed.command} accepted as ${parsed.action}; intent recorded.`;
  return `${parsed.command} accepted; dashboard response queued.`;
}

function buildGoalDirective(text: string, createdAt: string) {
  return {
    schemaVersion: "chapai.goal-directive.v1",
    id: `goal-${stableHash(text)}`,
    createdAt,
    updatedAt: createdAt,
    source: "telegram",
    sourcePath: "connectors/telegram/control_intent.jsonl",
    text,
    owner: "orchestrator",
    status: "active",
    linkedLanes: [
      "manager",
      "growth-orchestrator",
      "scout",
      "social-studio",
      "outreach-email",
      "content",
      "mobile-product",
    ],
    successSignals: [
      "Every lane has a truthful live/stale/sleeping state.",
      "Every learning claim has proof and a promotion status.",
      "Every external tool action has an approval state.",
      "Every profit idea includes cost, risk, confidence, and next test.",
    ],
    approvalBoundary: "watch-enrich-draft-stage-approve",
    proofPaths: [
      "reports/agentic-progress-2026-05-13.md",
      "config/agent-invocation-ledger.jsonl",
      "config/profit-pattern-candidates.jsonl",
    ],
    progress: {
      state: "recorded",
      percent: 10,
      detail: "Goal directive is durable; progress is proven by invocation, learning, tool-permission, and profit-pattern ledgers.",
    },
  };
}

export function appendTelegramControlMessage(message: TelegramControlMessage) {
  const root = connectorRoot();
  const runId = message.runId ?? `telegram-webhook-${new Date().toISOString().slice(0, 10)}`;
  const parsed = parseTelegramCommand(message.text);
  const basePayload = {
    message_id: message.messageId,
    chat_id_hash: stableHash(message.chatId),
    user_id_hash: stableHash(message.userId),
    thread: message.thread ?? "orchestrator",
  };
  const messageEvent = event("message_received", {
    ...basePayload,
    text_sha256: sha(message.text),
    text_preview: message.text.slice(0, 120),
  }, { runId, observedAt: message.receivedAt });
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
  }, { runId, observedAt: message.receivedAt });
  const outboundEvent = event("outbound_queued", {
    ...basePayload,
    channel: "telegram",
    delivery_status: "queued_only",
    approval_required: false,
    text: replyFor(parsed),
  }, { runId, taint: "system_generated" });

  appendJsonl(path.join(root, "message_received.jsonl"), messageEvent);
  appendJsonl(path.join(root, "command_received.jsonl"), commandEvent);
  appendJsonl(path.join(root, "outbound_queued.jsonl"), outboundEvent);

  let intentEvent: ConnectorEvent | null = null;
  let goalEvent: ConnectorEvent | null = null;
  if (parsed.intent) {
    intentEvent = event("control_intent", {
      ...basePayload,
      command: parsed.command,
      action: parsed.action,
      intent: parsed.intent,
      status: parsed.requiresConfirmation ? "confirmation_required" : "queued",
      payload: parsed.payload,
    }, { runId });
    appendJsonl(path.join(root, "control_intent.jsonl"), intentEvent);
  }
  if (parsed.ok && parsed.action === "create-goal" && parsed.payload.text) {
    const goal = buildGoalDirective(parsed.payload.text, new Date().toISOString());
    goalEvent = event("goal_directive", {
      ...basePayload,
      goal,
    }, {
      runId,
      allowedUses: ["dashboard", "audit", "operator-control", "agent-planning"],
    });
    appendJsonl(path.join(root, "goal_directive.jsonl"), goalEvent);
  }

  const summary = getTelegramControlSummary();
  writeJson(path.join(root, "control-state.json"), summary);
  return { parsed, events: [messageEvent, commandEvent, outboundEvent, intentEvent, goalEvent].filter(Boolean) };
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

function telegramFiles() {
  const root = connectorRoot();
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .filter((file) => file.endsWith(".jsonl"))
    .map((file) => path.join(root, file));
}

export function getTelegramControlSummary() {
  const files = telegramFiles();
  const rows = files.flatMap((filePath) => readJsonl(filePath).map((row) => ({ ...row, filePath })));
  const valid = rows.filter((row) => row.event?.schema_version === schemaVersion && row.event.source === "telegram");
  const commands = valid.filter((row) => row.event?.event_type === "command_received").map((row) => row.event as ConnectorEvent);
  const intents = valid.filter((row) => row.event?.event_type === "control_intent").map((row) => row.event as ConnectorEvent);
  const outbound = valid.filter((row) => row.event?.event_type === "outbound_queued").map((row) => row.event as ConnectorEvent);
  const goalEvents = valid.filter((row) => row.event?.event_type === "goal_directive").map((row) => row.event as ConnectorEvent);
  const byCommand = commands.reduce<Record<string, number>>((accumulator, command) => {
    const key = String(command.payload?.command ?? "unknown");
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    health: valid.length > 0 ? "live" : "missing",
    files: files.length,
    events: valid.length,
    commands: commands.length,
    acceptedCommands: commands.filter((item) => item.payload?.ok).length,
    rejectedCommands: commands.filter((item) => !item.payload?.ok).length,
    outboundQueued: outbound.length,
    controlIntents: intents.length,
    goalDirectives: goalEvents.length,
    latestGoalDirective: goalEvents
      .sort((left, right) => Date.parse(String(right.emitted_at ?? "")) - Date.parse(String(left.emitted_at ?? "")))
      .map((item) => item.payload?.goal)
      .find(Boolean) ?? null,
    pendingApproval: intents.filter((item) => item.payload?.intent === "approval-decision" || item.payload?.intent === "agent-instruction").length,
    confirmationRequired: intents.filter((item) => item.payload?.status === "confirmation_required").length,
    supportedCommands: [...telegramSupportedCommands],
    byCommand,
    latest: valid
      .sort((left, right) => Date.parse(right.event?.emitted_at ?? "") - Date.parse(left.event?.emitted_at ?? ""))
      .slice(0, 10)
      .map((row) => ({
        eventId: row.event?.event_id ?? "unknown",
        type: row.event?.event_type ?? "unknown",
        at: row.event?.emitted_at ?? null,
        command: row.event?.payload?.command ?? null,
        action: row.event?.payload?.action ?? null,
        status: row.event?.payload?.status ?? row.event?.payload?.delivery_status ?? null,
      })),
  };
}
