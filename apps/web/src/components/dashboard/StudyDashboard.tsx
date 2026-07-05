"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { StudyResource } from "@/lib/study-resources";
import ReadinessBanner from "@/components/dashboard/ReadinessBanner";

interface SessionSummary {
  id: string;
  exam: string;
  score?: number;
  scorePct?: number;
  totalQuestions: number;
  correctAnswers: number;
  createdAt?: string;
  startedAt?: number;
  completedAt?: number | null;
}

interface ReviewItem {
  questionId: string;
  stem: string;
  nextReviewAt: string | null;
  difficulty: number;
}

interface WeakArea {
  exam: string;
  category: string;
  label: string;
  totalAnswered: number;
  correctAnswered: number;
  accuracy: number;
}

interface DifficultyArea {
  difficulty: number;
  label: string;
  totalAnswered: number;
  correctAnswered: number;
  accuracy: number;
}

interface CjmmArea {
  step: string;
  label: string;
  totalAnswered: number;
  correctAnswered: number;
  accuracy: number;
}

interface WeakAreaRecommendation {
  category: string | null;
  categoryLabel: string | null;
  difficulty: number | null;
  difficultyLabel: string | null;
  cjmmStep: string | null;
  cjmmLabel: string | null;
  href: string;
  studyResources?: StudyResource[];
}

interface DashboardData {
  recentSessions: SessionSummary[];
  reviewQueue: ReviewItem[];
  weakAreas: WeakArea[];
  difficultyAreas: DifficultyArea[];
  cjmmSteps: CjmmArea[];
  recommendation: WeakAreaRecommendation | null;
  streak: number;
  peerPercentile: number | null;
  sevenDayAccuracy: number;
  totalAnswered: number;
  totalCorrect: number;
  premiumAnswered: number;
  legacyAnswered: number;
}

type ApiEnvelope<T> = T | { success?: boolean; data?: T };

function unwrapApiData<T>(payload: ApiEnvelope<T> | null | undefined, fallback: T): T {
  if (!payload) {
    return fallback;
  }

  if (typeof payload === "object" && "data" in payload && payload.data) {
    return payload.data;
  }

  return payload as T;
}

function sessionScore(session: SessionSummary) {
  return session.score ?? session.scorePct ?? (
    session.totalQuestions > 0 ? Math.round((session.correctAnswers / session.totalQuestions) * 100) : 0
  );
}

function sessionDate(session: SessionSummary) {
  if (session.createdAt) {
    return new Date(session.createdAt);
  }

  const timestamp = session.completedAt ?? session.startedAt;
  return timestamp ? new Date(timestamp * 1000) : new Date();
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "border-[rgba(111,141,118,0.24)] bg-[rgba(111,141,118,0.12)] text-[#55715e]"
      : score >= 65
        ? "border-[rgba(90,127,136,0.22)] bg-[rgba(90,127,136,0.1)] text-[#4f6f77]"
        : "border-[rgba(196,121,86,0.24)] bg-[rgba(196,121,86,0.12)] text-[#9b5e42]";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tone}`}>{score}%</span>;
}

function ProgressRing({ label, pct, target, tone, sub }: { label: string; pct: number; target: number; tone: string; sub?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  return (
    <article className="metric-tile rounded-[24px] p-5">
      <p className="terminal-label">{label}</p>
      <div className="mt-3 flex items-center gap-4">
        <svg viewBox="0 0 84 84" className="h-20 w-20 shrink-0 -rotate-90">
          <circle cx="42" cy="42" r={radius} fill="none" stroke="rgba(74,85,89,0.1)" strokeWidth="8" />
          <circle
            cx="42"
            cy="42"
            r={radius}
            fill="none"
            stroke={tone}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(clamped / 100) * circumference} ${circumference}`}
          />
        </svg>
        <div className="min-w-0">
          <p className="font-serif text-[2.1rem] leading-none text-dark">{clamped}%</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {clamped >= target ? `${clamped - target} pts above` : `${target - clamped} pts below`} the {target}% line
          </p>
        </div>
      </div>
      {sub ? <p className="mt-3 text-xs leading-5 text-muted">{sub}</p> : null}
    </article>
  );
}

function MilestoneBar({ label, value, steps, tone, unit }: { label: string; value: number; steps: number[]; tone: string; unit: string }) {
  const next = steps.find((step) => step > value) ?? steps[steps.length - 1];
  const prev = [...steps].reverse().find((step) => step <= value) ?? 0;
  const pct = value >= next ? 100 : next === prev ? 100 : Math.round(((value - prev) / (next - prev)) * 100);
  return (
    <article className="metric-tile rounded-[24px] p-5">
      <p className="terminal-label">{label}</p>
      <p className="mt-3 font-serif text-[2.1rem] leading-none text-dark">
        {value}
        <span className="ml-2 text-sm font-normal text-muted">{unit}</span>
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(74,85,89,0.08)]">
        <div className="h-full rounded-full" style={{ width: `${Math.max(4, pct)}%`, background: tone }} />
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">
        {value >= next ? `Top milestone reached.` : `${next - value} to the ${next} milestone`}
      </p>
    </article>
  );
}

