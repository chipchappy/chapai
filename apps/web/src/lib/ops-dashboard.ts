import "server-only";

import fs from "node:fs";
import path from "node:path";
import { getAgenticGrowthState } from "@/lib/agentic-growth";
import type { AgentLiveTelemetry, MissionControlSnapshot } from "@/lib/types";
import { readOpsOverrides } from "@/lib/ops-control";
import { listHeartbeatSupervision } from "@/lib/ops-heartbeats";
import { getPhase6NclexState } from "@/lib/phase6-nclex";
import { getTelegramControlSummary } from "@/lib/telegram-control";
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

function agentConfidence(agent: MissionControlSnapshot["unifiedGuild"]["agents"][number]) {
  const base = 0.62 + Math.min(0.18, agent.stats.skills * 0.015) + Math.min(0.12, agent.stats.durableMemories * 0.01);
  const stalePenalty = agent.state.toLowerCase().includes("stale") || agent.truthLevel.toLowerCase().includes("stale") ? 0.12 : 0;
  const blockerPenalty = agent.blocker && agent.blocker !== "none" ? 0.05 : 0;
  return Math.max(0.45, Math.min(0.95, Number((base - stalePenalty - blockerPenalty).toFixed(2))));
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
  const telegramControl = getTelegramControlSummary();
  const phase6Nclex = getPhase6NclexState();
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
  const agenticGrowth = getAgenticGrowthState(agents.map((agent) => agent.id));
  const toolPermissions = Array.from(agenticGrowth.lanePermissions.values());
  const agentNow: AgentLiveTelemetry[] = agents.map((agent) => {
    const permission = agenticGrowth.lanePermissions.get(agent.id);
    const latestInvocation = agenticGrowth.invocations.find((row) => row.agentId === agent.id);
    const latestSkill = agenticGrowth.skillGrowth.find((row) => row.ownerLane === agent.id);
    const latestMemory = [...agenticGrowth.memoryPromotions, ...agenticGrowth.rejectedMemories].find((row) => row.ownerLane === agent.id);
    const latestProfit = agenticGrowth.profitPatterns.find((row) => row.ownerLane === agent.id);
    const proofPath =
      latestInvocation?.proofPaths[0]
      ?? latestSkill?.proofPath
      ?? latestProfit?.sourceProof
      ?? agent.sources[0]?.path
      ?? "apps/web/src/lib/mission-control.ts";
    const learningMoment =
      latestSkill
        ? `${latestSkill.skillName}: ${latestSkill.successfulApplications} proven uses, ${latestSkill.confoundedApplications} confounded.`
        : latestMemory
          ? `${latestMemory.promotionStatus}: ${latestMemory.candidateMemory}`
          : agent.brain.recentEvents[0] ?? "No fresh learning event recorded.";
    const approvalState =
      latestProfit?.approvalNeeded
        ?? (permission?.mode === "blocked"
          ? "blocked"
          : permission?.mode === "approval-required"
            ? "approval required for external action"
            : permission?.mode === "draft-only"
              ? "draft-only"
              : "read-only");

    return {
      agentId: agent.id,
      displayName: agent.displayName,
      role: agent.role,
      runtime: agent.runtime,
      laneStatus: agent.state,
      truthLevel: agent.state.toLowerCase().includes("stale") && agent.truthLevel === "stale-telemetry"
        ? "stale file-backed telemetry"
        : agent.truthLevel,
      currentAction: agent.currentTask,
      nextPlan: agent.plan,
      blocker: agent.blocker,
      learningMoment,
      proofPath,
      queuePending: agent.stats.pendingExperiments + agent.stats.blockedTasks,
      approvalState,
      sourceTaint: permission?.sourceTaintDefault ?? "unvalidated",
      heartbeatFreshness: formatAge(agent.sources[0]?.updatedAt),
      confidence: agentConfidence(agent),
      toolMode: permission?.mode ?? "approval-required",
    };
  });

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
      id: "telegram-control-ledger",
      lane: "comms",
      at: telegramControl.latest[0]?.at ?? telegram.generatedAt ?? null,
      text: telegramControl.health === "live"
        ? `Telegram control ledger has ${telegramControl.commands} commands, ${telegramControl.outboundQueued} queued replies, ${telegramControl.pendingApproval} approval intents, and ${telegramControl.confirmationRequired} confirmation-required controls.`
        : "No Telegram control ledger is present yet; webhook and offline command tooling are ready to populate it.",
      status: telegramControl.health === "live" ? "live" : "missing-ledger",
    },
  ];

  const growthItems = growthQueue.items ?? [];
  const growthKpis = {
    signups: "unwired",
    dau: "unwired",
    conversion: "unwired",
    trafficSources: agenticGrowth.growthEngine.measurement.rows.length
      ? agenticGrowth.growthEngine.measurement.rows.map((row) => `${row.source}: ${row.status}`).slice(0, 6)
      : ["GSC pending", "GA4 pending", "Plausible pending", "billing replica pending"],
    approvals: growthItems.length + agenticGrowth.growthEngine.queue.pending,
    blocked: growthItems.filter((item) => item.blocker && item.blocker !== "none").length + agenticGrowth.growthEngine.measurement.pending,
    socialSent: socialDispatch.sent ?? 0,
    emailSent: emailDispatch.sent ?? 0,
    updatedAt: agenticGrowth.growthEngine.lastAuditAt ?? growthQueue.generatedAt ?? fileMtime("config/growth-approval-queue.json"),
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
    ...agenticGrowth.goals.slice(0, 3).map((goal) => ({
      id: goal.id,
      label: goal.text,
      owner: goal.owner,
      progress: goal.progress.percent,
      blocked: goal.status === "active" && goal.progress.percent < 100,
      detail: `${goal.status} / ${goal.approvalBoundary} / ${goal.progress.detail}`,
    })),
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
    ...phase6Nclex.lanes.map((lane) => ({
      id: `phase6-${lane.lane ?? "lane"}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: lane.goal ?? `${lane.lane ?? "Phase 6"} NCLEX objective`,
      owner: lane.lane ?? "Phase 6",
      progress: Number(lane.progress ?? 0),
      blocked: Boolean(lane.blocked),
      detail: `${lane.status ?? "unknown"} / ${(lane.nextActions ?? []).slice(0, 1).join(" ") || "no next action recorded"}`,
    })),
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
    {
      item: "Telegram command ledger",
      status: telegramControl.health,
      detail: `${telegramControl.commands} commands, ${telegramControl.controlIntents} control intents, ${telegramControl.outboundQueued} queued replies.`,
    },
    {
      item: "Phase 6 NCLEX orchestration",
      status: phase6Nclex.health,
      detail: `${phase6Nclex.lanes.length} lanes, ${phase6Nclex.blockers.length} blockers, ${phase6Nclex.kpis.liveQuestions}/${phase6Nclex.kpis.targetQuestions} live questions.`,
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
    phase6Nclex,
    telegramControl,
    overrides,
    heartbeats,
    brainVaults,
    dataLayer,
    agentNow,
    profitRadar: agenticGrowth.profitPatterns.slice(0, 6),
    agenticGrowth: {
      ...agenticGrowth.summary,
      growthEngine: agenticGrowth.growthEngine,
      guardrailPosture: agenticGrowth.guardrails.posture ?? "approval-gated",
      blockedExternalActions: agenticGrowth.guardrails.blockedExternalActions ?? [],
    },
    toolPermissions,
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
      approvals: growthItems.length + snapshot.unifiedGuild.approvalQueue.length + telegramControl.pendingApproval,
      profitCandidates: agenticGrowth.summary.profitCandidates,
      learningCandidates: agenticGrowth.summary.memoryCandidates,
      rejectedMemory: agenticGrowth.summary.memoryRejected,
      confoundedMemory: agenticGrowth.summary.confoundedMemory,
    },
    freshness: {
      telegram: formatAge(telegram.generatedAt ?? telegram.lastHealthyAt),
      growth: formatAge(growthKpis.updatedAt),
      boardroom: formatAge(snapshot.boardroom.updatedAt),
      guildLoop: formatAge(snapshot.unifiedGuild.sourceHealth.guildLoopUpdatedAt),
    },
  };
}
