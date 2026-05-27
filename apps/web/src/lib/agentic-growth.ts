import "server-only";

import fs from "node:fs";
import path from "node:path";
import type {
  AgentInvocationRecord,
  GoalDirective,
  MemoryPromotionRecord,
  ProfitPatternCandidate,
  SkillGrowthRecord,
  ToolPermissionContract,
} from "@/lib/types";

type ToolPermissionFile = {
  schemaVersion?: string;
  updatedAt?: string;
  defaultPolicy?: {
    mode?: ToolPermissionContract["mode"];
    sourceTaintDefault?: string;
    approvalRequiredFor?: string[];
    blockedActions?: string[];
  };
  lanePermissions?: Record<string, Partial<ToolPermissionContract>>;
};

type GuardrailPolicy = {
  schemaVersion?: string;
  updatedAt?: string;
  posture?: string;
  blockedExternalActions?: string[];
  allowedWithoutApproval?: string[];
  approvalTicketSources?: string[];
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

function readJson<T>(relativePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(workspaceRoot(), relativePath), "utf8")) as T;
  } catch {
    return fallback;
  }
}

function readJsonl<T>(relativePath: string): T[] {
  try {
    return fs.readFileSync(path.join(workspaceRoot(), relativePath), "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as T];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

function readText(relativePath: string, fallback = "") {
  try {
    return fs.readFileSync(path.join(workspaceRoot(), relativePath), "utf8");
  } catch {
    return fallback;
  }
}

function listFiles(relativePath: string) {
  try {
    return fs.readdirSync(path.join(workspaceRoot(), relativePath), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name !== ".gitkeep")
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function listDirectories(relativePath: string) {
  try {
    return fs.readdirSync(path.join(workspaceRoot(), relativePath), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function fileMtime(relativePath: string) {
  try {
    return fs.statSync(path.join(workspaceRoot(), relativePath)).mtime.toISOString();
  } catch {
    return null;
  }
}

function parseStateReadiness(stateText: string) {
  const rows = stateText
    .split(/\r?\n/)
    .filter((line) => line.startsWith("| ") && !line.includes("---"))
    .map((line) => line.split("|").map((cell) => cell.trim()).filter(Boolean))
    .filter((cells) => cells.length >= 5 && cells[0] !== "Source");

  return rows.map((cells) => ({
    source: cells[0],
    status: cells[1],
    lastVerified: cells[2],
    reviewer: cells[3],
    notes: cells[4],
  }));
}

function normalizeGoalDirective(value: Partial<GoalDirective>): GoalDirective | null {
  if (!value.id || !value.text) return null;
  return {
    schemaVersion: value.schemaVersion ?? "chapai.goal-directive.v1",
    id: value.id,
    createdAt: value.createdAt ?? new Date(0).toISOString(),
    updatedAt: value.updatedAt,
    source: value.source ?? "unknown",
    sourcePath: value.sourcePath,
    text: value.text,
    owner: value.owner ?? "orchestrator",
    status: value.status ?? "active",
    linkedLanes: Array.isArray(value.linkedLanes) ? value.linkedLanes : [],
    successSignals: Array.isArray(value.successSignals) ? value.successSignals : [],
    approvalBoundary: value.approvalBoundary ?? "approval-required-for-external-actions",
    proofPaths: Array.isArray(value.proofPaths) ? value.proofPaths : [],
    progress: {
      state: value.progress?.state ?? "recorded",
      percent: Number(value.progress?.percent ?? 0),
      detail: value.progress?.detail ?? "Goal directive recorded without progress details.",
    },
  };
}

function connectorGoalDirectives() {
  return readJsonl<{
    event_type?: string;
    emitted_at?: string;
    source?: string;
    payload?: Partial<GoalDirective> & { goal?: Partial<GoalDirective> };
  }>("connectors/telegram/goal_directive.jsonl")
    .filter((event) => event.event_type === "goal_directive")
    .flatMap((event) => {
      const payload = event.payload?.goal ?? event.payload ?? {};
      const normalized = normalizeGoalDirective({
        ...payload,
        source: payload.source ?? "telegram",
        createdAt: payload.createdAt ?? event.emitted_at,
      });
      return normalized ? [normalized] : [];
    });
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function getAgenticGrowthState(agentIds: string[]) {
  const goals = uniqueById([
    ...connectorGoalDirectives(),
    ...readJsonl<GoalDirective>("config/agent-goal-directives.jsonl").flatMap((item) => {
      const normalized = normalizeGoalDirective(item);
      return normalized ? [normalized] : [];
    }),
  ]).sort((left, right) => Date.parse(right.updatedAt ?? right.createdAt) - Date.parse(left.updatedAt ?? left.createdAt));

  const invocations = readJsonl<AgentInvocationRecord>("config/agent-invocation-ledger.jsonl");
  const memoryPromotions = readJsonl<MemoryPromotionRecord>("config/memory-promotion-ledger.jsonl");
  const rejectedMemories = readJsonl<MemoryPromotionRecord>("config/rejected-memory-ledger.jsonl");
  const skillGrowth = readJsonl<SkillGrowthRecord>("config/skill-use-ledger.jsonl");
  const profitPatterns = readJsonl<ProfitPatternCandidate>("config/profit-pattern-candidates.jsonl")
    .sort((left, right) => right.confidence - left.confidence || Date.parse(right.createdAt) - Date.parse(left.createdAt));
  const guardrails = readJson<GuardrailPolicy>("config/external-action-guardrails.json", {});
  const permissionsFile = readJson<ToolPermissionFile>("config/agent-tool-permissions.json", {});
  const growthState = readText("growth/STATE.md");
  const growthAudit = readJsonl<{
    timestamp?: string;
    agent?: string;
    action_taken?: string;
    artifact_path?: string;
    dry_run?: boolean;
  }>("growth/audit_log.jsonl");
  const measurementRows = parseStateReadiness(growthState);
  const growthQueue = {
    pending: listFiles("growth/approval-queue/pending").length,
    approved: listFiles("growth/approval-queue/approved").length,
    published: listFiles("growth/approval-queue/published").length,
    rejected: listFiles("growth/approval-queue/rejected").length,
  };
  const growthEngine = {
    present: Boolean(growthState),
    stateUpdatedAt: fileMtime("growth/STATE.md"),
    auditEvents: growthAudit.length,
    lastAuditAt: growthAudit.at(-1)?.timestamp ?? fileMtime("growth/audit_log.jsonl"),
    agents: listDirectories("growth/agents").filter((name) => name !== "shared").length,
    campaigns: listDirectories("growth/campaigns").length,
    seoPages: (readText("growth/pages/seo/_registry.yaml").match(/^\s*-\s+slug:/gm) ?? []).length,
    queue: growthQueue,
    measurement: {
      rows: measurementRows,
      pending: measurementRows.filter((row) => row.status === "pending").length,
      ready: measurementRows.filter((row) => /ready|verified|active|live/i.test(row.status)).length,
      blocked: measurementRows.filter((row) => /blocked|missing|failed/i.test(row.status)).length,
    },
  };
  const defaultPolicy = permissionsFile.defaultPolicy ?? {};
  const lanePermissions = new Map<string, ToolPermissionContract>();

  for (const agentId of agentIds) {
    const local = permissionsFile.lanePermissions?.[agentId] ?? {};
    lanePermissions.set(agentId, {
      agentId,
      mode: local.mode ?? defaultPolicy.mode ?? "approval-required",
      allowedTools: local.allowedTools ?? [],
      approvalRequiredFor: local.approvalRequiredFor ?? defaultPolicy.approvalRequiredFor ?? [],
      blockedActions: local.blockedActions ?? defaultPolicy.blockedActions ?? [],
      sourceTaintDefault: local.sourceTaintDefault ?? defaultPolicy.sourceTaintDefault ?? "unvalidated",
    });
  }

  const promotionRows = [...memoryPromotions, ...rejectedMemories];
  const summary = {
    activeGoals: goals.filter((goal) => goal.status === "active").length,
    invocations: invocations.length,
    memoryCandidates: promotionRows.filter((row) => row.promotionStatus === "candidate").length,
    memoryApproved: promotionRows.filter((row) => row.promotionStatus === "approved-durable").length,
    memoryRejected: promotionRows.filter((row) => row.promotionStatus === "rejected").length,
    confoundedMemory: promotionRows.filter((row) => row.dedupeState === "confounded").length,
    skillRecords: skillGrowth.length,
    skillFailures: skillGrowth.reduce((sum, row) => sum + row.failedApplications + row.confoundedApplications, 0),
    profitCandidates: profitPatterns.length,
    approvalRequiredProfitCandidates: profitPatterns.filter((row) => row.approvalNeeded && row.approvalNeeded !== "none").length,
    growthQueuePending: growthEngine.queue.pending,
    growthQueueApproved: growthEngine.queue.approved,
    growthQueuePublished: growthEngine.queue.published,
    growthQueueRejected: growthEngine.queue.rejected,
    growthAuditEvents: growthEngine.auditEvents,
    growthAgents: growthEngine.agents,
    growthCampaigns: growthEngine.campaigns,
    growthSeoPages: growthEngine.seoPages,
    measurementPending: growthEngine.measurement.pending,
    measurementReady: growthEngine.measurement.ready,
  };

  return {
    goals,
    invocations,
    memoryPromotions,
    rejectedMemories,
    skillGrowth,
    profitPatterns,
    guardrails,
    growthEngine,
    lanePermissions,
    summary,
  };
}
