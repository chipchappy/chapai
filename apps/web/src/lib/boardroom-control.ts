import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { hasDatabase, resolveEnv, type Env } from "@/lib/db";
import type {
  BoardroomCheckpointBundle,
  BoardroomMeetingLifecycle,
  BoardroomMeetingSnapshot,
  BoardroomStateSnapshot,
  MissionControlSnapshot,
} from "@/lib/types";

type BoardroomStatement = {
  bind: (...values: Array<string | number | null>) => BoardroomStatement;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  run: () => Promise<{ success?: boolean }>;
};

type BoardroomBinding = {
  prepare: (sql: string) => BoardroomStatement;
};

type BoardroomRow = {
  payload: string;
};

const BOARDROOM_STATE_ID = "boardroom-live-state";

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

function boardroomStatePath() {
  return path.join(workspaceRoot(), "config", "boardroom-state.json");
}

function createEmptyBoardroomState(): BoardroomStateSnapshot {
  return {
    accessMode: "preview-key-unified",
    cadence: "daily-standup",
    updatedAt: null,
    digest: [],
    activeMeeting: null,
    latestCompletedMeeting: null,
  };
}

function readFileState() {
  try {
    const filePath = boardroomStatePath();
    if (!fs.existsSync(filePath)) {
      return createEmptyBoardroomState();
    }
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as BoardroomStateSnapshot;
    return {
      ...createEmptyBoardroomState(),
      ...parsed,
    };
  } catch {
    return createEmptyBoardroomState();
  }
}

function saveFileState(state: BoardroomStateSnapshot) {
  try {
    const filePath = boardroomStatePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2) + "\n", "utf8");
  } catch {
    // Ignore file writes when the runtime is read-only.
  }
}

function asBoardroomBinding(env: Partial<Env>): BoardroomBinding | null {
  if (!hasDatabase(env) || !env.DB) {
    return null;
  }

  return env.DB as BoardroomBinding;
}

async function ensureBoardroomStore(binding: BoardroomBinding) {
  await binding.prepare(`
    CREATE TABLE IF NOT EXISTS boardroom_state (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `).run();
}

async function readPersistedBoardroomState() {
  const env = resolveEnv();
  const binding = asBoardroomBinding(env);

  if (binding) {
    await ensureBoardroomStore(binding);
    const row = await binding.prepare(`
      SELECT payload
      FROM boardroom_state
      WHERE id = ?
      LIMIT 1
    `).bind(BOARDROOM_STATE_ID).first<BoardroomRow>();

    if (row?.payload) {
      try {
        const parsed = JSON.parse(row.payload) as BoardroomStateSnapshot;
        return {
          ...createEmptyBoardroomState(),
          ...parsed,
        };
      } catch {
        // Fall through to the local file mirror.
      }
    }
  }

  return readFileState();
}

async function writePersistedBoardroomState(state: BoardroomStateSnapshot) {
  const nextState = {
    ...state,
    updatedAt: new Date().toISOString(),
  } satisfies BoardroomStateSnapshot;

  const env = resolveEnv();
  const binding = asBoardroomBinding(env);
  if (binding) {
    await ensureBoardroomStore(binding);
    await binding.prepare(`
      INSERT INTO boardroom_state (id, payload, updated_at)
      VALUES (?, ?, unixepoch())
      ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = unixepoch()
    `).bind(BOARDROOM_STATE_ID, JSON.stringify(nextState)).run();
  }

  saveFileState(nextState);
  return nextState;
}

function uniqueLines(values: Array<string | null | undefined>, limit = 4) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
        .filter((value) => value.toLowerCase() !== "none"),
    ),
  ).slice(0, limit);
}

function checkpointStatusForAgent(agent: MissionControlSnapshot["agents"][number]): BoardroomCheckpointBundle["status"] {
  if (agent.truthLevel === "presentation-only" || agent.truthLevel === "unwired") {
    return "unreachable";
  }
  if (agent.state === "stale") {
    return "unreachable";
  }
  if (agent.brainStatus === "corrupt") {
    return "blocked";
  }
  if (agent.state === "blocked" || agent.blocker !== "none") {
    return "blocked";
  }
  return "meeting-hold";
}

