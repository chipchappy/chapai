const DEFAULT_BASE_URL = "https://claritynclex.com";
const DEFAULT_PASSWORD = "AuditPass!2026";

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.CLARITY_SMOKE_BASE_URL || DEFAULT_BASE_URL,
    password: process.env.CLARITY_SMOKE_PASSWORD || DEFAULT_PASSWORD,
    paidPlanCode: process.env.CLARITY_SMOKE_PAID_PLAN || "all_access_monthly",
    skipCheckout: process.env.CLARITY_SMOKE_SKIP_CHECKOUT === "1",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const readValue = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[index];
    };
    if (arg === "--base-url") options.baseUrl = readValue();
    else if (arg.startsWith("--base-url=")) options.baseUrl = arg.slice("--base-url=".length);
    else if (arg === "--password") options.password = readValue();
    else if (arg.startsWith("--password=")) options.password = arg.slice("--password=".length);
    else if (arg === "--paid-plan-code") options.paidPlanCode = readValue();
    else if (arg.startsWith("--paid-plan-code=")) options.paidPlanCode = arg.slice("--paid-plan-code=".length);
    else if (arg === "--skip-checkout") options.skipCheckout = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  options.baseUrl = options.baseUrl.replace(/\/+$/, "");
  return options;
}

class CookieJar {
  #cookies = new Map();

  header() {
    return [...this.#cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
  }

  store(response) {
    const getSetCookie = response.headers.getSetCookie?.bind(response.headers);
    const values = getSetCookie ? getSetCookie() : splitSetCookie(response.headers.get("set-cookie"));
    for (const value of values) {
      const [pair] = value.split(";");
      const separator = pair.indexOf("=");
      if (separator <= 0) continue;
      this.#cookies.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
    }
  }
}

function splitSetCookie(raw) {
  if (!raw) return [];
  return raw.split(/,(?=\s*[^;,]+=)/g).map((value) => value.trim()).filter(Boolean);
}

async function request(baseUrl, jar, path, init = {}) {
  const headers = new Headers(init.headers ?? {});
  const cookieHeader = jar.header();
  if (cookieHeader) headers.set("cookie", cookieHeader);
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });
  jar.store(response);
  return response;
}

