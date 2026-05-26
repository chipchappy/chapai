import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Guild Access - ChapAI",
  description: "Private operator access for the ChapAI guild dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function GuildAccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const resolved = (await searchParams) ?? {};
  const nextPath = resolved.next && resolved.next.startsWith("/") ? resolved.next : "/dashboard";

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-[560px] rounded-[30px] border border-border bg-[rgba(251,249,243,0.92)] p-6 shadow-card md:p-8">
        <div className="text-[10px] uppercase tracking-[0.28em] text-muted">Private operator access</div>
        <h1 className="mt-4 font-serif text-[2.6rem] leading-[0.96] text-dark md:text-[3.1rem]">
          Guild dashboard access is private.
        </h1>
        <p className="mt-4 text-base text-muted">
          Enter the local guild access key to unlock the private dashboard for this browser. The public product site no longer links to internal operator progress.
        </p>
        <p className="mt-3 text-sm text-muted">
          Once unlocked, bookmark <code className="rounded bg-[rgba(255,252,247,0.92)] px-2 py-1 text-[0.92em] text-dark">/dashboard</code> on your phone. The session now stays warm longer so you can keep the guild room open.
        </p>
        <p className="mt-3 text-sm text-muted">
          There is also a private design board at <code className="rounded bg-[rgba(255,252,247,0.92)] px-2 py-1 text-[0.92em] text-dark">/design-review</code> once this browser is unlocked.
        </p>

        <form action="/api/dashboard-auth/login" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Guild access key</span>
            <input
              name="key"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-[18px] border border-border bg-[rgba(255,252,247,0.92)] px-4 py-3 text-base text-dark outline-none transition focus:border-[#8ba0a8] focus:ring-2 focus:ring-[rgba(139,160,168,0.18)]"
              placeholder="Enter private key"
              required
            />
          </label>
          {resolved.error ? (
            <p className="rounded-[16px] border border-[#e4d4cc] bg-[rgba(249,239,234,0.86)] px-4 py-3 text-sm text-[#7a5a4d]">
              The key did not match. Use the local dashboard key file on this machine and try again.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary">
              Unlock dashboard
            </button>
            <Link href="/" className="btn-secondary">
              Back to site
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
