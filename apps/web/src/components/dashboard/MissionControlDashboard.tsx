import type { MissionControlSnapshot } from "@/lib/types";
import GuildOfficeScene from "@/components/dashboard/GuildOfficeScene";

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
    <div className="guild-top-chip">
      <small>{label}</small>
      <strong>{value}</strong>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}

export default function MissionControlDashboard({
  snapshot,
}: {
  snapshot: MissionControlSnapshot;
}) {
  const linkedBrains = snapshot.agents.filter((agent) => agent.brainStatus === "linked").length;
  const blockedAgents = snapshot.agents.filter((agent) => agent.blocker !== "none").length;
  const liveQuestionTotal = snapshot.product.ccrnLiveQuestions + snapshot.product.nclexLiveQuestions;
  const liveAgents = snapshot.agents.filter((agent) => agent.state === "live").length;
  const growthBoard = [...snapshot.brains]
    .sort((left, right) => {
      const growthDelta = right.growthLevel - left.growthLevel;
      if (growthDelta !== 0) {
        return growthDelta;
      }
      return right.skillCount - left.skillCount;
    })
    .slice(0, 4);

  return (
    <div className="guild-shell">
      <section className="guild-topbar">
        <div className="guild-topbar-copy">
          <div className="section-label">Private guild dashboard</div>
          <h1>One live room for the swarm.</h1>
          <p>Workers stay in the room. The operator terminal stays on the right. Click any employee for the full dossier.</p>
        </div>

        <div className="guild-topbar-stats">
          <StatChip label="Live" value={String(liveAgents)} detail="active now" />
          <StatChip label="Questions" value={String(liveQuestionTotal)} detail="live bank" />
          <StatChip label="Brains" value={String(linkedBrains)} detail="linked" />
          <StatChip label="Blocked" value={String(blockedAgents)} detail="needs help" />
          <StatChip label="Checkout" value={snapshot.runtime.checkoutStatus} detail={snapshot.runtime.stripeMode} />
        </div>

        <div className="guild-topbar-actions">
          <a className="btn-secondary" href="https://clarityccrn.chapaisolutions.com/design-review">
            Review design
          </a>
          <a className="btn-secondary" href="https://clarityccrn.chapaisolutions.com/upgrade">
            Open packages
          </a>
          <form action="/api/dashboard-auth/logout" method="post">
            <button type="submit" className="btn-secondary">
              Lock dashboard
            </button>
          </form>
        </div>
      </section>

      <section className="guild-growth-strip">
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
            <h2 className="mt-2 font-serif text-[2rem] leading-[0.98] text-dark">
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
              <p className="mt-3 text-sm leading-6 text-muted">{system.bestUse.join(" · ")}</p>
            </article>
          ))}
        </div>
      </section>

      <GuildOfficeScene snapshot={snapshot} />
    </div>
  );
}
