import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://claritynclex.com";

type DecodedStreak = {
  days: number;
  readinessScore: number | null;
  questionsAnswered: number | null;
  firstName: string | null;
};

/**
 * The token is a base64url-encoded JSON payload — short enough to fit in a URL.
 * No PII required; it's a vanity share, not authenticated.
 * Shape: { d: days, s?: readinessScore, q?: questionsAnswered, n?: firstName }
 */
function decodeStreakToken(token: string): DecodedStreak | null {
  try {
    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    const raw = atob(padded);
    const parsed = JSON.parse(raw) as { d?: number; s?: number; q?: number; n?: string };
    if (typeof parsed.d !== "number" || parsed.d < 0 || parsed.d > 365) return null;
    return {
      days: Math.floor(parsed.d),
      readinessScore: typeof parsed.s === "number" ? Math.max(0, Math.min(100, parsed.s)) : null,
      questionsAnswered: typeof parsed.q === "number" ? Math.max(0, parsed.q) : null,
      firstName: typeof parsed.n === "string" ? parsed.n.slice(0, 32) : null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const decoded = decodeStreakToken(token);
  if (!decoded) {
    return {
      title: "Streak milestone | Clarity",
      description: "An NCLEX student is on a streak with Clarity Clinical Prep.",
      robots: { index: false, follow: true },
    };
  }
  const who = decoded.firstName ? `${decoded.firstName}'s` : "An NCLEX student's";
  const title = `🔥 ${who} ${decoded.days}-day Clarity streak`;
  const description = decoded.readinessScore
    ? `${decoded.days} consecutive days. Readiness score: ${decoded.readinessScore}/100. Studying with Clarity Clinical Prep.`
    : `${decoded.days} consecutive days of NCLEX practice on Clarity Clinical Prep.`;
  const ogImage = new URL(`/api/share/streak/${token}/og`, SITE_URL).toString();
  return {
    title,
    description,
    alternates: { canonical: `/share/streak/${token}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/share/streak/${token}`,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  };
}

export default async function StreakSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const decoded = decodeStreakToken(token);
  if (!decoded) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-[640px]">
          <section className="rounded-[30px] border border-[var(--c-border-soft)] bg-[var(--c-surface-glass)] p-6 md:p-8">
            <h1 className="font-serif text-3xl text-[var(--c-text-strong)]">Streak link expired</h1>
            <p className="mt-4 text-[var(--c-text-body)]">
              That share link isn&apos;t readable. Start your own streak below — your first 10 questions are free.
            </p>
            <Link
              href="/quiz"
              className="mt-6 inline-flex rounded-full bg-[var(--c-sage-deep)] px-6 py-3 font-semibold text-[#fcf8ee]"
            >
              Start studying →
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const who = decoded.firstName ? decoded.firstName.charAt(0).toUpperCase() + decoded.firstName.slice(1) : "Someone";

  return (
    <main className="streak-share">
      <div className="streak-share__inner">
        <span className="streak-share__eyebrow">Clarity streak</span>
        <div className="streak-share__flame" aria-hidden="true">🔥</div>
        <h1 className="streak-share__title">
          {who} just hit a <span className="dash-grad">{decoded.days}-day</span> NCLEX streak.
        </h1>
        <div className="streak-share__metrics">
          <div className="streak-share__metric">
            <strong>{decoded.days}</strong>
            <span>days</span>
          </div>
          {decoded.readinessScore !== null ? (
            <div className="streak-share__metric">
              <strong>{decoded.readinessScore}</strong>
              <span>readiness</span>
            </div>
          ) : null}
          {decoded.questionsAnswered !== null ? (
            <div className="streak-share__metric">
              <strong>{decoded.questionsAnswered.toLocaleString()}</strong>
              <span>questions</span>
            </div>
          ) : null}
        </div>
        <p className="streak-share__body">
          Clarity Clinical Prep is built around weak-area focus + readiness exams that map directly to the NCLEX blueprint.
          Start your own streak — first 10 questions are free.
        </p>
        <div className="streak-share__cta-row">
          <Link href="/quiz?utm_source=streak_share" className="streak-share__cta">
            Start your streak →
          </Link>
          <Link href="/pricing?utm_source=streak_share" className="streak-share__cta streak-share__cta--ghost">
            See pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
