import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { questions } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { createRequestContext, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
  });
}

// Template inlined here so the worker bundle is self-contained
// (Cloudflare Workers can't read from the filesystem at runtime).
// Mirror of src/lib/email/templates/qotd-daily.html — keep in sync.
const TEMPLATE_HTML = `<!doctype html>
<html>
  <body style="margin:0;background:#F7F1E6;color:#1E2A24;font-family:Inter,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F1E6;padding:24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#FBF7EE;border:1px solid rgba(30,42,36,0.16);border-radius:8px;padding:28px;">
            <tr>
              <td>
                <p style="margin:0 0 10px;color:#B0935A;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">Daily Question</p>
                <h1 style="margin:0;color:#1E2A24;font-family:Georgia,serif;font-size:32px;font-weight:500;line-height:1.08;">One NGN question. Five minutes.</h1>
                <p style="margin:20px 0 10px;color:#1E2A24;font-size:16px;line-height:1.6;">{{question_stem}}</p>
                <details style="margin:18px 0;border:1px solid rgba(30,42,36,0.16);border-radius:8px;padding:14px;">
                  <summary style="cursor:pointer;font-weight:700;">Show answer and rationale</summary>
                  <p style="margin:14px 0 0;color:#4E5A53;font-size:15px;line-height:1.6;">{{answer_and_rationale}}</p>
                </details>
                <p style="margin:24px 0;">
                  <a href="{{site_url}}/quiz?question={{question_id}}&utm_source=qotd_email&utm_medium=email&utm_campaign=qotd_daily" style="display:inline-block;background:#3E5B45;color:#fff;border-radius:8px;padding:13px 20px;text-decoration:none;font-weight:700;">Answer this in the practice center &rarr;</a>
                </p>
                <p style="margin:24px 0 0;color:#4E5A53;font-size:13px;line-height:1.6;">Why we're cheaper: we don't run TV ads or pay affiliate spammers. The product is the marketing.</p>
                <p style="margin:24px 0 0;color:#7A857E;font-size:12px;">Upgrade: <a href="{{site_url}}/pricing" style="color:#3F6F75;">unlock the full bank</a> | <a href="{{unsubscribe_url}}" style="color:#7A857E;">unsubscribe</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

function htmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Tiny safe markdown → HTML pass for the QOTD email body. Question stems use
// the same subset across the bank: **bold**, *italic*, `inline code`, ordered
// and unordered lists, line breaks. Anything else falls back to escaped text.
function markdownToHtml(raw: string): string {
  if (!raw) return "";
  // Escape first so source markdown can never become live HTML.
  let html = htmlEscape(raw);

  // Inline marks — order matters: triple emphasis is handled by double + single.
  html = html.replace(/`([^`]+?)`/g, '<code style="background:rgba(30,42,36,0.08);padding:1px 4px;border-radius:3px">$1</code>');
  html = html.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");

  // Block-level: split on blank lines, then handle lists vs paragraphs per block.
  const blocks = html.split(/\n{2,}/).map((block) => {
    const lines = block.split(/\n/).map((l) => l.trim());
    const isUnordered = lines.every((l) => /^[-*]\s+/.test(l));
    const isOrdered = lines.every((l) => /^\d+\.\s+/.test(l));
    if (lines.length > 1 && isUnordered) {
      const items = lines.map((l) => `<li>${l.replace(/^[-*]\s+/, "")}</li>`).join("");
      return `<ul style="margin:0 0 0 18px;padding:0;">${items}</ul>`;
    }
    if (lines.length > 1 && isOrdered) {
      const items = lines.map((l) => `<li>${l.replace(/^\d+\.\s+/, "")}</li>`).join("");
      return `<ol style="margin:0 0 0 18px;padding:0;">${items}</ol>`;
    }
    // Plain paragraph — preserve in-paragraph line breaks as <br>.
    return `<p style="margin:0 0 12px;">${lines.join("<br>")}</p>`;
  });

  return blocks.join("");
}

function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

