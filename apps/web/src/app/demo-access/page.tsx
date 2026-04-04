import Image from "next/image";
import { cookies } from "next/headers";
import { ACCESS_KEY_COOKIE } from "@/lib/access-keys";
import { PAID_ACCESS_COOKIE, resolvePremiumAccess } from "@/lib/premium-access";

export const metadata = {
  title: "Demo Access | Clarity",
  description: "Redeem a founder, creator, tester, or reviewer key to unlock the upgraded Clarity preview.",
  robots: {
    index: false,
    follow: false,
  },
};

function getErrorCopy(error: string | undefined) {
  switch ((error ?? "").toLowerCase()) {
    case "invalid":
      return "That access key was not recognized.";
    case "expired":
      return "That access key has expired.";
    case "exhausted":
      return "That access key has reached its redeem limit.";
    case "revoked":
      return "That access key has been revoked.";
    default:
      return "";
  }
}

const unlockedLinks = [
  {
    href: "/quiz?exam=ccrn&mode=standard",
    label: "Open standard practice",
    note: "Launch the live-bank question flow with the upgraded player.",
  },
  {
    href: "/quiz?exam=ccrn&mode=case-study",
    label: "Open case study mode",
    note: "Inspect the bedside data panels and clinically serious case format.",
  },
  {
    href: "/quiz?exam=nclex&mode=ngn",
    label: "Open NGN mode",
    note: "Validate the richer NGN interaction patterns directly in the study surface.",
  },
  {
    href: "/quiz?mode=practice-exam&practiceExam=nclex-sim-1",
    label: "Open a test-day simulation",
    note: "Run timer, review, navigation, and scoring without leaving the real product.",
  },
] as const;

export default async function DemoAccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; next?: string; unlocked?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/demo";
  const errorCopy = getErrorCopy(params.error);
  const cookieStore = await cookies();
  const access = resolvePremiumAccess({
    accessKeyCode: cookieStore.get(ACCESS_KEY_COOKIE)?.value,
    paidAccessToken: cookieStore.get(PAID_ACCESS_COOKIE)?.value,
  });
  const founderAccess = access.source === "founder-key";
  const paidAccess = access.source === "paid-cookie";
  const unlocked = access.tier !== "free";

  return (
    <main className="page-shell">
      <section className="overflow-hidden rounded-[34px] border border-border bg-[linear-gradient(135deg,rgba(247,242,233,0.98),rgba(244,248,243,0.94))] shadow-card">
        <div className="grid gap-8 px-6 py-6 md:px-8 md:py-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="max-w-2xl">
            <span className="section-label">Founder, creator, and tester access</span>
            <h1 className="mt-4 font-serif text-[clamp(2.9rem,6vw,4.9rem)] leading-[0.92] text-dark">
              Redeem a Clarity preview key.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              Use a founder, creator, tester, or reviewer key to unlock the upgraded practice center, premium study
              modes, and AI tutor flow without relying on a fake demo shell.
            </p>
            {unlocked ? (
              <div className="mt-6 rounded-[22px] border border-[rgba(90,127,136,0.18)] bg-[rgba(255,252,247,0.82)] p-4">
                <p className="text-sm font-semibold text-dark">
                  {paidAccess
                    ? "Paid premium access is already active in this browser."
                    : founderAccess
                      ? "Founder full access is already active in this browser."
                      : "Preview premium access is already active in this browser."}
                </p>
                {access.displayLabel ? <p className="mt-2 text-sm leading-6 text-muted">{access.displayLabel}</p> : null}
              </div>
            ) : null}

            <div className="mt-6 rounded-[20px] border border-[rgba(194,154,86,0.28)] bg-[rgba(254,249,237,0.82)] px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Founder key (full pro access)</p>
              <p className="mt-2 font-mono text-base font-semibold tracking-wide text-dark select-all">FOUNDER-CLARITY-FULL-2026</p>
            </div>

            <form action="/api/access-keys/redeem" method="post" className="mt-6 max-w-xl space-y-4">
              <input type="hidden" name="next" value={nextPath} />
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                  Paste or type your key
                </span>
                <input
                  type="text"
                  name="code"
                  placeholder="FOUNDER-CLARITY-FULL-2026"
                  className="w-full rounded-[18px] border border-border bg-[rgba(255,255,255,0.9)] px-4 py-3 text-base text-dark outline-none transition focus:border-[rgba(90,127,136,0.4)]"
                  autoComplete="off"
                />
              </label>
              {errorCopy ? <p className="text-sm text-[rgba(144,72,52,0.9)]">{errorCopy}</p> : null}
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="btn-primary">
                  Unlock access
                </button>
                <a href="/quiz" className="btn-secondary">
                  Open practice center
                </a>
              </div>
            </form>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="overflow-hidden rounded-[32px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,251,245,0.88)] p-5 shadow-[0_24px_60px_rgba(52,48,41,0.08)]">
              <Image
                src="/brand/clarity-c-logo.jpg"
                alt="Clarity C logo"
                width={480}
                height={480}
                priority
                sizes="(min-width: 1024px) 26vw, 72vw"
                className="h-auto w-full max-w-[16rem] rounded-[24px] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {unlocked ? (
        <section className="mt-8 rounded-[34px] border border-border bg-[rgba(255,252,247,0.94)] p-6 shadow-card md:p-8">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            {access.accessType ? <span className="rounded-full border border-border px-3 py-1">{access.accessType}</span> : null}
            <span className="rounded-full border border-border px-3 py-1">scope {access.examTrack}</span>
            <span className="rounded-full border border-border px-3 py-1">{access.tier.toUpperCase()} access</span>
          </div>
          <h2 className="mt-4 font-serif text-[2.2rem] leading-[0.96] text-dark">
            {paidAccess ? "Premium access active." : "Preview unlocked."}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
            Your access is active. Use the live links below to jump directly into the upgraded study environment,
            including richer question modes, AI tutor access, and test-day simulations.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {unlockedLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-[24px] border border-border bg-[rgba(251,249,243,0.96)] p-5 shadow-card transition-transform duration-200 hover:-translate-y-0.5"
              >
                <strong className="block text-base text-dark">{item.label}</strong>
                <span className="mt-2 block text-sm leading-6 text-muted">{item.note}</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
