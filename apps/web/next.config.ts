import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "clarityccrn.chapaisolutions.com",
          },
        ],
        destination: "https://clarityccrn.chapaisolutions.com/ccrn",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:path(home|nclex|ccrn|pricing|upgrade|privacy|terms|faq|nclex-glossary|nclex-lab-values)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/free/:slug*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=86400" }],
      },
      {
        source: "/tools/:slug*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=86400" }],
      },
      {
        source: "/nclex-requirements/:slug*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=86400" }],
      },
      {
        source: "/compare/:slug*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=86400" }],
      },
      {
        source: "/:path(api|account|auth|dashboard|demo-access|guild-access|heartbeats|ops|quiz|success)/:rest*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

export default nextConfig;
