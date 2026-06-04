import Link from "next/link";
import type { StudentDashboardData, ReadinessCategoryDelta, TutorFollowupItem } from "@/lib/student-dashboard";
import DashCountdownWidget from "./DashCountdownWidget";
import DashOnboardingTour from "./DashOnboardingTour";
import DashShareStreak from "./DashShareStreak";
import DashAchievementToasts from "./DashAchievementToasts";
import DashReadinessRadar from "./DashReadinessRadar";

type Props = {
  data: StudentDashboardData;
  userEmail: string | null;
  welcome?: boolean;
  upgradeSuccess?: boolean;
  upgradePackage?: string | null;
  readinessDeltas?: ReadinessCategoryDelta[];
  tutorMisses?: TutorFollowupItem[];
  canUseTutor?: boolean;
  utmSource?: string | null;
};

function ReadinessDonut({ score }: { score: number }) {
  const radius = 78;
  const stroke = 14;
  const circ = 2 * Math.PI * radius;
  const dash = (Math.min(100, score) / 100) * circ;

  return (
    <div className="dash-readiness">
      <svg viewBox="0 0 200 200" role="img" aria-label={`Readiness score ${score} percent`}>
        <defs>
          <linearGradient id="readinessGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--c-sage-deep)" />
            <stop offset="55%" stopColor="var(--c-gold)" />
            <stop offset="100%" stopColor="var(--c-adobe)" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--c-border-soft)" strokeWidth={stroke} />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#readinessGradMain)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          transform="rotate(-90 100 100)"
        />
        <text x="100" y="98" textAnchor="middle" className="dash-readiness__num">{score}</text>
        <text x="100" y="124" textAnchor="middle" className="dash-readiness__label">readiness</text>
      </svg>
    </div>
  );
}

