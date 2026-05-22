import type { AgentAvatar, AgentBrain } from "@chapai/brains";
import { getBoardroomState } from "@/lib/boardroom-control";
import { hasDatabase, resolveEnv, type Env } from "@/lib/db";
import { getLiveContentSummary } from "@/lib/live-content-summary";
import type { EmployeePresentationProfile, MissionControlSnapshot } from "@/lib/types";
import { UNIFIED_GUILD_STATE_SNAPSHOT } from "@/lib/unified-guild-state-snapshot";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

type LegacyTelemetryAgent = {
  id: string;
  nickname: string;
  role: string;
  state: string;
  progress: number;
  eta: string;
  current: string;
  latest: string;
  blocker: string;
};

type LegacyTelemetry = {
  agents?: LegacyTelemetryAgent[];
};

type TelemetryStatement = {
  first: <T = Record<string, unknown>>() => Promise<T | null>;
};

type TelemetryBinding = {
  prepare: (sql: string) => TelemetryStatement;
};

type GuildTelemetryRow = {
  payload: string | null;
  created_at: number | null;
};

type RevenueState = {
  checkoutStatus?: string;
  liveCutoverStatus?: string;
};

type RuntimeState = {
  active?: {
    route?: string;
    stage?: string;
    status?: string;
    startedAt?: string;
  } | null;
  lastRun?: {
    route?: string;
    status?: string;
    completedAt?: string;
    state?: string;
    blocker?: string;
    next?: string;
  };
  lastUpdatedAt?: string;
};

type OperatorInbox = {
  requests?: Array<{
    status?: string;
    text?: string;
  }>;
};

type NclexRefinementTopUpState = {
  generatedAt?: string;
  topUpNeeded?: boolean;
  approvedRefinedUsableUnique?: number;
  remainingTo5000?: number;
};

type ClaudeBridgeState = {
  enabled?: boolean;
  userConsented?: boolean;
  environmentId?: string;
  remoteSessionId?: string;
  localSessionId?: string;
};

type GuildLoopState = {
  lastUpdatedAt?: string;
  decision?: {
    ranWorkerCycle?: boolean;
    reason?: string;
  };
  latestPromoted?: {
    file?: string;
    ageMinutes?: number;
    lastWriteTime?: string;
  } | null;
  claudeEmployee?: {
    status?: string;
    blocker?: string;
    lastRunAt?: string;
    lastSuccessAt?: string;
  } | null;
};

type GuildRetrospectiveState = {
  generatedAt?: string;
  roomState?: string;
  wins?: string[];
  blockers?: string[];
  next?: string[];
};

type ClaudeEmployeeState = {
  status?: string;
  semanticStatus?: string;
  blocker?: string;
  lastRunAt?: string | null;
  lastSuccessAt?: string | null;
  lastHeartbeatAt?: string | null;
  staleAfterMinutes?: number;
  blockedUntil?: string | null;
  nextEligibleRunAt?: string | null;
  currentTask?: {
    id?: string;
    title?: string;
    kind?: string;
  } | null;
  queue?: {
    pending?: number;
    completed?: number;
    failed?: number;
  };
  auth?: {
    loggedIn?: boolean;
    authMethod?: string;
  };
  latestResult?: {
    taskId?: string;
    title?: string;
    summary?: string;
    suggestedHumanFix?: string;
    nextTask?: string;
    reportPath?: string;
  } | null;
};

type SocialStudioState = {
  status?: string;
  semanticStatus?: string;
  blocker?: string;
  lastRunAt?: string | null;
  lastSuccessAt?: string | null;
  lastHeartbeatAt?: string | null;
  staleAfterMinutes?: number;
  currentTask?: {
    id?: string;
    title?: string;
    kind?: string;
  } | null;
  queue?: {
    pending?: number;
    completed?: number;
    blocked?: number;
  };
  latestResult?: {
    taskId?: string;
    title?: string;
    summary?: string;
    suggestedHumanFix?: string;
    nextTask?: string;
    reportPath?: string;
  } | null;
};

type ManagerLaneState = {
  status?: string;
  semanticStatus?: string;
  blocker?: string;
  lastRunAt?: string | null;
  lastSuccessAt?: string | null;
  lastHeartbeatAt?: string | null;
  staleAfterMinutes?: number;
  currentTask?: {
    id?: string;
    title?: string;
    kind?: string;
  } | null;
  latestResult?: {
    title?: string;
    summary?: string;
    suggestedHumanFix?: string;
  } | null;
};

type ScoutLaneState = {
  status?: string;
  semanticStatus?: string;
  blocker?: string;
  lastRunAt?: string | null;
  lastSuccessAt?: string | null;
  lastHeartbeatAt?: string | null;
  staleAfterMinutes?: number;
  currentTask?: {
    id?: string;
    title?: string;
    kind?: string;
  } | null;
  latestResult?: {
    title?: string;
    summary?: string;
    suggestedHumanFix?: string;
  } | null;
};

type ContentEngineState = {
  status?: string;
  reason?: string;
  lastUpdatedAt?: string | null;
  latestPromoted?: {
    file?: string;
    ageMinutes?: number;
    lastWriteTime?: string;
  } | null;
  workerCycle?: {
    ok?: boolean;
    output?: string;
  } | null;
};

type AgentHeartbeatFile = {
  generatedAt?: string;
  agents?: Array<{
    id?: string;
    state?: string;
    current?: string;
    blocker?: string;
    latest?: string;
    lastSeenAt?: string;
    source?: string;
    staleAfterMinutes?: number;
  }>;
};

type GeneratedBatch = {
  batchId?: string;
  generatedAt?: string;
  validation?: {
    valid?: boolean;
  };
  examMix?: {
    ccrn?: number;
    nclex?: number;
  };
  questions?: unknown[];
};

type ServiceHealth = MissionControlSnapshot["liveServices"][number];
type UrgentFix = MissionControlSnapshot["urgentFixes"][number];

type AgentRegistryEntry = {
  id: string;
  nickname: string;
  role: string;
  runtime: string;
  avatar: AgentAvatar;
  goals?: string[];
  workflowContract?: string[];
  brainPath?: string;
  queuePath?: string;
  statePath?: string;
  heartbeatId?: string;
  presentation?: EmployeePresentationProfile;
};

type EmployeeRegistryFile = {
  employees?: AgentRegistryEntry[];
};

const DEFAULT_AGENT_REGISTRY: AgentRegistryEntry[] = [
  {
    id: "orchestrator",
    nickname: "Atlas",
    role: "Architecture",
    runtime: "codex",
    avatar: { key: "orchestrator", sigil: "AT", palette: ["#60787f", "#f6efe1", "#cfb06d"] },
  },
  {
    id: "frontend",
    nickname: "Turing",
    role: "Product Build",
    runtime: "codex",
    avatar: { key: "frontend", sigil: "TU", palette: ["#6c8d97", "#f5efe2", "#8ea884"] },
  },
  {
    id: "backend",
    nickname: "Kepler",
    role: "Backend",
    runtime: "codex",
    avatar: { key: "backend", sigil: "KE", palette: ["#68848d", "#f4ecdf", "#b99759"] },
  },
  {
    id: "content",
    nickname: "Hume",
    role: "Question System",
    runtime: "codex",
    avatar: { key: "content", sigil: "HU", palette: ["#7d8b6d", "#f6f0e5", "#c89a62"] },
  },
  {
    id: "manager",
    nickname: "Kuhn",
    role: "Manager",
    runtime: "codex",
    avatar: { key: "manager", sigil: "KU", palette: ["#7a7290", "#f6f1e8", "#b3a06b"] },
  },
  {
    id: "nemoclaw",
    nickname: "Nemoclaw",
    role: "Local Batch Worker",
    runtime: "nemotron",
    avatar: { key: "nemoclaw", sigil: "NM", palette: ["#567b74", "#eef1e6", "#d7b372"] },
  },
  {
    id: "claude-code",
    nickname: "Claude Code",
    role: "Design Review",
    runtime: "claude",
    avatar: { key: "claude-code", sigil: "CL", palette: ["#5e6c97", "#f0e8d6", "#c6b07a"] },
  },
  {
    id: "social-studio",
    nickname: "Mercury",
    role: "Growth Studio",
    runtime: "codex",
    avatar: { key: "social-studio", sigil: "ME", palette: ["#8b7556", "#f7f1e6", "#5e8791"] },
  },
  {
    id: "scout",
    nickname: "Aster",
    role: "Venture Scout",
    runtime: "codex",
    avatar: { key: "scout", sigil: "AS", palette: ["#6f7f96", "#f7f1e8", "#9aa784"] },
  },
];

function inferAvatar(agentId: string): AgentAvatar {
  return {
    key: agentId,
    sigil: agentId.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "AG",
    palette: ["#66737a", "#f5efe2", "#bda26c"],
  };
}

function inferPresentationProfile(entry: Pick<AgentRegistryEntry, "id" | "nickname" | "role" | "runtime">): EmployeePresentationProfile {
  const lowerRole = entry.role.toLowerCase();
  const runtimeLabel =
    entry.runtime === "nemotron"
      ? "cheap-batch lane"
      : entry.runtime === "claude"
        ? "premium critique lane"
        : entry.runtime === "gemini"
          ? "external audit lane"
          : "core build lane";

  const presentationTitle =
    entry.id === "manager"
      ? "chief of staff"
      : entry.id === "nemoclaw"
        ? "net-new batch pilot"
        : entry.id === "claude-code"
          ? "premium review partner"
          : lowerRole.includes("growth")
            ? "growth operator"
            : lowerRole.includes("product")
              ? "product builder"
              : "systems operator";

  return {
    presentationTitle,
    whatTheyDo: `${entry.nickname} owns ${entry.role.toLowerCase()} work and keeps the ${runtimeLabel} bounded.`,
    howTheyHelpTheBusinessGrow: `${entry.nickname} converts high-signal work into cleaner shipping velocity, better study surfaces, and fewer blocked lanes.`,
    howTheyGrowThemselves: `${entry.nickname} grows by promoting reusable heuristics, pruning noisy context, and staying scoped to one useful lane at a time.`,
    offHours:
      entry.id === "nemoclaw"
        ? "curates low-token batch heuristics and compares duplicate fingerprints"
        : entry.id === "claude-code"
          ? "collects premium UI critiques and tighter language patterns"
          : entry.id === "manager"
            ? "compresses status, trims blockers, and rewrites messy plans into clean queues"
            : "archives patterns, sharpens prompts, and tidies the lane for the next shift",
    presentationVoice:
      entry.runtime === "claude"
        ? "measured and editorial"
        : entry.runtime === "gemini"
          ? "strategic and audit-minded"
          : entry.runtime === "nemotron"
            ? "fast and practical"
            : "steady and builder-focused",
  };
}

