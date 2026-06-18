import { getAllPosts, type BlogBlock } from "@/content/blog/posts";
import { DEFAULT_SITE_ORIGIN } from "@/lib/site-origin";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function blocksToHtml(blocks: BlogBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "h2") {
        return `<h2>${escapeXml(block.text)}</h2>`;
      }
      if (block.type === "ul") {
        return `<ul>${block.items.map((item) => `<li>${escapeXml(item)}</li>`).join("")}</ul>`;
      }
      return `<p>${escapeXml(block.text)}</p>`;
    })
    .join("");
}

export function GET() {
  const posts = getAllPosts();
  const latestDate = posts[0]?.date ? new Date(posts[0].date) : new Date();

  const items = posts
    .map((post) => {
      const url = `${DEFAULT_SITE_ORIGIN}/blog/${post.slug}`;
      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<description>${escapeXml(post.description)}</description>`,
        `<pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `<content:encoded><![CDATA[${blocksToHtml(post.body)}]]></content:encoded>`,
        "</item>",
      ].join("");
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Clarity NCLEX Blog</title>
    <link>${DEFAULT_SITE_ORIGIN}/blog</link>
    <description>NCLEX study guides, NGN case study strategy, practice planning, and exam-readiness advice from Clarity Clinical Prep.</description>
    <language>en-us</language>
    <lastBuildDate>${latestDate.toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
