import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/guild-access", "/success"],
    },
    sitemap: "https://clarityccrn.chapaisolutions.com/sitemap.xml",
    host: "https://clarityccrn.chapaisolutions.com",
  };
}
