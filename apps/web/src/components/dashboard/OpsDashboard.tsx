import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CircleDollarSign,
  Command,
  Database,
  Goal,
  MessagesSquare,
  RadioTower,
  ServerCog,
  ShieldCheck,
  TerminalSquare,
  Users,
} from "lucide-react";
import OpsOverridePanel from "@/components/dashboard/OpsOverridePanel";
import type { getOpsDashboardData } from "@/lib/ops-dashboard";
import type { MissionControlSnapshot } from "@/lib/types";

type OpsData = ReturnType<typeof getOpsDashboardData>;
type OpsAgent = OpsData["agents"][number];

function statusTone(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes("live") || lower.includes("running")) {
    return "border-[#35593f] bg-[#162319] text-[#9dd6aa]";
  }
  if (lower.includes("block") || lower.includes("missing") || lower.includes("unwired") || lower.includes("gap")) {
    return "border-[#6c4039] bg-[#251716] text-[#efac9d]";
  }
  if (lower.includes("stale") || lower.includes("partial") || lower.includes("attention")) {
    return "border-[#5c533f] bg-[#211f18] text-[#d7c18d]";
  }
  return "border-[#313b4a] bg-[#151a24] text-[#aab4c2]";
}

function agentInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function agentGoal(agent: OpsAgent) {
  return "currentWorkingGoal" in agent && agent.currentWorkingGoal ? agent.currentWorkingGoal : agent.plan;
}

function compactPath(value: string) {
  return value.replace(/\\/g, "/").split("/").slice(-4).join("/");
}

