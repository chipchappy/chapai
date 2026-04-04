import { addDailyQuestionLead, getDailyQuestionLeadSummary } from "@/lib/daily-question-signups";

type SignupPayload = {
  email?: string;
  exam?: "ccrn" | "nclex" | "both";
  role?: "student" | "icu-nurse" | "educator" | "other";
  source?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export async function POST(request: Request) {
  let payload: SignupPayload;

  try {
    payload = (await request.json()) as SignupPayload;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase() ?? "";
  const exam = payload.exam ?? "both";
  const role = payload.role ?? "other";
  const source = payload.source?.trim() || "site";

  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const result = addDailyQuestionLead({
    email,
    exam,
    role,
    source,
  });

  return Response.json({
    ok: true,
    email: result.email,
    total: result.total,
    summary: getDailyQuestionLeadSummary(),
  });
}
