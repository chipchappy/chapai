import type { MetadataRoute } from "next";
import { DEFAULT_SITE_ORIGIN } from "@/lib/site-origin";
import { getAllPosts } from "@/content/blog/posts";
import { STATES } from "@/content/state-pages/states";

const FREE_LANDING_SLUGS = [
  "nclex-practice-exam",
  "nclex-practice-questions",
  "nclex-prep",
  "nclex-ngn-questions",
  "nclex-case-studies",
  "nclex-sata-questions",
  "nclex-bow-tie-questions",
  "nclex-matrix-questions",
  "nclex-pharmacology-questions",
  "nclex-prioritization-questions",
  "nclex-delegation-questions",
  "nclex-safety-questions",
  "nclex-cardiac-questions",
  "nclex-respiratory-questions",
  "nclex-endocrine-questions",
  "nclex-lab-values-questions",
] as const;

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

  const freeEntries: MetadataRoute.Sitemap = FREE_LANDING_SLUGS.map((slug) => ({
    url: `${base}/free/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.92,
  }));

  const core: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/nclex`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/ccrn`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/quiz`, lastModified: now, changeFrequency: "daily", priority: 0.88 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/upgrade`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/auth/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const nclexTopics: MetadataRoute.Sitemap = [
    "prioritization-questions",
    "delegation-questions",
    "24-hour-cram",
    "study-plan",
    "ai-tutor",
  ].map((slug) => ({
    url: `${base}/nclex/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.82,
  }));

  const ccrnTopics: MetadataRoute.Sitemap = [
    "hemodynamics-questions",
    "best-study-tool",
    "vasoactive-drips",
    "24-hour-cram",
    "study-plan",
    "ai-tutor",
  ].map((slug) => ({
    url: `${base}/ccrn/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.78,
  }));

  const compareEntries: MetadataRoute.Sitemap = [
    "chapai-vs-archer",
    "chapai-vs-uworld",
    "clarity-vs-mark-klimek",
    "clarity-vs-saunders",
    "clarity-vs-hurst",
    "clarity-vs-bootcamp",
    "clarity-vs-kaplan",
  ].map((slug) => ({
    url: `${base}/compare/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.78,
  }));

  const toolEntries: MetadataRoute.Sitemap = [
    "nclex-countdown",
    "nclex-readiness-calculator",
    "dosage-calculator",
  ].map((slug) => ({
    url: `${base}/tools/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.88,
  }));

  const referenceEntries: MetadataRoute.Sitemap = [
    { url: `${base}/free`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/nclex-lab-values`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/nclex-glossary`, lastModified: now, changeFrequency: "monthly", priority: 0.82 },
    { url: `${base}/nclex-requirements`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
  ];

  const stateEntries: MetadataRoute.Sitemap = STATES.map((s) => ({
    url: `${base}/nclex-requirements/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.78,
  }));

  return [
    ...core,
    ...referenceEntries,
    ...freeEntries,
    ...toolEntries,
    ...stateEntries,
    ...nclexTopics,
    ...ccrnTopics,
    ...compareEntries,
    ...blogEntries,
  ];
}
