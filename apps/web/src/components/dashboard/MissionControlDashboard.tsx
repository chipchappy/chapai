import type { MissionControlSnapshot } from "@/lib/types";
import GuildOfficeScene from "@/components/dashboard/GuildOfficeScene";
import { listAccessKeys } from "@/lib/access-keys";

function StatChip({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-[18px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.9)] px-4 py-3 shadow-[0_12px_30px_rgba(66,56,44,0.04)]">
      <small className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</small>
      <strong className="mt-1 block text-[1.35rem] leading-none tracking-[-0.04em] text-dark">{value}</strong>
      {detail ? <span className="mt-1 block text-[12px] leading-5 text-muted">{detail}</span> : null}
    </div>
  );
}

type UnifiedAgent = MissionControlSnapshot["unifiedGuild"]["agents"][number];

function agentTruthClass(agent: UnifiedAgent) {
  const truth = `${agent.truthLevel} ${agent.state} ${agent.blocker}`.toLowerCase();
  if (truth.includes("live") || truth.includes("runtime")) return "is-live";
  if (truth.includes("blocked") || agent.blocker !== "none") return "is-blocked";
  if (truth.includes("unwired") || truth.includes("presentation")) return "is-limited";
  return "is-stale";
}

function agentAccessSignals(agent: UnifiedAgent) {
  const sourceKinds = agent.sources.map((source) => source.kind.toLowerCase());
  const signals = [
    `runtime: ${agent.runtime}`,
    `truth: ${agent.truthLevel}`,
    sourceKinds.some((kind) => kind.includes("brain")) ? "brain linked" : "brain not linked",
    sourceKinds.some((kind) => kind.includes("state") || kind.includes("heartbeat")) ? "runtime state visible" : "no live runtime feed",
    agent.sources.length ? `${agent.sources.length} source files` : "no source files",
  ];
  return signals.slice(0, 5);
}

function agentProgress(agent: UnifiedAgent) {
  const base =
    12
    + agent.stats.completedTasks * 8
    + agent.stats.skills * 5
    + agent.stats.durableMemories * 4
    + agent.stats.sourceCount * 3
    + agent.stats.memoryEvents * 2
    - agent.stats.blockedTasks * 7;
  return Math.max(8, Math.min(100, base));
}

function agentScore(agent: UnifiedAgent, score: "autonomy" | "reliability" | "learning" | "communication" | "parallel") {
  if (score === "autonomy") {
    return Math.min(99, 40 + agent.stats.completedTasks * 5 + agent.stats.sourceCount * 6);
  }
  if (score === "reliability") {
    return Math.max(8, Math.min(99, 92 - agent.stats.blockedTasks * 10 + (agent.blocker === "none" ? 4 : -12)));
  }
  if (score === "learning") {
    return Math.min(99, 32 + agent.stats.skills * 5 + agent.stats.memoryEvents * 4 + agent.stats.durableMemories * 2);
  }
  if (score === "communication") {
    return Math.min(99, 28 + (agent.significantCommunications?.length ?? 0) * 12 + agent.sources.length * 5);
  }
  return Math.min(99, 34 + agent.stats.pendingExperiments * 10 + agent.experiments.length * 4);
}

function agentContributionStats(agent: UnifiedAgent) {
  const role = agent.role.toLowerCase();
  return {
    qbank: role.includes("content") || role.includes("clinical") ? agent.stats.completedTasks + agent.stats.memoryEvents : 0,
    product: role.includes("product") || role.includes("design") || role.includes("frontend") ? agent.stats.completedTasks + agent.experiments.length : 0,
    code: agent.runtime.includes("codex") || role.includes("backend") || role.includes("architecture") ? agent.stats.completedTasks + agent.stats.sourceCount : 0,
    refinement: role.includes("content") || role.includes("audit") || role.includes("quality") ? agent.stats.memoryEvents + agent.trialsAndErrors.length : 0,
  };
}