function loadEmployeeRegistry(
  workspaceRoot: string,
  brains: ReturnType<typeof loadBrains>["brains"],
) {
  const registryPath = path.join(workspaceRoot, "config", "employee-registry.json");
  const registryFile = safeReadJson<EmployeeRegistryFile>(registryPath, {});
  const merged = new Map<string, AgentRegistryEntry>();

  for (const entry of DEFAULT_AGENT_REGISTRY) {
    merged.set(entry.id, entry);
  }

  for (const entry of registryFile.employees ?? []) {
    if (!entry?.id) {
      continue;
    }

    const existing = merged.get(entry.id);
    merged.set(entry.id, {
      ...(existing ?? {
        id: entry.id,
        nickname: entry.nickname ?? entry.id,
        role: entry.role ?? "Employee",
        runtime: entry.runtime ?? "codex",
        avatar: entry.avatar ?? inferAvatar(entry.id),
      }),
      ...entry,
      avatar: entry.avatar ?? existing?.avatar ?? inferAvatar(entry.id),
      presentation:
        entry.presentation
        ?? existing?.presentation
        ?? inferPresentationProfile({
          id: entry.id,
          nickname: entry.nickname ?? existing?.nickname ?? entry.id,
          role: entry.role ?? existing?.role ?? "Employee",
          runtime: entry.runtime ?? existing?.runtime ?? "codex",
        }),
    });
  }

  for (const brain of brains) {
    if (merged.has(brain.agentId)) {
      continue;
    }

    merged.set(brain.agentId, {
      id: brain.agentId,
      nickname: brain.displayName,
      role: brain.role,
      runtime: brain.runtime,
      avatar: brain.avatar,
      goals: brain.goals,
      workflowContract: brain.workflowContract,
      brainPath: path.join(workspaceRoot, "brains", "agents", `${brain.agentId}.json`),
      queuePath: path.join(workspaceRoot, "config", `${brain.agentId}-queue.json`),
      statePath: path.join(workspaceRoot, "config", `${brain.agentId}-state.json`),
      heartbeatId: brain.agentId,
      presentation: inferPresentationProfile({
        id: brain.agentId,
        nickname: brain.displayName,
        role: brain.role,
        runtime: brain.runtime,
      }),
    });
  }

  return Array.from(merged.values()).sort((left, right) => left.nickname.localeCompare(right.nickname));
}

function safeReadJson<T>(filePath: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function resolveWorkspaceRoot() {
  let current = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    const candidate = path.join(current, "brains");
    const legacy = path.join(current, "..", "ccrn-agent");
    if (fs.existsSync(candidate) || fs.existsSync(legacy)) {
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

function resolveLegacyRoot(workspaceRoot: string) {
  const sibling = path.join(path.dirname(workspaceRoot), "ccrn-agent");
  return fs.existsSync(sibling) ? sibling : path.join(workspaceRoot, "..", "ccrn-agent");
}

function parseIsoAge(iso?: string | null) {
  if (!iso) {
    return null;
  }
  const time = Date.parse(iso);
  if (Number.isNaN(time)) {
    return null;
  }
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
  return minutes;
}

function formatAge(minutes: number | null) {
  if (minutes === null) {
    return "unknown";
  }
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

function isRuntimeFileStale(args: {
  freshnessMinutes?: number | null;
  staleAfterMinutes?: number | null;
  rawState?: string | null;
}) {
  const rawState = normalizeStatusText(args.rawState).toLowerCase();
  const staleAfterMinutes = args.staleAfterMinutes ?? 45;
  if (rawState.includes("stale")) {
    return true;
  }
  if (args.freshnessMinutes === null || args.freshnessMinutes === undefined) {
    return rawState.includes("live") || rawState.includes("run") || rawState.includes("work");
  }
  return args.freshnessMinutes > staleAfterMinutes;
}

function normalizeStatusText(value?: string | null) {
  if (!value) {
    return "none";
  }
  return value
    .replace(/Â·/g, "·")
    .replace(/â€”/g, "—")
    .replace(/âˆ’/g, "−")
    .trim();
}

function deriveBlockerSeverity(blocker: string) {
  const lower = blocker.toLowerCase();
  if (lower === "none" || lower === "clear") {
    return "info" as const;
  }
  if (lower.includes("limit") || lower.includes("auth") || lower.includes("offline") || lower.includes("stale")) {
    return "warning" as const;
  }
  return "critical" as const;
}

function deriveOperatingState(args: {
  rawState?: string | null;
  blocker?: string | null;
  truthLevel: MissionControlSnapshot["agents"][number]["truthLevel"];
  freshnessMinutes?: number | null;
  staleAfterMinutes?: number | null;
  current?: string | null;
}) {
  const rawState = normalizeStatusText(args.rawState).toLowerCase();
  const blocker = normalizeStatusText(args.blocker).toLowerCase();
  const current = normalizeStatusText(args.current).toLowerCase();

  if (args.truthLevel === "stale-telemetry" || args.truthLevel === "presentation-only" || args.truthLevel === "unwired" || rawState.includes("stale")) {
    return "stale" as const;
  }

  if (isRuntimeFileStale({
    freshnessMinutes: args.freshnessMinutes,
    staleAfterMinutes: args.staleAfterMinutes,
    rawState: args.rawState,
  })) {
    return "stale" as const;
  }

  if (rawState.includes("sleep") || rawState.includes("idle") || rawState.includes("brain-linked") || rawState.includes("ready")) {
    return "sleeping" as const;
  }

  if (blocker !== "none") {
    if (blocker.includes("reset") || blocker.includes("waiting") || blocker.includes("wake") || current.includes("next retry")) {
      return "sleeping" as const;
    }
    return "blocked" as const;
  }

  if (rawState.includes("run") || rawState.includes("live") || rawState.includes("work")) {
    return "live" as const;
  }

  if ((args.freshnessMinutes ?? 999) <= 15) {
    return "sleeping" as const;
  }

  return "stale" as const;
}

function deriveEmployeeHealth(args: {
  freshnessMinutes: number | null;
  blocker: string;
  activeContext: string[];
  durableCount: number;
  memoryEventCount: number;
  outputToday: number;
  swarmReadiness: "seedling" | "operator" | "lead";
}) {
  const blocker = normalizeStatusText(args.blocker);
  return {
    freshness:
      args.freshnessMinutes === null ? "aging" : args.freshnessMinutes <= 10 ? "fresh" : args.freshnessMinutes <= 45 ? "aging" : "stale",
    taskFit: args.activeContext.length <= 3 ? "tight" : args.activeContext.length <= 5 ? "mixed" : "drifting",
    blockerClarity: blocker === "none" ? "none" : blocker.length <= 90 ? "clear" : "fuzzy",
    brainHygiene:
      args.activeContext.length > 5
        ? "noisy"
        : args.memoryEventCount > args.durableCount * 3 + 6
          ? "watch"
          : "clean",
    outputToday: args.outputToday,
    swarmReadiness: args.swarmReadiness,
  } as const;
}

function deriveWorkflowSuggestion(args: {
  runtime: string;
  blocker: string;
  confidence: number;
  skillCount: number;
  activeContext: string[];
}) {
  const blocker = normalizeStatusText(args.blocker);
  if (blocker !== "none") {
    return `Resolve "${blocker}" first, then return this employee to one bounded task.`;
  }
  if (args.runtime === "claude") {
    return "Keep Claude on compact review, growth, and premium-surface critique tasks so the queue stays high-signal.";
  }
  if (args.runtime === "nemotron") {
    return "Use this lane for cheap batch generation, then promote only validated net-new questions into the banks.";
  }
  if (args.confidence < 0.82) {
    return "Promote fewer but sharper durable memories so this employee's future context stays clean.";
  }
  if (args.skillCount < 4) {
    return "Keep this employee scoped tightly until the skill ledger is denser and the outputs are more reusable.";
  }
  if (args.activeContext.length > 4) {
    return "Trim active context to the 2-3 most important threads so this employee does not spread effort across too many fronts.";
  }
  return "Keep this employee on one role, refresh live telemetry often, and only promote memory that clearly improves the next cycle.";
}

function countEventsToday(timestamps: string[]) {
  const now = new Date();
  return timestamps.filter((timestamp) => {
    const parsed = new Date(timestamp);
    return (
      parsed.getUTCFullYear() === now.getUTCFullYear() &&
      parsed.getUTCMonth() === now.getUTCMonth() &&
      parsed.getUTCDate() === now.getUTCDate()
    );
  }).length;
}

function deriveLearningVelocity(eventsToday: number): "quiet" | "steady" | "high" {
  if (eventsToday >= 4) {
    return "high";
  }
  if (eventsToday >= 2) {
    return "steady";
  }
  return "quiet";
}

function deriveSwarmReadiness(args: {
  confidence: number;
  skillCount: number;
  growthLevel: number;
}): "seedling" | "operator" | "lead" {
  if (args.confidence >= 0.9 && args.skillCount >= 6 && args.growthLevel >= 4) {
    return "lead";
  }
  if (args.confidence >= 0.82 && args.skillCount >= 4 && args.growthLevel >= 2) {
    return "operator";
  }
  return "seedling";
}

function parseClaudeReset(blocker?: string | null) {
  const normalized = normalizeStatusText(blocker);
  const match = normalized.match(/resets\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{1,2})(?::(\d{2}))?(am|pm)/i);
  if (!match) {
    return null;
  }

  const [, monthLabel, dayLabel, hourLabel, minuteLabel, meridiem] = match;
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = months.indexOf(monthLabel.slice(0, 3).toLowerCase());
  if (month < 0) {
    return null;
  }

  let hour = Number(hourLabel);
  if (meridiem.toLowerCase() === "pm" && hour !== 12) {
    hour += 12;
  }
  if (meridiem.toLowerCase() === "am" && hour === 12) {
    hour = 0;
  }

  const candidate = new Date();
  candidate.setMonth(month);
  candidate.setDate(Number(dayLabel));
  candidate.setHours(hour, Number(minuteLabel ?? 0), 0, 0);

  return Number.isNaN(candidate.getTime()) ? null : candidate.toISOString();
}

function probeClaudeDesktop() {
  const heartbeatLog = path.join(os.homedir(), "AppData", "Roaming", "Claude", "logs", "main.log");
  const bridgeStatePath = path.join(os.homedir(), "AppData", "Roaming", "Claude", "bridge-state.json");
  const bridgeState = safeReadJson<ClaudeBridgeState>(bridgeStatePath, {});

  let processOnline = false;
  try {
    const raw = execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        "$p = Get-Process claude -ErrorAction SilentlyContinue | Select-Object -First 1 Id, StartTime; if ($p) { $p | ConvertTo-Json -Compress }",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 2500 },
    ).trim();
    processOnline = raw.length > 0;
  } catch {
    processOnline = false;
  }

  let heartbeatAge: number | null = null;
  try {
    heartbeatAge = Math.max(0, Math.round((Date.now() - fs.statSync(heartbeatLog).mtimeMs) / 60000));
  } catch {
    heartbeatAge = null;
  }

  const bridgeLinked = Boolean(bridgeState.enabled && bridgeState.userConsented);
  const live = processOnline && heartbeatAge !== null && heartbeatAge <= 2;

  return {
    processOnline,
    heartbeatAge,
    bridgeLinked,
    bridgeStatePath,
    heartbeatLog,
    localSessionId: bridgeState.localSessionId ?? null,
    environmentId: bridgeState.environmentId ?? null,
    status: live ? "live" : processOnline ? "degraded" : "down",
    freshness: formatAge(heartbeatAge),
  } as const;
}

function normalizeBrain(
  agentId: string,
  raw: AgentBrain & {
    nextSkillTarget?: string;
    capabilityFocus?: string[];
    brainHygiene?: "clean" | "watch" | "noisy";
  },
) {
  const registry = DEFAULT_AGENT_REGISTRY.find((entry) => entry.id === agentId);
  const memoryEventCount = raw.memoryEvents.length;
  const growthPoints = raw.skills.length * 12 + raw.durableMemory.length * 9 + raw.activeContext.length * 4 + memoryEventCount * 3;
  const latestEvent = raw.memoryEvents.at(-1);
  const confidence = latestEvent?.provenance?.confidence ?? (raw.skills.length > 0 ? 0.86 : 0.72);
  const eventsToday = countEventsToday(raw.memoryEvents.map((event) => event.provenance.timestamp));
  const growthLevel = Math.max(1, Math.ceil(growthPoints / 20));

  return {
    agentId,
    nickname: registry?.nickname ?? raw.displayName ?? agentId,
    displayName: raw.displayName ?? registry?.nickname ?? agentId,
    runtime: raw.runtime ?? registry?.runtime ?? "unknown",
    avatar: raw.avatar ?? registry?.avatar ?? { key: agentId, sigil: agentId.slice(0, 2).toUpperCase(), palette: ["#66737a", "#f5efe2", "#bda26c"] },
    role: raw.role,
    mission: raw.mission,
    durableCount: raw.durableMemory.length,
    skillCount: raw.skills.length,
    memoryEventCount,
    growthLevel,
    confidence,
    learningVelocity: deriveLearningVelocity(eventsToday),
    swarmReadiness: deriveSwarmReadiness({
      confidence,
      skillCount: raw.skills.length,
      growthLevel,
    }),
    eventsToday,
    goals: raw.goals ?? [],
    workflowContract: raw.workflowContract ?? [],
    recentEvents: raw.memoryEvents.slice(-4).reverse().map((event) => ({
      id: event.id,
      summary: event.summary,
      kind: event.kind,
      timestamp: event.provenance.timestamp,
      confidence: event.provenance.confidence,
    })),
    nextSkillTarget: raw.nextSkillTarget,
    capabilityFocus: safeList(raw.capabilityFocus, 8),
    brainHygiene: raw.brainHygiene ?? "clean",
    activeContext: raw.activeContext,
    durableMemory: raw.durableMemory,
    skills: raw.skills,
    lastContribution: latestEvent?.summary ?? raw.durableMemory[0] ?? raw.mission,
    lastCuratedAt: raw.lastCuratedAt,
  };
}

function loadBrains(workspaceRoot: string) {
  const brainsDir = path.join(workspaceRoot, "brains", "agents");
  if (!fs.existsSync(brainsDir)) {
    return {
      brains: [] as ReturnType<typeof normalizeBrain>[],
      statusByAgent: new Map<string, MissionControlSnapshot["agents"][number]["brainStatus"]>(),
    };
  }

  const statusByAgent = new Map<string, MissionControlSnapshot["agents"][number]["brainStatus"]>();
  const brains = fs
    .readdirSync(brainsDir)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => {
      const agentId = path.basename(file, ".json");
      const filePath = path.join(brainsDir, file);
      try {
        const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").trim();
        if (!raw) {
          statusByAgent.set(agentId, "corrupt");
          return [];
        }
        const brain = JSON.parse(raw) as AgentBrain;
        if (
          !brain
          || brain.agentId !== agentId
          || !Array.isArray(brain.skills)
          || !Array.isArray(brain.durableMemory)
          || !Array.isArray(brain.activeContext)
          || !Array.isArray(brain.memoryEvents)
        ) {
          statusByAgent.set(agentId, "corrupt");
          return [];
        }
        statusByAgent.set(agentId, "linked");
        return [normalizeBrain(agentId, brain)];
      } catch {
        statusByAgent.set(agentId, "corrupt");
        return [];
      }
    })
    .sort((left, right) => left.nickname.localeCompare(right.nickname));

  return { brains, statusByAgent };
}

