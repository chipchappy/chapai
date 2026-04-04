import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Design Review - ChapAI",
  description: "Private visual review board for homepage and logo exploration.",
  robots: {
    index: false,
    follow: false,
  },
};

const reviewRoot = "C:/Users/Chapman/Desktop/ai/chapai/apps/web/public";

function getSortedVariantFiles(directory: string, prefix: string) {
  return fs
    .readdirSync(directory)
    .filter((file) => file.startsWith(prefix) && file.endsWith(".svg"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function getReviewManifest() {
  const manifestPath = path.join(reviewRoot, "design-review", "review-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return { heroes: {}, headers: {}, logos: {} } as Record<string, Record<string, { title?: string; note?: string }>>;
  }

  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, Record<string, { title?: string; note?: string }>>;
  } catch {
    return { heroes: {}, headers: {}, logos: {} } as Record<string, Record<string, { title?: string; note?: string }>>;
  }
}

export default async function DesignReviewPage() {
  const heroFiles = getSortedVariantFiles(path.join(reviewRoot, "design-review"), "frontpage-").slice(-10);
  const headerFiles = getSortedVariantFiles(path.join(reviewRoot, "design-review"), "social-header-").slice(-10);
  const logoFiles = getSortedVariantFiles(path.join(reviewRoot, "brand/options"), "chapai-option-").slice(-50);
  const manifest = getReviewManifest();

  return (
    <main className="page-shell">
      <section className="rounded-[32px] border border-border bg-[rgba(251,249,243,0.9)] p-6 shadow-card md:p-8">
        <span className="section-label">Design review</span>
        <h1 className="mt-3 font-serif text-[2.6rem] leading-[0.95] text-dark">Review the latest homepage directions and 50 fresh logo options.</h1>
        <p className="mt-4 max-w-3xl text-base text-muted">
          Use this page to approve one premium medical hero family, one logo system, and one social-banner direction
          before creator outreach begins.
        </p>
      </section>

      <section className="mt-8 rounded-[32px] border border-border bg-[rgba(255,252,247,0.88)] p-6 shadow-card md:p-8">
        <div className="section-label">Front-page concepts</div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {heroFiles.map((file) => (
            <article key={file} className="rounded-[24px] border border-border bg-[rgba(251,249,243,0.96)] p-4 shadow-card">
              <div className="overflow-hidden rounded-[20px] border border-border bg-[linear-gradient(180deg,rgba(251,250,246,0.96),rgba(241,236,228,0.9))]">
                <img src={`/review-assets/${file}`} alt={file.replace(".svg", "")} className="h-auto w-full" />
              </div>
              <h2 className="mt-4 font-serif text-2xl text-dark">
                {manifest.heroes?.[file]?.title ?? file.replace("frontpage-", "Concept ").replace(".svg", "")}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {manifest.heroes?.[file]?.note ?? "Latest premium medical-object exploration for the homepage hero."}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[32px] border border-border bg-[rgba(255,252,247,0.88)] p-6 shadow-card md:p-8">
        <div className="section-label">Logo system review</div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {logoFiles.map((file) => {
            const id = file.replace("chapai-option-", "").replace(".svg", "");
            return (
            <article key={file} className="rounded-[22px] border border-border bg-[rgba(251,249,243,0.96)] p-4">
              <div className="flex min-h-[180px] items-center justify-center rounded-[18px] border border-border bg-[linear-gradient(180deg,rgba(251,250,246,0.96),rgba(241,236,228,0.9))] p-5">
                <img src={`/logo-review/${file}`} alt={`Logo option ${id}`} className="max-h-[132px] w-full object-contain" />
              </div>
              <div className="mt-3 text-sm font-medium text-dark">
                {manifest.logos?.[file]?.title ?? `Option ${id}`}
              </div>
              <p className="mt-1 text-xs text-muted">
                {manifest.logos?.[file]?.note ?? "Refined medical mark exploration."}
              </p>
            </article>
          )})}
        </div>
      </section>

      <section className="mt-8 rounded-[32px] border border-border bg-[rgba(255,252,247,0.88)] p-6 shadow-card md:p-8">
        <div className="section-label">Social headers</div>
        <div className="mt-6 grid gap-6">
          {headerFiles.map((file) => (
            <article key={file} className="rounded-[24px] border border-border bg-[rgba(251,249,243,0.96)] p-4 shadow-card">
              <div className="overflow-hidden rounded-[20px] border border-border bg-[linear-gradient(180deg,rgba(251,250,246,0.96),rgba(241,236,228,0.9))]">
                <img src={`/review-assets/${file}`} alt={file.replace(".svg", "")} className="h-auto w-full" />
              </div>
              <div className="mt-3 text-sm font-medium text-dark">
                {manifest.headers?.[file]?.title ?? file.replace("social-header-", "Header ").replace(".svg", "")}
              </div>
              <p className="mt-1 text-xs text-muted">
                {manifest.headers?.[file]?.note ?? "Social banner variation for outbound profiles and creator outreach."}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