function Panel({
  id,
  title,
  eyebrow,
  icon: Icon,
  children,
  className = "",
}: {
  id?: string;
  title: string;
  eyebrow: string;
  icon: typeof Activity;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`rounded-lg border border-[#273241] bg-[#10151d] p-4 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#d99b72]">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold text-[#f4eee5]">{title}</h2>
        </div>
        <Icon className="h-5 w-5 text-[#d99b72]" aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#768194]">{label}</p>
      <strong className="mt-2 block font-mono text-2xl font-semibold text-[#f4eee5]">{value}</strong>
      <span className="mt-1 block text-xs leading-5 text-[#8f9aaa]">{detail}</span>
    </div>
  );
}

function CriticalCell({ label, value, detail, tone }: { label: string; value: string | number; detail: string; tone: string }) {
  return (
    <div className={`rounded-md border px-3 py-3 ${statusTone(tone)}`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-80">{label}</p>
      <strong className="mt-2 block font-mono text-xl font-semibold">{value}</strong>
      <span className="mt-1 block text-xs leading-5 opacity-85">{detail}</span>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#222a35]">
      <span className="block h-full rounded-full bg-[#d99b72]" style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
    </div>
  );
}

export default function OpsDashboard({
  snapshot,
  ops,
  accessLabel,
}: {
  snapshot: MissionControlSnapshot;
  ops: OpsData;
  accessLabel: string;
}) {
  const targets = ops.agents.map((agent) => ({
    id: agent.id,
    label: `${agent.displayName} - ${agent.role}`,
  }));
  const blockedGoals = ops.goalTree.filter((goal) => goal.blocked).length;
  const staleAgents = ops.agents.filter((agent) => agent.state.toLowerCase().includes("stale")).length;
  const topAgents = [...ops.agents].sort((left, right) => right.stats.durableMemories - left.stats.durableMemories).slice(0, 8);
  const operatorGoal = ops.goalTree.find((goal) => goal.id.startsWith("goal-"));
  const directiveProofPath = operatorGoal?.detail ?? "Goal directive not recorded yet.";

  return (
    <main className="min-h-screen bg-[#0b0e14] px-4 py-6 text-[#f4eee5] md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="rounded-lg border border-[#273241] bg-[#10151d] px-5 py-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#d99b72]">ChapAI /ops</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-normal text-[#f4eee5] md:text-5xl">
                Swarm command surface
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#9aa6b6]">
                One operator-only room for agent identity, memory, lane health, Telegram state, NCLEX growth, business signals, token economics, and durable manual commands.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[520px] xl:grid-cols-4">
              <Metric label="agents" value={ops.stats.totalAgents} detail={`${ops.stats.liveAgents} live / ${ops.stats.blockedAgents} blocked`} />
              <Metric label="nclex" value={ops.stats.nclexLive} detail={`${ops.stats.nclexTo2000} to 2,000`} />
              <Metric label="memory" value={ops.stats.memoryEntries} detail={`${ops.stats.skills} skills`} />
              <Metric label="access" value="operator" detail={accessLabel} />
            </div>
          </div>
          <nav className="mt-5 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#9aa6b6]">
            {["directive", "agents", "profit-radar", "goals", "lanes", "memory", "telegram", "nclex", "growth", "intel", "data", "tokens", "phase2", "overrides"].map((item) => (
              <a key={item} href={`#${item}`} className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2 transition hover:border-[#d99b72] hover:text-[#f4eee5]">
                {item}
              </a>
            ))}
          </nav>
        </header>

        <section id="directive" className="mt-4 rounded-lg border border-[#273241] bg-[#0f141b] p-4">
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#d99b72]">directive execution</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#f4eee5]">Current operator goal</h2>
              <p className="mt-2 text-sm leading-6 text-[#9aa6b6]">
                {operatorGoal?.label ?? "No durable /goal directive has been recorded yet. Submit a /goal command to bind lane plans, learning, and profit radar to one operator objective."}
              </p>
              <div className="mt-3 grid gap-2 font-mono text-[11px] text-[#8b95a3]">
                <span>owner {operatorGoal?.owner ?? "orchestrator"} / progress {operatorGoal?.progress ?? 0}%</span>
                <span>boundary {directiveProofPath}</span>
                <span>scope agent utility, safe tool autonomy, memory hygiene, profit-pattern recognition</span>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <CriticalCell label="blocked goals" value={blockedGoals} detail={`${ops.goalTree.length} active goals`} tone={blockedGoals ? "blocked" : "live"} />
              <CriticalCell label="restart due" value={ops.heartbeats.restartDue} detail="heartbeat watchdog" tone={ops.heartbeats.restartDue ? "attention" : "live"} />
              <CriticalCell label="stale agents" value={staleAgents} detail={`${ops.stats.liveAgents} live now`} tone={staleAgents ? "stale" : "live"} />
              <CriticalCell label="queued overrides" value={ops.overrides.commands.length} detail="operator command bus" tone={ops.overrides.commands.length ? "attention" : "live"} />
            </div>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            {["truth before autonomy", "approval-gated tools", "non-confounding memory", "profit radar"].map((item) => (
              <span key={item} className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#c8d0db]">
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="provider inventory" value={ops.stats.providerCount} detail={`${snapshot.unifiedGuild.providerReadiness.live} live providers`} />
          <Metric label="approval load" value={ops.stats.approvals} detail="growth and guild approvals" />
          <Metric label="profit radar" value={ops.stats.profitCandidates} detail="low-budget candidates" />
          <Metric label="learning queue" value={ops.stats.learningCandidates} detail={`${ops.stats.rejectedMemory} rejected / ${ops.stats.confoundedMemory} confounded`} />
        </section>

        <div className="mt-4 grid gap-4 2xl:grid-cols-[1.25fr_0.75fr]">
          <Panel id="agents" title="Agent Now" eyebrow="live telemetry cards" icon={Users}>
            <div className="grid gap-3 xl:grid-cols-2">
              {ops.agents.map((agent) => {
                const toolList = agent.sources.map((source) => source.kind).slice(0, 3);
                const now = ops.agentNow.find((item) => item.agentId === agent.id);
                return (
                  <article key={agent.id} className="rounded-lg border border-[#273241] bg-[#0b0e14] p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#d99b72]/45 bg-[#1a1716] font-mono text-sm font-semibold text-[#f0b489]">
                        {agentInitials(agent.displayName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-sm text-[#f4eee5]">{agent.displayName}</strong>
                          <span className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusTone(`${agent.state} ${agent.truthLevel} ${agent.blocker}`)}`}>
                            {agent.state} / {now?.toolMode ?? "approval"}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#768194]">{agent.role} / {agent.runtime} / {now?.truthLevel ?? agent.truthLevel}</p>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#c8d0db]">{now?.currentAction ?? agent.currentTask}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-[#8f9aaa]">
                      <div>
                        <span className="font-mono uppercase tracking-[0.14em] text-[#768194]">goal</span>
                        <p className="mt-1 line-clamp-2 leading-5">{agentGoal(agent)}</p>
                      </div>
                      <div>
                        <span className="font-mono uppercase tracking-[0.14em] text-[#768194]">plan</span>
                        <p className="mt-1 line-clamp-2 leading-5">{now?.nextPlan ?? agent.plan}</p>
                      </div>
                      <div>
                        <span className="font-mono uppercase tracking-[0.14em] text-[#768194]">learning</span>
                        <p className="mt-1 line-clamp-2 leading-5">{now?.learningMoment ?? "No fresh learning event recorded."}</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <span className={`rounded-md border px-2 py-1 ${statusTone(now?.approvalState ?? agent.blocker)}`}>{now?.approvalState ?? agent.blocker}</span>
                        <span className="rounded-md border border-[#273241] px-2 py-1">fresh {now?.heartbeatFreshness ?? "unknown"}</span>
                      </div>
                      <p className="truncate font-mono text-[11px] text-[#768194]">proof {compactPath(now?.proofPath ?? agent.sources[0]?.path ?? "missing")}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="rounded-md border border-[#273241] px-2 py-1">mem {agent.stats.durableMemories}</span>
                        <span className="rounded-md border border-[#273241] px-2 py-1">skills {agent.stats.skills}</span>
                        <span className="rounded-md border border-[#273241] px-2 py-1">events {agent.stats.memoryEvents}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(toolList.length ? toolList : [agent.runtime]).map((tool) => (
                          <span key={tool} className="rounded-md border border-[#273241] bg-[#10151d] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#9aa6b6]">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>

          <div className="grid gap-4">
            <Panel id="goals" title="Goal tree" eyebrow="live progress" icon={Goal}>
              <div className="space-y-3">
                {ops.goalTree.map((goal) => (
                  <article key={goal.id} className="rounded-md border border-[#273241] bg-[#0b0e14] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong className="text-sm text-[#f4eee5]">{goal.label}</strong>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#768194]">{goal.owner}</p>
                      </div>
                      <span className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${goal.blocked ? "border-[#6c4039] bg-[#251716] text-[#efac9d]" : "border-[#35593f] bg-[#162319] text-[#9dd6aa]"}`}>
                        {goal.blocked ? "blocked" : "clear"}
                      </span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={goal.progress} />
                      <div className="mt-2 flex justify-between gap-3 text-xs text-[#8f9aaa]">
                        <span>{goal.detail}</span>
                        <span className="font-mono">{goal.progress}%</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel id="telegram" title="Telegram log" eyebrow="comms lane" icon={MessagesSquare}>
              <div className="mb-3 grid gap-2 sm:grid-cols-3">
                <Metric label="commands" value={ops.telegramControl.commands} detail={`${ops.telegramControl.acceptedCommands} accepted`} />
                <Metric label="queued replies" value={ops.telegramControl.outboundQueued} detail="not externally sent" />
                <Metric label="goals" value={ops.telegramControl.goalDirectives} detail={`${ops.telegramControl.confirmationRequired} confirmations held`} />
              </div>
              <div className="space-y-2">
                {ops.telegramMessages.map((message) => (
                  <article key={message.id} className="rounded-md border border-[#273241] bg-[#0b0e14] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#d99b72]">{message.lane}</span>
                      <span className="font-mono text-[11px] text-[#768194]">{message.at ? new Date(message.at).toLocaleString() : "no timestamp"}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#c8d0db]">{message.text}</p>
                    <span className={`mt-2 inline-flex rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusTone(message.status)}`}>
                      {message.status}
                    </span>
                  </article>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          <Panel id="profit-radar" title="Profit radar" eyebrow="budget-aware candidates" icon={CircleDollarSign}>
            <div className="space-y-2">
              {ops.profitRadar.length > 0 ? ops.profitRadar.map((item) => (
                <article key={item.id} className="rounded-md border border-[#273241] bg-[#0b0e14] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <strong className="text-sm text-[#f4eee5]">{item.pattern}</strong>
                    <span className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#9aa6b6]">{item.targetCustomer} / {item.offerMapping}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <span className="rounded-md border border-[#273241] px-2 py-1 text-xs">cost ${item.estimatedBudgetUsd}</span>
                    <span className="rounded-md border border-[#273241] px-2 py-1 text-xs">confidence {Math.round(item.confidence * 100)}%</span>
                    <span className={`rounded-md border px-2 py-1 text-xs ${statusTone(item.approvalNeeded)}`}>{item.approvalNeeded}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#c8d0db]">{item.nextTest}</p>
                  <p className="mt-1 truncate font-mono text-[11px] text-[#768194]">proof {compactPath(item.sourceProof)}</p>
                </article>
              )) : (
                <p className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2 text-sm text-[#8f9aaa]">
                  No profit-pattern candidates have been staged yet.
                </p>
              )}
            </div>
          </Panel>

          <Panel id="lanes" title="Lane status grid" eyebrow="queues and error rate" icon={RadioTower}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-separate border-spacing-y-2 text-left">
                <thead className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#768194]">
                  <tr>
                    <th className="px-2 py-1">lane</th>
                    <th className="px-2 py-1">agents</th>
                    <th className="px-2 py-1">queue</th>
                    <th className="px-2 py-1">tokens 24h</th>
                    <th className="px-2 py-1">error</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-[#c8d0db]">
                  {ops.lanes.map((lane) => (
                    <tr key={lane.lane} className="bg-[#0b0e14]">
                      <td className="rounded-l-md border-y border-l border-[#273241] px-2 py-2">{lane.lane}</td>
                      <td className="border-y border-[#273241] px-2 py-2">{lane.live}/{lane.agents}</td>
                      <td className="border-y border-[#273241] px-2 py-2 font-mono">{lane.queueDepth}</td>
                      <td className="border-y border-[#273241] px-2 py-2 font-mono">{lane.tokenSpend}</td>
                      <td className="rounded-r-md border-y border-r border-[#273241] px-2 py-2 font-mono">{lane.errorRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel id="memory" title="Memory and skills" eyebrow="per-agent brain counts" icon={Brain}>
            <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-[#c8d0db] md:grid-cols-4">
              <span className="rounded-md border border-[#273241] bg-[#0b0e14] px-2 py-2">vaults {ops.brainVaults.ready}/{ops.brainVaults.total}</span>
              <span className="rounded-md border border-[#273241] bg-[#0b0e14] px-2 py-2">canonical {ops.brainVaults.canonical}</span>
              <span className="rounded-md border border-[#273241] bg-[#0b0e14] px-2 py-2">candidate {ops.agenticGrowth.memoryCandidates}</span>
              <span className="rounded-md border border-[#273241] bg-[#0b0e14] px-2 py-2">rejected {ops.agenticGrowth.memoryRejected}</span>
              <span className="rounded-md border border-[#273241] bg-[#0b0e14] px-2 py-2">confounded {ops.agenticGrowth.confoundedMemory}</span>
              <span className="rounded-md border border-[#273241] bg-[#0b0e14] px-2 py-2">skill records {ops.agenticGrowth.skillRecords}</span>
              <span className="rounded-md border border-[#273241] bg-[#0b0e14] px-2 py-2">skill failures {ops.agenticGrowth.skillFailures}</span>
              <span className="rounded-md border border-[#273241] bg-[#0b0e14] px-2 py-2">{ops.agenticGrowth.guardrailPosture}</span>
            </div>
            <div className="space-y-2">
              {topAgents.map((agent) => {
                const vault = ops.brainVaults.rows.find((row) => row.agentId === agent.id);
                return (
                  <div key={agent.id} className="rounded-md border border-[#273241] bg-[#0b0e14] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm text-[#f4eee5]">{agent.displayName}</strong>
                      <span className="font-mono text-[11px] text-[#768194]">{agent.brain.health}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-[#c8d0db]">
                      <span className="rounded-md border border-[#273241] px-2 py-1">canonical {agent.stats.durableMemories}</span>
                      <span className="rounded-md border border-[#273241] px-2 py-1">staging {agent.stats.memoryEvents}</span>
                      <span className="rounded-md border border-[#273241] px-2 py-1">skills {agent.stats.skills}</span>
                    </div>
                    {vault ? (
                      <p className="mt-2 font-mono text-[11px] text-[#768194]">
                        vault {vault.manifest ? "manifest" : "missing"} / {vault.indexStatus}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel id="nclex" title="NCLEX KPIs" eyebrow="production beneficiary" icon={BarChart3}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="live questions" value={snapshot.product.nclexLiveQuestions} detail={`${snapshot.product.nclexApprovedRefinedUsable} approved/refined usable`} />
              <Metric label="ngn share" value={`${snapshot.product.nclexNgnRatio}%`} detail={`${snapshot.product.nclexNgnLiveQuestions} NGN live`} />
              <Metric label="draft backlog" value={snapshot.product.nclexDraftQuestions} detail="draft NCLEX items" />
              <Metric label="phase 6" value={ops.phase6Nclex.health} detail={`${ops.phase6Nclex.blockers.length} lane blockers`} />
            </div>
            <div className="mt-3 rounded-md border border-[#273241] bg-[#0b0e14] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm text-[#f4eee5]">Phase 6 NCLEX SaaS</strong>
                <span className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusTone(ops.phase6Nclex.health)}`}>
                  {ops.phase6Nclex.domain}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <span className="rounded-md border border-[#273241] px-2 py-2 text-xs text-[#c8d0db]">
                  {ops.phase6Nclex.kpis.progressPct}% to {ops.phase6Nclex.kpis.targetQuestions}
                </span>
                <span className="rounded-md border border-[#273241] px-2 py-2 text-xs text-[#c8d0db]">
                  {ops.phase6Nclex.kpis.progressToUsableTargetPct}% to {ops.phase6Nclex.kpis.usableTarget} usable
                </span>
                <span className="rounded-md border border-[#273241] px-2 py-2 text-xs text-[#c8d0db]">
                  NGN {ops.phase6Nclex.kpis.ngnRatio}% / {ops.phase6Nclex.kpis.ngnTarget}%
                </span>
                <span className="rounded-md border border-[#273241] px-2 py-2 text-xs text-[#c8d0db]">
                  review flags {ops.phase6Nclex.kpis.needsReview}
                </span>
                <span className="rounded-md border border-[#273241] px-2 py-2 text-xs text-[#c8d0db]">
                  dup families {ops.phase6Nclex.kpis.duplicateFamiliesCollapsed}
                </span>
                <span className="rounded-md border border-[#273241] px-2 py-2 text-xs text-[#c8d0db]">
                  parity {ops.phase6Nclex.truth.deploymentParity}/{ops.phase6Nclex.truth.syncParity}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {ops.phase6Nclex.lanes.map((lane) => (
                  <div key={lane.lane} className="rounded-md border border-[#273241] bg-[#10151d] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="font-mono text-xs uppercase tracking-[0.12em] text-[#f4eee5]">{lane.lane}</strong>
                      <span className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusTone(lane.blocked ? "attention" : lane.status ?? "live")}`}>
                        {lane.status ?? "unknown"} / {lane.progress ?? 0}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#9aa6b6]">{lane.goal}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                <div className="rounded-md border border-[#273241] bg-[#10151d] px-3 py-2">
                  <strong className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#d99b72]">item deficits</strong>
                  <div className="mt-2 space-y-1">
                    {ops.phase6Nclex.truth.topItemDeficits.slice(0, 3).map((item) => (
                      <p key={item.key ?? "item"} className="text-xs leading-5 text-[#c8d0db]">
                        {item.key}: {item.deficit} short
                      </p>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-[#273241] bg-[#10151d] px-3 py-2">
                  <strong className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#d99b72]">client need deficits</strong>
                  <div className="mt-2 space-y-1">
                    {ops.phase6Nclex.truth.topClientNeedDeficits.slice(0, 3).map((item) => (
                      <p key={item.key ?? "client-need"} className="text-xs leading-5 text-[#c8d0db]">
                        {item.key}: {item.deficit} short
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel id="growth" title="Growth KPIs" eyebrow="funnel and demand" icon={Activity}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="signups" value={ops.growthKpis.signups} detail="analytics connector not wired" />
              <Metric label="dau" value={ops.growthKpis.dau} detail="analytics connector not wired" />
              <Metric label="conversion" value={ops.growthKpis.conversion} detail="checkout funnel not metered here" />
              <Metric label="approvals" value={ops.growthKpis.approvals} detail={`${ops.growthKpis.blocked} blocked growth lanes`} />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <CriticalCell label="draft queue" value={ops.agenticGrowth.growthEngine.queue.pending} detail="human review pending" tone={ops.agenticGrowth.growthEngine.queue.pending ? "attention" : "live"} />
              <CriticalCell label="audit events" value={ops.agenticGrowth.growthEngine.auditEvents} detail="append-only growth log" tone={ops.agenticGrowth.growthEngine.auditEvents ? "live" : "missing"} />
              <CriticalCell label="measurement pending" value={ops.agenticGrowth.growthEngine.measurement.pending} detail="read-only access flags" tone={ops.agenticGrowth.growthEngine.measurement.pending ? "blocked" : "live"} />
              <CriticalCell label="agents" value={ops.agenticGrowth.growthEngine.agents} detail="draft-only growth lanes" tone={ops.agenticGrowth.growthEngine.agents >= 8 ? "live" : "attention"} />
              <CriticalCell label="campaigns" value={ops.agenticGrowth.growthEngine.campaigns} detail="campaign scaffolds" tone={ops.agenticGrowth.growthEngine.campaigns >= 10 ? "live" : "attention"} />
              <CriticalCell label="seo pages" value={ops.agenticGrowth.growthEngine.seoPages} detail="registry entries" tone={ops.agenticGrowth.growthEngine.seoPages >= 20 ? "live" : "attention"} />
            </div>
            <div className="mt-3 space-y-2">
              {ops.agenticGrowth.growthEngine.measurement.rows.slice(0, 8).map((row) => (
                <div key={row.source} className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm text-[#f4eee5]">{row.source}</strong>
                    <span className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusTone(row.status)}`}>
                      {row.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#8f9aaa]">{row.notes}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {ops.growthKpis.trafficSources.map((source) => (
                <span key={source} className="rounded-md border border-[#273241] bg-[#0b0e14] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#9aa6b6]">
                  {source}
                </span>
              ))}
            </div>
          </Panel>

          <Panel id="intel" title="Intel digest" eyebrow="today and archive seed" icon={Database}>
            <div className="space-y-2">
              {ops.intelDigest.length > 0 ? ops.intelDigest.map((item, index) => (
                <p key={`${index}-${item}`} className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2 text-sm leading-6 text-[#c8d0db]">
                  {item}
                </p>
              )) : (
                <p className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2 text-sm text-[#8f9aaa]">
                  No intel digest has been exported yet.
                </p>
              )}
            </div>
          </Panel>

          <Panel id="data" title="ChapAi data layer" eyebrow="normalized connector stream" icon={Database}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="events" value={ops.dataLayer.events} detail={`${ops.dataLayer.files} jsonl files`} />
              <Metric label="sources" value={ops.dataLayer.sources.length} detail={ops.dataLayer.health} />
              <Metric label="invalid" value={ops.dataLayer.invalid} detail="schema failures" />
            </div>
            <div className="mt-3 space-y-2">
              {ops.dataLayer.sources.map((source) => (
                <div key={source.source} className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="font-mono text-xs uppercase tracking-[0.12em] text-[#f4eee5]">{source.source}</strong>
                    <span className="font-mono text-[11px] text-[#768194]">{source.events} events</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#8f9aaa]">
                    {source.eventTypes.join(", ")} / {source.taints.join(", ")}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 max-h-[220px] space-y-2 overflow-auto pr-1">
              {ops.dataLayer.latest.map((event) => (
                <div key={event.id} className="rounded-md border border-[#273241] bg-[#10151d] px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#d99b72]">{event.source} / {event.type}</span>
                    <span className="font-mono text-[11px] text-[#768194]">{event.emittedAt ? new Date(event.emittedAt).toLocaleString() : "no time"}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-[#c8d0db]">{event.summary}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel id="tokens" title="Token economics" eyebrow="routing and budget" icon={CircleDollarSign}>
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <Metric label="24h spend" value={ops.tokenEconomics.total} detail={ops.tokenEconomics.budgetState} />
              <Metric label="routing" value="cascade" detail="local/free before premium" />
            </div>
            <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
              {ops.tokenEconomics.rows.map((row) => (
                <div key={`${row.agentId}-${row.lane}`} className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="font-mono text-xs uppercase tracking-[0.12em] text-[#f4eee5]">{row.agentId}</strong>
                    <span className="font-mono text-[11px] text-[#768194]">{row.spend} / {row.budget}</span>
                  </div>
                  <p className="mt-1 text-sm text-[#9aa6b6]">{row.model} - {row.routing}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel id="phase2" title="Phase 2 supervision" eyebrow="deploy contracts" icon={ServerCog} className="2xl:col-span-3">
            <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr_1fr]">
              <div className="space-y-2">
                {ops.phaseReadiness.map((item) => (
                  <article key={item.item} className="rounded-md border border-[#273241] bg-[#0b0e14] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm text-[#f4eee5]">{item.item}</strong>
                      <span className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusTone(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#9aa6b6]">{item.detail}</p>
                  </article>
                ))}
              </div>

              <div className="rounded-md border border-[#273241] bg-[#0b0e14] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm text-[#f4eee5]">Heartbeat watchdog input</strong>
                  <span className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusTone(ops.heartbeats.restartDue > 0 ? "attention" : "live")}`}>
                    {ops.heartbeats.restartDue} restart due
                  </span>
                </div>
                <div className="mt-3 max-h-[360px] space-y-2 overflow-auto pr-1">
                  {ops.heartbeats.rows.slice(0, 10).map((row) => (
                    <div key={row.id} className="rounded-md border border-[#273241] bg-[#10151d] px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="font-mono text-xs uppercase tracking-[0.12em] text-[#f4eee5]">{row.id}</strong>
                        <span className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusTone(row.restartDue ? "attention" : row.state)}`}>
                          {row.restartDue ? "restart due" : row.state}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#8f9aaa]">
                        age {row.ageSeconds === null ? "missing" : `${Math.round(row.ageSeconds / 60)}m`} / missed {row.missedPings ?? "n/a"} / {row.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-[#273241] bg-[#0b0e14] p-3">
                <strong className="text-sm text-[#f4eee5]">Hetzner deploy artifacts</strong>
                <div className="mt-3 space-y-2">
                  {ops.phase2Infrastructure.map((item) => (
                    <div key={item.path} className="rounded-md border border-[#273241] bg-[#10151d] px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm text-[#c8d0db]">{item.label}</span>
                        <span className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusTone(item.ready ? "live" : "missing")}`}>
                          {item.ready ? "present" : "missing"}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-[#768194]">{item.path}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel title="System truth" eyebrow="known constraints" icon={AlertTriangle}>
            <div className="space-y-2 text-sm leading-6 text-[#c8d0db]">
              <p className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2">
                Websocket push is not configured in this repo. `/ops` uses the existing 30-second server refresh loop until Pusher or soketi is provisioned.
              </p>
              <p className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2">
                Growth analytics and token spend are exposed as missing meters rather than invented numbers.
              </p>
              <p className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2">
                Auth is enforced through the existing private dashboard access context; WebAuthn credential storage is not present in this codebase.
              </p>
            </div>
          </Panel>

          <section id="overrides">
            <OpsOverridePanel targets={targets} recentOverrides={ops.overrides.commands} />
          </section>
        </div>

        <footer className="mt-4 rounded-lg border border-[#273241] bg-[#10151d] px-4 py-3 text-xs text-[#768194]">
          <div className="flex flex-wrap items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-[#d99b72]" aria-hidden="true" />
            <span>Generated {new Date(ops.generatedAt).toLocaleString()}</span>
            <span>Boardroom freshness {ops.freshness.boardroom}</span>
            <span>Telegram freshness {ops.freshness.telegram}</span>
            <span>Growth freshness {ops.freshness.growth}</span>
            <TerminalSquare className="h-4 w-4 text-[#d99b72]" aria-hidden="true" />
            <span>Phase 1 dashboard baseline</span>
            <Command className="h-4 w-4 text-[#d99b72]" aria-hidden="true" />
            <span>{ops.overrides.commands.length} override commands retained</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
