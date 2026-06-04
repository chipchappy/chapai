import Link from "next/link";

type WeakArea = {
  topic: string;
  accuracy: number;
  delta: number;
  questions: number;
};

type CategoryMastery = {
  category: string;
  mastery: number;
  trend: "up" | "down" | "flat";
};

const WEAK_AREAS: WeakArea[] = [
  { topic: "Acid–base & ABG interpretation", accuracy: 48, delta: -6, questions: 42 },
  { topic: "Beta-blockers vs calcium channel blockers", accuracy: 53, delta: -3, questions: 28 },
  { topic: "Maternal hemorrhage prioritization", accuracy: 57, delta: 2, questions: 19 },
  { topic: "Delegation: RN vs LPN vs UAP", accuracy: 61, delta: 4, questions: 36 },
];

const MASTERY: CategoryMastery[] = [
  { category: "Safety & Infection Control", mastery: 82, trend: "up" },
  { category: "Pharmacology", mastery: 71, trend: "up" },
  { category: "Cardiac & Perfusion", mastery: 68, trend: "flat" },
  { category: "Respiratory", mastery: 64, trend: "up" },
  { category: "Maternal & Newborn", mastery: 57, trend: "down" },
  { category: "Mental Health", mastery: 74, trend: "up" },
  { category: "Endocrine", mastery: 66, trend: "flat" },
  { category: "Management of Care", mastery: 79, trend: "up" },
];

const WEEK_ACTIVITY = [12, 28, 18, 34, 22, 41, 26];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ReadinessDonut({ score }: { score: number }) {
  const radius = 78;
  const stroke = 14;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;

  return (
    <div className="dash-readiness">
      <svg viewBox="0 0 200 200" role="img" aria-label={`Readiness score ${score} percent`}>
        <defs>
          <linearGradient id="readinessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
          stroke="url(#readinessGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          transform="rotate(-90 100 100)"
        />
        <text x="100" y="98" textAnchor="middle" className="dash-readiness__num">{score}</text>
        <text x="100" y="124" textAnchor="middle" className="dash-readiness__label">% ready</text>
      </svg>
      <p className="dash-readiness__caption">
        On pace for first-attempt pass. <span>Hit 78% to lock it in.</span>
      </p>
    </div>
  );
}

