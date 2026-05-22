"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MissionControlSnapshot } from "@/lib/types";

type BoardroomControlPanelProps = {
  boardroom: MissionControlSnapshot["boardroom"];
  access: {
    role: "viewer" | "operator";
    displayLabel: string | null;
    accessType: string | null;
    canSummon: boolean;
  };
};

export default function BoardroomControlPanel({ boardroom, access }: BoardroomControlPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runAction(action: "summon" | "close") {
    setError(null);
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/boardroom/meeting", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            action,
            reason:
              action === "summon"
                ? "Manual founder/operator board meeting to collect reusable learnings and align the next shift."
                : "Close the board meeting and auto-resume paused lanes.",
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(payload?.error ?? "The boardroom action did not complete cleanly.");
          return;
        }

        router.refresh();
      })();
    });
  }

  const activeMeeting = boardroom.activeMeeting;

  return (
    <section className="rounded-[30px] border border-border bg-[rgba(255,252,247,0.92)] p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="section-label">Boardroom control</div>
          <h2 className="mt-2 font-serif text-[2rem] leading-[0.98] text-dark">
            summon, synthesize, and release the swarm without losing the thread.
          </h2>
          <p className="mt-3 max-w-[52rem] text-sm leading-7 text-muted">
            Preview-key access now drives the internal boardroom. Founder, tester, and creator passes can summon; reviewer passes stay read-only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          <span className="rounded-full border border-border px-3 py-1">{access.displayLabel ?? "private"}</span>
          <span className="rounded-full border border-border px-3 py-1">{boardroom.cadence}</span>
          <span className="rounded-full border border-border px-3 py-1">{activeMeeting ? activeMeeting.status : "idle"}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[24px] border border-border bg-[rgba(251,249,243,0.96)] p-4">
          <p className="section-label">Digest</p>
          <div className="mt-3 grid gap-2">
            {boardroom.digest.length > 0 ? boardroom.digest.map((item) => (
              <div key={item} className="rounded-[18px] border border-[rgba(74,85,89,0.08)] bg-white/70 px-4 py-3 text-sm leading-6 text-dark">
                {item}
              </div>
            )) : (
              <div className="rounded-[18px] border border-[rgba(74,85,89,0.08)] bg-white/70 px-4 py-3 text-sm leading-6 text-muted">
                No boardroom digest is recorded yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-border bg-[rgba(251,249,243,0.96)] p-4">
          <p className="section-label">Controls</p>
          <div className="mt-3 grid gap-3">
            {activeMeeting ? (
              <>
                <div className="rounded-[18px] border border-[rgba(90,127,136,0.12)] bg-[rgba(90,127,136,0.08)] px-4 py-3 text-sm leading-6 text-dark">
                  Meeting {activeMeeting.meetingId.slice(0, 8)} is live. {activeMeeting.arrivedCount}/{activeMeeting.totalAgents} lanes checked in.
                </div>
                {access.canSummon ? (
                  <button type="button" className="btn-primary" disabled={isPending} onClick={() => runAction("close")}>
                    {isPending ? "Closing..." : "Close and auto-resume"}
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <div className="rounded-[18px] border border-[rgba(126,157,134,0.16)] bg-[rgba(126,157,134,0.08)] px-4 py-3 text-sm leading-6 text-dark">
                  No active board meeting. Summon will checkpoint current learnings, pause cooperative lanes, and open the podium state.
                </div>
                {access.canSummon ? (
                  <button type="button" className="btn-primary" disabled={isPending} onClick={() => runAction("summon")}>
                    {isPending ? "Summoning..." : "Summon all agents"}
                  </button>
                ) : (
                  <div className="rounded-[18px] border border-[rgba(74,85,89,0.08)] bg-white/70 px-4 py-3 text-sm leading-6 text-muted">
                    This access level can review the boardroom but cannot issue a summon.
                  </div>
                )}
              </>
            )}
            <a className="btn-secondary" href="/dashboard#boardroom">
              View in command center
            </a>
            {error ? (
              <div className="rounded-[16px] border border-[rgba(144,72,52,0.2)] bg-[rgba(144,72,52,0.08)] px-4 py-3 text-sm leading-6 text-[rgba(144,72,52,0.92)]">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