async function jsonRequest(baseUrl, jar, path, body) {
  const response = await request(baseUrl, jar, path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

function assert(condition, message, context = {}) {
  if (!condition) {
    const error = new Error(message);
    error.context = context;
    throw error;
  }
}

function firstCorrectAnswer(question) {
  if (Array.isArray(question.answer)) return question.answer;
  if (question.answer && typeof question.answer === "object") return question.answer;
  return String(question.answer || question.options?.[0]?.id || "a");
}

function countReferences(value) {
  return Array.isArray(value) ? value.length : 0;
}

async function signup(baseUrl, label, password) {
  const jar = new CookieJar();
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const email = `clarity.smoke.${label}.${stamp}@example.com`;
  const { response, payload } = await jsonRequest(baseUrl, jar, "/api/auth/signup", {
    email,
    password,
    newsletterOptIn: false,
    acceptedTerms: true,
    acceptedPrivacy: true,
    nextPath: "/dashboard?welcome=1",
  });
  assert(response.ok, `${label} signup failed`, { status: response.status, payload });
  return { jar, email };
}

async function verifyDashboardAndStudyRedirect(baseUrl, jar, label) {
  const dashboard = await request(baseUrl, jar, "/dashboard");
  const dashboardText = await dashboard.text();
  assert(dashboard.ok, `${label} dashboard failed`, { status: dashboard.status });
  assert(/dashboard|accuracy|questions answered|study next/i.test(dashboardText), `${label} dashboard did not include progress language`);

  const study = await request(baseUrl, jar, "/study?welcome=1", { redirect: "manual" });
  assert([307, 308].includes(study.status), `${label} /study did not redirect`, { status: study.status });
  assert((study.headers.get("location") ?? "").includes("/dashboard"), `${label} /study did not point to /dashboard`, {
    location: study.headers.get("location"),
  });
}

async function verifyPracticePersistence(baseUrl, jar, label) {
  const { response, payload } = await jsonRequest(baseUrl, jar, "/api/quiz/start", {
    exam: "nclex",
    count: 5,
    questionType: "mcq",
    personalize: true,
  });
  const session = payload?.data ?? payload;
  assert(response.ok, `${label} quiz start failed`, { status: response.status, payload });
  assert(session?.sessionId && Array.isArray(session.questions) && session.questions.length === 5, `${label} quiz start returned invalid session`, session);

  for (const question of session.questions) {
    const answer = await jsonRequest(baseUrl, jar, "/api/quiz/answer", {
      sessionId: session.sessionId,
      questionId: question.id,
      selectedAnswer: firstCorrectAnswer(question),
      timeSpentMs: 30000,
    });
    assert(answer.response.ok, `${label} answer failed`, { status: answer.response.status, payload: answer.payload });
  }

  const history = await request(baseUrl, jar, "/api/quiz/history");
  const historyPayload = await history.json().catch(() => null);
  assert(history.ok, `${label} history failed`, { status: history.status, historyPayload });
  assert((historyPayload?.data?.stats?.totalSessions ?? 0) >= 1, `${label} completed session did not persist`, historyPayload);

  return { sessionId: session.sessionId };
}

async function verifyRationalePayload(baseUrl, jar, label) {
  const { response, payload } = await jsonRequest(baseUrl, jar, "/api/quiz/start", {
    exam: "nclex",
    count: 5,
    questionType: "case_study",
  });
  const session = payload?.data ?? payload;
  assert(response.ok, `${label} case-study start failed`, { status: response.status, payload });
  const question = session.questions?.find((item) => countReferences(item.references) > 0) ?? session.questions?.[0];
  assert(question, `${label} no case-study question returned`, session);

  const answer = await jsonRequest(baseUrl, jar, "/api/quiz/answer", {
    sessionId: session.sessionId,
    questionId: question.id,
    selectedAnswer: firstCorrectAnswer(question),
    timeSpentMs: 45000,
  });
  const answerPayload = answer.payload?.data ?? answer.payload;
  assert(answer.response.ok, `${label} case-study answer failed`, { status: answer.response.status, payload: answer.payload });
  assert(countReferences(answerPayload?.references) > 0, `${label} answer omitted citations`, {
    questionId: question.id,
    questionReferenceCount: countReferences(question.references),
    answerPayload,
  });
  return { questionId: question.id, references: countReferences(answerPayload.references) };
}

async function verifyP1Content(baseUrl, jar, label) {
  const caseStudy = await jsonRequest(baseUrl, jar, "/api/quiz/start", {
    exam: "nclex",
    count: 6,
    questionType: "case_study",
  });
  const caseSession = caseStudy.payload?.data ?? caseStudy.payload;
  assert(caseStudy.response.ok, `${label} case-study start failed`, { status: caseStudy.response.status, payload: caseStudy.payload });
  assert(caseSession.questions?.some((question) => question.caseStudyId && question.cjmmStep), `${label} missing CJMM metadata in case-study sample`, caseSession.questions);

  const bowTie = await jsonRequest(baseUrl, jar, "/api/quiz/start", {
    exam: "nclex",
    count: 5,
    questionType: "bow_tie",
  });
  const bowTieSession = bowTie.payload?.data ?? bowTie.payload;
  assert(bowTie.response.ok, `${label} bow-tie start failed`, { status: bowTie.response.status, payload: bowTie.payload });
  assert(bowTieSession.questions?.some((question) => question.bowTie?.center), `${label} bow-tie payload missing 3-zone structure`, bowTieSession.questions);
}

async function verifyPharmacology(baseUrl, jar, label) {
  const response = await request(baseUrl, jar, "/api/study/pharmacology?search=ketorolac");
  const payload = await response.json().catch(() => null);
  assert(response.ok, `${label} pharmacology search failed`, { status: response.status, payload });
  assert(JSON.stringify(payload).toLowerCase().includes("ketorolac"), `${label} pharmacology search did not include ketorolac`, payload);
}

async function verifyCheckout(baseUrl, jar, label, planCode) {
  const { response, payload } = await jsonRequest(baseUrl, jar, "/api/checkout", {
    planCode,
    acceptedTerms: true,
    acceptedPrivacy: true,
    successUrl: `${baseUrl}/dashboard?smoke=success`,
    cancelUrl: `${baseUrl}/pricing?smoke=cancel`,
  });
  assert(response.ok, `${label} checkout failed`, { status: response.status, payload });
  assert(/^https:\/\/checkout\.stripe\.com\//.test(payload?.data?.url ?? ""), `${label} checkout did not return Stripe URL`, payload);
  return { sessionId: payload?.data?.sessionId, planCode: payload?.data?.planCode };
}

async function runAccount(baseUrl, label, options) {
  const account = await signup(baseUrl, label, options.password);
  await verifyDashboardAndStudyRedirect(baseUrl, account.jar, label);
  await verifyPracticePersistence(baseUrl, account.jar, label);
  const rationale = await verifyRationalePayload(baseUrl, account.jar, label);
  await verifyP1Content(baseUrl, account.jar, label);
  await verifyPharmacology(baseUrl, account.jar, label);
  const checkout = label === "paid" && !options.skipCheckout
    ? await verifyCheckout(baseUrl, account.jar, label, options.paidPlanCode)
    : null;

  return {
    label,
    email: account.email,
    rationale,
    checkout,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const results = [
    await runAccount(options.baseUrl, "free", options),
    await runAccount(options.baseUrl, "paid", options),
  ];
  process.stdout.write(`${JSON.stringify({
    ok: true,
    checkedAt: new Date().toISOString(),
    baseUrl: options.baseUrl,
    results,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({
    ok: false,
    checkedAt: new Date().toISOString(),
    message: error.message,
    context: error.context ?? null,
  }, null, 2)}\n`);
  process.exit(1);
});