function buildCheckpointBundle(
  agent: MissionControlSnapshot["agents"][number],
  snapshot: MissionControlSnapshot,
): BoardroomCheckpointBundle {
  const brain = snapshot.brains.find((candidate) => candidate.agentId === agent.id);
  return {
    agentId: agent.id,
    nickname: agent.nickname,
    runtime: agent.runtime,
    status: checkpointStatusForAgent(agent),
    currentTask: agent.current,
    blocker: agent.blocker,
    latestFinding: agent.latest,
    usefulShareouts: uniqueLines([
      agent.latest,
      agent.workflowSuggestion,
      brain?.lastContribution,
      brain?.capabilityFocus?.[0],
    ]),
    candidateDurableMemories: uniqueLines(brain?.durableMemory?.slice(0, 3) ?? [], 3),
    candidateSkillUpdates: uniqueLines([brain?.nextSkillTarget, ...(brain?.skills.slice(0, 2) ?? [])], 3),
    lastCheckpointAt: agent.lastRuntimeUpdateAt ?? agent.lastBrainUpdateAt ?? snapshot.retrospective.generatedAt,
    telemetrySource:
      agent.truthLevel === "live-probe"
        ? "live telemetry"
        : agent.truthLevel === "stale-telemetry"
          ? "stale telemetry"
          : agent.truthLevel === "presentation-only" || agent.truthLevel === "unwired"
            ? "unwired lane"
        : agent.presentation
          ? "presentation metadata"
          : "derived dashboard state",
  };
}

function writeSummonTicket(meeting: BoardroomMeetingSnapshot) {
  try {
    const ticketDir = path.join(workspaceRoot(), "config", "boardroom-summons");
    fs.mkdirSync(ticketDir, { recursive: true });
    const ticket = {
      meetingId: meeting.meetingId,
      createdAt: meeting.requestedAt,
      status: meeting.status,
      autoResume: meeting.autoResume,
      requestedBy: meeting.requestedBy,
      reason: meeting.reason,
      checkpointRequests: meeting.checkpoints.map((checkpoint) => ({
        agentId: checkpoint.agentId,
        runtime: checkpoint.runtime,
        requestedStatus: checkpoint.status,
        currentTask: checkpoint.currentTask,
      })),
    };
    fs.writeFileSync(path.join(ticketDir, `${meeting.meetingId}.json`), JSON.stringify(ticket, null, 2) + "\n", "utf8");
  } catch {
    // Local ticketing is best-effort; D1/file boardroom state remains authoritative.
  }
}

function buildDigest(snapshot: MissionControlSnapshot, state?: BoardroomStateSnapshot) {
  const liveAgents = snapshot.agents.filter((agent) => agent.state === "live").length;
  const blockedAgents = snapshot.agents.filter((agent) => agent.state === "blocked").length;
  const activeMeeting = state?.activeMeeting;
  return uniqueLines([
    `${snapshot.product.nclexLiveQuestions} NCLEX live and ${snapshot.product.ccrnLiveQuestions} CCRN live are currently published.`,
    `${liveAgents} agents are live, with ${blockedAgents} lanes blocked.`,
    snapshot.retrospective.wins[0],
    snapshot.retrospective.next[0] ? `Next shift: ${snapshot.retrospective.next[0]}` : null,
    activeMeeting ? `Board meeting ${activeMeeting.meetingId.slice(0, 8)} is ${activeMeeting.status}.` : "Boardroom is ready for the next standup.",
  ], 5);
}

function buildMeetingSummary(checkpoints: BoardroomCheckpointBundle[]) {
  const blocked = checkpoints.filter((checkpoint) => checkpoint.status === "blocked").length;
  const unreachable = checkpoints.filter((checkpoint) => checkpoint.status === "unreachable").length;
  const ready = checkpoints.filter((checkpoint) => checkpoint.status !== "unreachable").length;
  return `${ready} employees checked in, ${blocked} blocked, ${unreachable} unreachable.`;
}

function appendLifecycle(
  lifecycle: BoardroomMeetingSnapshot["lifecycle"],
  status: BoardroomMeetingLifecycle,
  note: string,
) {
  return [...lifecycle, { status, at: new Date().toISOString(), note }];
}

