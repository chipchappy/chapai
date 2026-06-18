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

const LEGACY_BLOG_REDIRECTS = new Map([
  ["/blog/top-ten-free-nclex-study-tools", "/blog/top-ten-free-nclex-study-tools-best-free-practice-questions"],
]);

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("Strict-Transport-Security", "max-age=31536000");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), browsing-topics=()",
  );
  response.headers.set(
    "Content-Security-Policy-Report-Only",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self' https://checkout.stripe.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com",
      "connect-src 'self' https:",
      "frame-src https://js.stripe.com https://checkout.stripe.com",
    ].join("; "),
  );
  return response;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase().split(":")[0] ?? "";
  const forwardedProto = request.headers.get("x-forwarded-proto")?.toLowerCase();
  const isProductionHost = productionHosts.has(host);
  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";

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

  const legacyBlogRedirect = LEGACY_BLOG_REDIRECTS.get(pathname);
  if (legacyBlogRedirect) {
    const url = request.nextUrl.clone();
    url.pathname = legacyBlogRedirect;
    url.search = "";
    return applySecurityHeaders(NextResponse.redirect(url, 301));
  }

  if (host === "clarityccrn.chapaisolutions.com" && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/ccrn";
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
