import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import QuizPage from "./QuizPage";
import { ACCESS_KEY_COOKIE } from "@/lib/access-keys";
import { getLiveContentSummary } from "@/lib/live-content-summary";
import { PAID_ACCESS_COOKIE, resolvePremiumAccess } from "@/lib/premium-access";

export const metadata: Metadata = {
  title: "Practice center",
  description: "Large-format NCLEX and CCRN practice with AI-guided review, chart reading, case studies, and simulations.",
  alternates: {
    canonical: "/quiz",
  },
  robots: {
    index: false,
    follow: true,
  },
};

type PageSearchParams = {
  exam?: string;
  mode?: string;
  practiceExam?: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const access = resolvePremiumAccess({
    accessKeyCode: cookieStore.get(ACCESS_KEY_COOKIE)?.value,
    paidAccessToken: cookieStore.get(PAID_ACCESS_COOKIE)?.value,
  });
  const summary = getLiveContentSummary();

  return (
    <main className="min-h-screen bg-bg px-4 py-10 md:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[36px] border border-[rgba(74,85,89,0.08)] bg-[linear-gradient(135deg,rgba(247,242,233,0.98),rgba(238,243,239,0.94))] shadow-[0_28px_80px_rgba(52,48,41,0.08)]">
          <div className="grid gap-8 px-6 py-6 md:px-8 md:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-2xl">
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                <span className="rounded-full border border-border bg-white/70 px-3 py-1">Practice center</span>
                <span className="rounded-full border border-border bg-white/70 px-3 py-1">{summary.ccrn.live} live CCRN</span>
                <span className="rounded-full border border-border bg-white/70 px-3 py-1">{summary.nclex.live} live NCLEX</span>
                {access.displayLabel ? (
                  <span className="rounded-full border border-border bg-white/70 px-3 py-1">
                    {access.displayLabel}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 font-serif text-[clamp(3rem,6vw,5.2rem)] leading-[0.92] text-dark">
                Study in the product, not around it.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted">
                Move between live standard sessions, chart-reading drills, CCRN case studies, NGN-style items, and
                full simulations inside one wider, calmer, more serious practice surface.
              </p>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[28px] border border-[rgba(74,85,89,0.08)] shadow-[0_24px_60px_rgba(52,48,41,0.10)]">
                <Image
                  src="/assets/adobe-quiz-hero.png"
                  alt="Practice center anatomical artwork"
                  width={560}
                  height={560}
                  priority
                  sizes="(min-width: 1024px) 32vw, 92vw"
                  className="h-auto w-full object-cover mix-blend-multiply"
                  style={{ background: "linear-gradient(135deg,rgba(247,242,233,0.98),rgba(238,243,239,0.94))" }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8">
          <QuizPage
            tier={access.tier}
            initialExam={params.exam}
            initialMode={params.mode}
            initialPracticeExam={params.practiceExam}
            liveCounts={{
              ccrn: summary.ccrn.live,
              nclex: summary.nclex.live,
            }}
            accessType={access.displayLabel}
            canUseTutor={access.canUseTutor}
            canUseRichModes={access.canUseRichModes}
            canUsePracticeExams={access.canUsePracticeExams}
          />
        </div>
      </div>
    </main>
  );
}
