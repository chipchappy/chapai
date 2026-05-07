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
  const topAgents = [...ops.agents].sort((left, right) => right.stats.durableMemories - left.stats.durableMemories).slice(0, 8);

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
            {["agents", "goals", "lanes", "memory", "telegram", "nclex", "growth", "intel", "data", "tokens", "phase2", "overrides"].map((item) => (
              <a key={item} href={`#${item}`} className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2 transition hover:border-[#d99b72] hover:text-[#f4eee5]">
                {item}
              </a>
            ))}
          </nav>
        </header>

        <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="provider inventory" value={ops.stats.providerCount} detail={`${snapshot.unifiedGuild.providerReadiness.live} live providers`} />
          <Metric label="approval load" value={ops.stats.approvals} detail="growth and guild approvals" />
          <Metric label="freshness" value={ops.freshness.guildLoop} detail="guild loop age" />
          <Metric label="blocked goals" value={blockedGoals} detail={`${ops.goalTree.length} active top-level goals`} />
        </section>

        <div className="mt-4 grid gap-4 2xl:grid-cols-[1.25fr_0.75fr]">
          <Panel id="agents" title="Agent roster" eyebrow="identity cards" icon={Users}>
            <div className="grid gap-3 xl:grid-cols-2">
              {ops.agents.map((agent) => {
                const toolList = agent.sources.map((source) => source.kind).slice(0, 3);
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
                            {agent.state}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#768194]">{agent.role} / {agent.runtime}</p>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#c8d0db]">{agent.currentTask}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-[#8f9aaa]">
                      <div>
                        <span className="font-mono uppercase tracking-[0.14em] text-[#768194]">goal</span>
                        <p className="mt-1 line-clamp-2 leading-5">{agentGoal(agent)}</p>
                      </div>
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
              <span className="rounded-md border border-[#273241] bg-[#0b0e14] px-2 py-2">staging {ops.brainVaults.staging}</span>
              <span className="rounded-md border border-[#273241] bg-[#0b0e14] px-2 py-2">rejected {ops.brainVaults.rejected}</span>
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
              <Metric label="daily growth" value="unmetered" detail="no daily delta ledger connected" />
            </div>
          </Panel>

          <Panel id="growth" title="Growth KPIs" eyebrow="funnel and demand" icon={Activity}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="signups" value={ops.growthKpis.signups} detail="analytics connector not wired" />
              <Metric label="dau" value={ops.growthKpis.dau} detail="analytics connector not wired" />
              <Metric label="conversion" value={ops.growthKpis.conversion} detail="checkout funnel not metered here" />
              <Metric label="approvals" value={ops.growthKpis.approvals} detail={`${ops.growthKpis.blocked} blocked growth lanes`} />
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
