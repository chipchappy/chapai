import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DecodedStreak = {
  days: number;
  readinessScore: number | null;
  questionsAnswered: number | null;
  firstName: string | null;
};

function decodeStreakToken(token: string): DecodedStreak | null {
  try {
    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    const raw = atob(padded);
    const parsed = JSON.parse(raw) as { d?: number; s?: number; q?: number; n?: string };
    if (typeof parsed.d !== "number" || parsed.d < 0 || parsed.d > 365) return null;
    return {
      days: Math.floor(parsed.d),
      readinessScore: typeof parsed.s === "number" ? Math.max(0, Math.min(100, parsed.s)) : null,
      questionsAnswered: typeof parsed.q === "number" ? Math.max(0, parsed.q) : null,
      firstName: typeof parsed.n === "string" ? parsed.n.slice(0, 32) : null,
    };
  } catch {
    return null;
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSvg(decoded: DecodedStreak): string {
  const name = decoded.firstName
    ? decoded.firstName.charAt(0).toUpperCase() + decoded.firstName.slice(1)
    : "Someone";
  const safeName = escapeXml(name);
  const readiness = decoded.readinessScore;
  const answered = decoded.questionsAnswered;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#efe2c4"/>
      <stop offset="100%" stop-color="#e6d4ad"/>
    </linearGradient>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c0633f"/>
      <stop offset="100%" stop-color="#b08d57"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="100" cy="540" r="220" fill="#c0633f" opacity="0.10"/>
  <circle cx="1080" cy="80" r="180" fill="#6f8672" opacity="0.10"/>

  <text x="80" y="120" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="6" fill="#8d6a2e">CLARITY · NCLEX STREAK</text>

  <text x="80" y="240" font-family="Georgia, serif" font-size="64" font-weight="500" fill="#1e2a24">
    <tspan>${safeName} hit a</tspan>
  </text>
  <text x="80" y="340" font-family="Georgia, serif" font-size="120" font-weight="700" fill="url(#grad)">
    <tspan>${decoded.days}-day streak</tspan>
  </text>

  <text x="80" y="420" font-family="ui-sans-serif, system-ui, sans-serif" font-size="26" fill="#303a35">
    ${readiness !== null ? `Readiness ${readiness}/100` : "Studying daily on Clarity"}${answered !== null ? `  ·  ${answered.toLocaleString()} questions answered` : ""}
  </text>

  <text x="80" y="560" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="600" fill="#6f8672">
    Start your streak — claritynclex.com
  </text>

  <text x="1090" y="100" text-anchor="end" font-size="80" font-family="Apple Color Emoji, Segoe UI Emoji">🔥</text>
</svg>`;
}

export async function GET(_request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const decoded = decodeStreakToken(token);
  if (!decoded) {
    return new Response("Invalid token", { status: 400 });
  }
  const svg = buildSvg(decoded);
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
