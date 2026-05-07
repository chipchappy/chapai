import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { MissionControlSnapshot } from "@/lib/types";
import { readOpsOverrides } from "@/lib/ops-control";
import { listHeartbeatSupervision } from "@/lib/ops-heartbeats";
import { getUnifiedEventSummary } from "@/lib/unified-events";

type TelegramAlertState = {
  generatedAt?: string;
  status?: string;
  checks?: Record<string, string>;
  batch?: string;
  problems?: string[];
  lastHealthyAt?: string;
};

type GrowthApprovalQueue = {
  generatedAt?: string;
  topGrowthMoves?: string[];
  items?: Array<{
    lane?: string;
    status?: string;
    approvalMode?: string;
    nextAction?: string;
    blocker?: string;
    sourcePath?: string;
  }>;
};

type DispatchState = {
  generatedAt?: string;
  status?: string;
  mode?: string;
  approved?: number;
  sent?: number;
  blocked?: number;
  blocker?: string;
  lastDispatchAt?: string;
};

type GrowthRadar = {
  generatedAt?: string;
  title?: string;
  summary?: string;
  nextActions?: string[];
};

type OpportunityRadar = {
  generatedAt?: string;
  opportunities?: Array<{
    title?: string;
    summary?: string;
    platform?: string;
    signal?: string;
  }>;
};

type VaultManifest = {
  agentId?: string;
  qdrantCollection?: string;
  generatedAt?: string;
};

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

function readJson<T>(relativePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(workspaceRoot(), relativePath), "utf8")) as T;
  } catch {
    return fallback;
  }
}

function fileMtime(relativePath: string) {
  try {
    return fs.statSync(path.join(workspaceRoot(), relativePath)).mtime.toISOString();
  } catch {
    return null;
  }
}

function fileExists(relativePath: string) {
  return fs.existsSync(path.join(workspaceRoot(), relativePath));
}

function countMarkdown(dirPath: string) {
  try {
    return fs.readdirSync(dirPath).filter((file) => file.endsWith(".md")).length;
  } catch {
    return 0;
  }
}

function readVaultManifest(agentId: string): VaultManifest | null {
  return readJson<VaultManifest | null>(path.join("brains", agentId, ".chapai-vault.json"), null);
}

function getBrainVaultStatus(agentIds: string[]) {
  const root = workspaceRoot();
  const rows = agentIds.map((agentId) => {
    const vaultRoot = path.join(root, "brains", agentId);
    const manifest = readVaultManifest(agentId);
    const facts = countMarkdown(path.join(vaultRoot, "facts"));
    const skills = countMarkdown(path.join(vaultRoot, "skills"));
    const staging = countMarkdown(path.join(vaultRoot, "staging"));
    const rejected = countMarkdown(path.join(vaultRoot, "rejected"));
    return {
      agentId,
      exists: fs.existsSync(vaultRoot),
      manifest: Boolean(manifest),
      identity: fs.existsSync(path.join(vaultRoot, "identity.md")),
      canonical: facts + skills,
      facts,
      skills,
      staging,
      rejected,
      qdrantCollection: manifest?.qdrantCollection ?? `chapai_${agentId.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_brain`,
      indexStatus: manifest ? "projection-ready" : "missing-manifest",
    };
  });

  return {
    total: rows.length,
    ready: rows.filter((row) => row.exists && row.manifest && row.identity && row.canonical > 0).length,
    canonical: rows.reduce((sum, row) => sum + row.canonical, 0),
    staging: rows.reduce((sum, row) => sum + row.staging, 0),
    rejected: rows.reduce((sum, row) => sum + row.rejected, 0),
    rows,
  };
}

function ageMinutes(iso?: string | null) {
  if (!iso) {
    return null;
  }
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.max(0, Math.round((Date.now() - parsed) / 60000));
}