function safeList(value: unknown, limit = 8): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => String(item ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .slice(0, limit);
}

function mergeSignalLists(limit: number, ...lists: unknown[]): string[] {
  return lists.flatMap((list) => safeList(list, limit * 2)).filter((item, index, array) => array.indexOf(item) === index).slice(0, limit);
}

function deriveGuildPrediction(args: {
  nickname: string;
  blocker: string;
  state: string;
  goal: string;
  skills: string[];
  memories: string[];
}) {
  const blocker = normalizeStatusText(args.blocker);
  if (blocker !== "none") {
    return `${args.nickname} is most likely to unblock after the human-required item is cleared: ${blocker}`;
  }
  if (args.state === "live") {
    return `${args.nickname} should produce the next useful artifact by staying focused on: ${args.goal}`;
  }
  if (args.skills.length > args.memories.length + 3) {
    return `${args.nickname} has more skills than durable memories, so the next growth win is promoting one reusable lesson after the next run.`;
  }
  return `${args.nickname} is best used for one bounded task that advances: ${args.goal}`;
}

type CapabilityAuditSlice = Pick<
  MissionControlSnapshot["unifiedGuild"],
  "providerReadiness" | "capabilityMatrix" | "memoryHygiene" | "learningLedger" | "approvalQueue"
>;

function emptyCapabilityAudit(): CapabilityAuditSlice {
  return {
    providerReadiness: {
      totalProviders: 0,
      live: 0,
      installedIdle: 0,
      configuredMissingState: 0,
      legacyOnly: 0,
      unwired: 0,
      blocked: 0,
      unknown: 0,
    },
    capabilityMatrix: [],
    memoryHygiene: {
      mode: "chapai-primary-candidate-first",
      rawObservationCount: 0,
      candidateMemoryCount: 0,
      reviewedMemoryCount: 0,
      approvedDurableCount: 0,
      lowSignalCount: 0,
      rules: [
        "Do not promote raw transcripts or raw web text directly into durable memory.",
        "Keep product facts, hypotheses, experiments, skills, and persona flavor separate.",
        "Public actions require Telegram approval before execution.",
      ],
    },
    learningLedger: [],
    approvalQueue: [],
  };
}

function loadAgentCapabilityAudit(workspaceRoot: string): CapabilityAuditSlice {
  const raw = safeReadJson<Partial<CapabilityAuditSlice>>(path.join(workspaceRoot, "config", "agent-capability-audit.json"), {});
  const fallback = emptyCapabilityAudit();
  const capabilityMatrix = raw.capabilityMatrix ?? fallback.capabilityMatrix;
  return {
    providerReadiness: {
      ...fallback.providerReadiness,
      ...raw.providerReadiness,
      totalProviders: raw.providerReadiness?.totalProviders ?? capabilityMatrix.length,
    },
    capabilityMatrix,
    memoryHygiene: {
      ...fallback.memoryHygiene,
      ...raw.memoryHygiene,
      rules: mergeSignalLists(8, raw.memoryHygiene?.rules, fallback.memoryHygiene.rules),
    },
    learningLedger: raw.learningLedger ?? fallback.learningLedger,
    approvalQueue: raw.approvalQueue ?? fallback.approvalQueue,
  };
}

