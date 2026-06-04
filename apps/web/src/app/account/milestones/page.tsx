import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { achievementEvents } from "@chapai/db/schema";
import BrandMark from "@/components/brand/BrandMark";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Milestones",
  robots: { index: false, follow: false },
};

const ACHIEVEMENT_LABELS: Record<string, { title: string; body: string; icon: string }> = {
  "100-questions": {
    title: "100 questions answered",
    body: "Recommendations started getting sharper.",
    icon: "🎯",
  },
  "5-readiness-exams": {
    title: "All 5 readiness exams complete",
    body: "Full blueprint sampled multiple times.",
    icon: "🏆",
  },
  "streak-7": {
    title: "7-day streak unlocked",
    body: "One full week of practice.",
    icon: "🔥",
  },
  "streak-14": {
    title: "14-day streak unlocked",
    body: "Habit cemented.",
    icon: "🔥",
  },
  "streak-30": {
    title: "30-day streak unlocked",
    body: "Locked in.",
    icon: "🔥",
  },
};

function categoryLabel(category: string) {
  return category
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function resolveAchievement(key: string): { title: string; body: string; icon: string } {
  if (ACHIEVEMENT_LABELS[key]) return ACHIEVEMENT_LABELS[key];
  // category-70:cardiovascular  →  Cardiovascular crossed 70%
  if (key.startsWith("category-70:")) {
    const cat = key.slice("category-70:".length);
    return {
      title: `${categoryLabel(cat)} crossed 70%`,
      body: "Readiness threshold cleared on this category.",
      icon: "✓",
    };
  }
  if (key === "streak-opt-in") {
    return {
      title: "Streak protection prompt seen",
      body: "You decided whether to keep streak emails on.",
      icon: "🔥",
    };
  }
  return { title: key, body: "Milestone achieved.", icon: "•" };
}

function formatDate(unix: number) {
  const d = new Date(unix * 1000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function MilestonesPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/login?next=%2Faccount%2Fmilestones");
  }

  const env = resolveEnv();
  type Row = { id: string; key: string; occurredAt: number };
  let events: Row[] = [];
  if (hasDatabase(env)) {
    try {
      const db = getDB(env);
      const rows = await db
        .select({
          id: achievementEvents.id,
          achievementKey: achievementEvents.achievementKey,
          occurredAt: achievementEvents.occurredAt,
        })
        .from(achievementEvents)
        .where(eq(achievementEvents.userId, user.id))
        .orderBy(desc(achievementEvents.occurredAt))
        .limit(50);
      events = rows.map((r) => ({
        id: r.id,
        key: r.achievementKey,
        occurredAt: r.occurredAt,
      }));
    } catch {
      // non-fatal
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 md:py-14">
      <div className="mx-auto max-w-[760px]">
        <section className="rounded-[30px] border border-[var(--c-border-soft)] bg-[var(--c-surface-glass)] p-6 shadow-[var(--c-shadow-card)] backdrop-blur-md md:p-8">
          <BrandMark />
          <div className="mt-6 max-w-[34rem]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-text-muted)]">
              Account
            </span>
            <h1 className="mt-4 font-serif text-[clamp(2.2rem,4.5vw,3.4rem)] leading-[0.96] text-[var(--c-text-strong)]">
              Your milestones
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--c-text-body)]">
              Every achievement you&apos;ve unlocked. Future toast events land here automatically.
            </p>
          </div>

          {events.length > 0 ? (
            <ul className="milestones-list">
              {events.map((event) => {
                const meta = resolveAchievement(event.key);
                return (
                  <li key={event.id} className="milestones-item">
                    <span className="milestones-item__icon" aria-hidden="true">{meta.icon}</span>
                    <div className="milestones-item__copy">
                      <strong className="milestones-item__title">{meta.title}</strong>
                      <p className="milestones-item__body">{meta.body}</p>
                    </div>
                    <time className="milestones-item__date" dateTime={new Date(event.occurredAt * 1000).toISOString()}>
                      {formatDate(event.occurredAt)}
                    </time>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="milestones-empty">
              <p>No milestones yet. Answer your first 10 questions to start unlocking them.</p>
              <Link href="/quiz" className="dash-cta dash-cta--primary">Start studying →</Link>
            </div>
          )}

          <div className="mt-8">
            <Link href="/account/settings" className="text-sm font-semibold text-[var(--c-text-strong)] underline decoration-[var(--c-border-strong)] underline-offset-4 hover:text-[var(--c-gold-deep)]">
              Account settings
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
