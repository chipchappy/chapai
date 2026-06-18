import { getAllPosts, type BlogBlock } from "@/content/blog/posts";
import { DEFAULT_SITE_ORIGIN } from "@/lib/site-origin";

export const dynamic = "force-static";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function blocksToHtml(blocks: BlogBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "h2") {
        return `<h2>${escapeHtml(block.text)}</h2>`;
      }
      if (block.type === "ul") {
        return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
      }
      return `<p>${escapeHtml(block.text)}</p>`;
    })
    .join("");
}

export function GET() {
  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Clarity NCLEX Blog",
    home_page_url: `${DEFAULT_SITE_ORIGIN}/blog`,
    feed_url: `${DEFAULT_SITE_ORIGIN}/feed.json`,
    description: "NCLEX study guides, NGN case study strategy, practice planning, and exam-readiness advice from Clarity Clinical Prep.",
    language: "en-US",
    items: getAllPosts().map((post) => {
      const url = `${DEFAULT_SITE_ORIGIN}/blog/${post.slug}`;
      return {
        id: url,
        url,
        title: post.title,
        summary: post.description,
        content_html: blocksToHtml(post.body),
        date_published: new Date(post.date).toISOString(),
        tags: post.tags,
        author: { name: post.author },
      };
    }),
  };

  return Response.json(feed, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