function loadUnifiedGuildState(
  workspaceRoot: string,
  agents: MissionControlSnapshot["agents"],
  brains: MissionControlSnapshot["brains"],
): MissionControlSnapshot["unifiedGuild"] {
  const filePath = path.join(workspaceRoot, "config", "unified-agent-guild-state.json");
  const fileRaw = safeReadJson<Partial<MissionControlSnapshot["unifiedGuild"]>>(filePath, {});
  const raw = Array.isArray(fileRaw.agents) && fileRaw.agents.length > 0 ? fileRaw : UNIFIED_GUILD_STATE_SNAPSHOT;
  const capabilityAudit = loadAgentCapabilityAudit(workspaceRoot);
  const brainMap = new Map(brains.map((brain) => [brain.agentId, brain]));
  const rawAgentMap = new Map((raw.agents ?? []).flatMap((agent) => (agent.id ? [[agent.id, agent]] : [])));
  const fallbackAgents: MissionControlSnapshot["unifiedGuild"]["agents"] = agents.map((agent) => {
    const brain = brainMap.get(agent.id);
    const skills = brain?.skills ?? [];
    const durableMemory = brain?.durableMemory ?? [];
    const recentEvents = brain?.recentEvents?.map((event) => event.summary) ?? [];
    const xp = skills.length * 12 + durableMemory.length * 9 + recentEvents.length * 5 + agent.outputToday * 7;
    const currentWorkingGoal = brain?.nextSkillTarget ?? brain?.activeContext?.[0] ?? agent.current;
    const humanRequiredBlocks = mergeSignalLists(
      5,
      agent.blocker !== "none" ? [agent.blocker] : [],
      agent.blockerSeverity !== "info" ? [agent.workflowSuggestion] : [],
    );
    const experimentResults = mergeSignalLists(
      6,
      recentEvents,
      agent.outputToday > 0 ? [`${agent.outputToday} visible outputs recorded in the current dashboard window.`] : [],
    );
    const significantCommunications = mergeSignalLists(
      6,
      recentEvents,
      agent.blocker !== "none" ? [`Human required: ${agent.blocker}`] : [],
    );
    const significantEvents = mergeSignalLists(
      6,
      recentEvents,
      [agent.latest],
    );

    return {
      id: agent.id,
      displayName: brain?.displayName ?? agent.nickname,
      nickname: agent.nickname,
      role: agent.role,
      runtime: agent.runtime,
      state: agent.state,
      truthLevel: agent.truthLevel,
      currentTask: agent.current,
      latest: agent.latest,
      blocker: agent.blocker,
      plan: agent.workflowSuggestion,
      currentWorkingGoal,
      predictions: mergeSignalLists(4, [
        deriveGuildPrediction({
          nickname: agent.nickname,
          blocker: agent.blocker,
          state: agent.state,
          goal: currentWorkingGoal,
          skills,
          memories: durableMemory,
        }),
      ]),
      experimentResults,
      significantCommunications,
      significantEvents,
      humanRequiredBlocks,
      theories: safeList([brain?.nextSkillTarget, ...(brain?.capabilityFocus ?? []), ...(durableMemory.slice(0, 2) ?? [])], 5),
      experiments: safeList([agent.current, ...(brain?.activeContext ?? [])], 6),
      trialsAndErrors: agent.blocker === "none" ? [] : [agent.blocker],
      stats: {
        level: Math.max(1, Math.ceil(xp / 45)),
        xp,
        skills: skills.length,
        durableMemories: durableMemory.length,
        memoryEvents: brain?.memoryEventCount ?? 0,
        activeContexts: brain?.activeContext?.length ?? 0,
        pendingExperiments: 0,
        completedTasks: agent.outputToday,
        blockedTasks: agent.blocker === "none" ? 0 : 1,
        sourceCount: [agent.provenance, brain ? "brain" : ""].filter(Boolean).length,
      },
      brain: {
        health: brain?.brainHygiene ?? "clean",
        lastCuratedAt: brain?.lastCuratedAt ?? agent.lastBrainUpdateAt,
        nextSkillTarget: brain?.nextSkillTarget ?? null,
        activeContext: brain?.activeContext ?? [],
        durableMemory,
        skills,
        recentEvents,
      },
      sources: [
        {
          label: "Mission control snapshot",
          kind: "derived-dashboard-state",
          path: "apps/web/src/lib/mission-control.ts",
          updatedAt: agent.lastRuntimeUpdateAt ?? agent.lastBrainUpdateAt ?? new Date().toISOString(),
        },
      ],
    };
  });

  const unifiedAgents = fallbackAgents.map((fallback) => {
    const rawAgent = rawAgentMap.get(fallback.id);
    if (!rawAgent) {
      return fallback;
    }

    const brain = {
      health: fallback.brain.health ?? rawAgent.brain?.health ?? "clean",
      lastCuratedAt: fallback.brain.lastCuratedAt ?? rawAgent.brain?.lastCuratedAt ?? null,
      nextSkillTarget: fallback.brain.nextSkillTarget ?? rawAgent.brain?.nextSkillTarget ?? null,
      activeContext: mergeSignalLists(8, fallback.brain.activeContext, rawAgent.brain?.activeContext),
      durableMemory: mergeSignalLists(8, fallback.brain.durableMemory, rawAgent.brain?.durableMemory),
      skills: mergeSignalLists(12, fallback.brain.skills, rawAgent.brain?.skills),
      recentEvents: mergeSignalLists(8, fallback.brain.recentEvents, rawAgent.brain?.recentEvents),
    };

    const currentWorkingGoal = fallback.currentWorkingGoal ?? rawAgent.currentWorkingGoal ?? brain.nextSkillTarget ?? fallback.currentTask;
    const predictions = mergeSignalLists(
      5,
      rawAgent.predictions,
      fallback.predictions,
      rawAgent.theories,
    );

    return {
      ...rawAgent,
      ...fallback,
      displayName: rawAgent.displayName ?? fallback.displayName,
      role: rawAgent.role ?? fallback.role,
      currentWorkingGoal,
      predictions: predictions.length > 0 ? predictions : fallback.predictions,
      experimentResults: mergeSignalLists(8, rawAgent.experimentResults, fallback.experimentResults, rawAgent.brain?.recentEvents),
      significantCommunications: mergeSignalLists(8, rawAgent.significantCommunications, fallback.significantCommunications, rawAgent.brain?.recentEvents),
      significantEvents: mergeSignalLists(8, rawAgent.significantEvents, fallback.significantEvents, rawAgent.latest ? [rawAgent.latest] : []),
      humanRequiredBlocks: mergeSignalLists(8, rawAgent.humanRequiredBlocks, fallback.humanRequiredBlocks),
      theories: mergeSignalLists(7, fallback.theories, rawAgent.theories),
      experiments: mergeSignalLists(8, fallback.experiments, rawAgent.experiments),
      trialsAndErrors: mergeSignalLists(8, fallback.trialsAndErrors, rawAgent.trialsAndErrors),
      stats: {
        ...rawAgent.stats,
        ...fallback.stats,
        level: Math.max(rawAgent.stats?.level ?? 1, fallback.stats.level),
        xp: Math.max(rawAgent.stats?.xp ?? 0, fallback.stats.xp),
        skills: Math.max(rawAgent.stats?.skills ?? 0, fallback.stats.skills),
        durableMemories: Math.max(rawAgent.stats?.durableMemories ?? 0, fallback.stats.durableMemories),
        memoryEvents: Math.max(rawAgent.stats?.memoryEvents ?? 0, fallback.stats.memoryEvents),
        sourceCount: Math.max(rawAgent.stats?.sourceCount ?? 0, fallback.stats.sourceCount),
      },
      brain,
      sources: [
        ...(rawAgent.sources ?? []),
        ...fallback.sources,
      ].filter((source, index, array) => array.findIndex((candidate) => `${candidate.kind}:${candidate.path}` === `${source.kind}:${source.path}`) === index).slice(0, 8),
    };
  });
  const stats = raw.stats ?? {
    totalAgents: unifiedAgents.length,
    live: agents.filter((agent) => agent.state === "live").length,
    sleeping: agents.filter((agent) => agent.state === "sleeping").length,
    blocked: agents.filter((agent) => agent.state === "blocked").length,
    stale: agents.filter((agent) => agent.state === "stale").length,
    totalSkills: brains.reduce((sum, brain) => sum + brain.skillCount, 0),
    totalDurableMemories: brains.reduce((sum, brain) => sum + brain.durableCount, 0),
    totalExperiments: unifiedAgents.reduce((sum, agent) => sum + agent.experiments.length, 0),
    totalTrialErrors: unifiedAgents.reduce((sum, agent) => sum + agent.trialsAndErrors.length, 0),
  };

  return {
    generatedAt: raw.generatedAt ?? null,
    version: raw.version ?? 1,
    title: raw.title ?? "Unified ChappyAI + ChapAI Agent Guild State",
    sourceRoots: {
      chapai: raw.sourceRoots?.chapai ?? workspaceRoot,
      chappyVault: raw.sourceRoots?.chappyVault ?? path.join(os.homedir(), "Desktop", "ChapAi"),
      legacyCcrnAgent: raw.sourceRoots?.legacyCcrnAgent ?? path.join(path.dirname(workspaceRoot), "ccrn-agent"),
    },
    sourceHealth: {
      chapaiBrains: raw.sourceHealth?.chapaiBrains ?? brains.length,
      obsidianGuildNotes: raw.sourceHealth?.obsidianGuildNotes ?? 0,
      legacyMemoryLinked: raw.sourceHealth?.legacyMemoryLinked ?? false,
      publicLedgerRecords: raw.sourceHealth?.publicLedgerRecords ?? 0,
      approvalQueuePending: raw.sourceHealth?.approvalQueuePending ?? 0,
      boardroomLinked: raw.sourceHealth?.boardroomLinked ?? false,
      guildLoopUpdatedAt: raw.sourceHealth?.guildLoopUpdatedAt ?? null,
    },
    stats,
    memorySystem: {
      mode: raw.memorySystem?.mode ?? "candidate-first",
      rawNotes: raw.memorySystem?.rawNotes ?? [],
      candidatePromotions: raw.memorySystem?.candidatePromotions ?? [],
      approvedDurableUpdates: raw.memorySystem?.approvedDurableUpdates ?? [],
      hygieneRules: raw.memorySystem?.hygieneRules ?? [
        "Do not dump raw transcripts into durable memory.",
        "Separate product truth from persona flavor.",
        "Keep one reusable insight per concept.",
      ],
    },
    sharedContext: {
      legacyDurableFacts: raw.sharedContext?.legacyDurableFacts ?? [],
      legacyAgentNotes: raw.sharedContext?.legacyAgentNotes ?? [],
      legacyFindings: raw.sharedContext?.legacyFindings ?? [],
      publicResearchFindings: raw.sharedContext?.publicResearchFindings ?? [],
      approvalExperiments: raw.sharedContext?.approvalExperiments ?? [],
    },
    providerReadiness: capabilityAudit.providerReadiness,
    capabilityMatrix: capabilityAudit.capabilityMatrix,
    memoryHygiene: capabilityAudit.memoryHygiene,
    learningLedger: capabilityAudit.learningLedger,
    approvalQueue: capabilityAudit.approvalQueue,
    agents: unifiedAgents,
  };
}

function mergeUnifiedGuildStates(
  localState: MissionControlSnapshot["unifiedGuild"],
  cloudState: MissionControlSnapshot["unifiedGuild"] | null,
): MissionControlSnapshot["unifiedGuild"] {
  if (!cloudState) {
    return localState;
  }

  const cloudAgentMap = new Map(cloudState.agents.map((agent) => [agent.id, agent]));
  const mergedAgents = localState.agents.map((localAgent) => {
    const cloudAgent = cloudAgentMap.get(localAgent.id);
    if (!cloudAgent) {
      return localAgent;
    }

    return {
      ...cloudAgent,
      ...localAgent,
      currentWorkingGoal: localAgent.currentWorkingGoal ?? cloudAgent.currentWorkingGoal,
      predictions: mergeSignalLists(6, localAgent.predictions, cloudAgent.predictions),
      experimentResults: mergeSignalLists(8, localAgent.experimentResults, cloudAgent.experimentResults),
      significantCommunications: mergeSignalLists(8, localAgent.significantCommunications, cloudAgent.significantCommunications),
      significantEvents: mergeSignalLists(8, localAgent.significantEvents, cloudAgent.significantEvents),
      humanRequiredBlocks: mergeSignalLists(8, localAgent.humanRequiredBlocks, cloudAgent.humanRequiredBlocks),
      theories: mergeSignalLists(8, localAgent.theories, cloudAgent.theories),
      experiments: mergeSignalLists(8, localAgent.experiments, cloudAgent.experiments),
      trialsAndErrors: mergeSignalLists(8, localAgent.trialsAndErrors, cloudAgent.trialsAndErrors),
      stats: {
        ...cloudAgent.stats,
        ...localAgent.stats,
        level: Math.max(localAgent.stats.level, cloudAgent.stats.level),
        xp: Math.max(localAgent.stats.xp, cloudAgent.stats.xp),
        sourceCount: Math.max(localAgent.stats.sourceCount, cloudAgent.stats.sourceCount),
      },
      brain: {
        ...cloudAgent.brain,
        ...localAgent.brain,
        activeContext: mergeSignalLists(8, localAgent.brain.activeContext, cloudAgent.brain.activeContext),
        durableMemory: mergeSignalLists(8, localAgent.brain.durableMemory, cloudAgent.brain.durableMemory),
        skills: mergeSignalLists(12, localAgent.brain.skills, cloudAgent.brain.skills),
        recentEvents: mergeSignalLists(8, localAgent.brain.recentEvents, cloudAgent.brain.recentEvents),
      },
      sources: [
        ...localAgent.sources,
        ...cloudAgent.sources,
      ].filter((source, index, array) => array.findIndex((candidate) => `${candidate.kind}:${candidate.path}` === `${source.kind}:${source.path}`) === index).slice(0, 10),
    };
  });

  return {
    ...localState,
    generatedAt: cloudState.generatedAt ?? localState.generatedAt,
    sourceHealth: {
      ...localState.sourceHealth,
      ...cloudState.sourceHealth,
      boardroomLinked: true,
    },
    memorySystem: {
      ...localState.memorySystem,
      candidatePromotions: mergeSignalLists(16, localState.memorySystem.candidatePromotions, cloudState.memorySystem.candidatePromotions),
      approvedDurableUpdates: mergeSignalLists(16, localState.memorySystem.approvedDurableUpdates, cloudState.memorySystem.approvedDurableUpdates),
      hygieneRules: mergeSignalLists(8, localState.memorySystem.hygieneRules, cloudState.memorySystem.hygieneRules),
    },
    sharedContext: {
      ...localState.sharedContext,
      publicResearchFindings: mergeSignalLists(12, localState.sharedContext.publicResearchFindings, cloudState.sharedContext.publicResearchFindings),
      approvalExperiments: mergeSignalLists(12, localState.sharedContext.approvalExperiments, cloudState.sharedContext.approvalExperiments),
    },
    providerReadiness: localState.providerReadiness,
    capabilityMatrix: localState.capabilityMatrix.length > 0 ? localState.capabilityMatrix : cloudState.capabilityMatrix ?? [],
    memoryHygiene: {
      ...(cloudState.memoryHygiene ?? {}),
      ...localState.memoryHygiene,
      rules: mergeSignalLists(8, localState.memoryHygiene.rules, cloudState.memoryHygiene?.rules),
    },
    learningLedger: [
      ...localState.learningLedger,
      ...(cloudState.learningLedger ?? []),
    ].filter((record, index, array) => array.findIndex((candidate) => `${candidate.source}:${candidate.summary}` === `${record.source}:${record.summary}`) === index).slice(0, 120),
    approvalQueue: [
      ...localState.approvalQueue,
      ...(cloudState.approvalQueue ?? []),
    ].filter((ticket, index, array) => array.findIndex((candidate) => candidate.id === ticket.id) === index).slice(0, 40),
    agents: mergedAgents,
  };
}