export async function getBoardroomState(snapshot?: MissionControlSnapshot) {
  const state = await readPersistedBoardroomState();
  if (!snapshot) {
    return state;
  }

  return {
    ...state,
    digest: buildDigest(snapshot, state),
  } satisfies BoardroomStateSnapshot;
}

export async function summonAllAgents(input: {
  snapshot: MissionControlSnapshot;
  requestedBy: string;
  reason?: string;
  autoResume?: boolean;
}) {
  const checkpoints = input.snapshot.agents.map((agent) => buildCheckpointBundle(agent, input.snapshot));
  const arrivedCount = checkpoints.filter((checkpoint) => checkpoint.status !== "unreachable").length;
  const meeting: BoardroomMeetingSnapshot = {
    meetingId: randomUUID(),
    status: "in-meeting",
    requestedAt: new Date().toISOString(),
    requestedBy: input.requestedBy,
    reason: input.reason?.trim() || "Manual board meeting summon triggered from the boardroom.",
    autoResume: input.autoResume ?? true,
    quorumTarget: Math.max(1, Math.ceil(Math.max(arrivedCount, 1) * 0.7)),
    totalAgents: checkpoints.length,
    arrivedCount,
    currentPresenterId: checkpoints.find((checkpoint) => checkpoint.status === "meeting-hold")?.agentId ?? checkpoints[0]?.agentId ?? null,
    summary: buildMeetingSummary(checkpoints),
    lifecycle: [
      {
        status: "checkpointing",
        at: new Date().toISOString(),
        note: "Cooperative checkpoint bundles requested from every reachable lane.",
      },
      {
        status: "ready",
        at: new Date().toISOString(),
        note: "All reachable lanes checkpointed or were accounted for as blocked/unreachable.",
      },
      {
        status: "in-meeting",
        at: new Date().toISOString(),
        note: "Boardroom podium is active and new task pickup is paused for cooperative lanes.",
      },
    ],
    checkpoints,
    knowledgePipeline: {
      rawMeetingNotes: uniqueLines([
        input.snapshot.retrospective.wins[0],
        input.snapshot.retrospective.blockers[0],
        input.snapshot.retrospective.next[0],
      ], 3),
      candidateMemoryPromotions: uniqueLines(checkpoints.flatMap((checkpoint) => checkpoint.candidateDurableMemories), 6),
      candidateSkillPromotions: uniqueLines(checkpoints.flatMap((checkpoint) => checkpoint.candidateSkillUpdates), 6),
      approvedDurableUpdates: [],
    },
  };

  const current = await readPersistedBoardroomState();
  writeSummonTicket(meeting);
  const nextState: BoardroomStateSnapshot = {
    ...current,
    activeMeeting: meeting,
    digest: buildDigest(input.snapshot, {
      ...current,
      activeMeeting: meeting,
    }),
  };

  return writePersistedBoardroomState(nextState);
}

export async function closeActiveBoardMeeting(snapshot: MissionControlSnapshot | null, requestedBy: string) {
  const current = await readPersistedBoardroomState();
  if (!current.activeMeeting) {
    return current;
  }

  const completedMeeting: BoardroomMeetingSnapshot = {
    ...current.activeMeeting,
    status: "completed",
    summary: `${current.activeMeeting.summary} Auto-resume ${current.activeMeeting.autoResume ? "is armed" : "is disabled"} after synthesis by ${requestedBy}.`,
    lifecycle: appendLifecycle(
      appendLifecycle(
        appendLifecycle(current.activeMeeting.lifecycle, "synthesizing", "The manager compressed shareouts into a reusable boardroom digest."),
        "resuming",
        current.activeMeeting.autoResume
          ? "Cooperative lanes may resume their prior bounded tasks."
          : "Meeting ended without auto-resume; lanes remain paused until a manual wake command.",
      ),
      "completed",
      `Meeting closed by ${requestedBy}.`,
    ),
  };

  const nextState: BoardroomStateSnapshot = {
    ...current,
    activeMeeting: null,
    latestCompletedMeeting: completedMeeting,
    digest: snapshot ? buildDigest(snapshot, { ...current, activeMeeting: null, latestCompletedMeeting: completedMeeting }) : current.digest,
  };

  return writePersistedBoardroomState(nextState);
}