async function pickRandomQuestion(db: ReturnType<typeof getDB>) {
  // Email-friendly question: published NCLEX MCQ that isn't a case-study or
  // matrix item (those don't render cleanly in a single-page email body).
  const row = await db
    .select({
      id: questions.id,
      stem: questions.stem,
      answer: questions.answer,
      rationale: questions.rationale,
      category: questions.category,
    })
    .from(questions)
    .where(
      and(
        eq(questions.exam, "nclex"),
        eq(questions.type, "mcq"),
        eq(questions.publishState, "published"),
      ),
    )
    .orderBy(sql`random()`)
    .limit(1)
    .get();
  return row ?? null;
}

async function sendBroadcastViaResend(opts: {
  apiKey: string;
  audienceId: string;
  from: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; broadcastId?: string; reason?: string }> {
  // Resend broadcasts API: create → send. Two-step so we can short-circuit
  // (and so the operation is idempotent enough — Resend dedupes by audience).
  const createRes = await fetch("https://api.resend.com/broadcasts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audience_id: opts.audienceId,
      from: opts.from,
      subject: opts.subject,
      html: opts.html,
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!createRes.ok) {
    return { ok: false, reason: `create_${createRes.status}` };
  }
  const createPayload = (await createRes.json().catch(() => null)) as { id?: string } | null;
  const broadcastId = createPayload?.id;
  if (!broadcastId) {
    return { ok: false, reason: "missing_broadcast_id" };
  }

  const sendRes = await fetch(`https://api.resend.com/broadcasts/${broadcastId}/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.apiKey}` },
    signal: AbortSignal.timeout(12_000),
  });
  if (!sendRes.ok) {
    return { ok: false, broadcastId, reason: `send_${sendRes.status}` };
  }
  return { ok: true, broadcastId };
}

async function handle(request: NextRequest) {
  const requestContext = createRequestContext(request, { route: "/api/cron/qotd-send" });
  const env = resolveEnv();

  // Same auth pattern as the streak cron — cron header OR bearer.
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const isCronTrigger = request.headers.get("cf-cron") || request.headers.get("x-vercel-cron");
  const tokenMatches = cronSecret && auth === `Bearer ${cronSecret}`;
  if (!isCronTrigger && !tokenMatches) {
    return json(401, { success: false, error: "Unauthorized" });
  }

  if (!hasDatabase(env)) return json(503, { success: false, error: "Database unavailable" });

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_QOTD_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    return json(503, { success: false, error: "Email provider not configured" });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://claritynclex.com";
  const unsubscribeUrl = `${origin}/api/cron/streak-protection/unsubscribe`;
  const from = process.env.QOTD_EMAIL_FROM ?? "Clarity NCLEX <qotd@claritynclex.com>";

  let questionRow;
  try {
    const db = getDB(env);
    questionRow = await pickRandomQuestion(db);
  } catch (error) {
    logError("qotd cron: question pick failed", error, requestContext);
    return json(500, { success: false, error: "Question pick failed" });
  }
  if (!questionRow) return json(404, { success: false, error: "No questions available" });

  const subject = "🩺 Your daily NCLEX question";
  const html = fillTemplate(TEMPLATE_HTML, {
    question_id: htmlEscape(questionRow.id),
    question_stem: markdownToHtml(questionRow.stem ?? ""),
    answer_and_rationale: markdownToHtml(
      `**Answer: ${questionRow.answer ?? ""}**\n\n${questionRow.rationale ?? ""}`,
    ),
    site_url: origin,
    unsubscribe_url: unsubscribeUrl,
  });

  const result = await sendBroadcastViaResend({ apiKey, audienceId, from, subject, html });
  if (!result.ok) {
    logError("qotd cron: send failed", new Error(result.reason ?? "unknown"), requestContext);
    return json(502, { success: false, error: `Send failed: ${result.reason}` });
  }

  return json(200, {
    success: true,
    data: {
      broadcastId: result.broadcastId,
      questionId: questionRow.id,
      category: questionRow.category,
    },
  });
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}