function ActivityBars({ values }: { values: { date: string; count: number }[] }) {
  const max = Math.max(1, ...values.map((v) => v.count));
  const labels = values.map((v) => {
    const d = new Date(`${v.date}T00:00:00Z`);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });
  return (
    <div className="dash-activity__bars" role="img" aria-label="Daily questions answered this week">
      {values.map((v, i) => (
        <div key={v.date} className="dash-activity__bar-wrap">
          <div
            className="dash-activity__bar"
            style={{ height: `${(v.count / max) * 100}%` }}
            data-day={labels[i]}
          >
            <span>{v.count}</span>
          </div>
          <span className="dash-activity__day">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function MasteryBar({
  label,
  value,
  answered,
  badge,
}: {
  label: string;
  value: number;
  answered: number;
  badge?: { text: string; tone: "up" | "down" | "flat" };
}) {
  const tone = badge?.tone ?? "flat";
  const trendClass =
    tone === "up"
      ? "dash-mastery__trend--up"
      : tone === "down"
        ? "dash-mastery__trend--down"
        : "dash-mastery__trend--flat";
  return (
    <div className="dash-mastery__row">
      <div className="dash-mastery__row-head">
        <span className="dash-mastery__label">{label}</span>
        <span className={`dash-mastery__trend ${trendClass}`}>
          <strong>{value}%</strong>
          <span className="dash-mastery__meta">· {answered}q</span>
        </span>
      </div>
      <div className="dash-mastery__track">
        <div className="dash-mastery__fill" style={{ width: `${Math.max(2, value)}%` }} />
      </div>
    </div>
  );
}

function formatRelative(iso: string | null) {
  if (!iso) return "—";
  const diffMs = Date.now() - Date.parse(iso);
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function categoryLabel(category: string | null) {
  if (!category) return "Mixed practice";
  return category
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const UTM_BANNERS: Record<string, { kicker: string; copy: string }> = {
  qotd_email: {
    kicker: "From your daily question",
    copy: "Nice — you came in from the QOTD email. Here's the full progress view your streak is building.",
  },
  streak_email: {
    kicker: "Streak saved",
    copy: "You answered after the at-risk email — streak preserved. Knock out one more set to keep momentum.",
  },
  streak_share: {
    kicker: "Welcome from a friend",
    copy: "Someone shared their streak with you. Start your own — first 10 questions are free.",
  },
};

export default function StudentProgressDashboard({ data, userEmail, welcome = false, upgradeSuccess = false, upgradePackage = null, readinessDeltas = [], tutorMisses = [], canUseTutor = false, utmSource = null }: Props) {
  const utmBanner = utmSource ? UTM_BANNERS[utmSource] : null;
  const greeting = userEmail ? userEmail.split("@")[0].replace(/[._]/g, " ") : "there";
  const score = data.readinessScore;
  const examLabel =
    data.examFocus === "nclex"
      ? "NCLEX-RN"
      : data.examFocus === "ccrn"
        ? "CCRN"
        : data.examFocus === "mixed"
          ? "NCLEX + CCRN"
          : "your exam";

  const accuracyDeltaText =
    data.last7DayAnswered >= 5
      ? `Last 7 days: ${data.last7DayAccuracy}% accuracy across ${data.last7DayAnswered} questions`
      : "Answer a few more questions this week to unlock 7-day trend";

  return (
    <main className="dash-main">
      <section className="dash-shell">
        {utmBanner ? (
          <div className="dash-utm-banner" role="status">
            <span className="dash-utm-banner__kicker">{utmBanner.kicker}</span>
            <p className="dash-utm-banner__copy">{utmBanner.copy}</p>
          </div>
        ) : null}

        {upgradeSuccess ? (
          <div className="dash-upgrade-banner" role="status">
            <div className="dash-upgrade-banner__sparkles" aria-hidden="true">
              <span>✦</span><span>✦</span><span>✦</span><span>✦</span><span>✦</span>
              <span>✦</span><span>✦</span><span>✦</span><span>✦</span><span>✦</span>
            </div>
            <span className="dash-eyebrow dash-upgrade-banner__eyebrow">Upgrade complete</span>
            <h2 className="dash-upgrade-banner__title">
              {upgradePackage ? <>{upgradePackage} unlocked.</> : <>Pro unlocked.</>}{" "}
              <span className="dash-grad">Here&apos;s what just opened up.</span>
            </h2>
            <ul className="dash-upgrade-banner__list">
              <li>Full 5,000-question NCLEX bank (and CCRN if Dual)</li>
              <li>All 5 readiness exams — diagnostic + retest cycles</li>
              <li>AI tutor on every question for instant clinical reasoning</li>
              <li>Adaptive selection that biases toward your weak areas</li>
            </ul>
          </div>
        ) : null}

        {welcome ? (
          <div className="dash-welcome-banner">
            <span className="dash-eyebrow">Welcome to Clarity</span>
            <h2>You&apos;re in. This is your study HQ.</h2>
            <p>
              Every question you answer tunes the recommendations below to your actual weak spots.
              Start with a small set — your dashboard fills in as you practice.
            </p>
          </div>
        ) : null}

        {/* Hero */}
        <header className="dash-hero">
          <div className="dash-hero__lead">
            <div className="dash-hero__eyebrow-row">
              <span className="dash-eyebrow">Your dashboard · {examLabel}</span>
              {data.baselineTakenAt ? (
                <span className="dash-baseline-chip" aria-label={`Baseline readiness exam taken ${new Date(data.baselineTakenAt).toLocaleDateString()}`}>
                  <span aria-hidden="true" className="dash-baseline-chip__dot">✓</span>
                  <span>Baseline taken · {new Date(data.baselineTakenAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  {data.daysSinceBaseline !== null && data.daysSinceBaseline >= 30 ? (
                    <Link href="/quiz?mode=practice-exam" className="dash-baseline-chip__link">
                      Retake →
                    </Link>
                  ) : null}
                </span>
              ) : null}
            </div>
            <h1 className="dash-hero__title">
              {data.hasData ? (
                <>
                  <span className="dash-grad">{score >= 70 ? "On pace" : score >= 50 ? "Building momentum" : "Just getting started"}</span>{" "}
                  — here&apos;s what to study next, <span className="dash-cap">{greeting}</span>.
                </>
              ) : (
                <>
                  Welcome, <span className="dash-cap">{greeting}</span>. Let&apos;s start with{" "}
                  <span className="dash-grad-sage">your first 10 questions</span>.
                </>
              )}
            </h1>
            <p className="dash-hero__sub">
              {data.hasData
                ? `${data.totalAnswered.toLocaleString()} questions answered · ${data.overallAccuracy}% accuracy overall · ${accuracyDeltaText}`
                : "Your dashboard fills in as you practice. Every question you answer tunes the recommendations below to your real weak spots."}
            </p>
            <div className="dash-hero__cta">
              {data.suggestedCategory ? (
                <Link
                  href={`/quiz?exam=${data.suggestedCategory.exam}&category=${encodeURIComponent(data.suggestedCategory.category)}`}
                  className="dash-cta dash-cta--primary"
                >
                  Drill {categoryLabel(data.suggestedCategory.category)} →
                </Link>
              ) : (
                <Link href="/quiz" className="dash-cta dash-cta--primary">
                  Start practicing →
                </Link>
              )}
              {data.reviewQueueSize > 0 ? (
                <Link href="/quiz?mode=review" className="dash-cta dash-cta--ghost">
                  Review {data.reviewQueueSize} due cards
                </Link>
              ) : (
                <Link href="/quiz?mode=practice-exam" className="dash-cta dash-cta--ghost">
                  Take a readiness exam
                </Link>
              )}
            </div>
          </div>
          <div className="dash-hero__right">
            <ReadinessDonut score={score} />
            <DashShareStreak
              streakDays={data.streakDays}
              readinessScore={data.readinessScore}
              questionsAnswered={data.totalAnswered}
              firstName={userEmail ? userEmail.split("@")[0].replace(/[._]/g, " ").split(" ")[0] : null}
            />
          </div>
        </header>

        {/* KPI row */}
        <section className="dash-kpi-row" aria-label="Key metrics">
          <article className="dash-kpi">
            <span className="dash-kpi__label">Streak</span>
            <strong className="dash-kpi__value">
              {data.streakDays}
              <small>days</small>
            </strong>
            <span className="dash-kpi__hint">Longest · {data.longestStreakDays} days</span>
          </article>
          <article className="dash-kpi">
            <span className="dash-kpi__label">This week</span>
            <strong className="dash-kpi__value">
              {data.last7DayAnswered}
              <small>q</small>
            </strong>
            <span className="dash-kpi__hint">{data.last7DayAccuracy}% accuracy</span>
          </article>
          <article className="dash-kpi">
            <span className="dash-kpi__label">Overall accuracy</span>
            <strong className="dash-kpi__value">
              {data.overallAccuracy}
              <small>%</small>
            </strong>
            <span className="dash-kpi__hint">{data.totalAnswered.toLocaleString()} total answered</span>
          </article>
          <article className="dash-kpi">
            <span className="dash-kpi__label">Time to ready</span>
            <strong className="dash-kpi__value">
              {data.estimatedDaysToReady === null
                ? "—"
                : data.estimatedDaysToReady === 0
                  ? "Now"
                  : data.estimatedDaysToReady}
              {data.estimatedDaysToReady && data.estimatedDaysToReady > 0 ? <small>days</small> : null}
            </strong>
            <span className="dash-kpi__hint">
              {data.estimatedDaysToReady === null
                ? "Practice this week to estimate"
                : "At your current pace"}
            </span>
          </article>
        </section>

        {/* Main grid */}
        <section className="dash-grid">
          {/* Next move */}
          <article className="dash-card dash-card--next">
            <div className="dash-card__head">
              <span className="dash-eyebrow">Next best study move</span>
              <span className="dash-pill dash-pill--adobe">AI recommendation</span>
            </div>
            {data.suggestedCategory ? (
              <>
                <h2 className="dash-card__title">
                  25-question{" "}
                  <span className="dash-grad-sage">{categoryLabel(data.suggestedCategory.category)}</span>{" "}
                  drill.
                </h2>
                <p className="dash-card__body">
                  Your accuracy in {categoryLabel(data.suggestedCategory.category)} is{" "}
                  <strong>{data.suggestedCategory.accuracy}%</strong> across{" "}
                  {data.suggestedCategory.answered} attempts — your biggest readiness leak. A focused
                  25-question drill should pull this category over 70% by next week.
                </p>
                <div className="dash-card__row">
                  <Link
                    href={`/quiz?exam=${data.suggestedCategory.exam}&category=${encodeURIComponent(data.suggestedCategory.category)}&size=25`}
                    className="dash-cta dash-cta--primary"
                  >
                    Start the drill
                  </Link>
                  <Link href="/nclex-lab-values" className="dash-cta dash-cta--ghost">
                    Review the lab sheet first
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="dash-card__title">
                  Start with <span className="dash-grad-sage">10 mixed NCLEX questions</span>.
                </h2>
                <p className="dash-card__body">
                  Once you have answered a handful, this card will swap to the exact category that&apos;s
                  costing you the most points. Your weak spots, your plan.
                </p>
                <div className="dash-card__row">
                  <Link href="/quiz?exam=nclex&size=10" className="dash-cta dash-cta--primary">
                    Start 10 questions
                  </Link>
                  <Link href="/quiz/sample" className="dash-cta dash-cta--ghost">
                    Try a sample first
                  </Link>
                </div>
              </>
            )}
          </article>

          {/* Activity */}
          <article className="dash-card dash-card--activity">
            <div className="dash-card__head">
              <span className="dash-eyebrow">This week</span>
              <span className="dash-pill">{data.last7DayAnswered} questions</span>
            </div>
            <div className="dash-activity">
              <ActivityBars values={data.weeklyActivity} />
            </div>
            <p className="dash-card__footnote">
              {data.streakDays >= 3
                ? `${data.streakDays}-day streak — keep showing up.`
                : data.last7DayAnswered === 0
                  ? "No questions yet this week. A 25-question set takes 12 minutes."
                  : "Aim for 30+ questions/day for steady readiness gains."}
            </p>
          </article>

          {/* Weak areas */}
          <article className="dash-card dash-card--weak">
            <div className="dash-card__head">
              <span className="dash-eyebrow">Weak areas</span>
              <span className="dash-pill dash-pill--adobe">Targets</span>
            </div>
            {data.weakAreas.length > 0 ? (
              <ul className="dash-weak-list">
                {data.weakAreas.map((w) => (
                  <li key={`${w.exam}::${w.category}`} className="dash-weak">
                    <div className="dash-weak__head">
                      <span className="dash-weak__topic">{categoryLabel(w.category)}</span>
                      <Link
                        href={`/quiz?exam=${w.exam}&category=${encodeURIComponent(w.category)}`}
                        className="dash-weak__delta dash-weak__delta--down"
                      >
                        Drill →
                      </Link>
                    </div>
                    <div className="dash-weak__track">
                      <div className="dash-weak__fill" style={{ width: `${Math.max(3, w.accuracy)}%` }} />
                    </div>
                    <div className="dash-weak__meta">
                      <span>{w.accuracy}% correct</span>
                      <span>{w.answered} attempts</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dash-card__body">
                We need at least 5 answered questions per category before flagging weak areas.
                Knock out 25 more questions to unlock this view.
              </p>
            )}
          </article>

          {/* AI tutor follow-up — last week's misses ready for tutor walk-through */}
          {tutorMisses.length > 0 ? (
            <article className="dash-card dash-card--tutor">
              <div className="dash-card__head">
                <span className="dash-eyebrow">AI tutor follow-up</span>
                <span className="dash-pill dash-pill--adobe">{tutorMisses.length} ready</span>
              </div>
              <p className="dash-card__body">
                Questions you missed in the last 7 days. The tutor explains the why, the trap, and the priority pattern.
              </p>
              <ul className="dash-tutor-list">
                {tutorMisses.map((item) => (
                  <li key={item.questionId} className="dash-tutor-item">
                    <div className="dash-tutor-item__meta">
                      <span className="dash-tutor-item__cat">{item.exam.toUpperCase()} · {categoryLabel(item.category)}</span>
                      <span className="dash-tutor-item__ago">{formatRelative(new Date(item.answeredAtMs).toISOString())}</span>
                    </div>
                    <p className="dash-tutor-item__stem">{item.stemPreview}</p>
                    <div className="dash-tutor-item__actions">
                      <Link
                        href={`/quiz?exam=${item.exam}&category=${encodeURIComponent(item.category)}&tutorQuestion=${encodeURIComponent(item.questionId)}`}
                        className="dash-tutor-item__cta"
                      >
                        {canUseTutor ? "Ask tutor →" : "Review →"}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          {/* Mastery by category */}
          <article className="dash-card dash-card--mastery">
            <div className="dash-card__head">
              <span className="dash-eyebrow">Mastery by category</span>
              <span className="dash-pill">{data.categoryStats.length} tracked</span>
            </div>
            {data.categoryStats.length > 0 ? (
              <div className="dash-mastery">
                {data.categoryStats.slice(0, 10).map((c) => (
                  <MasteryBar
                    key={`${c.exam}::${c.category}`}
                    label={categoryLabel(c.category)}
                    value={c.accuracy}
                    answered={c.answered}
                    badge={{
                      text: `${c.accuracy}%`,
                      tone: c.accuracy >= 75 ? "up" : c.accuracy < 60 ? "down" : "flat",
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="dash-card__body">
                Answer a few questions to start tracking your category mastery here. Every answer
                tunes the readiness score above.
              </p>
            )}
          </article>

          {/* Countdown widget */}
          <article className="dash-card dash-card--countdown">
            <DashCountdownWidget totalAnswered={data.totalAnswered} />
          </article>

          {/* Strengths */}
          <article className="dash-card dash-card--tools">
            <div className="dash-card__head">
              <span className="dash-eyebrow">Your strengths</span>
              <span className="dash-pill dash-pill--sage">
                {data.tutorCallsThisWeek > 0 ? `🤖 ${data.tutorCallsThisWeek} tutor this week` : "Keep sharp"}
              </span>
            </div>
            {data.strengths.length > 0 ? (
              <ul className="dash-strengths">
                {data.strengths.map((s) => (
                  <li key={`${s.exam}::${s.category}`} className="dash-strength">
                    <div className="dash-strength__name">{categoryLabel(s.category)}</div>
                    <div className="dash-strength__meta">
                      <strong>{s.accuracy}%</strong> · {s.answered} q
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dash-card__body">
                Once a category clears 75% accuracy with at least 5 attempts, it shows up here as a
                strength. Solid streaks reinforce the muscle memory you need on test day.
              </p>
            )}
          </article>

          {/* Readiness comparison — only shown after 2+ practice exam attempts */}
          {readinessDeltas.length > 0 ? (
            <article className="dash-card dash-card--comparison">
              <div className="dash-card__head">
                <span className="dash-eyebrow">Readiness comparison</span>
                <span className="dash-pill dash-pill--sage">Across recent exams</span>
              </div>
              {readinessDeltas.length >= 3 ? <DashReadinessRadar deltas={readinessDeltas} /> : null}
              <ul className="dash-comparison">
                {readinessDeltas.map((d) => {
                  const tone = d.delta > 0 ? "up" : d.delta < 0 ? "down" : "flat";
                  const arrow = tone === "up" ? "↑" : tone === "down" ? "↓" : "→";
                  return (
                    <li key={d.category} className={`dash-comparison__row dash-comparison__row--${tone}`}>
                      <div className="dash-comparison__head">
                        <span className="dash-comparison__name">{categoryLabel(d.category)}</span>
                        <span className="dash-comparison__delta">
                          <span aria-hidden="true">{arrow}</span>
                          {d.delta > 0 ? "+" : ""}{d.delta}pts
                        </span>
                      </div>
                      <div className="dash-comparison__bars">
                        <div className="dash-comparison__bar dash-comparison__bar--earliest" style={{ width: `${Math.max(3, d.earliest)}%` }} title={`Earliest: ${d.earliest}%`} />
                        <div className="dash-comparison__bar dash-comparison__bar--latest" style={{ width: `${Math.max(3, d.latest)}%` }} title={`Latest: ${d.latest}%`} />
                      </div>
                      <div className="dash-comparison__meta">
                        <span>{d.earliest}% → {d.latest}%</span>
                        <span>{d.attempts} attempts</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="dash-card__footnote">
                Computed across your last 3 readiness exams. Categories need 3+ items per exam to qualify.
              </p>
            </article>
          ) : null}

          {/* Recent sessions */}
          <article className="dash-card dash-card--plan">
            <div className="dash-card__head">
              <span className="dash-eyebrow">Recent sessions</span>
              <Link href="/quiz" className="dash-pill dash-pill--sage" style={{ textDecoration: "none" }}>
                New session →
              </Link>
            </div>
            {data.recentSessions.length > 0 ? (
              <ol className="dash-plan-list">
                {data.recentSessions.map((s) => (
                  <li key={s.id}>
                    <span className="dash-plan__time">{formatRelative(s.startedAt)}</span>
                    <span className="dash-plan__body">
                      <strong>{s.exam.toUpperCase()}</strong> ·{" "}
                      {categoryLabel(s.category) ?? "Mixed"} ·{" "}
                      <span style={{ color: "var(--c-sage-deep)" }}>{s.correctCount}</span>
                      <span style={{ color: "var(--c-text-muted)" }}>/{s.totalQuestions}</span> ·{" "}
                      {s.accuracy}%
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="dash-card__body">
                Your last 6 sessions will appear here. Tap any to jump back into review.
              </p>
            )}
          </article>
        </section>
      </section>
      <DashOnboardingTour />
      <DashAchievementToasts
        streakDays={data.streakDays}
        totalAnswered={data.totalAnswered}
        readinessExamCount={
          // Each "Recent session" that's a practice-exam counts; the lib already
          // exposes baselineTakenAt so we approximate by counting sessions with
          // totalQuestions >= 50 in the recentSessions slice.
          data.recentSessions.filter((s) => s.totalQuestions >= 50 && s.completedAt).length
        }
        topCategoryAccuracy={
          data.strengths.length > 0
            ? { category: data.strengths[0].category, accuracy: data.strengths[0].accuracy }
            : null
        }
      />
    </main>
  );
}