function ActivitySparkline({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="dash-activity">
      <div className="dash-activity__bars" role="img" aria-label="Daily questions completed this week">
        {values.map((v, i) => (
          <div key={labels[i]} className="dash-activity__bar-wrap">
            <div
              className="dash-activity__bar"
              style={{ height: `${(v / max) * 100}%` }}
              data-day={labels[i]}
            >
              <span>{v}</span>
            </div>
            <span className="dash-activity__day">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MasteryBar({ label, value, trend }: { label: string; value: number; trend: "up" | "down" | "flat" }) {
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const trendClass = trend === "up" ? "dash-mastery__trend--up" : trend === "down" ? "dash-mastery__trend--down" : "dash-mastery__trend--flat";
  return (
    <div className="dash-mastery__row">
      <div className="dash-mastery__row-head">
        <span className="dash-mastery__label">{label}</span>
        <span className={`dash-mastery__trend ${trendClass}`}>
          <strong>{value}%</strong>
          <span aria-hidden="true">{trendIcon}</span>
        </span>
      </div>
      <div className="dash-mastery__track">
        <div className="dash-mastery__fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const readiness = 64;
  const streak = 12;
  const weekDone = WEEK_ACTIVITY.reduce((a, b) => a + b, 0);

  return (
    <main className="dash-main">
      <section className="dash-shell">
        <header className="dash-hero">
          <div className="dash-hero__lead">
            <span className="dash-eyebrow">Student dashboard · {dateStr}</span>
            <h1 className="dash-hero__title">
              You&apos;re <span className="dash-grad">66 days out</span> — and the curve is bending your way.
            </h1>
            <p className="dash-hero__sub">
              Personalized snapshot of your readiness, weak areas, and the smartest next 30 minutes of study.
              Sign in to swap example data for your own.
            </p>
            <div className="dash-hero__cta">
              <Link href="/auth/signup" className="dash-cta dash-cta--primary">Unlock my real dashboard →</Link>
              <Link href="/quiz" className="dash-cta dash-cta--ghost">Start today&apos;s 25-question set</Link>
            </div>
          </div>
          <ReadinessDonut score={readiness} />
        </header>

        <section className="dash-kpi-row" aria-label="Key metrics">
          <article className="dash-kpi">
            <span className="dash-kpi__label">Streak</span>
            <strong className="dash-kpi__value">{streak}<small>days</small></strong>
            <span className="dash-kpi__hint">Longest this term · 14 days</span>
          </article>
          <article className="dash-kpi">
            <span className="dash-kpi__label">Questions this week</span>
            <strong className="dash-kpi__value">{weekDone}<small>q</small></strong>
            <span className="dash-kpi__hint">Goal pace · 60 / day</span>
          </article>
          <article className="dash-kpi">
            <span className="dash-kpi__label">7-day accuracy</span>
            <strong className="dash-kpi__value">68<small>%</small></strong>
            <span className="dash-kpi__hint">+4 vs last week</span>
          </article>
          <article className="dash-kpi">
            <span className="dash-kpi__label">Time to ready</span>
            <strong className="dash-kpi__value">~3<small>weeks</small></strong>
            <span className="dash-kpi__hint">At current pace</span>
          </article>
        </section>

        <section className="dash-grid">
          <article className="dash-card dash-card--next">
            <div className="dash-card__head">
              <span className="dash-eyebrow">Next best study move</span>
              <span className="dash-pill dash-pill--adobe">AI recommendation</span>
            </div>
            <h2 className="dash-card__title">
              25-question <span className="dash-grad-sage">Acid–base &amp; ABG</span> drill.
            </h2>
            <p className="dash-card__body">
              Your accuracy on ABG interpretation dropped 6 points this week — that&apos;s your
              biggest readiness leak. A focused 25-question drill should pull this category back over 60% by Friday.
            </p>
            <div className="dash-card__row">
              <Link href="/quiz?category=acid-base" className="dash-cta dash-cta--primary">Start the drill</Link>
              <Link href="/nclex-lab-values" className="dash-cta dash-cta--ghost">Review the lab sheet first</Link>
            </div>
          </article>

          <article className="dash-card dash-card--activity">
            <div className="dash-card__head">
              <span className="dash-eyebrow">This week</span>
              <span className="dash-pill">{weekDone} questions</span>
            </div>
            <ActivitySparkline values={WEEK_ACTIVITY} labels={DAY_LABELS} />
            <p className="dash-card__footnote">
              Pace is steady — Saturday is your strongest day. Plan your hardest set for then.
            </p>
          </article>

          <article className="dash-card dash-card--weak">
            <div className="dash-card__head">
              <span className="dash-eyebrow">Weak areas</span>
              <span className="dash-pill dash-pill--adobe">Targets</span>
            </div>
            <ul className="dash-weak-list">
              {WEAK_AREAS.map((w) => (
                <li key={w.topic} className="dash-weak">
                  <div className="dash-weak__head">
                    <span className="dash-weak__topic">{w.topic}</span>
                    <span className={`dash-weak__delta ${w.delta < 0 ? "dash-weak__delta--down" : "dash-weak__delta--up"}`}>
                      {w.delta > 0 ? "+" : ""}{w.delta}
                    </span>
                  </div>
                  <div className="dash-weak__track">
                    <div className="dash-weak__fill" style={{ width: `${w.accuracy}%` }} />
                  </div>
                  <div className="dash-weak__meta">
                    <span>{w.accuracy}% correct</span>
                    <span>{w.questions} attempts</span>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="dash-card dash-card--mastery">
            <div className="dash-card__head">
              <span className="dash-eyebrow">Mastery by category</span>
              <span className="dash-pill">8 of 12 categories tracked</span>
            </div>
            <div className="dash-mastery">
              {MASTERY.map((m) => (
                <MasteryBar key={m.category} label={m.category} value={m.mastery} trend={m.trend} />
              ))}
            </div>
          </article>

          <article className="dash-card dash-card--tools">
            <div className="dash-card__head">
              <span className="dash-eyebrow">Quick tools</span>
            </div>
            <div className="dash-tool-grid">
              <Link href="/tools/nclex-countdown" className="dash-tool">
                <span className="dash-tool__name">Countdown</span>
                <span className="dash-tool__hint">Days · target · intensity</span>
              </Link>
              <Link href="/tools/nclex-readiness-calculator" className="dash-tool">
                <span className="dash-tool__name">Readiness calc</span>
                <span className="dash-tool__hint">Where you stand today</span>
              </Link>
              <Link href="/tools/dosage-calculator" className="dash-tool">
                <span className="dash-tool__name">Dosage calc</span>
                <span className="dash-tool__hint">mL/hr · gtt/min · BSA</span>
              </Link>
              <Link href="/nclex-lab-values" className="dash-tool">
                <span className="dash-tool__name">Lab values</span>
                <span className="dash-tool__hint">Hot list with priority</span>
              </Link>
            </div>
          </article>

          <article className="dash-card dash-card--plan">
            <div className="dash-card__head">
              <span className="dash-eyebrow">Today&apos;s plan</span>
              <span className="dash-pill dash-pill--sage">42 min</span>
            </div>
            <ol className="dash-plan-list">
              <li>
                <span className="dash-plan__time">12 min</span>
                <span className="dash-plan__body">Acid–base drill — 25 questions, AI tutor on misses</span>
              </li>
              <li>
                <span className="dash-plan__time">15 min</span>
                <span className="dash-plan__body">Pharmacology table review: beta-blockers vs CCBs</span>
              </li>
              <li>
                <span className="dash-plan__time">10 min</span>
                <span className="dash-plan__body">Spaced review · 8 cards from yesterday&apos;s misses</span>
              </li>
              <li>
                <span className="dash-plan__time">5 min</span>
                <span className="dash-plan__body">Glance at the readiness score before you log off</span>
              </li>
            </ol>
          </article>
        </section>
      </section>
    </main>
  );
}