function loadLegacyAgentState(
  workspaceRoot: string,
  legacyRoot: string,
  brains: ReturnType<typeof loadBrains>["brains"],
  brainStatusByAgent: ReturnType<typeof loadBrains>["statusByAgent"],
  heartbeats: AgentHeartbeatFile,
  registry: AgentRegistryEntry[],
) {
  const telemetryPath = path.join(legacyRoot, "team", "telemetry.json");
  const telemetry = safeReadJson<LegacyTelemetry>(telemetryPath, {});
  const telemetryUpdatedAt = (() => {
    try {
      return fs.statSync(telemetryPath).mtime.toISOString();
    } catch {
      return null;
    }
  })();
  const telemetryAge = (() => {
    try {
      return Math.max(0, Math.round((Date.now() - fs.statSync(telemetryPath).mtimeMs) / 60000));
    } catch {
      return null;
    }
  })();
  const telemetryMap = new Map((telemetry.agents ?? []).map((agent) => [agent.nickname.toLowerCase(), agent]));
  const brainMap = new Map(brains.map((brain) => [brain.agentId, brain]));
  const heartbeatMap = new Map((heartbeats.agents ?? []).flatMap((agent) => (agent.id ? [[agent.id, agent]] : [])));

  return registry.map((entry) => {
    const statePath = entry.statePath
      ? path.isAbsolute(entry.statePath)
        ? entry.statePath
        : path.join(workspaceRoot, entry.statePath)
      : null;
    const laneState = statePath ? safeReadJson<Record<string, unknown>>(statePath, {}) : {};
    const telemetryAgent = telemetryMap.get(entry.nickname.toLowerCase());
    const brain = brainMap.get(entry.id);
    const brainFileStatus = brainStatusByAgent.get(entry.id) ?? (brain ? "linked" : "missing");
    const heartbeat = heartbeatMap.get(entry.id);
    const runtimeState =
      heartbeat && heartbeat.source !== "brain-only"
        ? heartbeat
        : laneState && Object.keys(laneState).length > 0
          ? {
              state:
                typeof laneState.semanticStatus === "string"
                  ? laneState.semanticStatus
                  : typeof laneState.status === "string"
                    ? laneState.status
                    : "sleeping",
              current:
                laneState.currentTask &&
                typeof laneState.currentTask === "object" &&
                "title" in laneState.currentTask &&
                typeof laneState.currentTask.title === "string"
                  ? laneState.currentTask.title
                  : undefined,
              latest:
                laneState.latestResult &&
                typeof laneState.latestResult === "object" &&
                "summary" in laneState.latestResult &&
                typeof laneState.latestResult.summary === "string"
                  ? laneState.latestResult.summary
                  : undefined,
              blocker: typeof laneState.blocker === "string" ? laneState.blocker : "none",
              lastSeenAt:
                typeof laneState.lastHeartbeatAt === "string"
                  ? laneState.lastHeartbeatAt
                  : typeof laneState.lastRunAt === "string"
                    ? laneState.lastRunAt
                    : undefined,
              source: "employee-state",
              staleAfterMinutes: typeof laneState.staleAfterMinutes === "number" ? laneState.staleAfterMinutes : undefined,
            }
          : heartbeat;
    const lastCuratedAge = formatAge(parseIsoAge(brain?.lastCuratedAt));
    const heartbeatMinutes = parseIsoAge(runtimeState?.lastSeenAt ?? null);
    const heartbeatAge = formatAge(heartbeatMinutes);
    const telemetryStale = Boolean(telemetryAgent && telemetryAge !== null && telemetryAge > 20);
    const runtimeRawState = runtimeState?.state ?? (telemetryStale ? "stale" : telemetryAgent?.state ?? (brain ? "brain-linked" : "unknown"));
    const runtimeStale = Boolean(runtimeState) && isRuntimeFileStale({
      freshnessMinutes: heartbeatMinutes,
      staleAfterMinutes: runtimeState?.staleAfterMinutes,
      rawState: runtimeRawState,
    });
    const truthLevel =
      runtimeState
        ? runtimeStale
          ? ("stale-telemetry" as const)
          : ("runtime-file" as const)
        : telemetryAgent && telemetryAge !== null && telemetryAge > 20
          ? ("stale-telemetry" as const)
          : telemetryAgent
            ? ("runtime-file" as const)
            : brain
              ? ("brain-only" as const)
              : entry.runtime === "gemini" || entry.runtime === "nemotron"
                ? ("unwired" as const)
                : ("presentation-only" as const);
    const blocker = runtimeState?.blocker ?? telemetryAgent?.blocker ?? "none";
    const confidence = brain?.confidence ?? 0.72;
    const skillCount = brain?.skillCount ?? 0;
    const activeContext = brain?.activeContext ?? [];
    const outputToday = countEventsToday((brain?.recentEvents ?? []).map((event) => event.timestamp));
    const state = deriveOperatingState({
      rawState: runtimeRawState,
      blocker,
      truthLevel,
      freshnessMinutes: heartbeatMinutes,
      staleAfterMinutes: runtimeState?.staleAfterMinutes,
      current: runtimeState?.current ?? telemetryAgent?.current ?? activeContext[0] ?? "Awaiting bounded work.",
    });
    const swarmReadiness = brain?.swarmReadiness ?? "seedling";

    return {
      id: entry.id,
      nickname: entry.nickname,
      runtime: brain?.runtime ?? entry.runtime,
      avatar: brain?.avatar ?? entry.avatar,
      role: telemetryAgent?.role ?? entry.role,
      state,
      progress: telemetryAgent?.progress ?? Math.min(96, (brain?.growthLevel ?? 1) * 11),
      eta: telemetryAgent?.eta ?? "ready",
      current: runtimeState?.current ?? telemetryAgent?.current ?? activeContext[0] ?? "Awaiting bounded work.",
      latest: runtimeState?.latest ?? telemetryAgent?.latest ?? brain?.lastContribution ?? "Brain bundle linked with no fresh telemetry yet.",
      blocker,
      freshness: runtimeState ? heartbeatAge : telemetryAgent ? telemetryAgent.eta : lastCuratedAge,
      provenance:
        runtimeState
          ? `${runtimeState.source ?? "agent-heartbeats.json"} + brain bundle`
          : telemetryStale
            ? `stale telemetry (${formatAge(telemetryAge)}) + brain bundle`
            : telemetryAgent
              ? "legacy telemetry + brain bundle"
              : "brain bundle only",
      brainStatus: brainFileStatus,
      truthLevel,
      lastRuntimeUpdateAt: runtimeState?.lastSeenAt ?? telemetryUpdatedAt,
      lastBrainUpdateAt: brain?.lastCuratedAt ?? null,
      blockerSeverity: deriveBlockerSeverity(blocker),
      outputToday,
      workflowSuggestion: deriveWorkflowSuggestion({
        runtime: brain?.runtime ?? entry.runtime,
        blocker,
        confidence,
        skillCount,
        activeContext,
      }),
      presentation:
        entry.presentation
        ?? inferPresentationProfile({
          id: entry.id,
          nickname: entry.nickname,
          role: telemetryAgent?.role ?? entry.role,
          runtime: brain?.runtime ?? entry.runtime,
        }),
      employeeHealth: deriveEmployeeHealth({
        freshnessMinutes: heartbeatMinutes,
        blocker,
        activeContext,
        durableCount: brain?.durableCount ?? 0,
        memoryEventCount: brain?.memoryEventCount ?? 0,
        outputToday,
        swarmReadiness,
      }),
    };
  });
}

function loadBatchState(workspaceRoot: string) {
  const stagingRoot = path.join(workspaceRoot, "packages", "content", "staging");
  const latestBatch = ["generated", "promoted"]
    .flatMap((folder) => {
      const batchDir = path.join(stagingRoot, folder);
      if (!fs.existsSync(batchDir)) {
        return [];
      }
      return fs
        .readdirSync(batchDir)
        .filter((file) => /^mixed-batch-\d+\.json$/.test(file))
        .map((file) => path.join(batchDir, file));
    })
    .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs)[0] ?? null;

  if (!latestBatch) {
    return {
      latestGeneratedAt: null,
      latestBatchId: null,
      latestBatchFile: null,
      validation: "missing" as const,
      totalQuestions: 0,
      examMix: { ccrn: 0, nclex: 0 },
    };
  }

  const batch = safeReadJson<GeneratedBatch>(latestBatch, {});
  return {
    latestGeneratedAt: batch.generatedAt ?? null,
    latestBatchId: batch.batchId ?? null,
    latestBatchFile: latestBatch,
    validation: batch.validation?.valid ? ("valid" as const) : ("invalid" as const),
    totalQuestions: Array.isArray(batch.questions) ? batch.questions.length : 0,
    examMix: {
      ccrn: batch.examMix?.ccrn ?? 0,
      nclex: batch.examMix?.nclex ?? 0,
    },
  };
}

function loadNclexRefinementTopUpState(workspaceRoot: string): NclexRefinementTopUpState {
  return safeReadJson<NclexRefinementTopUpState>(
    path.join(workspaceRoot, "packages", "content", "questions", "nclex", "review", "nclex-top-up-needed.latest.json"),
    {},
  );
}

function loadGuildLoopState(workspaceRoot: string) {
  return safeReadJson<GuildLoopState>(path.join(workspaceRoot, "config", "guild-loop-state.json"), {});
}

function loadGuildRetrospectiveState(workspaceRoot: string) {
  return safeReadJson<GuildRetrospectiveState>(path.join(workspaceRoot, "config", "guild-retrospective.json"), {});
}

function loadAgentHeartbeats(workspaceRoot: string) {
  return safeReadJson<AgentHeartbeatFile>(path.join(workspaceRoot, "config", "agent-heartbeats.json"), {});
}

function asTelemetryBinding(env: Partial<Env>): TelemetryBinding | null {
  if (!hasDatabase(env) || !env.DB) {
    return null;
  }
  return env.DB as TelemetryBinding;
}

async function loadCloudAgentHeartbeats(): Promise<AgentHeartbeatFile> {
  const binding = asTelemetryBinding(resolveEnv());
  if (!binding) {
    return {};
  }

  try {
    const row = await binding.prepare(`
      SELECT payload, created_at
      FROM guild_telemetry_events
      WHERE kind = 'heartbeat' AND verified = 1
      ORDER BY created_at DESC
      LIMIT 1
    `).first<GuildTelemetryRow>();

    if (!row?.payload) {
      return {};
    }

    const event = JSON.parse(row.payload) as { payload?: AgentHeartbeatFile; receivedAt?: string };
    const heartbeatPayload = event.payload;
    if (!heartbeatPayload || !Array.isArray(heartbeatPayload.agents)) {
      return {};
    }

    return {
      ...heartbeatPayload,
      generatedAt: heartbeatPayload.generatedAt
        ?? event.receivedAt
        ?? (row.created_at ? new Date(row.created_at * 1000).toISOString() : undefined),
    };
  } catch {
    return {};
  }
}

async function loadCloudUnifiedGuildState(): Promise<MissionControlSnapshot["unifiedGuild"] | null> {
  const binding = asTelemetryBinding(resolveEnv());
  if (!binding) {
    return null;
  }

  try {
    const row = await binding.prepare(`
      SELECT payload, created_at
      FROM guild_telemetry_events
      WHERE kind = 'unified_guild_state' AND verified = 1
      ORDER BY created_at DESC
      LIMIT 1
    `).first<GuildTelemetryRow>();

    if (!row?.payload) {
      return null;
    }

    const event = JSON.parse(row.payload) as {
      payload?: MissionControlSnapshot["unifiedGuild"];
      receivedAt?: string;
    };
    const payload = event.payload;
    if (!payload || !Array.isArray(payload.agents) || payload.agents.length === 0) {
      return null;
    }

    return {
      ...payload,
      generatedAt: payload.generatedAt ?? event.receivedAt ?? null,
      sourceHealth: {
        ...payload.sourceHealth,
        boardroomLinked: true,
      },
    };
  } catch {
    return null;
  }
}

