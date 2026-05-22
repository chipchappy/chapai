"use client";

import BoardroomControlPanel from "@/components/dashboard/BoardroomControlPanel";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { MissionControlSnapshot } from "@/lib/types";

type Member = MissionControlSnapshot["agents"][number] & {
  brain?: MissionControlSnapshot["brains"][number];
};
type UnifiedAgent = MissionControlSnapshot["unifiedGuild"]["agents"][number];

type DossierTab = "status" | "brain" | "experiments" | "events" | "blocks";
type WorkerDisplayState = "working" | "idle" | "offline" | "blocked" | "looped";

function uniqueLines(...lists: Array<Array<string | null | undefined> | undefined>) {
  return lists
    .flatMap((list) => list ?? [])
    .map((item) => String(item ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

function toneClass(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes("live") || lower.includes("ok") || lower.includes("working") || lower.includes("linked")) {
    return "guild-tone-live";
  }
  if (
    lower.includes("warn") ||
    lower.includes("pending") ||
    lower.includes("degraded") ||
    lower.includes("info") ||
    lower.includes("sleep") ||
    lower.includes("ready")
  ) {
    return "guild-tone-warn";
  }
  return "guild-tone-down";
}

function displayState(member: Member): { label: WorkerDisplayState; tone: WorkerDisplayState } {
  const current = member.current.toLowerCase();

  if (member.state === "blocked" || member.blocker !== "none") {
    return { label: "blocked", tone: "blocked" };
  }

  if (member.state === "stale") {
    return { label: "offline", tone: "offline" };
  }

  if (
    member.state === "live" &&
    (member.id === "manager" ||
      member.id === "nemoclaw" ||
      current.includes("cycle") ||
      current.includes("queue") ||
      current.includes("promot") ||
      current.includes("sweep") ||
      current.includes("heartbeat") ||
      current.includes("engine"))
  ) {
    return { label: "looped", tone: "looped" };
  }

  if (member.state === "live") {
    return { label: "working", tone: "working" };
  }

  return { label: "idle", tone: "idle" };
}

function deriveSuggestion(member: Member) {
  if (member.blocker !== "none") {
    return `Clear the blocker first, then resume bounded work for ${member.nickname}.`;
  }

  if (member.runtime === "claude" && !member.state.toLowerCase().includes("live")) {
    return "Wake Claude only for one bounded premium review lane after the queue is clean.";
  }

  if (member.runtime.includes("nemotron") || member.nickname.toLowerCase().includes("nemoclaw")) {
    return "Keep this lane on cheap batch generation and promote only validated, net-new questions.";
  }

  if ((member.brain?.confidence ?? 0) < 0.82) {
    return "Promote fewer, sharper durable memories so the brain stays clean and reusable.";
  }

  if ((member.brain?.skillCount ?? 0) < 4) {
    return "Keep this worker tightly scoped until the skill ledger is denser and more reliable.";
  }

  return "Keep this worker bounded, refresh telemetry often, and promote durable memory only when it improves the next cycle.";
}

function brainUpdate(member: Member) {
  return member.brain?.lastContribution ?? member.latest;
}

function needsHuman(member: Member) {
  if (member.blocker !== "none") {
    return member.blocker;
  }

  if (member.runtime === "claude" && !member.state.toLowerCase().includes("live")) {
    return "Claude desktop needs to be open and linked.";
  }

  return "No direct human fix needed.";
}

function truthLabel(member: Member) {
  const map: Record<Member["truthLevel"], string> = {
    "live-probe": "live probe",
    "runtime-file": "runtime file",
    "stale-telemetry": "stale telemetry",
    "brain-only": "brain only",
    "presentation-only": "presentation only",
    unwired: "unwired lane",
  };

  return map[member.truthLevel] ?? member.truthLevel;
}

function shortLine(value: string, limit = 72) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 3).trimEnd()}...`;
}

function xpProgress(xp: number) {
  return `${Math.max(8, Math.min(100, xp % 100 || 100))}%`;
}

function stateCounts(members: Member[]) {
  return members.reduce(
    (counts, member) => {
      counts[member.state] += 1;
      return counts;
    },
    { live: 0, sleeping: 0, blocked: 0, stale: 0 } as Record<Member["state"], number>,
  );
}

function selectedUnifiedAgent(snapshot: MissionControlSnapshot, selectedId: string): UnifiedAgent | undefined {
  return snapshot.unifiedGuild.agents.find((agent) => agent.id === selectedId);
}

function stationClass(member: Member) {
  const map: Record<string, string> = {
    orchestrator: "guild-station-anchor",
    frontend: "guild-station-north",
    backend: "guild-station-east",
    content: "guild-station-west",
    manager: "guild-station-center",
    nemoclaw: "guild-station-south",
    "claude-code": "guild-station-lounge",
    "social-studio": "guild-station-garden",
    scout: "guild-station-east-south",
    explorer: "guild-station-explorer",
    "gemini-audit": "guild-station-gemini",
    antigravity: "guild-station-antigravity",
  };

  return map[member.id] ?? "";
}

function activityGlyph(state: WorkerDisplayState) {
  switch (state) {
    case "working":
      return "++";
    case "looped":
      return "<>";
    case "blocked":
      return "!!";
    case "offline":
      return "zz";
    default:
      return "..";
  }
}

function AgentSprite({ member }: { member: Member }) {
  const [primary, surface, accent] = member.avatar.palette;
  const isClaude = member.runtime === "claude";
  const isNemotron = member.runtime.includes("nemotron");
  const isManager = member.id === "manager";
  const isGemini = member.id === "gemini-audit";
  const isAntigravity = member.id === "antigravity";
  const isSocial = member.id === "social-studio";
  const isScout = member.id === "scout" || member.id === "explorer";

  return (
    <div
      className="guild-sprite"
      style={
        {
          "--sprite-primary": primary,
          "--sprite-surface": surface,
          "--sprite-accent": accent,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96" className="guild-sprite-svg" shapeRendering="crispEdges">
        <rect x="28" y="79" width="40" height="5" fill="rgba(85,61,39,0.16)" />
        <rect x="38" y="18" width="20" height="16" rx="2" fill="#f1dcc6" />
        <rect x="36" y="14" width="24" height="7" rx="2" fill={surface} />
        <rect x="34" y="36" width="28" height="22" rx="2" fill={primary} />
        <rect x="30" y="39" width="6" height="19" rx="1.5" fill={primary} />
        <rect x="60" y="39" width="6" height="19" rx="1.5" fill={primary} />
        <rect x="40" y="58" width="7" height="20" rx="1.5" fill={accent} />
        <rect x="49" y="58" width="7" height="20" rx="1.5" fill={accent} />
        <rect x="38" y="76" width="10" height="4" rx="1.5" fill="rgba(70,52,41,0.62)" />
        <rect x="48" y="76" width="10" height="4" rx="1.5" fill="rgba(70,52,41,0.62)" />
        <rect x="43" y="24" width="3" height="3" fill="rgba(61,45,35,0.48)" />
        <rect x="50" y="24" width="3" height="3" fill="rgba(61,45,35,0.48)" />
        <rect x="44" y="29" width="8" height="2" rx="1" fill="rgba(61,45,35,0.26)" />
        <rect x="18" y="16" width="15" height="15" rx="3" fill="rgba(255,250,245,0.96)" stroke="rgba(88,69,53,0.14)" strokeWidth="1.6" />
        <text x="25.5" y="26" textAnchor="middle" fontSize="7" fontWeight="700" fill={primary}>
          {member.avatar.sigil}
        </text>
        <rect x="34" y="44" width="28" height="3" fill="rgba(255,255,255,0.22)" />
        {isClaude ? <rect x="65" y="17" width="10" height="6" rx="2" fill="rgba(198,176,122,0.88)" /> : null}
        {isNemotron ? <circle cx="72" cy="21" r="5" fill="rgba(90,127,136,0.14)" stroke={primary} strokeWidth="1.2" /> : null}
        {isManager ? <path d="M66 19h12l-2 4h-8z" fill="rgba(122,114,144,0.9)" /> : null}
        {isGemini ? <path d="M72 17l4 6l-8 0z" fill="rgba(125,116,184,0.92)" /> : null}
        {isAntigravity ? <path d="M66 18c3-3 8-3 12 0c-3 2-5 5-6 9c-1-4-2-7-6-9z" fill="rgba(112,103,168,0.92)" /> : null}
        {isSocial ? <rect x="66" y="18" width="12" height="5" rx="2" fill="rgba(196,154,86,0.9)" /> : null}
        {isScout ? <path d="M72 16l6 5l-6 5l-6-5z" fill="rgba(108,141,151,0.9)" /> : null}
        <rect x="63" y="52" width="10" height="8" rx="1.5" fill="rgba(88,74,55,0.24)" />
        <rect x="65" y="48" width="6" height="6" rx="1.5" fill="rgba(132,154,161,0.44)" />
      </svg>
    </div>
  );
}

export default function GuildOfficeScene({
  snapshot,
  mode = "dashboard",
  access,
}: {
  snapshot: MissionControlSnapshot;
  mode?: "dashboard" | "boardroom";
  access?: {
    role: "viewer" | "operator";
    displayLabel: string | null;
    accessType: string | null;
    canSummon: boolean;
  };
}) {
  const members = useMemo<Member[]>(
    () =>
      snapshot.agents.map((agent) => ({
        ...agent,
        brain: snapshot.brains.find((brain) => brain.agentId === agent.id),
      })),
    [snapshot],
  );

  const [selectedId, setSelectedId] = useState(snapshot.boardroom.activeMeeting?.currentPresenterId ?? members[0]?.id ?? "");
  const [selectedTab, setSelectedTab] = useState<DossierTab>("status");
  const selected = members.find((member) => member.id === selectedId) ?? members[0];

  if (!selected) {
    return null;
  }

  const selectedDisplayState = displayState(selected);
  const topFixes = snapshot.urgentFixes.slice(0, 3);
  const topServices = snapshot.liveServices.slice(0, 4);
  const syncNext = snapshot.retrospective.next.slice(0, 2);
  const primaryFix = topFixes[0];
  const primaryService = topServices[0];
  const growthOps = members.filter((member) => member.id === "social-studio" || member.id === "outreach-email");
  const meetingForDossier = snapshot.boardroom.activeMeeting ?? snapshot.boardroom.latestCompletedMeeting;
  const selectedCheckpoint = meetingForDossier?.checkpoints.find((checkpoint) => checkpoint.agentId === selected.id);
  const selectedUnified = selectedUnifiedAgent(snapshot, selected.id);
  const selectedUnifiedHealth = selectedUnified?.brain.health ?? selected.brain?.brainHygiene ?? "clean";
  const selectedSources = selectedUnified?.sources ?? [];
  const selectedTheories = selectedUnified?.theories.length ? selectedUnified.theories : selected.brain?.capabilityFocus ?? [];
  const selectedExperiments = selectedUnified?.experiments.length ? selectedUnified.experiments : selected.brain?.workflowContract ?? [];
  const selectedTrialErrors = selectedUnified?.trialsAndErrors ?? [];
  const selectedBrainSkills = selectedUnified?.brain.skills.length ? selectedUnified.brain.skills : selected.brain?.skills ?? [];
  const selectedActiveContext = selectedUnified?.brain.activeContext.length ? selectedUnified.brain.activeContext : selected.brain?.activeContext ?? [];
  const selectedDurableMemory = selectedUnified?.brain.durableMemory.length ? selectedUnified.brain.durableMemory : selected.brain?.durableMemory ?? [];
  const counts = stateCounts(members);
  const selectedLevel = selectedUnified?.stats.level ?? selected.brain?.growthLevel ?? 1;
  const selectedXp = selectedUnified?.stats.xp ?? Math.round((selected.brain?.confidence ?? 0.72) * 100);
  const selectedCurrentGoal = selectedUnified?.currentWorkingGoal ?? selectedUnified?.brain.nextSkillTarget ?? selected.brain?.nextSkillTarget ?? selected.current;
  const selectedPredictions = uniqueLines(
    selectedUnified?.predictions,
    selectedTheories,
    [deriveSuggestion(selected)],
  ).slice(0, 5);
  const selectedExperimentResults = uniqueLines(
    selectedUnified?.experimentResults,
    selectedUnified?.brain.recentEvents,
    selected.brain?.recentEvents?.map((event) => event.summary),
  ).slice(0, 7);
  const selectedCommunications = uniqueLines(
    selectedUnified?.significantCommunications,
    selectedCheckpoint?.usefulShareouts,
    snapshot.boardroom.digest,
    selected.blocker !== "none" ? [`human required: ${selected.blocker}`] : [],
  ).slice(0, 7);
  const selectedSignificantEvents = uniqueLines(
    selectedUnified?.significantEvents,
    selectedUnified?.brain.recentEvents,
    selected.brain?.recentEvents?.map((event) => `${event.kind}: ${event.summary}`),
    selectedCheckpoint ? [`checkpoint: ${selectedCheckpoint.latestFinding}`] : [],
  ).slice(0, 7);
  const selectedHumanRequiredBlocks = uniqueLines(
    selectedUnified?.humanRequiredBlocks,
    selected.blocker !== "none" ? [needsHuman(selected)] : [],
    selectedCheckpoint?.status === "blocked" ? [selectedCheckpoint.blocker] : [],
  ).slice(0, 6);
  const xpWidth = xpProgress(selectedXp);

  return (
    <section className="guild-tavern-shell">
      <div className="guild-tavern-copy">
        <div className="section-label">{mode === "boardroom" ? "boardroom floor" : "guild tavern"}</div>
        <h2>{mode === "boardroom" ? "one podium, one dossier, one clean control rail." : "One warm room, one practical rail."}</h2>
        <p>
          {mode === "boardroom"
            ? "Summon the swarm, inspect checkpoint bundles, and click any employee for the operational view plus the presentation layer."
            : "Every worker stays in the tavern. The rail shows only what matters. Click anyone for the real brain and blocker view."}
        </p>
      </div>

      <div className="guild-command-deck">
        <div className="guild-command-hero-card">
          <div className="guild-command-eyebrow">persistent guild command center</div>
          <h3>{selected.nickname} is selected.</h3>
          <p>{selectedCurrentGoal}</p>
          <div className="guild-command-statline">
            <span>{counts.live} live</span>
            <span>{counts.sleeping} sleeping</span>
            <span>{counts.blocked} blocked</span>
            <span>{counts.stale} stale</span>
          </div>
        </div>

        <div className="guild-roster-grid" aria-label="Agent roster">
          {members.map((member) => {
            const workerState = displayState(member);
            const unified = selectedUnifiedAgent(snapshot, member.id);
            const level = unified?.stats.level ?? member.brain?.growthLevel ?? 1;
            const xp = unified?.stats.xp ?? Math.round((member.brain?.confidence ?? 0.72) * 100);
            return (
              <button
                key={member.id}
                type="button"
                className={`guild-roster-card guild-roster-card-${workerState.tone} ${selected.id === member.id ? "is-selected" : ""}`}
                onClick={() => {
                  setSelectedId(member.id);
                  setSelectedTab("status");
                }}
              >
                <span className="guild-roster-sigil">{member.avatar.sigil}</span>
                <span className="guild-roster-main">
                  <strong>{member.nickname}</strong>
                  <em>{member.role}</em>
                </span>
                <span className="guild-roster-level">lv {level}</span>
                <span className="guild-roster-xp">
                  <span style={{ width: xpProgress(xp) }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {access ? <BoardroomControlPanel boardroom={snapshot.boardroom} access={access} /> : null}

      <div className="guild-tavern-grid">
        <div className="guild-tavern-floor">
          <div className="guild-tavern-beam guild-tavern-beam-left" />
          <div className="guild-tavern-beam guild-tavern-beam-right" />
          <div className="guild-tavern-window guild-tavern-window-a" />
          <div className="guild-tavern-window guild-tavern-window-b" />
          <div className="guild-tavern-rug guild-tavern-rug-main" />
          <div className="guild-tavern-rug guild-tavern-rug-stage" />
          <div className="guild-tavern-banner">
            <span>{mode === "boardroom" ? "boardroom" : "Guild floor"}</span>
            <strong>{snapshot.boardroom.activeMeeting?.status ?? snapshot.runtime.runtimeState}</strong>
          </div>
          <div className="guild-tavern-candle guild-tavern-candle-a" />
          <div className="guild-tavern-candle guild-tavern-candle-b" />
          <div className="guild-tavern-candle guild-tavern-candle-c" />
          <div className="guild-tavern-candle guild-tavern-candle-d" />
          <div className="guild-tavern-light guild-tavern-light-a" />
          <div className="guild-tavern-light guild-tavern-light-b" />
          <div className="guild-tavern-smoke guild-tavern-smoke-a" />
          <div className="guild-tavern-smoke guild-tavern-smoke-b" />
          <div className="guild-tavern-fireplace" />
          <div className="guild-tavern-bar" />
          <div className="guild-tavern-shelf guild-tavern-shelf-a" />
          <div className="guild-tavern-shelf guild-tavern-shelf-b" />
          <div className="guild-tavern-workbench guild-tavern-workbench-a" />
          <div className="guild-tavern-workbench guild-tavern-workbench-b" />
          <div className="guild-tavern-map-table" />
          <div className="guild-tavern-quest-board" />
          <div className="guild-tavern-kegs" />
          <div className="guild-tavern-crates" />
          <div className="guild-tavern-chest" />
          <div className="guild-tavern-plant guild-tavern-plant-a" />
          <div className="guild-tavern-plant guild-tavern-plant-b" />
          <div className="guild-tavern-stage" />
          <div className="guild-tavern-table guild-tavern-table-a" />
          <div className="guild-tavern-table guild-tavern-table-b" />
          <div className="guild-tavern-stool guild-tavern-stool-a" />
          <div className="guild-tavern-stool guild-tavern-stool-b" />
          <div className="guild-tavern-stool guild-tavern-stool-c" />
          <div className="guild-tavern-stool guild-tavern-stool-d" />
          <div className="guild-tavern-lantern guild-tavern-lantern-a" />
          <div className="guild-tavern-lantern guild-tavern-lantern-b" />

          <div className="guild-tavern-stations">
            {members.map((member, index) => {
              const workerState = displayState(member);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(member.id);
                    setSelectedTab("status");
                  }}
                  title={`${member.nickname}: ${member.current}`}
                  className={`guild-station guild-station-${workerState.tone} ${stationClass(member)} ${selected.id === member.id ? "guild-station-selected" : ""}`}
                  style={{ animationDelay: `${index * 120}ms` } as CSSProperties}
                >
                  <div className={`guild-worker-status guild-worker-status-${workerState.tone}`}>
                    <span>{workerState.label}</span>
                  </div>
                  <div className={`guild-worker-aura guild-worker-aura-${workerState.tone}`} aria-hidden="true" />
                  <AgentSprite member={member} />
                  <div className="guild-worker-tag">
                    <strong>{member.nickname}</strong>
                  </div>
                  <div className={`guild-worker-activity guild-worker-activity-${workerState.tone}`}>
                    <span>{activityGlyph(workerState.label)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="guild-tavern-panel">
          <div className="guild-tavern-header">
            <AgentSprite member={selected} />
            <div>
              <div className="guild-tavern-runtime">{selected.runtime}</div>
              <h3>{selected.nickname}</h3>
              <p>{selected.role}</p>
              {selected.presentation ? <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted">{selected.presentation.presentationTitle}</p> : null}
              <p className="mt-1 text-sm text-muted">{selected.brain?.mission ?? "No mission recorded yet."}</p>
              <div className={`guild-state-chip guild-state-chip-${selectedDisplayState.tone}`}>{selectedDisplayState.label}</div>
            </div>
          </div>

          {selected.presentation ? (
            <div className="mt-4 rounded-[20px] border border-border bg-[rgba(251,249,243,0.94)] px-4 py-4">
              <div className="section-label">Presentation mode</div>
              <div className="mt-3 space-y-3 text-sm leading-6 text-dark">
                <p><strong>What they do:</strong> {selected.presentation.whatTheyDo}</p>
                <p><strong>Business growth:</strong> {selected.presentation.howTheyHelpTheBusinessGrow}</p>
                <p><strong>Self growth:</strong> {selected.presentation.howTheyGrowThemselves}</p>
                <p><strong>Off hours:</strong> {selected.presentation.offHours}</p>
              </div>
            </div>
          ) : null}

          <div className="guild-tavern-summary">
            <div>
              <small>Freshness</small>
              <strong>{selected.freshness}</strong>
            </div>
            <div>
              <small>Growth</small>
              <strong>Lv {selectedLevel}</strong>
            </div>
            <div>
              <small>XP</small>
              <strong>{selectedXp}</strong>
            </div>
            <div>
              <small>Sources</small>
              <strong>{selectedSources.length || selected.outputToday}</strong>
            </div>
          </div>

          <div className="guild-player-meter" aria-label={`${selected.nickname} experience meter`}>
            <span style={{ width: xpWidth }} />
          </div>

          <div className="guild-rpg-stat-grid">
            <div>
              <small>skills</small>
              <strong>{selectedBrainSkills.length}</strong>
            </div>
            <div>
              <small>memories</small>
              <strong>{selectedDurableMemory.length}</strong>
            </div>
            <div>
              <small>events</small>
              <strong>{selectedSignificantEvents.length}</strong>
            </div>
            <div>
              <small>blocks</small>
              <strong>{selectedHumanRequiredBlocks.length}</strong>
            </div>
          </div>

          <div className="guild-terminal-stack">
            <div className="guild-terminal-block guild-terminal-block-selected">
              <div className="guild-terminal-head">
                <span>selected worker</span>
                <strong>{truthLabel(selected)}</strong>
              </div>
              <div className="guild-terminal-lines">
                <div className="guild-terminal-line guild-terminal-line-live">
                  <strong>goal</strong>
                  <span>{selectedCurrentGoal}</span>
                </div>
                <div className="guild-terminal-line guild-terminal-line-info">
                  <strong>latest change</strong>
                  <span>{selectedUnified?.latest ?? selected.latest}</span>
                </div>
                <div className="guild-terminal-line guild-terminal-line-info">
                  <strong>prediction</strong>
                  <span>{selectedPredictions[0] ?? deriveSuggestion(selected)}</span>
                </div>
                <div className={`guild-terminal-line guild-terminal-line-${selected.blocker !== "none" ? "warning" : "live"}`}>
                  <strong>human step</strong>
                  <span>{needsHuman(selected)}</span>
                </div>
              </div>
            </div>

            <div className="guild-terminal-block">
              <div className="guild-terminal-head">
                <span>ops console</span>
                <strong>{snapshot.retrospective.roomState}</strong>
              </div>
              <div className="guild-terminal-lines">
                {primaryFix ? (
                  <div className={`guild-terminal-line guild-terminal-line-${primaryFix.severity}`}>
                    <strong>top human fix</strong>
                    <span>{primaryFix.action}</span>
                  </div>
                ) : null}
                <div className="guild-terminal-line guild-terminal-line-live">
                  <strong>content lane</strong>
                  <span>
                    {snapshot.batches.latestBatchId ?? "none"} | {snapshot.product.ccrnDraftQuestions} CCRN |{" "}
                    {snapshot.product.nclexDraftQuestions} NCLEX
                  </span>
                </div>
                {primaryService ? (
                  <div className={`guild-terminal-line guild-terminal-line-${primaryService.status}`}>
                    <strong>{primaryService.label}</strong>
                    <span>{primaryService.detail}</span>
                  </div>
                ) : null}
                {syncNext[0] ? (
                  <div className="guild-terminal-line guild-terminal-line-info">
                    <strong>next sweep</strong>
                    <span>{syncNext[0]}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="guild-terminal-block">
              <div className="guild-terminal-head">
                <span>growth ops</span>
                <strong>{growthOps.filter((member) => member.state === "live").length} live</strong>
              </div>
              <div className="guild-terminal-lines">
                {growthOps.map((member) => {
                  const workerState = displayState(member);
                  return (
                    <div key={member.id} className={`guild-terminal-line guild-terminal-line-${workerState.tone}`}>
                      <strong>{member.nickname}</strong>
                      <span>{member.blocker !== "none" ? member.blocker : shortLine(member.current, 92)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {mode === "boardroom" && snapshot.boardroom.activeMeeting ? (
              <div className="guild-terminal-block">
                <div className="guild-terminal-head">
                  <span>board meeting</span>
                  <strong>{snapshot.boardroom.activeMeeting.status}</strong>
                </div>
                <div className="guild-terminal-lines">
                  <div className="guild-terminal-line guild-terminal-line-live">
                    <strong>summary</strong>
                    <span>{snapshot.boardroom.activeMeeting.summary}</span>
                  </div>
                  <div className="guild-terminal-line guild-terminal-line-info">
                    <strong>requested by</strong>
                    <span>{snapshot.boardroom.activeMeeting.requestedBy}</span>
                  </div>
                  <div className="guild-terminal-line guild-terminal-line-live">
                    <strong>podium</strong>
                    <span>{snapshot.boardroom.activeMeeting.currentPresenterId ?? "rotating"}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="guild-tab-row" role="tablist" aria-label="Employee dossier">
            <button
              type="button"
              className={`guild-tab ${selectedTab === "status" ? "guild-tab-active" : ""}`}
              onClick={() => setSelectedTab("status")}
            >
              Goal
            </button>
            <button
              type="button"
              className={`guild-tab ${selectedTab === "brain" ? "guild-tab-active" : ""}`}
              onClick={() => setSelectedTab("brain")}
            >
              Brain
            </button>
            <button
              type="button"
              className={`guild-tab ${selectedTab === "experiments" ? "guild-tab-active" : ""}`}
              onClick={() => setSelectedTab("experiments")}
            >
              Experiments
            </button>
            <button
              type="button"
              className={`guild-tab ${selectedTab === "events" ? "guild-tab-active" : ""}`}
              onClick={() => setSelectedTab("events")}
            >
              Events
            </button>
            <button
              type="button"
              className={`guild-tab ${selectedTab === "blocks" ? "guild-tab-active" : ""}`}
              onClick={() => setSelectedTab("blocks")}
            >
              Blockers
            </button>
          </div>

          {selectedTab === "status" ? (
            <div className="guild-tavern-details">
              <div className="guild-tavern-body">
                <p><strong>Current working goal:</strong> {selectedCurrentGoal}</p>
                <p><strong>Current action:</strong> {selectedUnified?.currentTask ?? selected.current}</p>
                <p><strong>Latest visible change:</strong> {selectedUnified?.latest ?? selected.latest}</p>
                <p><strong>Prediction:</strong> {selectedPredictions[0] ?? deriveSuggestion(selected)}</p>
                <p><strong>Worker state:</strong> {selectedDisplayState.label}</p>
                <p><strong>Truth level:</strong> {selectedUnified?.truthLevel ?? truthLabel(selected)}</p>
                <p><strong>Data source:</strong> {selectedSources[0]?.label ?? selected.provenance}</p>
                <p><strong>Plan:</strong> {selectedUnified?.plan ?? selected.workflowSuggestion ?? selected.eta}</p>
                <p><strong>Runtime updated:</strong> {selected.lastRuntimeUpdateAt ?? "No runtime timestamp yet."}</p>
                <p><strong>Brain updated:</strong> {selected.lastBrainUpdateAt ?? "No brain timestamp yet."}</p>
                <p>
                  <strong>Employee health:</strong> {selected.employeeHealth.freshness} / {selected.employeeHealth.taskFit} /{" "}
                  {selectedUnifiedHealth}
                </p>
                <div className="guild-chip-row">
                  <span className="guild-chip">{selectedUnified?.stats.memoryEvents ?? selected.brain?.memoryEventCount ?? 0} memory events</span>
                  <span className="guild-chip">{selectedUnified?.stats.durableMemories ?? selected.brain?.durableCount ?? 0} durable facts</span>
                  <span className="guild-chip">{selectedUnified?.stats.pendingExperiments ?? 0} active experiments</span>
                </div>
                <div className="guild-signal-grid">
                  {selectedPredictions.slice(0, 3).map((prediction) => (
                    <div key={prediction} className="guild-signal-card">
                      <small>prediction</small>
                      <strong>{prediction}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {selectedTab === "brain" ? (
            <div className="guild-tavern-details">
              <div className="guild-tavern-body">
                <p><strong>Latest brain addition:</strong> {brainUpdate(selected)}</p>
                <p><strong>Next skill target:</strong> {selectedUnified?.brain.nextSkillTarget ?? selected.brain?.nextSkillTarget ?? "No target recorded yet."}</p>
                <p><strong>Brain hygiene:</strong> {selectedUnifiedHealth}</p>
                <p><strong>Durable memory count:</strong> {selectedUnified?.stats.durableMemories ?? selected.brain?.durableCount ?? 0} promoted facts</p>
                <div className="guild-chip-row">
                  {selectedTheories.slice(0, 4).map((focus) => (
                    <span key={focus} className="guild-chip guild-chip-goal">{focus}</span>
                  ))}
                </div>
                <div className="guild-chip-row">
                  {selectedBrainSkills.slice(0, 8).map((skill) => (
                    <span key={skill} className="guild-chip">{skill}</span>
                  ))}
                </div>
                <div className="guild-chip-row">
                  {selectedActiveContext.slice(0, 6).map((item) => (
                    <span key={item} className="guild-chip">{item}</span>
                  ))}
                </div>
                <div className="guild-chip-row">
                  {(selected.brain?.goals ?? []).slice(0, 4).map((goal) => (
                    <span key={goal} className="guild-chip guild-chip-goal">{goal}</span>
                  ))}
                </div>
                <ul className="guild-memory-list">
                  {selectedDurableMemory.slice(0, 5).map((memory) => (
                    <li key={memory}>{memory}</li>
                  ))}
                </ul>
                {selectedSources.length > 0 ? (
                  <div className="guild-source-grid">
                    {selectedSources.slice(0, 5).map((source) => (
                      <div key={`${source.kind}-${source.path}`}>
                        <small>{source.kind}</small>
                        <strong>{source.label}</strong>
                        <span>{source.updatedAt}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="guild-events-list">
                  {(selected.brain?.recentEvents ?? []).slice(0, 4).map((event) => (
                    <div key={event.id} className="guild-event-card">
                      <small>{event.kind} | {Math.round(event.confidence * 100)}%</small>
                      <strong>{event.summary}</strong>
                      <span>{event.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {selectedTab === "experiments" ? (
            <div className="guild-tavern-details">
              <div className="guild-tavern-body">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[16px] border border-border bg-[rgba(255,252,247,0.72)] p-3">
                    <small className="text-[10px] uppercase tracking-[0.18em] text-muted">stats</small>
                    <p className="mt-2 text-sm text-dark">
                      Lv {selectedUnified?.stats.level ?? selected.brain?.growthLevel ?? 1} | {selectedUnified?.stats.skills ?? selected.brain?.skillCount ?? 0} skills |{" "}
                      {selectedUnified?.stats.durableMemories ?? selected.brain?.durableCount ?? 0} memories | {selectedUnified?.stats.memoryEvents ?? selected.brain?.eventsToday ?? 0} events
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-border bg-[rgba(255,252,247,0.72)] p-3">
                    <small className="text-[10px] uppercase tracking-[0.18em] text-muted">runtime truth</small>
                    <p className="mt-2 text-sm text-dark">
                      {selectedUnified?.truthLevel ?? truthLabel(selected)} | {selected.brainStatus} brain | {selected.employeeHealth.freshness}
                    </p>
                  </div>
                </div>

                <p><strong>Current theory:</strong> {selectedTheories[0] ?? selectedActiveContext[0] ?? selected.current}</p>
                <p><strong>Next experiment:</strong> {(selectedExperiments[0] ?? selected.workflowSuggestion) || deriveSuggestion(selected)}</p>
                <p><strong>Training target:</strong> {selectedUnified?.brain.nextSkillTarget ?? selected.brain?.nextSkillTarget ?? "Keep the lane bounded and promote only reusable learning."}</p>

                <div className="guild-signal-grid">
                  {(selectedExperimentResults.length > 0 ? selectedExperimentResults : ["No experiment result recorded yet."]).slice(0, 4).map((result) => (
                    <div key={result} className="guild-signal-card guild-signal-card-result">
                      <small>experiment result</small>
                      <strong>{result}</strong>
                    </div>
                  ))}
                </div>

                <div className="guild-chip-row">
                  {selectedExperiments.slice(0, 5).map((rule) => (
                    <span key={rule} className="guild-chip guild-chip-goal">experiment: {rule}</span>
                  ))}
                </div>

                <div className="guild-chip-row">
                  {selectedTrialErrors.slice(0, 5).map((rule) => (
                    <span key={rule} className="guild-chip">trial/error: {rule}</span>
                  ))}
                </div>

                <div className="guild-events-list">
                  {(selected.brain?.recentEvents ?? []).slice(0, 5).map((event) => (
                    <div key={event.id} className="guild-event-card">
                      <small>{event.kind} | {Math.round(event.confidence * 100)}% confidence</small>
                      <strong>{event.summary}</strong>
                      <span>{event.timestamp}</span>
                    </div>
                  ))}
                  {selectedCheckpoint ? (
                    <div className="guild-event-card">
                      <small>{selectedCheckpoint.status} | {selectedCheckpoint.telemetrySource}</small>
                      <strong>{selectedCheckpoint.latestFinding}</strong>
                      <span>{selectedCheckpoint.lastCheckpointAt ?? meetingForDossier?.requestedAt ?? "checkpoint pending"}</span>
                    </div>
                  ) : null}
                </div>

                {selectedCheckpoint?.usefulShareouts.length ? (
                  <ul className="guild-memory-list">
                    {selectedCheckpoint.usefulShareouts.slice(0, 4).map((shareout) => (
                      <li key={shareout}>{shareout}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}

          {selectedTab === "events" ? (
            <div className="guild-tavern-details">
              <div className="guild-tavern-body">
                <p><strong>Significant communication:</strong> {selectedCommunications[0] ?? "No significant communication recorded for this agent yet."}</p>
                <p><strong>Significant event:</strong> {selectedSignificantEvents[0] ?? "No significant event recorded for this agent yet."}</p>
                <p><strong>Boardroom checkpoint:</strong> {selectedCheckpoint?.latestFinding ?? "No checkpoint bundle recorded for this agent yet."}</p>

                <div className="guild-signal-grid">
                  {(selectedCommunications.length > 0 ? selectedCommunications : ["No notable communication recorded yet."]).slice(0, 4).map((communication) => (
                    <div key={communication} className="guild-signal-card guild-signal-card-comm">
                      <small>communication</small>
                      <strong>{communication}</strong>
                    </div>
                  ))}
                </div>

                <div className="guild-events-list">
                  {(selectedSignificantEvents.length > 0 ? selectedSignificantEvents : ["No notable event recorded yet."]).slice(0, 6).map((event) => (
                    <div key={event} className="guild-event-card">
                      <small>significant event</small>
                      <strong>{event}</strong>
                      <span>{selectedUnified?.brain.lastCuratedAt ?? selected.lastRuntimeUpdateAt ?? "persistent state"}</span>
                    </div>
                  ))}
                </div>

                {selectedCheckpoint?.candidateDurableMemories.length ? (
                  <ul className="guild-memory-list">
                    {selectedCheckpoint.candidateDurableMemories.slice(0, 4).map((memory) => (
                      <li key={memory}>candidate memory: {memory}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}

          {selectedTab === "blocks" ? (
            <div className="guild-tavern-details">
              <div className="guild-tavern-body">
                <p><strong>Human fix needed:</strong> {selectedHumanRequiredBlocks[0] ?? needsHuman(selected)}</p>
                <p><strong>Blocker severity:</strong> {selected.blockerSeverity}</p>
                <p><strong>Suggested improvement:</strong> {selected.workflowSuggestion || deriveSuggestion(selected)}</p>
                <p>
                  <strong>Manager view:</strong> blocker {selected.employeeHealth.blockerClarity}, freshness{" "}
                  {selected.employeeHealth.freshness}, swarm {selected.employeeHealth.swarmReadiness}
                </p>
                <p>
                  <strong>Health rubric:</strong> task fit {selected.employeeHealth.taskFit}, brain{" "}
                  {selected.employeeHealth.brainHygiene}, output {selected.employeeHealth.outputToday}
                </p>
                <p>
                  <strong>Active context:</strong>{" "}
                  {selectedActiveContext.slice(0, 4).join(" / ") || "No active context recorded."}
                </p>
                <p><strong>Swarm readiness:</strong> {selected.brain?.swarmReadiness ?? "seedling"}</p>
                <p><strong>Auto routes already tried:</strong> live probe / runtime file / brain bundle / worker heartbeat.</p>
                <div className="guild-signal-grid">
                  {(selectedHumanRequiredBlocks.length > 0 ? selectedHumanRequiredBlocks : ["No direct human-required block is currently recorded."]).slice(0, 4).map((block) => (
                    <div key={block} className="guild-signal-card guild-signal-card-block">
                      <small>human-required block</small>
                      <strong>{block}</strong>
                    </div>
                  ))}
                </div>
                <div className="guild-contract-list">
                  {(selectedTrialErrors.length > 0 ? selectedTrialErrors : selected.brain?.workflowContract ?? []).slice(0, 5).map((step) => (
                    <div key={step}>{step}</div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
