export default function QuizLoading() {
  return (
    <main className="min-h-screen bg-bg px-4 py-10 md:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[34px] border border-[rgba(74,85,89,0.08)] bg-[linear-gradient(135deg,rgba(247,242,233,0.98),rgba(241,245,241,0.94))] p-6 shadow-card md:p-8">
          <span className="inline-flex rounded-full border border-border bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            Loading practice center
          </span>
          <h1 className="mt-4 font-serif text-[clamp(2.5rem,5vw,4rem)] leading-[0.94] text-dark">
            Preparing your study session.
          </h1>
          <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="h-28 animate-pulse rounded-[24px] bg-[rgba(74,85,89,0.06)]" />
              <div className="h-72 animate-pulse rounded-[28px] bg-[rgba(74,85,89,0.06)]" />
            </div>
            <div className="space-y-4">
              <div className="h-28 animate-pulse rounded-[24px] bg-[rgba(74,85,89,0.06)]" />
              <div className="h-44 animate-pulse rounded-[24px] bg-[rgba(74,85,89,0.06)]" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
