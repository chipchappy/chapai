export default function QuizLoading() {
  return (
    <main className="quiz-route-screen">
      <div className="quiz-terminal-app">
        <header className="quiz-terminal-header">
          <div>
            <p className="quiz-terminal-kicker">Clarity terminal</p>
            <p className="quiz-terminal-copy">Preparing your study workspace.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="quiz-chip">Session boot</span>
            <span className="quiz-chip quiz-chip-accent">Routing live bank</span>
          </div>
        </header>

        <div className="quiz-terminal-body">
          <section className="quiz-terminal-state">
            <div className="quiz-terminal-catalog-grid">
              <section className="quiz-terminal-panel quiz-terminal-panel-hero">
                <span className="quiz-chip quiz-chip-accent">Loading practice center</span>
                <h1 className="mt-5 font-serif text-[clamp(2.5rem,5vw,4.4rem)] leading-[0.88] text-[#f4ede0]">
                  Warming up the command deck.
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[rgba(230,223,209,0.76)]">
                  Pulling live questions, rich exhibits, and the fixed terminal shell into place.
                </p>
                <div className="mt-6 grid gap-3 xl:grid-cols-3">
                  <div className="quiz-terminal-stat animate-pulse">
                    <span>Live bank</span>
                    <strong>...</strong>
                    <small>Counting reviewed questions.</small>
                  </div>
                  <div className="quiz-terminal-stat animate-pulse">
                    <span>Render pass</span>
                    <strong>...</strong>
                    <small>Validating rich item shapes.</small>
                  </div>
                  <div className="quiz-terminal-stat animate-pulse">
                    <span>Route shell</span>
                    <strong>Ready</strong>
                    <small>Terminal workspace locked to viewport.</small>
                  </div>
                </div>
              </section>

              <section className="quiz-terminal-panel quiz-terminal-panel-controls">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="h-28 animate-pulse rounded-[24px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)]" />
                  <div className="h-28 animate-pulse rounded-[24px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)]" />
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="h-16 animate-pulse rounded-[18px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)]" />
                  <div className="h-16 animate-pulse rounded-[18px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)]" />
                </div>
              </section>
            </div>

            <section className="quiz-terminal-section">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="quiz-terminal-kicker">Mission lanes</p>
                  <h2 className="font-serif text-[2rem] leading-[0.94] text-[#f6eee2]">Staging launch modules.</h2>
                </div>
              </div>
              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="quiz-terminal-lane animate-pulse">
                    <div className="h-4 w-28 rounded-full bg-[rgba(255,255,255,0.08)]" />
                    <div className="mt-5 h-14 rounded-[16px] bg-[rgba(255,255,255,0.06)]" />
                    <div className="mt-4 h-20 rounded-[18px] bg-[rgba(255,255,255,0.05)]" />
                  </div>
                ))}
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}
