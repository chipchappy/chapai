"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { StudyResource } from "@/lib/study-resources";

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

function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "neutral" | "sage" | "blue" | "gold";
}) {
  const toneClasses =
    tone === "sage"
      ? "bg-[linear-gradient(180deg,rgba(240,246,241,0.95),rgba(255,252,247,0.96))]"
      : tone === "blue"
        ? "bg-[linear-gradient(180deg,rgba(239,246,248,0.95),rgba(255,252,247,0.96))]"
        : tone === "gold"
          ? "bg-[linear-gradient(180deg,rgba(250,245,232,0.96),rgba(255,252,247,0.96))]"
          : "bg-[rgba(255,252,247,0.94)]";

  return (
    <article className={`metric-tile rounded-[24px] p-5 ${toneClasses}`}>
      <p className="terminal-label">{label}</p>
      <p className="mt-3 font-serif text-[2rem] leading-none text-dark">{value}</p>
      {sub ? <p className="mt-2 text-sm leading-6 text-muted">{sub}</p> : null}
    </article>
  );
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function ResourceActionRow({ resource, tone = "Study" }: { resource: StudyResource; tone?: string }) {
  const content = (
    <>
      <span>
        <strong>{resource.title}</strong>
        <small>{resource.why}</small>
      </span>
      <span className="signal-pill signal-pill-sage">{tone}</span>
    </>
  );

  if (isExternalHref(resource.href)) {
    return (
      <a href={resource.href} target="_blank" rel="noreferrer" className="dashboard-action-row">
        {content}
      </a>
    );
  }

  return (
    <Link href={resource.href} className="dashboard-action-row">
      {content}
    </Link>
  );
}

export default function StudyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "review">("overview");

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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="dashboard-hub overflow-hidden rounded-[30px] p-6">
        <div className="grid gap-5 xl:grid-cols-[1.14fr_0.86fr]">
          <div className="max-w-3xl">
            <p className="terminal-label">Study dashboard</p>
            <h1 className="mt-3 font-serif text-[2.9rem] leading-[0.94] text-dark">Keep the next study move obvious.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              Turn raw study history into a clear objective, a cleaner review loop, and faster access to the exact mode you should open next.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="signal-pill signal-pill-sage">{data?.streak ?? 0} day streak</span>
              <span className="signal-pill signal-pill-blue">{data?.totalAnswered ?? 0} answered</span>
              <span className="signal-pill signal-pill-gold">{data && data.totalAnswered > 0 ? `${data.sevenDayAccuracy}% 7-day` : "No 7-day score yet"}</span>
              <span className="signal-pill">{data?.reviewQueue.length ?? 0} due now</span>
              {strongestLane ? <span className="signal-pill">Best lane: {strongestLane.exam}</span> : null}
            </div>
          </div>

          {nextObjective ? (
            <div className={`dashboard-objective dashboard-objective-${nextObjective.tone}`}>
              <p className="terminal-label">{nextObjective.label}</p>
              <h2 className="mt-3 font-serif text-[2rem] leading-[0.96] text-dark">{nextObjective.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{nextObjective.body}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={nextObjective.href} className="btn-primary">
                  {nextObjective.cta}
                </Link>
                <Link href="/quiz?mode=practice-exam&practiceExam=nclex-sim-1" className="btn-secondary">
                  Open simulation
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Streak" value={data?.streak ?? 0} sub="days in a row" tone="sage" />
        <StatCard label="7-day accuracy" value={data && data.totalAnswered > 0 ? `${data.sevenDayAccuracy}%` : "n/a"} sub="completed sessions" tone="blue" />
        <StatCard label="Due now" value={data?.reviewQueue.length ?? 0} sub="spaced repetition queue" tone="gold" />
        <StatCard
          label="Weak categories"
          value={weakAreas.length || "n/a"}
          sub={weakAreas.length ? weakAreas.map((area) => area.label).join(", ") : "none identified yet"}
        />
        <StatCard
          label="Next challenge"
          value={weakestDifficulty ? `L${weakestDifficulty.difficulty}` : "n/a"}
          sub={weakestCjmm ? weakestCjmm.label : "CJMM signal pending"}
          tone="blue"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="study-console-panel">
          <p className="terminal-label">Quick launch</p>
          <div className="mt-4 grid gap-3">
            <Link href={resumeHref} className="dashboard-action-row">
              <span>
                <strong>Resume practice</strong>
                <small>{weakestLane ? `Open ${weakestLane.label} from the reviewed bank.` : "Open a clean NCLEX rep from the reviewed bank."}</small>
              </span>
              <span className="signal-pill signal-pill-blue">Launch</span>
            </Link>
            <Link href="/quiz?exam=nclex&mode=ngn" className="dashboard-action-row">
              <span>
                <strong>NGN focus</strong>
                <small>Matrix, ordering, bow-tie, and multipart reps.</small>
              </span>
              <span className="signal-pill signal-pill-gold">NGN</span>
            </Link>
            <Link href={resumeHref} className="dashboard-action-row">
              <span>
                <strong>Recommended challenge</strong>
                <small>
                  {weakestDifficulty || weakestCjmm
                    ? [weakestDifficulty?.label, weakestCjmm?.label].filter(Boolean).join(" / ")
                    : "Difficulty and CJMM targeting appears after saved answers."}
                </small>
              </span>
              <span className="signal-pill signal-pill-sage">Target</span>
            </Link>
            {recommendationResources[0] ? (
              <ResourceActionRow resource={recommendationResources[0]} tone="Study" />
            ) : null}
            <Link href="/quiz?mode=practice-exam&practiceExam=nclex-sim-1" className="dashboard-action-row">
              <span>
                <strong>Practice exam</strong>
                <small>Fixed-length timed simulation with the same bank.</small>
              </span>
              <span className="signal-pill">Timed</span>
            </Link>
          </div>
        </article>

        <article className="study-console-panel">
          <p className="terminal-label">Momentum</p>
          <div className="mt-4 space-y-3">
            <div className="dashboard-signal-row">
              <span>Queue pressure</span>
              <strong>{data?.reviewQueue.length ?? 0}</strong>
            </div>
            <div className="dashboard-signal-row">
              <span>Best lane</span>
              <strong>{strongestLane?.exam ?? "Building"}</strong>
            </div>
            <div className="dashboard-signal-row">
              <span>Weakest lane</span>
              <strong>{weakestLane?.label ?? "None yet"}</strong>
            </div>
            <div className="dashboard-signal-row">
              <span>Weakest CJMM</span>
              <strong>{weakestCjmm?.label ?? "Pending"}</strong>
            </div>
            <div className="dashboard-signal-row">
              <span>Premium baseline</span>
              <strong>{data?.legacyAnswered ? `${data.premiumAnswered}/${data.totalAnswered}` : "Current"}</strong>
            </div>
          </div>
        </article>

        <article className="study-console-panel">
          <p className="terminal-label">Coach note</p>
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
        </article>
      </section>

      <section className="study-console-panel">
        <div className="dashboard-tab-strip flex gap-1 rounded-[18px] bg-[rgba(245,241,232,0.86)] p-1">
          {(["overview", "history", "review"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-[14px] px-4 py-2.5 text-sm font-semibold capitalize transition ${
                activeTab === tab ? "bg-white text-dark shadow-[0_8px_18px_rgba(31,38,43,0.06)]" : "text-muted hover:text-dark"
              }`}
            >
              {tab === "review" ? `Review (${data?.reviewQueue.length ?? 0})` : tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-4">
              <article className="study-console-panel bg-white/70">
                <div className="flex items-center justify-between gap-3">
                  <p className="terminal-label">Recent sessions</p>
                  <Link href="/quiz" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5A7F88]">
                    Practice now
                  </Link>
                </div>
                {data?.recentSessions.length ? (
                  <div className="mt-4 space-y-3">
                    {data.recentSessions.slice(0, 5).map((session) => (
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

              {data && data.reviewQueue.length > 0 ? (
                <article className="dashboard-objective dashboard-objective-sage">
                  <p className="terminal-label">Review queue</p>
                  <h2 className="mt-3 font-serif text-[1.8rem] leading-[0.98] text-dark">{data.reviewQueue.length} items due next.</h2>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    Keep the queue light and the retention curve steadier by clearing the next review block inside the same study surface.
                  </p>
                  <Link href="/quiz?mode=review" className="btn-secondary mt-4 inline-flex">
                    Start review
                  </Link>
                </article>
              ) : null}
            </div>

            <div className="space-y-4">
              <article className="study-console-panel bg-white/70">
                <p className="terminal-label">Exam trends</p>
                <div className="mt-4 space-y-3">
                  {examStats.length ? (
                    examStats
                      .sort((a, b) => a.accuracy - b.accuracy)
                      .map((stat) => (
                        <div key={stat.exam}>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium text-dark">{stat.exam}</span>
                            <span className="text-muted">{stat.accuracy}%</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(74,85,89,0.08)]">
                            <div
                              className={`h-full rounded-full ${stat.accuracy >= 75 ? "bg-[#7e9d86]" : stat.accuracy >= 60 ? "bg-[#5A7F88]" : "bg-[#c47956]"}`}
                              style={{ width: `${stat.accuracy}%` }}
                            />
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm leading-6 text-muted">Session trends will appear here after your first saved run.</p>
                  )}
                </div>
              </article>

              <article className="study-console-panel bg-white/70">
                <p className="terminal-label">Focus next</p>
                {weakAreas.length ? (
                  <div className="mt-4 space-y-3">
                    {weakAreas.map((area) => (
                      <div key={`${area.exam}-${area.category}`} className="rounded-[18px] border border-[rgba(196,121,86,0.18)] bg-[rgba(250,242,236,0.88)] px-4 py-3">
                        <p className="text-sm font-semibold text-dark">{area.label}</p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {area.accuracy}% accuracy across {area.totalAnswered} saved answers. Open a fresh set and keep the rationale loop tight.
                        </p>
                      </div>
                    ))}
                    {(weakestDifficulty || weakestCjmm) ? (
                      <div className="rounded-[18px] border border-[rgba(90,127,136,0.18)] bg-[rgba(239,246,248,0.88)] px-4 py-3">
                        <p className="text-sm font-semibold text-dark">Adaptive target</p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {[weakestDifficulty ? `${weakestDifficulty.label} at ${weakestDifficulty.accuracy}%` : null, weakestCjmm ? `${weakestCjmm.label} at ${weakestCjmm.accuracy}%` : null]
                            .filter(Boolean)
                            .join(" | ")}
                        </p>
                      </div>
                    ) : null}
                    {recommendationResources.length ? (
                      <div className="rounded-[18px] border border-[rgba(176,141,87,0.22)] bg-[rgba(250,246,239,0.88)] px-4 py-3">
                        <p className="text-sm font-semibold text-dark">Study material</p>
                        <div className="mt-3 space-y-2">
                          {recommendationResources.slice(0, 3).map((resource) => (
                            isExternalHref(resource.href) ? (
                              <a key={`${resource.kind}-${resource.href}`} href={resource.href} target="_blank" rel="noreferrer" className="block text-sm font-semibold text-[#5A7F88] hover:text-dark">
                                {resource.title}
                              </a>
                            ) : (
                              <Link key={`${resource.kind}-${resource.href}`} href={resource.href} className="block text-sm font-semibold text-[#5A7F88] hover:text-dark">
                                {resource.title}
                              </Link>
                            )
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-muted">
                    No weak area is standing out yet. Keep stacking clean reps and use the tutor on misses to keep that edge.
                  </p>
                )}
              </article>
            </div>
          </div>
        ) : null}

        {activeTab === "history" ? (
          <div className="mt-5 rounded-[24px] bg-white/70 shadow-[0_12px_28px_rgba(31,38,43,0.03)]">
            {data?.recentSessions.length ? (
              data.recentSessions.map((session) => (
                <div key={session.id} className="dashboard-session-row border-b border-[rgba(74,85,89,0.08)] last:border-b-0">
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
              ))
            ) : (
              <div className="dashboard-empty px-5 py-8 text-center text-sm text-muted">No session history yet.</div>
            )}
          </div>
        ) : null}

        {activeTab === "review" ? (
          <div className="mt-5 space-y-4">
            {data?.reviewQueue.length ? (
              <>
                <div className="dashboard-objective dashboard-objective-sage">
                  <p className="text-sm font-semibold text-dark">{data.reviewQueue.length} question{data.reviewQueue.length === 1 ? "" : "s"} due for spaced review.</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Review them inside the main quiz surface so misses, citations, and tutor follow-up all stay together.
                  </p>
                  <Link href="/quiz?mode=review" className="btn-primary mt-4 inline-flex">
                    Start review
                  </Link>
                </div>
                <div className="rounded-[24px] bg-white/70 divide-y divide-[rgba(74,85,89,0.08)] shadow-[0_12px_28px_rgba(31,38,43,0.03)]">
                  {data.reviewQueue.slice(0, 8).map((item) => (
                    <div key={item.questionId} className="dashboard-session-row">
                      <div>
                        <p className="text-sm leading-6 text-dark">{item.stem}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">
                          Due {item.nextReviewAt ? new Date(item.nextReviewAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "now"} | difficulty {item.difficulty}/5
                        </p>
                      </div>
                      <span className="signal-pill signal-pill-sage">Due</span>
                    </div>
                  ))}
                  {data.reviewQueue.length > 8 ? <div className="px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted">+{data.reviewQueue.length - 8} more in queue</div> : null}
                </div>
              </>
            ) : (
              <div className="dashboard-empty rounded-[24px] bg-white/70 p-8 text-center shadow-[0_12px_28px_rgba(31,38,43,0.03)]">
                <p className="font-semibold text-dark">All caught up.</p>
                <p className="mt-2 text-sm leading-6 text-muted">No questions are due for spaced review right now.</p>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