function mergeHeartbeatSources(localHeartbeats: AgentHeartbeatFile, cloudHeartbeats: AgentHeartbeatFile): AgentHeartbeatFile {
  if (!cloudHeartbeats.agents?.length) {
    return localHeartbeats;
  }

  if (!localHeartbeats.agents?.length) {
    return cloudHeartbeats;
  }

  const merged = new Map<string, NonNullable<AgentHeartbeatFile["agents"]>[number]>();
  for (const agent of localHeartbeats.agents) {
    if (agent.id) {
      merged.set(agent.id, agent);
    }
  }
  for (const agent of cloudHeartbeats.agents) {
    if (agent.id) {
      merged.set(agent.id, { ...agent, source: agent.source ?? "signed-cloud-telemetry" });
    }
  }

  return {
    generatedAt: cloudHeartbeats.generatedAt ?? localHeartbeats.generatedAt,
    agents: Array.from(merged.values()),
  };
}

function loadClaudeEmployeeState(workspaceRoot: string) {
  const legacy = safeReadJson<ClaudeEmployeeState>(path.join(workspaceRoot, "config", "claude-employee-state.json"), {});
  const normalized = safeReadJson<ClaudeEmployeeState>(path.join(workspaceRoot, "config", "claude-code-state.json"), {});
  return {
    ...legacy,
    ...normalized,
    currentTask: normalized.currentTask ?? legacy.currentTask,
    queue: normalized.queue ?? legacy.queue,
    auth: normalized.auth ?? legacy.auth,
    latestResult: normalized.latestResult ?? legacy.latestResult,
  };
}

function loadSocialStudioState(workspaceRoot: string) {
  return safeReadJson<SocialStudioState>(path.join(workspaceRoot, "config", "social-studio-state.json"), {});
}

function loadManagerLaneState(workspaceRoot: string) {
  return safeReadJson<ManagerLaneState>(path.join(workspaceRoot, "config", "manager-state.json"), {});
}

function loadScoutLaneState(workspaceRoot: string) {
  return safeReadJson<ScoutLaneState>(path.join(workspaceRoot, "config", "scout-state.json"), {});
}

function loadContentEngineState(workspaceRoot: string) {
  return safeReadJson<ContentEngineState>(path.join(workspaceRoot, "config", "content-engine-state.json"), {});
}

function resolveRuntimeState(runtime: RuntimeState) {
  if (runtime.active?.route) {
    return `${runtime.active.route} (${runtime.active.status ?? "running"})`;
  }
  if (runtime.lastRun?.route) {
    return `${runtime.lastRun.route} (${runtime.lastRun.status ?? "idle"})`;
  }
  return "idle";
}

