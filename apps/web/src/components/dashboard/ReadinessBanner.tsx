import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Readiness verdict banner (pairs with the /pricing Pass Pledge).
// Derives an HONEST readiness signal from the student's real aggregate accuracy
// and volume — no fabricated per-exam scores. Bands mirror the on-site readiness
// calculator (≥65 "On Track" · 55–64 on the cusp · <55 building) so the language
// stays consistent across surfaces. A volume gate keeps a lucky small sample from
// reading "ready".
// ─────────────────────────────────────────────────────────────────────────────

export type ReadinessTone = "sage" | "blue" | "gold" | "clay";

export interface ReadinessVerdict {
  verdict: string;
  tone: ReadinessTone;
  headline: string;
  advice: string;
  meterPct: number;
  targetLabel: string;
  likelihood: string;
}

export const MIN_SIGNAL_ANSWERS = 25;
export const ON_TRACK_ACCURACY = 65;
export const CUSP_ACCURACY = 55;

export function computeReadiness(accuracy: number, totalAnswered: number): ReadinessVerdict {
  const acc = Math.max(0, Math.min(100, Math.round(accuracy)));

  if (totalAnswered < MIN_SIGNAL_ANSWERS) {
    const remaining = MIN_SIGNAL_ANSWERS - totalAnswered;
    return {
      verdict: "Warming up",
      tone: "blue",
      headline: "Your readiness signal is almost ready.",
      advice: `Answer ${remaining} more question${remaining === 1 ? "" : "s"} to generate a readiness read.`,
      meterPct: Math.round((totalAnswered / MIN_SIGNAL_ANSWERS) * 100),
      targetLabel: `${totalAnswered}/${MIN_SIGNAL_ANSWERS} answered`,
      likelihood: "Too early to call",
    };
  }

  if (acc >= ON_TRACK_ACCURACY) {
    return {
      verdict: "On Track",
      tone: "sage",
      headline: "You're testing at NCLEX-ready accuracy.",
      advice: "Hold your volume steady and keep the review queue light — that consistency is what protects the score.",
      meterPct: acc,
      targetLabel: "On Track line: 65%",
      likelihood: "On pace to pass if the trend holds",
    };
  }

  if (acc >= CUSP_ACCURACY) {
    return {
      verdict: "On the cusp",
      tone: "gold",
      headline: "You're close to the readiness line.",
      advice: "A focused week or two on your weakest lanes usually moves this over 65%.",
      meterPct: acc,
      targetLabel: "On Track line: 65%",
      likelihood: "Borderline — winnable in 1–2 focused weeks",
    };
  }

  return {
    verdict: "Keep building",
    tone: "clay",
    headline: "Below the readiness line for now.",
    advice: "Prioritize the review queue and the rationale loop before adding raw volume.",
    meterPct: acc,
    targetLabel: "On Track line: 65%",
    likelihood: "At risk at current accuracy",
  };
}

const TONE: Record<ReadinessTone, { wrap: string; chip: string; meter: string }> = {
  sage: {
    wrap: "border-[rgba(111,141,118,0.28)] bg-[linear-gradient(180deg,rgba(240,246,241,0.96),rgba(255,252,247,0.97))]",
    chip: "border-[rgba(111,141,118,0.28)] bg-[rgba(111,141,118,0.12)] text-[#55715e]",
    meter: "bg-[#7e9d86]",
  },
  blue: {
    wrap: "border-[rgba(90,127,136,0.26)] bg-[linear-gradient(180deg,rgba(239,246,248,0.95),rgba(255,252,247,0.97))]",
    chip: "border-[rgba(90,127,136,0.24)] bg-[rgba(90,127,136,0.1)] text-[#4f6f77]",
    meter: "bg-[#5A7F88]",
  },
  gold: {
    wrap: "border-[rgba(176,141,87,0.3)] bg-[linear-gradient(180deg,rgba(250,245,232,0.96),rgba(255,252,247,0.97))]",
    chip: "border-[rgba(176,141,87,0.28)] bg-[rgba(176,141,87,0.12)] text-[#8a6a2f]",
    meter: "bg-[#c9a15a]",
  },
  clay: {
    wrap: "border-[rgba(196,121,86,0.3)] bg-[linear-gradient(180deg,rgba(250,242,236,0.95),rgba(255,252,247,0.97))]",
    chip: "border-[rgba(196,121,86,0.24)] bg-[rgba(196,121,86,0.12)] text-[#9b5e42]",
    meter: "bg-[#c47956]",
  },
};

export default function ReadinessBanner({
  accuracy,
  totalAnswered,
  sevenDayAccuracy,
}: {
  accuracy: number;
  totalAnswered: number;
  sevenDayAccuracy: number;
}) {
  const verdict = computeReadiness(accuracy, totalAnswered);
  const tone = TONE[verdict.tone];
  const hasSignal = totalAnswered >= MIN_SIGNAL_ANSWERS;
  const basisLine = totalAnswered > 0
    ? `Based on ${totalAnswered} answered at ${Math.round(accuracy)}% overall${sevenDayAccuracy > 0 ? ` · ${sevenDayAccuracy}% last 7 days` : ""}.`
    : "No answers logged yet.";

  return (
    <section className={`readiness-banner rounded-[24px] border p-5 ${tone.wrap}`} aria-label="Predicted NCLEX readiness">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="terminal-label">Predicted NCLEX readiness</p>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tone.chip}`}>
              {verdict.verdict}
            </span>
            <span className="inline-flex rounded-full border border-[rgba(74,85,89,0.16)] bg-white/60 px-3 py-1 text-xs font-medium text-muted">
              {verdict.likelihood}
            </span>
          </div>
          <h2 className="mt-3 font-serif text-[1.7rem] leading-[1.02] text-dark">{verdict.headline}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{verdict.advice}</p>
          <p className="mt-1 text-xs text-muted">{basisLine}</p>

          <div className="mt-4 max-w-md">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{verdict.targetLabel}</span>
              {hasSignal ? <span className="font-semibold text-dark">{Math.round(accuracy)}%</span> : null}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(74,85,89,0.08)]">
              <div className={`h-full rounded-full ${tone.meter}`} style={{ width: `${verdict.meterPct}%` }} />
            </div>
            {hasSignal ? (
              <p className="mt-2 text-xs leading-5 text-muted">
                NCLEX standard comparison: practice banks treat ~{ON_TRACK_ACCURACY}% as the on-track line. You&rsquo;re{" "}
                {Math.round(accuracy) >= ON_TRACK_ACCURACY
                  ? `${Math.round(accuracy) - ON_TRACK_ACCURACY} pts above it`
                  : `${ON_TRACK_ACCURACY - Math.round(accuracy)} pts below it`}
                .
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 md:items-end md:text-right">
          <Link href="/quiz?mode=practice-exam&practiceExam=nclex-sim-1" className="btn-primary">
            Take a readiness exam &rarr;
          </Link>
          <p className="max-w-[15rem] text-xs leading-5 text-muted">
            Score <span className="font-semibold text-dark">On Track</span> on all 5 timed readiness exams to unlock the{" "}
            <Link href="/pricing" className="underline decoration-dotted underline-offset-2 hover:text-dark">
              Pass Pledge
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