function capabilityStatusClass(status: string) {
  if (status === "live" || status === "installed-idle") {
    return "border-[rgba(126,157,134,0.26)] bg-[rgba(126,157,134,0.1)] text-[#5E7A65]";
  }
  if (status === "configured-missing-state" || status === "legacy-only") {
    return "border-[rgba(196,121,86,0.24)] bg-[rgba(196,121,86,0.1)] text-[#9B5E42]";
  }
  if (status === "unwired" || status === "blocked") {
    return "border-[rgba(180,84,77,0.22)] bg-[rgba(180,84,77,0.08)] text-[#8C4B45]";
  }
  return "border-[rgba(110,121,134,0.18)] bg-[rgba(110,121,134,0.08)] text-[#66717C]";
}

function AgentIntelTile({ agent }: { agent: UnifiedAgent }) {
  const latestMemory = agent.brain.durableMemory[0] ?? agent.brain.activeContext[0] ?? "No durable memory promoted yet.";
  const latestSkill = agent.brain.skills[0] ?? agent.brain.nextSkillTarget ?? "No skill registered yet.";
  const latestUpdate = agent.significantEvents?.[0] ?? agent.brain.recentEvents[0] ?? agent.latest;
  const limitation = agent.humanRequiredBlocks?.[0] ?? (agent.blocker !== "none" ? agent.blocker : agent.truthLevel.includes("unwired") ? "No live control target connected." : "No human-required block.");
  const progress = agentProgress(agent);
  const contributions = agentContributionStats(agent);
  const toolSignals = agent.sources.map((source) => `${source.kind}: ${source.label}`).slice(0, 3);
  const collaboration = agent.significantCommunications?.[0] ?? agent.sources.find((source) => source.kind.includes("obsidian"))?.label ?? "No cross-agent communication recorded yet.";
  const win = agent.experimentResults?.[0] ?? agent.significantEvents?.[0] ?? "No completed result recorded yet.";
  const lesson = agent.trialsAndErrors[0] ?? "No trial/error lesson recorded yet.";

  return (
    <article className={`agent-intel-tile ${agentTruthClass(agent)}`}>
      <div className="agent-intel-topline">
        <div>
          <span>{agent.runtime}</span>
          <strong>{agent.displayName}</strong>
        </div>
        <em>{agent.state}</em>
      </div>
      <p className="agent-intel-objective">{agent.currentWorkingGoal ?? agent.currentTask}</p>
      <div className="agent-intel-progress" aria-label={`${agent.displayName} progress ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="agent-intel-access">
        {agentAccessSignals(agent).map((signal) => (
          <span key={signal}>{signal}</span>
        ))}
      </div>
      <div className="agent-intel-ledger">
        <div>
          <span>memory</span>
          <strong>{latestMemory}</strong>
        </div>
        <div>
          <span>skill</span>
          <strong>{latestSkill}</strong>
        </div>
        <div>
          <span>latest update</span>
          <strong>{latestUpdate}</strong>
        </div>
        <div>
          <span>limit / block</span>
          <strong>{limitation}</strong>
        </div>
      </div>
      <div className="agent-intel-deck">
        <div>
          <span>next plan</span>
          <strong>{agent.plan}</strong>
        </div>
        <div>
          <span>theory</span>
          <strong>{agent.theories[0] ?? "No active theory recorded."}</strong>
        </div>
        <div>
          <span>experiment</span>
          <strong>{agent.experiments[0] ?? "No experiment queued."}</strong>
        </div>
        <div>
          <span>win / lesson</span>
          <strong>{win} / {lesson}</strong>
        </div>
      </div>
      <div className="agent-intel-scores">
        <span>autonomy {agentScore(agent, "autonomy")}</span>
        <span>reliability {agentScore(agent, "reliability")}</span>
        <span>learning {agentScore(agent, "learning")}</span>
        <span>comm {agentScore(agent, "communication")}</span>
        <span>parallel {agentScore(agent, "parallel")}</span>
      </div>
      <div className="agent-intel-contrib">
        <span>qbank {contributions.qbank}</span>
        <span>product {contributions.product}</span>
        <span>code/test {contributions.code}</span>
        <span>refine {contributions.refinement}</span>
      </div>
      <div className="agent-intel-proof">
        <span>tool access</span>
        <strong>{toolSignals.join(" / ") || "No tool/source access recorded."}</strong>
        <span>collaboration</span>
        <strong>{collaboration}</strong>
      </div>
      <div className="agent-intel-statbar" aria-label={`${agent.displayName} agent stats`}>
        <span>lv {agent.stats.level}</span>
        <span>{agent.stats.skills} skills</span>
        <span>{agent.stats.durableMemories} memories</span>
        <span>{agent.stats.pendingExperiments} experiments</span>
      </div>
    </article>
  );
}

export default function MissionControlDashboard({
  snapshot,
  access,
  initialMode = "overview",
}: {
  snapshot: MissionControlSnapshot;
  access: {
    role: "viewer" | "operator";
    source: "preview-key" | "legacy-guild-key" | "none";
    accessType: string | null;
    displayLabel: string | null;
    canSummon: boolean;
  };
  initialMode?: "overview" | "boardroom";
}) {
  const activeAccessKeys = listAccessKeys().filter((key) => key.status === "active");
  const demoPass = activeAccessKeys.find((key) => key.type === "demo-pass");
  const testerPass = activeAccessKeys.find((key) => key.type === "tester-pass");
  const founderPass = activeAccessKeys.find((key) => key.type === "founder-pass");
  const linkedBrains = snapshot.agents.filter((agent) => agent.brainStatus === "linked").length;
  const corruptBrains = snapshot.agents.filter((agent) => agent.brainStatus === "corrupt").length;
  const blockedAgents = snapshot.agents.filter((agent) => agent.blocker !== "none").length;
  const liveQuestionTotal = snapshot.product.ccrnLiveQuestions + snapshot.product.nclexLiveQuestions;
  const nclexLiveQuestions = snapshot.product.nclexLiveQuestions;
  const nclexNgnLiveQuestions = snapshot.product.nclexNgnLiveQuestions;
  const nclexNgnRatio = snapshot.product.nclexNgnRatio;
  const liveAgents = snapshot.agents.filter((agent) => agent.state === "live").length;
  const staleAgents = snapshot.agents.filter((agent) => agent.state === "stale").length;
  const launchReadyServices = snapshot.liveServices.filter((service) => service.status === "live");
  const launchBlockedServices = snapshot.liveServices.filter((service) => service.status !== "live");
  const activeAgents = snapshot.agents
    .filter((agent) => agent.state === "live")
    .sort((left, right) => right.outputToday - left.outputToday)
    .slice(0, 4);
  const urgentFixes = snapshot.urgentFixes.slice(0, 3);
  const recentWins = snapshot.retrospective.wins.slice(0, 4);
  const nextShifts = snapshot.retrospective.next.slice(0, 3);
  const boardroomDigest = snapshot.boardroom.digest.slice(0, 3);
  const unifiedGuild = snapshot.unifiedGuild;
  const capabilityMatrix = unifiedGuild.capabilityMatrix ?? [];
  const providerReadiness = unifiedGuild.providerReadiness;
  const learningLedger = unifiedGuild.learningLedger ?? [];
  const approvalQueue = unifiedGuild.approvalQueue ?? [];
  const memoryHygiene = unifiedGuild.memoryHygiene;
  const priorityCapabilities = [...capabilityMatrix].sort((left, right) => {
    const rank = (status: string) =>
      status === "configured-missing-state" ? 0 : status === "legacy-only" ? 1 : status === "unwired" || status === "blocked" ? 2 : status === "installed-idle" ? 3 : status === "live" ? 4 : 5;
    return rank(left.adapterStatus) - rank(right.adapterStatus);
  });
  const recentLearningRecords = learningLedger.slice(0, 5);
  const activeApprovalTickets = approvalQueue.slice(0, 5);
  const unifiedAgents = [...unifiedGuild.agents]
    .sort((left, right) => {
      const stateRank = (value: string) => (value.match(/live|running/i) ? 0 : value.match(/blocked/i) ? 1 : value.match(/sleep|idle|brain-only/i) ? 2 : 3);
      const stateDelta = stateRank(left.state) - stateRank(right.state);
      if (stateDelta !== 0) {
        return stateDelta;
      }
      return right.stats.level - left.stats.level;
    })
    .slice(0, 15);
  const unifiedFreshness = unifiedGuild.generatedAt ? new Date(unifiedGuild.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "not exported";
  const demoAccessCards = [
    founderPass ? { label: "Founder full", detail: "Best key for full paid-path testing", code: founderPass.code } : null,
    demoPass ? { label: "Demo", detail: "Public-safe preview key", code: demoPass.code } : null,
    testerPass ? { label: "Tester", detail: "Full product QA key", code: testerPass.code } : null,
  ].filter((item): item is { label: string; detail: string; code: string } => Boolean(item));
  const growthBoard = [...snapshot.brains]
    .sort((left, right) => {
      const growthDelta = right.growthLevel - left.growthLevel;
      if (growthDelta !== 0) {
        return growthDelta;
      }
      return right.skillCount - left.skillCount;
    })
    .slice(0, 4);
  const commandModes = [
    { label: "overview", href: "#overview", active: initialMode === "overview" },
    { label: "agents", href: "#agents", active: false },
    { label: "access", href: "#access", active: false },
    { label: "brains", href: "#brains", active: false },
    { label: "memory", href: "#memory", active: false },
    { label: "qbank", href: "#qbank", active: false },
    { label: "boardroom", href: "#boardroom", active: false },
  ];
  const stateTone = {
    live: "border-[rgba(126,157,134,0.24)] bg-[rgba(126,157,134,0.12)] text-[#5E7A65]",
    sleeping: "border-[rgba(110,121,134,0.18)] bg-[rgba(110,121,134,0.08)] text-[#66717C]",
    blocked: "border-[rgba(196,121,86,0.24)] bg-[rgba(196,121,86,0.12)] text-[#9B5E42]",
    stale: "border-[rgba(143,110,96,0.2)] bg-[rgba(143,110,96,0.1)] text-[#7D6559]",
  } as const;

  return (
    <div id="overview" className="guild-shell">
      <section className="guild-topbar">
        <div className="guild-topbar-copy">
          <div className="section-label">Private guild dashboard</div>
          <h1 className="max-w-[14ch]">One calm room for the swarm.</h1>
          <p className="max-w-[42rem]">
            Keep the NCLEX launch lanes readable at a glance: what is live, what is blocked, and what is feeding reviewed learner-ready growth.
          </p>
        </div>

        <div className="guild-topbar-stats gap-3">
          <StatChip label="Live" value={String(liveAgents)} detail="active now" />
          <StatChip label="NCLEX" value={String(nclexLiveQuestions)} detail="reviewed live" />
          <StatChip label="QC usable" value={String(snapshot.product.nclexApprovedRefinedUsable)} detail={snapshot.product.nclexTopUpNeeded ? `${snapshot.product.nclexRemainingTo5000} to 5k` : "5k target met"} />
          <StatChip label="NGN" value={String(nclexNgnLiveQuestions)} detail={`${nclexNgnRatio}% of NCLEX live`} />
          <StatChip label="Questions" value={String(liveQuestionTotal)} detail="all live" />
          <StatChip label="Brains" value={String(linkedBrains)} detail="linked" />
          <StatChip label="Stale" value={String(staleAgents)} detail={corruptBrains ? `${corruptBrains} corrupt brains` : "truth checked"} />
          <StatChip label="Blocked" value={String(blockedAgents)} detail="needs help" />
          <StatChip label="Unified" value={String(unifiedGuild.stats.totalAgents)} detail={`refreshed ${unifiedFreshness}`} />
          <StatChip label="Checkout" value={snapshot.runtime.checkoutStatus} detail={snapshot.runtime.stripeMode} />
          <StatChip label="Boardroom" value={snapshot.boardroom.activeMeeting ? snapshot.boardroom.activeMeeting.status : "idle"} detail={access.displayLabel ?? "private"} />
        </div>

        <div className="guild-topbar-actions">
          <a className="btn-secondary" href="#boardroom">
            Boardroom floor
          </a>
          <a className="btn-secondary" href="/design-review">
            Review design
          </a>
          <a className="btn-secondary" href="/demo-access">
            Demo access
          </a>
          <a className="btn-secondary" href="/upgrade">
            Open packages
          </a>
          <form action="/api/dashboard-auth/logout" method="post">
            <button type="submit" className="btn-secondary">
              Lock dashboard
            </button>
          </form>
        </div>
      </section>

      <section className="agent-command-modebar" aria-label="agent command center modes">
        {commandModes.map((mode) => (
          <a key={mode.label} href={mode.href} className={mode.active ? "is-active" : ""}>
            {mode.label}
          </a>
        ))}
      </section>

      <section id="agents" className="unified-guild-console">
        <div className="unified-guild-header">
          <div>
            <div className="section-label">Unified persistent brain state</div>
            <h2>One live guild layer across ChapAI, ChappyAI, Obsidian, and legacy CCRN memory.</h2>
            <p>
              This board is generated from the persistent brain JSON files, lane heartbeats, ChappyAI vault notes, legacy CCRN memory, public-data ledger, approval queue, and boardroom checkpoint state.
            </p>
          </div>
          <div className="unified-guild-ledger">
            <span>{unifiedGuild.sourceHealth.chapaiBrains} brains linked</span>
            <span>{unifiedGuild.sourceHealth.obsidianGuildNotes} Obsidian notes</span>
            <span>{unifiedGuild.sourceHealth.publicLedgerRecords} research records</span>
            <span>{unifiedGuild.sourceHealth.approvalQueuePending} approvals queued</span>
          </div>
        </div>

        <div className="unified-guild-stats">
          <StatChip label="Agents" value={String(unifiedGuild.stats.totalAgents)} detail="combined roster" />
          <StatChip label="Live" value={String(unifiedGuild.stats.live)} detail="working lanes" />
          <StatChip label="Skills" value={String(unifiedGuild.stats.totalSkills)} detail="guild-wide" />
          <StatChip label="Memory" value={String(unifiedGuild.stats.totalDurableMemories)} detail="durable facts" />
          <StatChip label="Experiments" value={String(unifiedGuild.stats.totalExperiments)} detail="queued/active" />
          <StatChip label="Trials" value={String(unifiedGuild.stats.totalTrialErrors)} detail="errors/lessons" />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[28px] border border-border bg-[rgba(255,252,247,0.92)] p-5 shadow-card">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="section-label">Provider capability truth</div>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-dark">Unlocked, stale, legacy, and unwired lanes are separated.</h3>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                <span className="rounded-full border border-border px-3 py-1">{providerReadiness.totalProviders} providers</span>
                <span className="rounded-full border border-border px-3 py-1">{providerReadiness.installedIdle} installed idle</span>
                <span className="rounded-full border border-border px-3 py-1">{providerReadiness.unwired} unwired</span>
                <span className="rounded-full border border-border px-3 py-1">{providerReadiness.legacyOnly} legacy-only</span>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {priorityCapabilities.slice(0, 8).map((provider) => (
                <div key={provider.providerId} className="rounded-[20px] border border-border bg-[rgba(248,245,238,0.86)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="block text-sm uppercase tracking-[0.14em] text-dark">{provider.providerId}</strong>
                      <span className="mt-1 block text-xs text-muted">{provider.dashboardTruthLevel}</span>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${capabilityStatusClass(provider.adapterStatus)}`}>
                      {provider.adapterStatus}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
                    {provider.safeModes.slice(0, 3).join(" | ")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(provider.blockedCapabilities.length ? provider.blockedCapabilities : provider.probeEvidence).slice(0, 2).map((item) => (
                      <span key={item} className="rounded-full border border-[rgba(74,85,89,0.1)] bg-white/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-muted">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-border bg-[rgba(255,252,247,0.92)] p-5 shadow-card">
            <div className="section-label">Memory hygiene and approvals</div>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-dark">Public learning stays candidate-first until reviewed.</h3>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <StatChip label="Raw notes" value={String(memoryHygiene.rawObservationCount)} detail="Obsidian + public ledger" />
              <StatChip label="Candidates" value={String(memoryHygiene.candidateMemoryCount)} detail="not durable yet" />
              <StatChip label="Low-signal" value={String(memoryHygiene.lowSignalCount)} detail="kept out of durable brain" />
              <StatChip label="Approvals" value={String(activeApprovalTickets.length)} detail="Telegram required" />
            </div>
            <div className="mt-5 space-y-3">
              {activeApprovalTickets.length > 0 ? activeApprovalTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-[18px] border border-[rgba(196,121,86,0.16)] bg-[rgba(255,247,239,0.88)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-dark">{ticket.title}</strong>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-muted">{ticket.lifecycle}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{ticket.requestedAction}</p>
                </div>
              )) : (
                <div className="rounded-[18px] border border-border bg-[rgba(251,249,243,0.95)] px-4 py-3 text-sm leading-6 text-muted">
                  No external action is waiting for Telegram approval.
                </div>
              )}
            </div>
          </article>
        </div>

        <div className="unified-agent-grid">
          {unifiedAgents.map((agent) => {
            const xpWidth = `${Math.min(100, Math.max(8, agent.stats.xp % 100))}%`;
            const stateClass = agent.state.match(/live|running/i)
              ? "is-live"
              : agent.blocker !== "none" || agent.state.match(/blocked/i)
                ? "is-blocked"
                : agent.state.match(/stale|missing|corrupt/i)
                  ? "is-stale"
                  : "is-sleeping";
            return (
              <article key={agent.id} className={`unified-agent-card ${stateClass}`}>
                <div className="unified-agent-card-top">
                  <div>
                    <small>{agent.runtime}</small>
                    <strong>{agent.displayName}</strong>
                  </div>
                  <span>Lv {agent.stats.level}</span>
                </div>
                <div className="unified-xp-track" aria-label={`${agent.displayName} XP`}>
                  <span style={{ width: xpWidth }} />
                </div>
                <p className="unified-agent-role">{agent.role}</p>
                <p className="unified-agent-task">{agent.currentTask}</p>
                <div className="unified-agent-stats">
                  <span>{agent.stats.skills} skills</span>
                  <span>{agent.stats.durableMemories} memories</span>
                  <span>{agent.stats.pendingExperiments} experiments</span>
                  <span>{agent.stats.sourceCount} sources</span>
                </div>
                <div className="unified-agent-score-grid" aria-label={`${agent.displayName} derived agent stats`}>
                  <span>autonomy {Math.min(99, 42 + agent.stats.completedTasks * 3 + agent.stats.sourceCount * 4)}</span>
                  <span>reliability {Math.max(10, 92 - agent.stats.blockedTasks * 8)}</span>
                  <span>learning {Math.min(99, 35 + agent.stats.skills * 4 + agent.stats.memoryEvents)}</span>
                  <span>parallel {Math.min(99, 40 + agent.stats.pendingExperiments * 7)}</span>
                </div>
                <div className="unified-agent-tabs">
                  {(agent.theories.length > 0 ? agent.theories : [agent.plan]).slice(0, 2).map((item) => (
                    <span key={item}>theory: {item}</span>
                  ))}
                  {(agent.trialsAndErrors.length > 0 ? agent.trialsAndErrors : [agent.brain.health]).slice(0, 1).map((item) => (
                    <span key={item}>lesson: {item}</span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <div id="memory" className="unified-guild-memory">
          <article>
            <span>memory system</span>
            <strong>{unifiedGuild.memorySystem.mode}</strong>
            <p>{unifiedGuild.memorySystem.hygieneRules[0] ?? "Candidate memories stay separate until approved."}</p>
          </article>
          <article>
            <span>candidate promotions</span>
            <strong>{unifiedGuild.memorySystem.candidatePromotions.length}</strong>
            <p>{unifiedGuild.memorySystem.candidatePromotions[0] ?? "No candidate promotions pending."}</p>
          </article>
          <article>
            <span>public research</span>
            <strong>{unifiedGuild.sharedContext.publicResearchFindings.length}</strong>
            <p>{unifiedGuild.sharedContext.publicResearchFindings[0] ?? "No public research finding recorded yet."}</p>
          </article>
          <article>
            <span>latest candidate</span>
            <strong>{recentLearningRecords[0]?.agentId ?? "none"}</strong>
            <p>{recentLearningRecords[0]?.summary ?? "No Obsidian or public-data candidate has been ingested yet."}</p>
          </article>
        </div>
      </section>

      <section id="access" className="agent-intel-console" aria-label="agent intelligence and access console">
        <div className="agent-command-section-head">
          <div>
            <div className="section-label">Palantir-style agent intelligence</div>
            <h2>Who is working, what they can see, what they remember, and where they are blocked.</h2>
          </div>
          <span>{unifiedGuild.stats.totalAgents} agents mapped</span>
        </div>
        <div className="agent-intel-grid">
          {unifiedAgents.map((agent) => (
            <AgentIntelTile key={agent.id} agent={agent} />
          ))}
        </div>
      </section>

      <section id="qbank" className="mt-8 grid gap-4 xl:grid-cols-[1.08fr_1fr_1fr]">
        <article className="rounded-[28px] border border-border bg-[rgba(255,252,247,0.94)] p-5 shadow-card">
          <div className="section-label">Launch board</div>
          <h2 className="mt-2 font-serif text-[2rem] leading-[0.98] text-dark">
            Stable enough to ship, with the next NCLEX blockers called out plainly.
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-border bg-[rgba(248,244,236,0.92)] p-4">
              <small className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Live services</small>
              <div className="mt-2 text-2xl font-semibold text-dark">{launchReadyServices.length}</div>
              <p className="mt-2 text-sm leading-6 text-muted">
                {launchReadyServices.slice(0, 2).map((service) => service.label).join(" | ") || "No live services reported yet."}
              </p>
            </div>
            <div className="rounded-[20px] border border-border bg-[rgba(250,242,236,0.92)] p-4">
              <small className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Needs attention</small>
              <div className="mt-2 text-2xl font-semibold text-dark">{launchBlockedServices.length + urgentFixes.length}</div>
              <p className="mt-2 text-sm leading-6 text-muted">
                {launchBlockedServices[0]?.label || urgentFixes[0]?.title || "No active blockers surfaced."}
              </p>
            </div>
            <div className="rounded-[20px] border border-border bg-[rgba(244,249,244,0.92)] p-4 sm:col-span-2">
              <small className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">NCLEX shape mix</small>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                <span className="rounded-full border border-[rgba(126,157,134,0.18)] bg-[rgba(126,157,134,0.1)] px-3 py-1">
                  {snapshot.product.nclexMcqLiveQuestions} MCQ live
                </span>
                <span className="rounded-full border border-[rgba(90,127,136,0.18)] bg-[rgba(90,127,136,0.08)] px-3 py-1">
                  {nclexNgnLiveQuestions} NGN live
                </span>
                <span className="rounded-full border border-[rgba(196,121,86,0.16)] bg-[rgba(196,121,86,0.08)] px-3 py-1">
                  QC usable: {snapshot.product.nclexApprovedRefinedUsable}
                </span>
                <span className="rounded-full border border-[rgba(196,121,86,0.16)] bg-[rgba(196,121,86,0.08)] px-3 py-1">
                  {snapshot.product.nclexTopUpNeeded ? `${snapshot.product.nclexRemainingTo5000} targeted items needed after refinement` : "5,000 usable target met"}
                </span>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-border bg-[rgba(255,252,247,0.94)] p-5 shadow-card">
          <div className="section-label">Active lanes</div>
          <div className="mt-4 space-y-3">
            {activeAgents.map((agent) => (
              <div key={agent.id} className="rounded-[18px] border border-border bg-[rgba(251,249,243,0.95)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm uppercase tracking-[0.14em] text-dark">{agent.nickname}</strong>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${stateTone[agent.state]}`}>
                    {agent.state}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{agent.current}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-border bg-[rgba(255,252,247,0.94)] p-5 shadow-card">
          <div className="section-label">Human blockers</div>
          <div className="mt-4 space-y-3">
            {urgentFixes.length > 0 ? urgentFixes.map((fix) => (
              <div key={fix.id} className="rounded-[18px] border border-border bg-[rgba(251,249,243,0.95)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-dark">{fix.title}</strong>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted">{fix.severity}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{fix.action}</p>
              </div>
            )) : (
              <div className="rounded-[18px] border border-border bg-[rgba(251,249,243,0.95)] px-4 py-3 text-sm leading-6 text-muted">
                No launch-critical human blocker is currently surfaced.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[28px] border border-border bg-[rgba(255,252,247,0.94)] p-5 shadow-card">
          <div className="section-label">Recent improvements</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recentWins.length > 0 ? recentWins.map((win) => (
              <div key={win} className="rounded-[18px] border border-border bg-[rgba(251,249,243,0.95)] px-4 py-3">
                <strong className="text-sm text-dark">Shipped</strong>
                <p className="mt-2 text-sm leading-6 text-muted">{win}</p>
              </div>
            )) : (
              <div className="rounded-[18px] border border-border bg-[rgba(251,249,243,0.95)] px-4 py-3 text-sm leading-6 text-muted">
                No retrospective wins are recorded yet.
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {snapshot.retrospective.generatedAt ? <span className="rounded-full border border-border px-3 py-1">updated {snapshot.retrospective.generatedAt}</span> : null}
            <span className="rounded-full border border-border px-3 py-1">{snapshot.retrospective.roomState}</span>
            {access.accessType ? <span className="rounded-full border border-border px-3 py-1">{access.accessType}</span> : null}
            {nextShifts.map((item) => (
              <span key={item} className="rounded-full border border-[rgba(126,157,134,0.18)] bg-[rgba(126,157,134,0.08)] px-3 py-1">
                next: {item}
              </span>
            ))}
            {boardroomDigest.map((item) => (
              <span key={item} className="rounded-full border border-[rgba(90,127,136,0.18)] bg-[rgba(90,127,136,0.08)] px-3 py-1">
                {item}
              </span>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-border bg-[rgba(255,252,247,0.94)] p-5 shadow-card">
          <div className="section-label">Demo and QA keys</div>
          <div className="mt-4 space-y-3">
            {demoAccessCards.map((key) => (
              <div key={key.code} className="rounded-[18px] border border-border bg-[rgba(251,249,243,0.95)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-dark">{key.label}</strong>
                  <code className="rounded-full border border-[rgba(74,85,89,0.12)] bg-white/80 px-3 py-1 font-mono text-[11px] tracking-[0.08em] text-dark">
                    {key.code}
                  </code>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{key.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a className="btn-secondary" href="/demo-access">
              Redeem a key
            </a>
            <a className="btn-secondary" href="/quiz?exam=nclex&mode=ngn">
              Test NGN flow
            </a>
          </div>
        </article>
      </section>

      <section id="brains" className="guild-growth-strip">
        <div className="guild-growth-copy">
          <div className="section-label">Employee growth report</div>
          <h2>Who is compounding, what they should learn next, and where the swarm still needs help.</h2>
        </div>

        <div className="guild-growth-grid">
          {growthBoard.map((brain) => (
            <article key={brain.agentId} className="guild-growth-card">
              <div className="guild-growth-top">
                <span>{brain.displayName}</span>
                <strong>Lv {brain.growthLevel}</strong>
              </div>
              <p>{brain.role}</p>
              <div className="guild-growth-meta">
                <small>Next skill</small>
                <strong>{brain.nextSkillTarget ?? "Keep the lane bounded."}</strong>
              </div>
              <div className="guild-growth-focus">
                {(brain.capabilityFocus ?? []).slice(0, 2).map((focus) => (
                  <span key={focus}>{focus}</span>
                ))}
              </div>
              <div className="guild-growth-foot">
                <small>{brain.brainHygiene ?? "clean"} brain</small>
                <small>{brain.skillCount} skills</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[30px] border border-border bg-[rgba(255,252,247,0.9)] p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="section-label">Capability unlock</div>
            <h2 className="mt-2 max-w-[18ch] font-serif text-[2rem] leading-[0.98] text-dark">
              Cheap-first where it is safe, premium escalation where it actually matters.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted">
            <span className="rounded-full border border-border px-3 py-1">
              {snapshot.capabilities.providerCount} providers
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              low-cost: {snapshot.capabilities.lowCostFirst.join(", ")}
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              premium: {snapshot.capabilities.premiumEscalation.join(", ")}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.capabilities.highlights.map((system) => (
            <article key={system.id} className="rounded-[22px] border border-border bg-[rgba(251,249,243,0.96)] p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-[0.95rem] uppercase tracking-[0.12em] text-dark">{system.id}</strong>
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted">{system.category}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{system.bestUse.join(" | ")}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="boardroom" className="agent-command-boardroom-focus">
        <div className="agent-command-section-head">
          <div>
            <div className="section-label">Boardroom inside dashboard</div>
            <h2>One shared room for summon control, live dossiers, checkpoints, skills, memories, and human-required blocks.</h2>
          </div>
          <span>{snapshot.boardroom.activeMeeting ? snapshot.boardroom.activeMeeting.status : "idle"}</span>
        </div>
        <GuildOfficeScene snapshot={snapshot} mode="boardroom" access={access} />
      </section>
    </div>
  );
}
