import { NextResponse, type NextRequest } from "next/server";

const productionHosts = new Set([
  "claritynclex.com",
  "www.claritynclex.com",
  "claritynclex.chapaisolutions.com",
  "clarityccrn.chapaisolutions.com",
  "clarityhome.chapaisolutions.com",
]);

const CANONICAL_HOST = "claritynclex.com";

const LEGACY_HOSTS_TO_REDIRECT = new Set([
  "www.claritynclex.com",
  "claritynclex.chapaisolutions.com",
]);

function hasAuthCookie(request: NextRequest) {
  return request.cookies.has("chapai_session")
    || request.cookies.getAll().some((cookie) => /^sb-[a-z0-9]+-auth-token$/i.test(cookie.name));
}

function applySecurityHeaders(response: NextResponse, local = false) {
  // localhost only: HSTS is a footgun on localhost and Next's dev client needs
  // eval + a websocket for React Refresh/HMR. Production hosts never match, so
  // the deployed policy is unchanged.
  if (!local) response.headers.set("Strict-Transport-Security", "max-age=31536000");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), browsing-topics=()",
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self' https://checkout.stripe.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `script-src 'self' 'unsafe-inline'${local ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com https://static.cloudflareinsights.com`,
      // `https:` here allowed the page to talk to any host on the internet,
      // which is the channel an injected script would use to exfiltrate. The
      // list below is what the browser actually needs: Supabase for auth,
      // Stripe for checkout, GA/GTM for analytics, and Cloudflare's RUM beacon.
      // The AI providers are called from the Worker, not the browser, so they
      // are deliberately absent.
      `connect-src 'self'${local ? " ws: http:" : ""} https://*.supabase.co https://api.stripe.com https://*.google-analytics.com https://www.googletagmanager.com https://*.cloudflareinsights.com`,
      "frame-src https://js.stripe.com https://checkout.stripe.com",
    ].join("; "),
  );
  return response;
}

function isLocalHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase().split(":")[0] ?? "";
  const local = isLocalHost(host);
  const forwardedProto = request.headers.get("x-forwarded-proto")?.toLowerCase();
  const isProductionHost = productionHosts.has(host);

  if (isProductionHost && (forwardedProto === "http" || request.nextUrl.protocol === "http:")) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = host;
    return applySecurityHeaders(NextResponse.redirect(url, 308));
  }

  if (LEGACY_HOSTS_TO_REDIRECT.has(host)) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    return applySecurityHeaders(NextResponse.redirect(url, 301));
  }

  if (host === "clarityccrn.chapaisolutions.com") {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.pathname = "/";
    return applySecurityHeaders(NextResponse.redirect(url, 301));
  }

  // The /nclex landing page is retired. It carried external backlinks and
  // ranked on its own terms, so it redirects rather than 404s. Only the bare
  // path — the /nclex/* SEO pages below it are still live and must fall through.
  if (request.nextUrl.pathname === "/nclex") {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.pathname = "/";
    url.search = "";
    return applySecurityHeaders(NextResponse.redirect(url, 301));
  }

  if (request.nextUrl.pathname === "/ccrn" || request.nextUrl.pathname.startsWith("/ccrn/")) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.pathname = "/";
    return applySecurityHeaders(NextResponse.redirect(url, 301));
  }

  if (request.nextUrl.pathname === "/study" && !hasAuthCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "";
    url.searchParams.set("next", "/study");
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(NextResponse.next(), local);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
