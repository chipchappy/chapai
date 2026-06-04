import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { streakEmailOptouts } from "@chapai/db/schema";
import BrandMark from "@/components/brand/BrandMark";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import StreakEmailToggle from "./StreakEmailToggle";
import QotdToggle from "./QotdToggle";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/login?next=%2Faccount%2Fsettings");
  }

  let optedOutOfStreakEmails = false;
  let qotdSubscribed = false;
  const env = resolveEnv();

  // KV-cached QOTD enrollment state — falls back to false on any failure.
  if (user.email) {
    try {
      type KvBinding = { get: (k: string) => Promise<string | null> };
      const kv = (env as unknown as { KV?: KvBinding }).KV;
      if (kv) {
        const cached = await kv.get(`qotd-sub:${user.email.toLowerCase().trim()}`);
        if (cached === "1") qotdSubscribed = true;
        if (cached === "0") qotdSubscribed = false;
      }
    } catch {
      // ignore
    }
  }

  if (user.email && hasDatabase(env)) {
    try {
      const db = getDB(env);
      const row = await db
        .select({ email: streakEmailOptouts.email })
        .from(streakEmailOptouts)
        .where(eq(streakEmailOptouts.email, user.email.toLowerCase().trim()))
        .get();
      optedOutOfStreakEmails = Boolean(row);
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
              Settings
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--c-text-body)]">
              Signed in as <strong className="text-[var(--c-text-strong)]">{user.email ?? "your account"}</strong>.
            </p>
          </div>

          <div className="settings-grid">
            <section className="settings-section">
              <div className="settings-section__head">
                <h2 className="settings-section__title">Email preferences</h2>
                <p className="settings-section__hint">Choose what we send. You can change this anytime.</p>
              </div>
              <StreakEmailToggle initialOptedOut={optedOutOfStreakEmails} />
              <QotdToggle initialSubscribed={qotdSubscribed} />
              <p className="mt-6 text-xs text-[var(--c-text-muted)]">
                <a href="/account/milestones" className="font-semibold text-[var(--c-text-strong)] underline decoration-[var(--c-border-strong)] underline-offset-4 hover:text-[var(--c-gold-deep)]">
                  See your milestones →
                </a>
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