function formatAge(iso?: string | null) {
  const minutes = ageMinutes(iso);
  if (minutes === null) {
    return "unknown";
  }
  if (minutes < 1) {
    return "now";
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  return `${Math.round(minutes / 60)}h`;
}

export function getOpsDashboardData(snapshot: MissionControlSnapshot) {
  const telegram = readJson<TelegramAlertState>("config/telegram-problem-alert-state.json", {});
  const growthQueue = readJson<GrowthApprovalQueue>("config/growth-approval-queue.json", {});
  const socialDispatch = readJson<DispatchState>("config/social-outbox/dispatch-state.json", {});
  const emailDispatch = readJson<DispatchState>("config/email-outbox/dispatch-state.json", {});
  const growthRadar = readJson<GrowthRadar>("config/email-outbox/growth-radar-latest.json", {});
  const opportunityRadar = readJson<OpportunityRadar>("config/social-outbox/opportunity-radar-latest.json", {});
  const overrides = readOpsOverrides();
  const heartbeats = listHeartbeatSupervision();
  const dataLayer = getUnifiedEventSummary();
  const agents = snapshot.unifiedGuild.agents.length > 0
    ? snapshot.unifiedGuild.agents
    : snapshot.agents.map((agent) => ({
        id: agent.id,
        displayName: agent.nickname,
        nickname: agent.nickname,
        role: agent.role,
        runtime: agent.runtime,
        state: agent.state,
        truthLevel: agent.truthLevel,
        currentTask: agent.current,
        latest: agent.latest,
        blocker: agent.blocker,
        plan: agent.workflowSuggestion,
        theories: [],
        experiments: [],
        trialsAndErrors: [],
        stats: {
          level: 1,
          xp: 0,
          skills: 0,
          durableMemories: 0,
          memoryEvents: 0,
          activeContexts: 0,
          pendingExperiments: 0,
          completedTasks: agent.outputToday,
          blockedTasks: agent.blocker === "none" ? 0 : 1,
          sourceCount: 1,
        },
        brain: {
          health: agent.brainStatus,
          lastCuratedAt: agent.lastBrainUpdateAt,
          nextSkillTarget: null,
          activeContext: [],
          durableMemory: [],
          skills: [],
          recentEvents: [],
        },
        sources: [],
      }));

  const laneMap = new Map<string, {
    lane: string;
    agents: number;
    live: number;
    blocked: number;
    stale: number;
    queueDepth: number;
    tokenSpend: string;
    errorRate: number;
  }>();

  for (const agent of agents) {
    const existing = laneMap.get(agent.role) ?? {
      lane: agent.role,
      agents: 0,
      live: 0,
      blocked: 0,
      stale: 0,
      queueDepth: 0,
      tokenSpend: "unmetered",
      errorRate: 0,
    };
    existing.agents += 1;
    existing.live += /live|running/i.test(agent.state) ? 1 : 0;
    existing.blocked += agent.blocker && agent.blocker !== "none" ? 1 : 0;
    existing.stale += /stale|missing|unwired|presentation/i.test(`${agent.state} ${agent.truthLevel}`) ? 1 : 0;
    existing.queueDepth += agent.stats.pendingExperiments + agent.stats.blockedTasks;
    existing.errorRate = Math.round((existing.blocked / Math.max(existing.agents, 1)) * 100);
    laneMap.set(agent.role, existing);
  }

  const telegramMessages = [
    {
      id: "telegram-health",
      lane: "alerts",
      at: telegram.generatedAt ?? telegram.lastHealthyAt ?? fileMtime("config/telegram-problem-alert-state.json"),
      text: `Telegram alert health is ${telegram.status ?? "unknown"}; public ${telegram.checks?.public ?? "n/a"}, guild ${telegram.checks?.["guild-access"] ?? "n/a"}, tutor ${telegram.checks?.["ai-tutor"] ?? "n/a"}.`,
      status: telegram.problems?.length ? "attention" : "healthy",
    },
    {
      id: "telegram-ledger-gap",
      lane: "comms",
      at: telegram.generatedAt ?? null,
      text: "No last-100 Telegram message ledger is present in the repo; only alert health state is observable.",
      status: "missing-ledger",
    },
  ];

  const growthItems = growthQueue.items ?? [];
  const growthKpis = {
    signups: "unwired",
    dau: "unwired",
    conversion: "unwired",
    trafficSources: ["social approval queue", "email approval queue"],
    approvals: growthItems.length,
    blocked: growthItems.filter((item) => item.blocker && item.blocker !== "none").length,
    socialSent: socialDispatch.sent ?? 0,
    emailSent: emailDispatch.sent ?? 0,
    updatedAt: growthQueue.generatedAt ?? fileMtime("config/growth-approval-queue.json"),
  };

  const intelDigest = [
    ...snapshot.boardroom.digest,
    ...snapshot.retrospective.wins.slice(0, 3),
    ...(growthQueue.topGrowthMoves ?? []).slice(0, 3),
    ...(growthRadar.nextActions ?? []).slice(0, 2),
    ...(opportunityRadar.opportunities ?? []).slice(0, 2).map((item) =>
      [item.platform, item.title, item.signal ?? item.summary].filter(Boolean).join(" - "),
    ),
  ].filter(Boolean).slice(0, 12);

  const tokenEconomics = {
    total: "unmetered",
    budgetState: "missing meter",
    rows: agents.slice(0, 12).map((agent) => ({
      agentId: agent.id,
      lane: agent.role,
      model: agent.runtime,
      spend: "unmetered",
      budget: "unset",
      routing: agent.runtime === "claude" ? "premium escalation" : agent.runtime === "gemini" ? "free long-context" : "core/local lane",
    })),
  };

  const goalTree = [
    {
      id: "goal-nclex-2000",
      label: "NCLEX live bank to 2,000+ questions",
      owner: "Product-Ops",
      progress: Math.min(100, Math.round((snapshot.product.nclexLiveQuestions / 2000) * 100)),
      blocked: snapshot.product.nclexLiveQuestions < 2000,
      detail: `${snapshot.product.nclexLiveQuestions} live, ${snapshot.product.nclexDraftQuestions} draft`,
    },
    {
      id: "goal-ngn-60",
      label: "NGN distribution at or above 60%",
      owner: "Product-Ops",
      progress: Math.min(100, Math.round((snapshot.product.nclexNgnRatio / 60) * 100)),
      blocked: snapshot.product.nclexNgnRatio < 60,
      detail: `${snapshot.product.nclexNgnRatio}% NGN live`,
    },
    {
      id: "goal-growth-loop",
      label: "Growth approval loop",
      owner: "Growth",
      progress: growthItems.length ? 60 : 15,
      blocked: growthKpis.blocked > 0,
      detail: `${growthItems.length} approval lanes, ${growthKpis.blocked} blocked`,
    },
    {
      id: "goal-agent-observability",
      label: "Swarm observability baseline",
      owner: "Orchestrator",
      progress: snapshot.unifiedGuild.stats.totalAgents > 0 ? 70 : 20,
      blocked: snapshot.urgentFixes.length > 0,
      detail: `${snapshot.unifiedGuild.stats.totalAgents} agents, ${snapshot.urgentFixes.length} operator issues`,
    },
  ];
  const brainVaults = getBrainVaultStatus(agents.map((agent) => agent.id));

  const phase2Infrastructure = [
    { label: "heartbeat ingress", path: "apps/web/src/app/heartbeats/route.ts", ready: fileExists("apps/web/src/app/heartbeats/route.ts") },
    { label: "watchdog", path: "scripts/ops/chapai-watchdog.mjs", ready: fileExists("scripts/ops/chapai-watchdog.mjs") },
    { label: "redis queue adapter", path: "scripts/ops/chapai-queue.mjs", ready: fileExists("scripts/ops/chapai-queue.mjs") },
    { label: "systemd units", path: "infra/systemd", ready: fileExists("infra/systemd/chapai-watchdog.service") },
    { label: "nightly backup", path: "scripts/ops/chapai-backup.mjs", ready: fileExists("scripts/ops/chapai-backup.mjs") },
    { label: "observability compose", path: "infra/hetzner/docker-compose.phase2.yml", ready: fileExists("infra/hetzner/docker-compose.phase2.yml") },
    { label: "agent vaults", path: "scripts/ops/initialize-agent-vaults.mjs", ready: fileExists("scripts/ops/initialize-agent-vaults.mjs") },
    { label: "memory steward", path: "scripts/ops/memory-steward.mjs", ready: fileExists("scripts/ops/memory-steward.mjs") },
    { label: "qdrant sync", path: "scripts/ops/sync-qdrant-brains.mjs", ready: fileExists("scripts/ops/sync-qdrant-brains.mjs") },
  ];

  const phaseReadiness = [
    {
      item: "Operator route",
      status: "live",
      detail: "/ops is operator-gated through the existing dashboard access context.",
    },
    {
      item: "Passkey auth",
      status: "gap",
      detail: "WebAuthn credential storage is not present; current auth is private key/session based.",
    },
    {
      item: "Realtime transport",
      status: "gap",
      detail: "Pusher/soketi is not provisioned; server refresh runs every 30 seconds.",
    },
    {
      item: "Override command bus",
      status: "live",
      detail: `${overrides.commands.length} retained commands; GET/POST API is available for watchdog consumers.`,
    },
    {
      item: "Heartbeat supervision",
      status: heartbeats.restartDue > 0 ? "attention" : "live",
      detail: `${heartbeats.total} agents tracked, ${heartbeats.restartDue} restart-due by the 3-missed-ping rule.`,
    },
    {
      item: "Phase 2 deploy files",
      status: phase2Infrastructure.every((item) => item.ready) ? "live" : "partial",
      detail: `${phase2Infrastructure.filter((item) => item.ready).length}/${phase2Infrastructure.length} required deploy artifacts present.`,
    },
    {
      item: "Unified event stream",
      status: dataLayer.health,
      detail: `${dataLayer.events} events across ${dataLayer.sources.length} sources; ${dataLayer.invalid} invalid rows.`,
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    generatedAge: "now",
    agents,
    lanes: Array.from(laneMap.values()).sort((left, right) => right.blocked - left.blocked || left.lane.localeCompare(right.lane)),
    goalTree,
    telegramMessages,
    growthKpis,
    intelDigest,
    tokenEconomics,
    overrides,
    heartbeats,
    brainVaults,
    dataLayer,
    phaseReadiness,
    phase2Infrastructure,
    stats: {
      liveAgents: snapshot.unifiedGuild.agents.length > 0 ? snapshot.unifiedGuild.stats.live : snapshot.agents.filter((agent) => agent.state === "live").length,
      blockedAgents: snapshot.unifiedGuild.agents.length > 0 ? snapshot.unifiedGuild.stats.blocked : snapshot.agents.filter((agent) => agent.blocker !== "none").length,
      totalAgents: agents.length,
      memoryEntries: snapshot.unifiedGuild.stats.totalDurableMemories,
      skills: snapshot.unifiedGuild.stats.totalSkills,
      nclexLive: snapshot.product.nclexLiveQuestions,
      nclexNgn: snapshot.product.nclexNgnLiveQuestions,
      nclexNgnRatio: snapshot.product.nclexNgnRatio,
      nclexDraft: snapshot.product.nclexDraftQuestions,
      nclexApproved: snapshot.product.nclexApprovedRefinedUsable,
      nclexTo2000: Math.max(0, 2000 - snapshot.product.nclexLiveQuestions),
      providerCount: snapshot.capabilities.providerCount || snapshot.unifiedGuild.providerReadiness.totalProviders,
      approvals: growthItems.length + snapshot.unifiedGuild.approvalQueue.length,
    },
    freshness: {
      telegram: formatAge(telegram.generatedAt ?? telegram.lastHealthyAt),
      growth: formatAge(growthKpis.updatedAt),
      boardroom: formatAge(snapshot.boardroom.updatedAt),
      guildLoop: formatAge(snapshot.unifiedGuild.sourceHealth.guildLoopUpdatedAt),
    },
  };
}
