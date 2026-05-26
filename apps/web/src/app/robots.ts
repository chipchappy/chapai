import type { MetadataRoute } from "next";
import { DEFAULT_SITE_ORIGIN } from "@/lib/site-origin";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/free/", "/blog/", "/nclex/", "/ccrn/", "/compare/"],
        disallow: [
          "/dashboard",
          "/guild-access",
          "/success",
          "/account",
          "/api/",
          "/demo-access",
          "/ops",
          "/heartbeats",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/guild-access", "/account"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/guild-access", "/account"],
      },
    ],
    sitemap: `${DEFAULT_SITE_ORIGIN}/sitemap.xml`,
    host: DEFAULT_SITE_ORIGIN,
  };
}
