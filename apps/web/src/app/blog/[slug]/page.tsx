import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, type BlogBlock } from "@/content/blog/posts";
import { DEFAULT_SITE_ORIGIN } from "@/lib/site-origin";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: "Post not found" };
  }
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      url: `${DEFAULT_SITE_ORIGIN}/blog/${post.slug}`,
    },
  };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

function Block({ block }: { block: BlogBlock }) {
  if (block.type === "h2") {
    return <h2 className="mt-10 text-[1.7rem] leading-[1.2] tracking-[-0.02em]">{block.text}</h2>;
  }
  if (block.type === "ul") {
    return (
      <ul className="mt-5 grid gap-2.5 pl-5">
        {block.items.map((item, i) => (
          <li key={i} className="list-disc text-base leading-8 text-[var(--c-text-muted)] marker:text-[#7E9D86]">
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return <p className="mt-5 text-base leading-8 text-[var(--c-text-muted)]">{block.text}</p>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "Clarity Clinical Prep" },
    mainEntityOfPage: `${DEFAULT_SITE_ORIGIN}/blog/${post.slug}`,
  };

  return (
    <main className="bg-[var(--c-bg)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <article className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-[44rem]">
          <Link href="/blog" className="text-sm font-semibold text-[#4f6f77]">
            &larr; All guides
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--c-text-muted)]">
            {post.exam ? <span className="rounded-full bg-[rgba(126,157,134,0.14)] px-2.5 py-1 text-[#4f6f77]">{post.exam.toUpperCase()}</span> : null}
            <span>{formatDate(post.date)}</span>
            {post.readingTime ? <span>· {post.readingTime}</span> : null}
          </div>
          <h1 className="mt-4 text-[clamp(2.1rem,4vw,3.4rem)] leading-[1.05] tracking-[-0.03em]">{post.title}</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--c-text-muted)]">{post.description}</p>

          <div className="mt-8 border-t border-[var(--c-border)] pt-2">
            {post.body.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>

          {post.tags.length > 0 ? (
            <div className="mt-10 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[var(--c-border)] px-3 py-1 text-xs font-semibold text-[var(--c-text-muted)]">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-12 rounded-[18px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-6">
            <h2 className="text-[1.35rem] leading-tight">Ready to practice the way you test?</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--c-text-muted)]">
              Full NGN bank, realistic test-mode questions, and a calmer study system for $9.99/mo.
            </p>
            <Link
              href="/nclex"
              className="mt-4 inline-flex items-center justify-center rounded-[12px] bg-[#7E9D86] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6F8D76]"
            >
              Explore Clarity NCLEX
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
