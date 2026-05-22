import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/content/blog/posts";

export const metadata: Metadata = {
  title: "NCLEX & CCRN study blog",
  description:
    "Clear, no-fluff guides on NCLEX and CCRN prep: NGN case studies, study plans, prioritization, and exam-day strategy from Clarity Clinical Prep.",
  alternates: { canonical: "/blog" },
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="bg-[var(--c-bg)]">
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-[1180px]">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
            Clarity blog
          </span>
          <h1 className="mt-4 max-w-[40rem] text-[clamp(2.35rem,4vw,4.2rem)] leading-[1.02] tracking-[-0.03em]">
            Study guides that respect your time.
          </h1>
          <p className="mt-5 max-w-[36rem] text-base leading-8 text-[var(--c-text-muted)]">
            Practical NCLEX and CCRN prep — NGN case studies, study plans, and exam-day strategy, written the way we build the
            product: calm, clear, and clinically grounded.
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="flex flex-col rounded-[18px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-6 shadow-[0_16px_38px_rgba(30,42,36,0.05)] transition hover:border-[rgba(126,157,134,0.4)]"
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--c-text-muted)]">
                  {post.exam ? <span className="rounded-full bg-[rgba(126,157,134,0.14)] px-2.5 py-1 text-[#4f6f77]">{post.exam.toUpperCase()}</span> : null}
                  <span>{formatDate(post.date)}</span>
                  {post.readingTime ? <span>· {post.readingTime}</span> : null}
                </div>
                <h2 className="mt-4 text-[1.6rem] leading-[1.15] tracking-[-0.02em]">
                  <Link href={`/blog/${post.slug}`} className="transition hover:text-[#4f6f77]">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 flex-1 text-sm leading-7 text-[var(--c-text-muted)]">{post.description}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#4f6f77]"
                >
                  Read the guide &rarr;
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
