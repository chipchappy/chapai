import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/free",
        destination: "/quiz",
        permanent: false,
      },
      {
        source: "/tools",
        destination: "/study",
        permanent: false,
      },
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
        // The homepage is force-dynamic and OpenNext runs with a dummy
        // incremental cache, so ISR is unavailable and every edge-cache miss
        // executes the Worker plus its D1 stat queries. Measured live that is
        // ~1.2s against ~0.24s on a hit, and misses were roughly half of
        // samples at s-maxage=600 because each PoP caches independently.
        //
        // The only thing on this page that moves is the live bank count, which
        // is itself memoised for 60s, so a 30-minute edge window costs nothing
        // in freshness and removes most of the slow path.
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=1800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:path((?:home|pricing|upgrade|compare/.*|privacy|terms|free/.*|tools/.*|nclex-glossary|nclex-lab-values|nclex-requirements/.*|faq).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=1800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:path((?:api|account|auth|dashboard|demo-access|guild-access|heartbeats|ops|quiz|study|success).*)",
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
