import type { MetadataRoute } from "next";
import { DEFAULT_SITE_ORIGIN } from "@/lib/site-origin";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/guild-access", "/success"],
    },
    sitemap: `${DEFAULT_SITE_ORIGIN}/sitemap.xml`,
    host: DEFAULT_SITE_ORIGIN,
  };
}