async function pingUrl(url: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    return { ok: response.status >= 200 && response.status < 500, detail: `${response.status}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unreachable";
    return { ok: false, detail: message };
  }
}

function resolveNamedTunnelConfig() {
  const cloudflaredDir = path.join(os.homedir(), ".cloudflared");
  const configPath = path.join(cloudflaredDir, "ccrn-live-config.yml");
  if (!fs.existsSync(configPath)) {
    return null;
  }
  const raw = fs.readFileSync(configPath, "utf8");
  const serviceMatch = raw.match(/service:\s*(.+)\s*$/m);
  return {
    path: configPath,
    service: serviceMatch?.[1]?.trim() ?? "unknown",
  };
}

async function loadLiveServices(
  runtime: RuntimeState,
  revenue: RevenueState,
  claudeDesktop: ReturnType<typeof probeClaudeDesktop>,
  guildLoop: GuildLoopState,
  claudeEmployee: ClaudeEmployeeState,
  socialStudio: SocialStudioState,
  contentEngine: ContentEngineState,
) {
  const namedTunnelConfig = resolveNamedTunnelConfig();
  const [local3001, publicClarity, apexDomain] = await Promise.all([
    pingUrl("http://127.0.0.1:3001/"),
    pingUrl("https://clarityccrn.chapaisolutions.com/"),
    pingUrl("https://chapaisolutions.com/"),
  ]);

  const services: ServiceHealth[] = [
    {
      key: "local-app",
      label: "Local app shell",
      status: local3001.ok ? "live" : "down",
      detail: local3001.ok ? "Primary local production port is reachable on 3001." : `Local app not reachable (${local3001.detail}).`,
      action: local3001.ok ? "No human fix needed." : "Restart the local prod server with the legacy-env launcher.",
      provenance: "live http probe",
    },
    {
      key: "named-tunnel",
      label: "Named Cloudflare tunnel",
      status: publicClarity.ok ? "live" : namedTunnelConfig ? "degraded" : "unknown",
      detail: publicClarity.ok
        ? "clarityccrn.chapaisolutions.com is answering."
        : namedTunnelConfig
          ? `Configured via ${path.basename(namedTunnelConfig.path)} -> ${namedTunnelConfig.service}, but the public hostname is not healthy.`
          : "No local named-tunnel config was found.",
      action: publicClarity.ok ? "No human fix needed." : "Run the named tunnel and verify its ingress points at the ChapAI app port.",
      provenance: namedTunnelConfig ? `cloudflared config + public probe` : "public probe",
    },
    {
      key: "apex-domain",
      label: "Primary apex domain",
      status: apexDomain.ok ? "live" : "degraded",
      detail: apexDomain.ok
        ? "chapaisolutions.com is resolving to a live app surface."
        : `chapaisolutions.com is still not serving the primary app (${apexDomain.detail}).`,
      action: apexDomain.ok ? "No human fix needed." : "Fix the Cloudflare apex mapping after the named tunnel stays healthy.",
      provenance: "public probe",
    },
    {
      key: "quick-tunnel",
      label: "Quick tunnel fallback",
      status: "degraded",
      detail: "Fallback launcher exists locally for temporary public access if the named tunnel is down.",
      action: "Use the quick-tunnel launcher only while the named tunnel is being repaired.",
      provenance: "local launcher scripts",
    },
    {
      key: "guild-loop",
      label: "Guild continuity loop",
      status:
        guildLoop.lastUpdatedAt && (parseIsoAge(guildLoop.lastUpdatedAt) ?? 999) <= 10
          ? "live"
          : guildLoop.lastUpdatedAt
            ? "degraded"
            : "unknown",
      detail: guildLoop.lastUpdatedAt
        ? `Last continuity cycle ${formatAge(parseIsoAge(guildLoop.lastUpdatedAt))}. ${guildLoop.decision?.ranWorkerCycle ? "Worker cycle auto-ran." : "Monitoring only."}`
        : "Continuity loop has not written state yet.",
      action: guildLoop.lastUpdatedAt
        ? "No human fix needed unless the loop goes stale."
        : "Start the guild stack so restart continuity and cheap generation stay alive.",
      provenance: "config/guild-loop-state.json",
    },
    {
      key: "claude-desktop",
      label: "Claude desktop lane",
      status: claudeDesktop.status,
      detail: claudeDesktop.processOnline
        ? `Claude desktop is running with heartbeat freshness ${claudeDesktop.freshness}${claudeDesktop.bridgeLinked ? " and a linked bridge session." : "."}`
        : "Claude desktop does not appear to be running on this machine.",
      action: claudeDesktop.processOnline ? "No human fix needed." : "Open Claude desktop so the Claude employee lane comes online again.",
      provenance: "local Claude process + heartbeat log + bridge-state.json",
    },
    {
      key: "claude-employee",
      label: "Claude autonomous lane",
      status: !claudeDesktop.processOnline
        ? "degraded"
        : claudeEmployee.status === "live"
          ? "live"
          : claudeEmployee.status === "running"
            ? "live"
            : claudeEmployee.status === "idle"
              ? "degraded"
              : "degraded",
      detail: claudeEmployee.currentTask?.title
        ? `Current task: ${claudeEmployee.currentTask.title}. Queue pending: ${claudeEmployee.queue?.pending ?? 0}.${claudeEmployee.blockedUntil ? ` Next automatic retry ${claudeEmployee.blockedUntil}.` : ""}`
        : claudeEmployee.latestResult?.summary
          ? `Latest result: ${claudeEmployee.latestResult.summary}`
          : normalizeStatusText(claudeEmployee.blocker) ?? "Claude employee queue has not produced a result yet.",
      action:
        claudeEmployee.status === "blocked" && normalizeStatusText(claudeEmployee.blocker) !== "none"
          ? `Wait for the reset window${claudeEmployee.blockedUntil ? ` (${claudeEmployee.blockedUntil})` : ""} or attach an API-token path so Claude can resume bounded queue work.`
          : claudeEmployee.auth?.loggedIn
          ? "Keep Claude on bounded queue tasks and watch for high-signal brain updates."
          : "Authenticate Claude CLI once so queued tasks can run automatically.",
      provenance: "config/claude-employee-state.json + dashboard brain bundle",
    },
    {
      key: "batch-pipeline",
      label: "Nemoclaw batch pipeline",
      status: runtime.lastRun?.route === "run-assigned" || runtime.lastRun?.route === "worker-cycle" ? "live" : "degraded",
      detail: runtime.lastRun?.state ?? "No recent worker-cycle recorded in runtime-state.json.",
      action: "Run `py remote-control\\scripts\\exec_route.py worker-cycle` if generation looks stale.",
      provenance: "runtime-state.json",
    },
    {
      key: "content-engine",
      label: "Overnight content engine",
      status:
        contentEngine.status === "ran" || contentEngine.status === "idle"
          ? "live"
          : contentEngine.status === "blocked"
            ? "degraded"
            : "unknown",
      detail: contentEngine.latestPromoted?.file
        ? `Latest promoted batch: ${contentEngine.latestPromoted.file}. Reason: ${contentEngine.reason ?? "none"}.`
        : "No content-engine state has been written yet.",
      action:
        contentEngine.status === "blocked"
          ? "Run the content engine script or inspect the latest worker-cycle output."
          : "No human fix needed unless the promoted batch stops advancing.",
      provenance: "config/content-engine-state.json",
    },
    {
      key: "checkout",
      label: "Checkout readiness",
      status: String(revenue.checkoutStatus ?? "").includes("verified") ? "live" : "degraded",
      detail: revenue.checkoutStatus ?? "No checkout status recorded.",
      action: String(revenue.checkoutStatus ?? "").includes("verified") ? "No human fix needed." : "Verify Stripe session creation and webhook state in the active app.",
      provenance: "revenue-state.json",
    },
    {
      key: "growth-studio",
      label: "Growth studio lane",
      status:
        socialStudio.status === "running" || socialStudio.status === "ready"
          ? "live"
          : socialStudio.status === "blocked"
            ? "degraded"
            : "unknown",
      detail: socialStudio.currentTask?.title
        ? `Current task: ${socialStudio.currentTask.title}. Pending queue: ${socialStudio.queue?.pending ?? 0}.`
        : socialStudio.latestResult?.summary ?? "Growth studio has not produced a live state snapshot yet.",
      action:
        socialStudio.blocker && normalizeStatusText(socialStudio.blocker) !== "none"
          ? socialStudio.blocker
          : "Keep the outreach queue focused on one distribution wave at a time.",
      provenance: "config/social-studio-state.json",
    },
  ];

  return services;
}

function buildUrgentFixes(
  services: ServiceHealth[],
  runtime: RuntimeState,
  batches: ReturnType<typeof loadBatchState>,
  inbox: OperatorInbox,
  guildLoop: GuildLoopState,
  claudeEmployee: ClaudeEmployeeState,
  socialStudio: SocialStudioState,
  scoutLane: ScoutLaneState,
  geminiAudit: SocialStudioState,
  antigravity: SocialStudioState,
): UrgentFix[] {
  const fixes: UrgentFix[] = [];

  if (claudeEmployee.queue?.pending && claudeEmployee.queue.pending > 0 && !claudeEmployee.auth?.loggedIn) {
    fixes.push({
      id: "claude-auth",
      title: "Claude queue is blocked by auth",
      detail: `${claudeEmployee.queue.pending} Claude tasks are waiting, but Claude CLI is not authenticated.`,
      action: "Run `claude auth login` or `claude setup-token` once on this machine to activate the Claude employee lane.",
      severity: "warning",
      source: "config/claude-employee-state.json",
    });
  }

  if (claudeEmployee.queue?.pending && claudeEmployee.queue.pending > 0 && claudeEmployee.auth?.loggedIn && normalizeStatusText(claudeEmployee.blocker) !== "none") {
    const blockedUntil = claudeEmployee.blockedUntil ?? parseClaudeReset(claudeEmployee.blocker);
    fixes.push({
      id: "claude-blocked",
      title: "Claude queue is blocked by usage limits",
      detail: `${claudeEmployee.queue.pending} Claude tasks are queued, but the lane is currently blocked: ${normalizeStatusText(claudeEmployee.blocker)}${blockedUntil ? ` Next retry ${blockedUntil}.` : ""}`,
      action: blockedUntil
        ? `Let the queue wake back up at ${blockedUntil}, or add an API-token path if you want Claude to resume bounded work sooner.`
        : "Wait for the reset window or add an API-token path if you want Claude to resume automatic bounded work sooner.",
      severity: "warning",
      source: "config/claude-employee-state.json",
    });
  }

  if (socialStudio.queue?.pending && (socialStudio.blocker ?? "").length > 0 && normalizeStatusText(socialStudio.blocker) !== "none") {
    fixes.push({
      id: "growth-studio-blocked",
      title: "Growth studio needs a human action",
      detail: `${socialStudio.queue.pending} growth tasks remain queued. Current block: ${normalizeStatusText(socialStudio.blocker)}.`,
      action: socialStudio.latestResult?.suggestedHumanFix ?? socialStudio.blocker ?? "Open the growth studio queue and execute the highest-priority human step.",
      severity: "info",
      source: "config/social-studio-state.json",
    });
  }

  if (normalizeStatusText(scoutLane.blocker) !== "none") {
    fixes.push({
      id: "scout-blocked",
      title: "Scout lane needs a decision",
      detail: normalizeStatusText(scoutLane.blocker),
      action: scoutLane.latestResult?.suggestedHumanFix ?? "Review the scout memo and clear the blocker.",
      severity: "info",
      source: "config/scout-state.json",
    });
  }

  if (normalizeStatusText(geminiAudit.blocker) !== "none") {
    fixes.push({
      id: "gemini-blocked",
      title: "Gemini audit lane needs attention",
      detail: normalizeStatusText(geminiAudit.blocker),
      action: geminiAudit.latestResult?.suggestedHumanFix ?? "Review the Gemini audit lane and clear the blocker.",
      severity: "info",
      source: "config/gemini-audit-state.json",
    });
  }

  if (normalizeStatusText(antigravity.blocker) !== "none") {
    fixes.push({
      id: "antigravity-blocked",
      title: "Antigravity pod lane is blocked",
      detail: normalizeStatusText(antigravity.blocker),
      action: antigravity.latestResult?.suggestedHumanFix ?? "Review the Antigravity queue and clear the highest-priority pod blocker.",
      severity: "info",
      source: "config/antigravity-state.json",
    });
  }

  for (const service of services) {
    if (service.status === "down" || service.status === "degraded") {
      fixes.push({
        id: `service-${service.key}`,
        title: service.label,
        detail: service.detail,
        action: service.action,
        severity: service.status === "down" ? "critical" : "warning",
        source: service.provenance,
      });
    }
  }

  if (batches.validation !== "valid") {
    fixes.push({
      id: "batch-validation",
      title: "Batch promotion is blocked",
      detail: batches.latestBatchId
        ? `${batches.latestBatchId} is not currently marked valid.`
        : "No validated mixed batch is available yet.",
      action: "Run `worker-cycle` or inspect the latest staged batch before promotion.",
      severity: "warning",
      source: "content staging",
    });
  }

  const runtimeAge = parseIsoAge(runtime.lastUpdatedAt ?? runtime.lastRun?.completedAt ?? null);
  if (runtimeAge !== null && runtimeAge > 90) {
    fixes.push({
      id: "runtime-stale",
      title: "Runtime telemetry is stale",
      detail: `The last runtime update was ${formatAge(runtimeAge)}.`,
      action: "Run `exec self-test` or `exec run-assigned` to refresh live state.",
      severity: "warning",
      source: "runtime-state.json",
    });
  }

  const loopAge = parseIsoAge(guildLoop.lastUpdatedAt ?? null);
  if (loopAge !== null && loopAge > 12) {
    fixes.push({
      id: "guild-loop-stale",
      title: "Guild continuity loop is stale",
      detail: `The last persistence cycle was ${formatAge(loopAge)}.`,
      action: "Restart the guild stack so app, tunnel, and low-token ops resume automatically.",
      severity: "warning",
      source: "config/guild-loop-state.json",
    });
  }

  const openRequests = (inbox.requests ?? []).filter((item) => item.status === "open");
  if (openRequests.length > 0) {
    fixes.push({
      id: "open-directives",
      title: "Open operator directives remain",
      detail: `${openRequests.length} operator requests are still open in the inbox.`,
      action: "Acknowledge or close stale directives so the dashboard reflects only active needs.",
      severity: "info",
      source: "operator-inbox.json",
    });
  }

  const rank = { critical: 0, warning: 1, info: 2 } as const;
  return fixes
    .sort((left, right) => {
      const severityDelta = rank[left.severity] - rank[right.severity];
      if (severityDelta !== 0) {
        return severityDelta;
      }
      if (left.id === "claude-auth") {
        return -1;
      }
      if (right.id === "claude-auth") {
        return 1;
      }
      return left.title.localeCompare(right.title);
    })
    .slice(0, 7);
}

export async function getMissionControlSnapshot(): Promise<MissionControlSnapshot> {
  const workspaceRoot = resolveWorkspaceRoot();
  const legacyRoot = resolveLegacyRoot(workspaceRoot);
  const summary = getLiveContentSummary();
  const brainBundle = loadBrains(workspaceRoot);
  const brains = brainBundle.brains;
  const revenue = safeReadJson<RevenueState>(path.join(legacyRoot, "remote-control", "config", "revenue-state.json"), {});
  const runtime = safeReadJson<RuntimeState>(path.join(legacyRoot, "remote-control", "config", "runtime-state.json"), {});
  const inbox = safeReadJson<OperatorInbox>(path.join(legacyRoot, "remote-control", "config", "operator-inbox.json"), {});
  const batches = loadBatchState(workspaceRoot);
  const nclexRefinement = loadNclexRefinementTopUpState(workspaceRoot);
  const guildLoop = loadGuildLoopState(workspaceRoot);
  const retrospective = loadGuildRetrospectiveState(workspaceRoot);
  const heartbeats = mergeHeartbeatSources(loadAgentHeartbeats(workspaceRoot), await loadCloudAgentHeartbeats());
  const claudeEmployee = loadClaudeEmployeeState(workspaceRoot);
  const socialStudio = loadSocialStudioState(workspaceRoot);
  const scoutLane = loadScoutLaneState(workspaceRoot);
  const contentEngine = loadContentEngineState(workspaceRoot);
  const managerLane = loadManagerLaneState(workspaceRoot);
  const geminiAudit = safeReadJson<SocialStudioState>(path.join(workspaceRoot, "config", "gemini-audit-state.json"), {});
  const antigravity = safeReadJson<SocialStudioState>(path.join(workspaceRoot, "config", "antigravity-state.json"), {});
  const capabilityInventory = safeReadJson<{ principles?: string[]; systems?: Array<{ id: string; category: string; bestUse?: string[] }> }>(
    path.join(workspaceRoot, "config", "capability-inventory.json"),
    {},
  );
  const providerRegistry = safeReadJson<{ providers?: Record<string, unknown> }>(
    path.join(workspaceRoot, "config", "provider-adapter-registry.json"),
    {},
  );
  const claudeDesktop = probeClaudeDesktop();
  const employeeRegistry = loadEmployeeRegistry(workspaceRoot, brains);
  const liveServices = await loadLiveServices(runtime, revenue, claudeDesktop, guildLoop, claudeEmployee, socialStudio, contentEngine);
  const agents = loadLegacyAgentState(workspaceRoot, legacyRoot, brains, brainBundle.statusByAgent, heartbeats, employeeRegistry).map((agent) => {
    if (agent.id !== "claude-code") {
      return agent;
    }

    const latestSummary = claudeEmployee.latestResult?.summary;
    const queuePending = claudeEmployee.queue?.pending ?? 0;
    const blockedUntil = claudeEmployee.blockedUntil ?? parseClaudeReset(claudeEmployee.blocker);
    const truthLevel: MissionControlSnapshot["agents"][number]["truthLevel"] = claudeDesktop.processOnline ? "live-probe" : "runtime-file";
    const blocker =
      !claudeDesktop.processOnline
        ? "desktop offline"
        : claudeEmployee.blocker && normalizeStatusText(claudeEmployee.blocker) !== "none"
          ? normalizeStatusText(claudeEmployee.blocker)
          : queuePending > 0 && !claudeEmployee.auth?.loggedIn
            ? "cli auth required"
            : "none";
    const freshnessMinutes = parseIsoAge(claudeEmployee.lastRunAt ?? null);
    const outputToday = Math.max(agent.outputToday, claudeEmployee.latestResult?.summary ? 1 : 0);
    const state = !claudeDesktop.processOnline
      ? "stale"
      : blockedUntil && queuePending > 0
        ? "sleeping"
        : deriveOperatingState({
            rawState: claudeEmployee.status,
            blocker,
            truthLevel,
            freshnessMinutes,
            current: claudeEmployee.currentTask?.title ?? agent.current,
          });

    return {
      ...agent,
      state,
      current:
        claudeEmployee.currentTask?.title
          ? `${claudeEmployee.currentTask.title} (${claudeEmployee.currentTask.kind ?? "task"})${blockedUntil ? ` | next retry ${blockedUntil}` : ""}`
          : claudeDesktop.processOnline
            ? `Claude desktop is online${claudeDesktop.bridgeLinked ? " with bridge session linked" : ""}.`
            : "Claude desktop is offline.",
      latest:
        latestSummary
          ? latestSummary
          : claudeDesktop.localSessionId
            ? `Local session ${claudeDesktop.localSessionId.slice(0, 8)} is present in Claude desktop state.`
            : agent.latest,
      blocker,
      freshness: claudeEmployee.lastRunAt ? formatAge(freshnessMinutes) : claudeDesktop.freshness,
      provenance: "brain bundle + Claude desktop probe + claude employee state",
      truthLevel,
      lastRuntimeUpdateAt: claudeEmployee.lastRunAt ?? null,
      lastBrainUpdateAt: agent.lastBrainUpdateAt,
      blockerSeverity: deriveBlockerSeverity(blocker),
      outputToday,
      workflowSuggestion:
        queuePending > 0 && blockedUntil
          ? `Keep the queue pending until ${blockedUntil}, then let Claude resume bounded work automatically.`
          : agent.workflowSuggestion,
      employeeHealth: deriveEmployeeHealth({
        freshnessMinutes,
        blocker,
        activeContext: agent.brainStatus === "linked" ? (brains.find((brain) => brain.agentId === agent.id)?.activeContext ?? []) : [],
        durableCount: brains.find((brain) => brain.agentId === agent.id)?.durableCount ?? 0,
        memoryEventCount: brains.find((brain) => brain.agentId === agent.id)?.memoryEventCount ?? 0,
        outputToday,
        swarmReadiness: brains.find((brain) => brain.agentId === agent.id)?.swarmReadiness ?? "seedling",
      }),
    };
  }).map((agent) => {
    if (agent.id !== "social-studio") {
      return agent;
    }

    const blocker = normalizeStatusText(socialStudio.blocker);
    const pending = socialStudio.queue?.pending ?? 0;
    const freshnessMinutes = parseIsoAge(socialStudio.lastHeartbeatAt ?? socialStudio.lastRunAt ?? null);
    const truthLevel: MissionControlSnapshot["agents"][number]["truthLevel"] = isRuntimeFileStale({
      freshnessMinutes,
      staleAfterMinutes: socialStudio.staleAfterMinutes,
      rawState: socialStudio.semanticStatus ?? socialStudio.status ?? "ready",
    })
      ? "stale-telemetry"
      : "runtime-file";
    const outputToday = Math.max(agent.outputToday, socialStudio.queue?.completed ?? 0);
    const state = deriveOperatingState({
      rawState: socialStudio.semanticStatus ?? socialStudio.status ?? "ready",
      blocker,
      truthLevel,
      freshnessMinutes,
      staleAfterMinutes: socialStudio.staleAfterMinutes,
      current: socialStudio.currentTask?.title ?? agent.current,
    });

    return {
      ...agent,
      state,
      current:
        socialStudio.currentTask?.title
          ? `${socialStudio.currentTask.title} (${socialStudio.currentTask.kind ?? "growth"})`
          : "Preparing the next outreach and creator-distribution wave.",
      latest: socialStudio.latestResult?.summary ?? agent.latest,
      blocker,
      freshness: socialStudio.lastHeartbeatAt ?? socialStudio.lastRunAt ? formatAge(freshnessMinutes) : agent.freshness,
      provenance: "brain bundle + social studio state",
      truthLevel,
      lastRuntimeUpdateAt: socialStudio.lastHeartbeatAt ?? socialStudio.lastRunAt ?? null,
      blockerSeverity: deriveBlockerSeverity(blocker),
      outputToday,
      workflowSuggestion:
        blocker !== "none"
          ? socialStudio.latestResult?.suggestedHumanFix ?? "Use one manual posting window to unlock the next growth cycle."
          : pending > 0
            ? "Keep the queue on one posting wave, one creator wave, and one partnership wave at a time."
            : agent.workflowSuggestion,
      employeeHealth: deriveEmployeeHealth({
        freshnessMinutes,
        blocker,
        activeContext: brains.find((brain) => brain.agentId === agent.id)?.activeContext ?? [],
        durableCount: brains.find((brain) => brain.agentId === agent.id)?.durableCount ?? 0,
        memoryEventCount: brains.find((brain) => brain.agentId === agent.id)?.memoryEventCount ?? 0,
        outputToday,
        swarmReadiness: brains.find((brain) => brain.agentId === agent.id)?.swarmReadiness ?? "seedling",
      }),
    };
  }).map((agent) => {
    if (agent.id !== "manager") {
      return agent;
    }

    const blocker = normalizeStatusText(managerLane.blocker);
    const freshnessMinutes = parseIsoAge(managerLane.lastHeartbeatAt ?? managerLane.lastRunAt ?? null);
    const truthLevel: MissionControlSnapshot["agents"][number]["truthLevel"] = isRuntimeFileStale({
      freshnessMinutes,
      staleAfterMinutes: managerLane.staleAfterMinutes,
      rawState: managerLane.semanticStatus ?? managerLane.status ?? "running",
    })
      ? "stale-telemetry"
      : "runtime-file";
    const state = deriveOperatingState({
      rawState: managerLane.semanticStatus ?? managerLane.status ?? "running",
      blocker,
      truthLevel,
      freshnessMinutes,
      staleAfterMinutes: managerLane.staleAfterMinutes,
      current: managerLane.currentTask?.title ?? "Keep all lanes moving",
    });

    return {
      ...agent,
      state,
      current: managerLane.currentTask?.title ?? "Keep all lanes moving",
      latest: managerLane.latestResult?.summary ?? agent.latest,
      blocker,
      freshness: managerLane.lastHeartbeatAt ?? managerLane.lastRunAt ? formatAge(freshnessMinutes) : agent.freshness,
      provenance: "brain bundle + manager lane state",
      truthLevel,
      lastRuntimeUpdateAt: managerLane.lastHeartbeatAt ?? managerLane.lastRunAt ?? null,
      blockerSeverity: deriveBlockerSeverity(blocker),
      workflowSuggestion:
        blocker !== "none"
          ? managerLane.latestResult?.suggestedHumanFix ?? "Clear the top blocker and keep the manager loop running."
          : "Keep the manager lane compressing state and surfacing only the highest-leverage human actions.",
      employeeHealth: deriveEmployeeHealth({
        freshnessMinutes,
        blocker,
        activeContext: brains.find((brain) => brain.agentId === agent.id)?.activeContext ?? [],
        durableCount: brains.find((brain) => brain.agentId === agent.id)?.durableCount ?? 0,
        memoryEventCount: brains.find((brain) => brain.agentId === agent.id)?.memoryEventCount ?? 0,
        outputToday: agent.outputToday,
        swarmReadiness: brains.find((brain) => brain.agentId === agent.id)?.swarmReadiness ?? "seedling",
      }),
    };
  }).map((agent) => {
    if (agent.id !== "scout") {
      return agent;
    }

    const blocker = normalizeStatusText(scoutLane.blocker);
    const freshnessMinutes = parseIsoAge(scoutLane.lastHeartbeatAt ?? scoutLane.lastRunAt ?? null);
    const truthLevel: MissionControlSnapshot["agents"][number]["truthLevel"] = isRuntimeFileStale({
      freshnessMinutes,
      staleAfterMinutes: scoutLane.staleAfterMinutes,
      rawState: scoutLane.semanticStatus ?? scoutLane.status ?? "ready",
    })
      ? "stale-telemetry"
      : "runtime-file";
    const state = deriveOperatingState({
      rawState: scoutLane.semanticStatus ?? scoutLane.status ?? "ready",
      blocker,
      truthLevel,
      freshnessMinutes,
      staleAfterMinutes: scoutLane.staleAfterMinutes,
      current: scoutLane.currentTask?.title ?? "Maintain the next-product recommendation",
    });

    return {
      ...agent,
      state,
      current: scoutLane.currentTask?.title ?? "Maintain the next-product recommendation",
      latest: scoutLane.latestResult?.summary ?? agent.latest,
      blocker,
      freshness: scoutLane.lastHeartbeatAt ?? scoutLane.lastRunAt ? formatAge(freshnessMinutes) : agent.freshness,
      provenance: "brain bundle + scout state",
      truthLevel,
      lastRuntimeUpdateAt: scoutLane.lastHeartbeatAt ?? scoutLane.lastRunAt ?? null,
      blockerSeverity: deriveBlockerSeverity(blocker),
      workflowSuggestion:
        blocker !== "none"
          ? scoutLane.latestResult?.suggestedHumanFix ?? "Clear the scout blocker and keep only one next-product direction active."
          : "Keep one next-product memo warm, but do not let the scout lane steal focus from revenue work.",
      employeeHealth: deriveEmployeeHealth({
        freshnessMinutes,
        blocker,
        activeContext: brains.find((brain) => brain.agentId === agent.id)?.activeContext ?? [],
        durableCount: brains.find((brain) => brain.agentId === agent.id)?.durableCount ?? 0,
        memoryEventCount: brains.find((brain) => brain.agentId === agent.id)?.memoryEventCount ?? 0,
        outputToday: agent.outputToday,
        swarmReadiness: brains.find((brain) => brain.agentId === agent.id)?.swarmReadiness ?? "seedling",
      }),
    };
  });
  const localUnifiedGuild = loadUnifiedGuildState(workspaceRoot, agents, brains);
  const unifiedGuild = mergeUnifiedGuildStates(localUnifiedGuild, await loadCloudUnifiedGuildState());
  const urgentFixes = buildUrgentFixes(
    liveServices,
    runtime,
    batches,
    inbox,
    guildLoop,
    claudeEmployee,
    socialStudio,
    scoutLane,
    geminiAudit,
    antigravity,
  );

  const snapshotBase = {
    product: {
      ccrnLiveQuestions: summary.ccrn.live,
      ccrnDraftQuestions: summary.ccrn.draft,
      nclexLiveQuestions: summary.nclex.live,
      nclexDraftQuestions: summary.nclex.draft,
      nclexMcqLiveQuestions: summary.nclex.mcqLive,
      nclexNgnLiveQuestions: summary.nclex.ngnLive,
      nclexNgnRatio: summary.nclex.ngnRatio,
      nclexApprovedRefinedUsable: nclexRefinement.approvedRefinedUsableUnique ?? summary.nclex.live,
      nclexTopUpNeeded: nclexRefinement.topUpNeeded ?? summary.nclex.live < 5000,
      nclexRemainingTo5000: nclexRefinement.remainingTo5000 ?? Math.max(0, 5000 - summary.nclex.live),
      nclexRefinementGeneratedAt: nclexRefinement.generatedAt ?? null,
    },
    retrospective: {
      generatedAt: retrospective.generatedAt ?? null,
      roomState: retrospective.roomState ?? "guild-sync",
      wins: retrospective.wins ?? [],
      blockers: retrospective.blockers ?? [],
      next: retrospective.next ?? [],
    },
    urgentFixes,
    liveServices,
    brains,
    unifiedGuild,
    employeeRegistry: employeeRegistry.map((entry) => ({
      agentId: entry.id,
      displayName: entry.nickname,
      runtime: entry.runtime,
      role: entry.role,
      avatar: entry.avatar,
      goals: entry.goals ?? [],
      workflowContract: entry.workflowContract ?? [],
      brainPath: entry.brainPath,
      queuePath: entry.queuePath,
      statePath: entry.statePath,
      heartbeatId: entry.heartbeatId ?? entry.id,
      presentation: entry.presentation ?? inferPresentationProfile(entry),
    })),
    agents,
    batches,
    runtime: {
      primaryRepo: "chapai",
      fallbackRepo: "ccrn-agent",
      stripeMode: revenue.liveCutoverStatus === "live" ? "live" : revenue.liveCutoverStatus === "pending" ? "test" : "unknown",
      deploymentTarget: "chapaisolutions.com",
      checkoutStatus: revenue.checkoutStatus ?? "unknown",
      managerCadence: "1-2 min",
      runtimeState: resolveRuntimeState(runtime),
      openDirectives: (inbox.requests ?? []).filter((request) => request.status === "open").length,
    },
    capabilities: {
      providerCount: Object.keys(providerRegistry.providers ?? {}).length,
      unlockedSystems: (capabilityInventory.systems ?? []).map((system) => system.id),
      lowCostFirst: (capabilityInventory.systems ?? [])
        .filter((system) => ["low-cost-utility", "cheap-content", "remote-ops"].includes(system.category))
        .map((system) => system.id),
      premiumEscalation: (capabilityInventory.systems ?? [])
        .filter((system) => ["premium-build", "premium-review", "external-audit"].includes(system.category))
        .map((system) => system.id),
      highlights: (capabilityInventory.systems ?? []).slice(0, 6).map((system) => ({
        id: system.id,
        category: system.category,
        bestUse: system.bestUse ?? [],
      })),
    },
  } satisfies Omit<MissionControlSnapshot, "boardroom">;
  const boardroom = await getBoardroomState(snapshotBase as MissionControlSnapshot);

  return {
    ...snapshotBase,
    boardroom,
  } satisfies MissionControlSnapshot;
}
