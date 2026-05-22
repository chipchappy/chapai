import type { MetadataRoute } from "next";
import { DEFAULT_SITE_ORIGIN } from "@/lib/site-origin";
import { getAllPosts } from "@/content/blog/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = DEFAULT_SITE_ORIGIN;
  const now = new Date();

  const blogEntries: MetadataRoute.Sitemap = [
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...getAllPosts().map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.66,
    })),
  ];

  return [
    ...blogEntries,
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/ccrn`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/nclex`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/upgrade`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.45,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.45,
    },
    {
      url: `${base}/ccrn/hemodynamics-questions`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/ccrn/best-study-tool`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/ccrn/vasoactive-drips`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.79,
    },
    {
      url: `${base}/ccrn/24-hour-cram`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.83,
    },
    {
      url: `${base}/ccrn/study-plan`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/ccrn/ai-tutor`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/compare/chapai-vs-archer`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.78,
    },
    {
      url: `${base}/compare/chapai-vs-uworld`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.78,
    },
    {
      url: `${base}/nclex/prioritization-questions`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.79,
    },
    {
      url: `${base}/nclex/delegation-questions`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.79,
    },
    {
      url: `${base}/nclex/24-hour-cram`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.83,
    },
    {
      url: `${base}/nclex/study-plan`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/nclex/ai-tutor`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