export default function StudyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiEvaluation, setAiEvaluation] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/study/evaluation", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const body = unwrapApiData<{ evaluation?: string | null }>(payload, { evaluation: null });
        if (!cancelled && typeof body.evaluation === "string" && body.evaluation.length > 0) {
          setAiEvaluation(body.evaluation);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [historyRes, reviewRes, weakAreasRes] = await Promise.all([
          fetch("/api/quiz/history", { cache: "no-store" }),
          fetch("/api/quiz/review-queue", { cache: "no-store" }),
          fetch("/api/quiz/weak-areas", { cache: "no-store" }),
        ]);
        const historyPayload = historyRes.ok ? await historyRes.json() : null;
        const reviewPayload = reviewRes.ok ? await reviewRes.json() : null;
        const weakAreasPayload = weakAreasRes.ok ? await weakAreasRes.json() : null;
        const history = unwrapApiData<{
          sessions?: SessionSummary[];
          streak?: number;
          sevenDayAccuracy?: number;
          peerPercentile?: number | null;
          stats?: { totalQuestions?: number; totalCorrect?: number; overallAccuracy?: number };
        }>(historyPayload, { sessions: [] });
        const review = unwrapApiData<{ items?: ReviewItem[]; meta?: { dueNow?: number } }>(reviewPayload, { items: [] });
        const weakAreas = unwrapApiData<{
          areas?: WeakArea[];
          difficultyAreas?: DifficultyArea[];
          cjmmSteps?: CjmmArea[];
          recommendation?: WeakAreaRecommendation | null;
          meta?: { premiumAnswered?: number; legacyAnswered?: number };
        }>(weakAreasPayload, { areas: [] });
        const sessions: SessionSummary[] = history.sessions || [];

        setData({
          recentSessions: sessions.slice(0, 10),
          reviewQueue: review.items || [],
          streak: history.streak || 0,
          peerPercentile: history.peerPercentile ?? null,
          sevenDayAccuracy: history.sevenDayAccuracy || 0,
          weakAreas: (weakAreas.areas || []).slice(0, 3),
          difficultyAreas: (weakAreas.difficultyAreas || []).slice(0, 3),
          cjmmSteps: (weakAreas.cjmmSteps || []).slice(0, 3),
          recommendation: weakAreas.recommendation ?? null,
          totalAnswered: history.stats?.totalQuestions ?? sessions.reduce((sum, session) => sum + session.totalQuestions, 0),
          totalCorrect: history.stats?.totalCorrect ?? sessions.reduce((sum, session) => sum + session.correctAnswers, 0),
          premiumAnswered: weakAreas.meta?.premiumAnswered ?? 0,
          legacyAnswered: weakAreas.meta?.legacyAnswered ?? 0,
        });
      } catch {
        setData({
          recentSessions: [],
          reviewQueue: [],
          weakAreas: [],
          difficultyAreas: [],
          cjmmSteps: [],
          recommendation: null,
          streak: 0,
          peerPercentile: null,
          sevenDayAccuracy: 0,
          totalAnswered: 0,
          totalCorrect: 0,
          premiumAnswered: 0,
          legacyAnswered: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const examStats = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {};
    for (const session of data?.recentSessions ?? []) {
      const key = session.exam?.toUpperCase() || "UNKNOWN";
      if (!map[key]) map[key] = { correct: 0, total: 0 };
      map[key].correct += session.correctAnswers || 0;
      map[key].total += session.totalQuestions || 0;
    }

    return Object.entries(map).map(([exam, totals]) => ({
      exam,
      accuracy: totals.total > 0 ? Math.round((totals.correct / totals.total) * 100) : 0,
      total: totals.total,
    }));
  }, [data?.recentSessions]);

  const weakAreas = data?.weakAreas ?? [];
  const weakestDifficulty = data?.difficultyAreas[0] ?? null;
  const weakestCjmm = data?.cjmmSteps[0] ?? null;
  const strongestLane = useMemo(() => [...examStats].sort((a, b) => b.accuracy - a.accuracy)[0] ?? null, [examStats]);
  const weakestLane = weakAreas[0] ?? null;
  const resumeHref = data?.recommendation?.href ?? (weakestLane ? `/quiz?category=${encodeURIComponent(weakestLane.category)}` : "/quiz?exam=nclex&mode=standard");
  const recommendationResources = useMemo(() => data?.recommendation?.studyResources ?? [], [data?.recommendation?.studyResources]);

  const nextObjective = useMemo(() => {
    if (!data) {
      return null;
    }

    if (data.reviewQueue.length > 0) {
      return {
        label: "Next objective",
        title: `Clear ${data.reviewQueue.length} review item${data.reviewQueue.length === 1 ? "" : "s"}.`,
        body: "Protect retention first. Knock out the due queue while the exact misses, tutor logic, and citations are still fresh.",
        href: "/quiz?mode=review",
        cta: "Start review block",
        tone: "sage" as const,
      };
    }

    if (weakestLane) {
      const challenge = [
        weakestDifficulty ? weakestDifficulty.label : null,
        weakestCjmm ? weakestCjmm.label : null,
      ].filter(Boolean).join(" / ");
      return {
        label: "Next objective",
        title: `Rebuild ${weakestLane.label}.`,
        body: `${weakestLane.accuracy}% accuracy across ${weakestLane.totalAnswered} saved answers.${challenge ? ` Bias the next review toward ${challenge}.` : ""}${recommendationResources[0] ? ` Pair it with ${recommendationResources[0].title}.` : " Open a fresh live-bank run and keep the rationale loop tight."}`,
        href: resumeHref,
        cta: "Resume practice \u2192",
        tone: "gold" as const,
      };
    }

    return {
      label: "Next objective",
      title: data.recentSessions.length > 0 ? "Keep the streak clean." : "Start the first clean run.",
      body: data.recentSessions.length > 0
        ? "Your queue is clear. Use a fresh live-bank session to keep momentum while the pattern recognition is warm."
        : "Open a live bank, answer a first set, and this dashboard will start shaping the next best move automatically.",
      href: "/quiz?exam=nclex&mode=standard",
      cta: data.recentSessions.length > 0 ? "Resume practice \u2192" : "Start your first session",
      tone: "blue" as const,
    };
  }, [data, weakestCjmm, weakestDifficulty, weakestLane, resumeHref, recommendationResources]);

  if (loading) {
    return (
      <div className="loading-console mx-auto max-w-5xl py-14 text-center">
        <div className="inline-flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#8ea884]" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">Loading your study dashboard...</p>
      </div>
    );
  }

  const overallAccuracy = data && data.totalAnswered > 0
    ? Math.round((data.totalCorrect / data.totalAnswered) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <ReadinessBanner
        accuracy={overallAccuracy}
        totalAnswered={data?.totalAnswered ?? 0}
        sevenDayAccuracy={data?.sevenDayAccuracy ?? 0}
      />

      <section className="dashboard-hub overflow-hidden rounded-[30px] p-6 md:p-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="terminal-label">Study dashboard</p>
            <h1 className="mt-2 font-serif text-[clamp(2.4rem,3.4vw,3.1rem)] leading-[0.96] text-dark">Your study console.</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {typeof data?.peerPercentile === "number" ? (
              <span className="signal-pill signal-pill-sage">Ahead of {data.peerPercentile}% of students this week</span>
            ) : null}
            <span className="signal-pill signal-pill-gold">{data?.reviewQueue.length ?? 0} due for review</span>
            {strongestLane ? <span className="signal-pill">Best lane: {strongestLane.exam}</span> : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ProgressRing
            label="Overall accuracy"
            pct={overallAccuracy}
            target={65}
            tone="#7e9d86"
            sub={`${data?.totalCorrect ?? 0}/${data?.totalAnswered ?? 0} correct all-time`}
          />
          <ProgressRing
            label="7-day accuracy"
            pct={data && data.totalAnswered > 0 ? data.sevenDayAccuracy : 0}
            target={65}
            tone="#5A7F88"
            sub="completed sessions this week"
          />
          <MilestoneBar label="Questions answered" value={data?.totalAnswered ?? 0} steps={[50, 100, 250, 500, 1000, 2500, 5000]} tone="#c9a15a" unit="answered" />
          <MilestoneBar label="Study streak" value={data?.streak ?? 0} steps={[3, 7, 14, 30, 60, 100]} tone="#c47956" unit="days" />
        </div>

        {weakAreas.length ? (
          <div className="mt-6 border-t border-[rgba(139,120,93,0.16)] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="terminal-label">Weak points</p>
              <Link href={resumeHref} className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5A7F88] hover:text-dark">
                Drill the weakest &rarr;
              </Link>
            </div>
            <div className="mt-4 grid gap-x-6 gap-y-4 md:grid-cols-3">
              {weakAreas.map((area) => (
                <div key={`${area.exam}-${area.category}`}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-dark">{area.label}</span>
                    <span className="text-muted">{area.accuracy}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(74,85,89,0.12)]">
                    <div
                      className={`h-full rounded-full ${area.accuracy >= 65 ? "bg-[#7e9d86]" : area.accuracy >= 50 ? "bg-[#c9a15a]" : "bg-[#c47956]"}`}
                      style={{ width: `${Math.max(6, area.accuracy)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">{area.totalAnswered} answered</p>
                </div>
              ))}
            </div>
            {(weakestDifficulty || weakestCjmm) ? (
              <p className="mt-3 text-xs leading-5 text-muted">
                Adaptive target:{" "}
                {[
                  weakestDifficulty ? `${weakestDifficulty.label} (${weakestDifficulty.accuracy}%)` : null,
                  weakestCjmm ? `${weakestCjmm.label} (${weakestCjmm.accuracy}%)` : null,
                ].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="study-console-panel">
          <p className="terminal-label">Next move</p>
          {nextObjective ? (
            <>
              <h2 className="mt-3 font-serif text-[1.8rem] leading-[0.98] text-dark">{nextObjective.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{nextObjective.body}</p>
              <Link href={nextObjective.href} className="btn-primary mt-4 inline-flex">
                {nextObjective.cta}
              </Link>
            </>
          ) : null}
          <div className="mt-5 grid gap-3">
            <Link href="/quiz?exam=nclex&mode=ngn" className="dashboard-action-row">
              <span>
                <strong>NGN focus</strong>
                <small>Matrix, ordering, bow-tie, and multipart reps.</small>
              </span>
              <span className="signal-pill signal-pill-gold">NGN</span>
            </Link>
            <Link href="/quiz?mode=practice-exam&practiceExam=nclex-sim-1" className="dashboard-action-row">
              <span>
                <strong>Readiness exam</strong>
                <small>Timed, scored against the blueprint — feeds your verdict.</small>
              </span>
              <span className="signal-pill">Timed</span>
            </Link>
            <Link href="/account/billing" className="dashboard-action-row">
              <span>
                <strong>Account &amp; billing</strong>
                <small>Plan status, payment method, cancel anytime.</small>
              </span>
              <span className="signal-pill">Manage</span>
            </Link>
          </div>
        </article>

        <article className="study-console-panel">
          <div className="flex items-center gap-2">
            <p className="terminal-label">{aiEvaluation ? "AI evaluation" : "Coach note"}</p>
            {aiEvaluation ? <span className="signal-pill signal-pill-blue">AI</span> : null}
          </div>
          {aiEvaluation ? (
            <p className="mt-3 text-sm leading-7 text-muted">{aiEvaluation}</p>
          ) : (
            <>
              <h2 className="mt-3 font-serif text-[1.8rem] leading-[0.98] text-dark">
                {data?.reviewQueue.length ? "Protect recall before pushing speed." : "Use your clearest lane to press volume."}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                {data?.reviewQueue.length
                  ? "A clean review queue keeps misses from quietly compounding. Clear due items, then go back to fresh bank reps."
                  : strongestLane
                    ? `${strongestLane.exam} is converting best right now. Stack more reps there while you still have rhythm, then return to the weaker lane.`
                    : "The dashboard will get smarter as soon as you log a few sessions. Start with a clean live-bank run."}
              </p>
            </>
          )}
        </article>
      </section>

      <section>
        <article className="study-console-panel">
          <div className="flex items-center justify-between gap-3">
            <p className="terminal-label">Recent sessions</p>
            <Link href="/quiz" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5A7F88]">
              Practice now
            </Link>
          </div>
          {data && data.reviewQueue.length > 0 ? (
            <div className="mt-4 rounded-[18px] border border-[rgba(111,141,118,0.2)] bg-[rgba(240,246,241,0.7)] px-4 py-3 text-sm">
              <span className="font-semibold text-dark">
                {data.reviewQueue.length} question{data.reviewQueue.length === 1 ? "" : "s"} due for spaced review.
              </span>{" "}
              <Link href="/quiz?mode=review" className="underline decoration-dotted underline-offset-2 text-[#55715e] hover:text-dark">
                Start review
              </Link>
            </div>
          ) : null}
          {data?.recentSessions.length ? (
            <div className="mt-4 space-y-3">
              {data.recentSessions.slice(0, 4).map((session) => (
                <div key={session.id} className="dashboard-session-row">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5A7F88]">{session.exam}</p>
                    <p className="mt-1 text-sm text-dark">
                      {session.correctAnswers}/{session.totalQuestions} correct
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {sessionDate(session).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <ScoreBadge score={sessionScore(session)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty mt-4">
              <p className="font-semibold text-dark">No saved sessions yet.</p>
              <p className="mt-2 text-sm leading-6 text-muted">Start a live-bank set and your progress will appear here automatically.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
