import { test, expect, type Page } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// SMOKE SUITE — gates every deploy (see ../scripts/deploy-stable.sh).
// Read-only against the target site. Covers the non-negotiables:
// canonical nav labels, theme persistence on every tab, zero console errors,
// quiz renders, mobile 390px integrity, SEO fingerprint.
// ─────────────────────────────────────────────────────────────────────────────

const KEY_PAGES = ["/", "/quiz", "/pricing", "/nclex", "/auth/signup", "/free", "/nclex-lab-values", "/nclex-glossary", "/compare/clarity-vs-kaplan"];
const CANONICAL_NAV = ["NCLEX", "Study now", "Dashboard", "Pricing"];

function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e)));
  return () => errors.filter((e) => !/googletagmanager|google-analytics|ERR_BLOCKED_BY_CLIENT/i.test(e));
}

test.describe("pages load clean", () => {
  for (const path of KEY_PAGES) {
    test(`200 + zero console errors: ${path}`, async ({ page }) => {
      const getErrors = collectConsoleErrors(page);
      const resp = await page.goto(path, { waitUntil: "networkidle" });
      expect(resp?.status(), `${path} should be 200`).toBe(200);
      expect(getErrors(), `${path} console must be clean`).toEqual([]);
    });
  }
});

test.describe("brand + nav fingerprint (canonical baseline)", () => {
  test("header nav labels are exactly the canonical set", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    for (const label of CANONICAL_NAV) {
      await expect(page.locator(`header nav a:has-text("${label}")`).first(),
        `nav tab "${label}" must exist`).toHaveCount(1);
    }
  });

  test("retired CCRN pages redirect to NCLEX", async ({ page }) => {
    await page.goto("/ccrn/ai-tutor", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/nclex$/);
  });

  test("design tokens present (sand bg + orb) and favicon serves", async ({ page, request }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const html = await page.content();
    expect(html, "sand design token --c-bg").toContain("--c-bg");
    expect(html.toLowerCase(), "aurora orb").toContain("orb");
    let faviconStatus = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        faviconStatus = (await request.get("/favicon.ico")).status();
        if (faviconStatus === 200) break;
      } catch {
        faviconStatus = 0;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    expect(faviconStatus).toBe(200);
  });

  test("SEO fingerprint: canonical + JSON-LD + OG on home", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
    await expect(page.locator('meta[property="og:title"]').first()).toHaveCount(1);
  });
});

test.describe("theme persists across every tab (hard requirement) @desktopOnly", () => {
  test("dark theme survives all 5 tab navigations", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const toggle = page.locator("button.theme-toggle").first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    for (const label of CANONICAL_NAV) {
      await Promise.all([
        page.waitForLoadState("domcontentloaded"),
        page.locator(`header nav a:has-text("${label}")`).first().click(),
      ]);
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme")),
        `theme must persist after clicking "${label}"`).toBe(theme);
    }
  });
});

// Study content is account-gated. The deploy gate injects a currently active
// D1 key so rotations cannot silently make the suite test an expired key.
function demoKey() {
  const key = process.env.CLARITY_SMOKE_ACCESS_KEY?.trim();
  if (!key) throw new Error("CLARITY_SMOKE_ACCESS_KEY is required for product smoke tests.");
  return key;
}

function demoKeyCookie() {
  return `chapai_preview_access=${demoKey()}`;
}

async function grantDemoAccess(page: import("@playwright/test").Page) {
  const base = test.info().project.use.baseURL ?? "https://claritynclex.com";
  await page.context().addCookies([
    { name: "chapai_preview_access", value: demoKey(), url: base },
  ]);
}

async function gotoStable(page: Page, path: string) {
  let lastStatus: number | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
      lastStatus = response?.status() ?? null;
      if (lastStatus === null || lastStatus < 500) return;
    } catch {
      lastStatus = null;
    }
    await page.waitForTimeout(1_500);
  }
  throw new Error(`Unable to load ${path} after 3 attempts${lastStatus ? ` (last status ${lastStatus})` : ""}.`);
}

test.describe("core product", () => {
  test("quiz/start requires an account and serves questions with access @desktopOnly", async ({ request }) => {
    const anon = await request.post("/api/quiz/start", { data: { exam: "nclex", count: 5 } });
    expect(anon.status(), "anon quiz/start is blocked").toBe(401);
    for (const exam of ["nclex", "ccrn"]) {
      const resp = await request.post("/api/quiz/start", {
        data: { exam, count: 5 },
        headers: { cookie: demoKeyCookie() },
      });
      expect(resp.status(), `quiz/start ${exam} (demo key)`).toBe(200);
      const body = await resp.json();
      const questions = (body.data ?? body).questions ?? [];
      expect(questions.length, `${exam} returns questions`).toBeGreaterThanOrEqual(1);
      expect(String(questions[0].stem ?? "").length).toBeGreaterThan(20);
    }
  });

  test("quiz/answer and tutor are account-gated (anon → 401)", async ({ request }) => {
    const answer = await request.post("/api/quiz/answer", {
      data: { sessionId: "demo-1", questionId: "smoke-any", selectedOptionId: "a" },
    });
    expect(answer.status(), "anon quiz/answer is blocked").toBe(401);
    const tutor = await request.post("/api/tutor/ask", {
      data: { questionId: "smoke-any", userMessage: "help", context: "rationale", history: [] },
    });
    expect(tutor.status(), "anon tutor is blocked").toBe(401);

    const forgedTutor = await request.post("/api/tutor/ask", {
      data: { questionId: "smoke-any", userMessage: "help", context: "rationale", history: [] },
      headers: { cookie: "chapai_preview_access=forged-smoke-key" },
    });
    expect(forgedTutor.status(), "an unvalidated preview cookie cannot unlock the tutor").toBe(401);
  });

  test("AI tutor returns completed model coaching with access @desktopOnly", async ({ request }) => {
    const start = await request.post("/api/quiz/start", {
      data: { exam: "nclex", count: 5 },
      headers: { cookie: demoKeyCookie() },
    });
    expect(start.status(), "quiz/start for tutor smoke").toBe(200);
    const startBody = await start.json();
    const question = ((startBody.data ?? startBody).questions ?? [])[0];
    expect(question?.id, "tutor smoke receives a real question").toBeTruthy();

    const tutor = await request.post("/api/tutor/ask", {
      data: {
        questionId: question.id,
        userMessage: "Explain the highest-priority clue, the underlying mechanism, why the tempting distractor is unsafe here, and when that distractor would become appropriate.",
        context: "rationale",
        history: [],
        selectedAnswer: "A",
        answeredCorrectly: false,
      },
      headers: { cookie: demoKeyCookie() },
      timeout: 40_000,
    });
    expect(tutor.status(), "tutor responds with access").toBe(200);
    expect(["anthropic", "gemini", "groq", "cerebras"], "a real model served the tutor response")
      .toContain(tutor.headers()["x-clarity-tutor-provider"]);
    const tutorBody = await tutor.text();
    expect(tutorBody, "tutor completes its event stream").toContain("[DONE]");
    expect(tutorBody.length, "tutor returns detailed, substantive coaching").toBeGreaterThan(500);
  });

  test("anon deep-link into practice routes to the signup gate", async ({ page }) => {
    await page.goto("/quiz?exam=nclex&mode=standard", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/auth/signup**", { timeout: 20_000 });
    expect(page.url(), "anon practice deep-link lands on signup").toContain("/auth/signup");
  });

  test("quiz session renders in UI (demo-key deep-link)", async ({ page }) => {
    const getErrors = collectConsoleErrors(page);
    await grantDemoAccess(page);
    await page.goto("/quiz?exam=nclex&mode=standard", { waitUntil: "networkidle" });
    // Tolerant of item type: an item counter, a Submit control, or option buttons
    const rendered = page.locator("text=/Item \\d+ of \\d+/")
      .or(page.getByRole("button", { name: /submit/i }))
      .first();
    await expect(rendered, "a live question should render").toBeVisible({ timeout: 20_000 });
    expect(getErrors()).toEqual([]);
  });

  test("answered question opens a working Clarity AI tutor @desktopOnly", async ({ page }) => {
    await grantDemoAccess(page);
    await page.goto("/quiz?exam=nclex&mode=standard", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /^submit$/i })).toBeVisible({ timeout: 25_000 });

    const answerControl = page.locator([
      ".nclex-word-choice:not([disabled])",
      ".nclex-highlight-choice:not([disabled])",
      ".nclex-radio-cell:not([disabled])",
      ".nclex-bowtie button:not([disabled])",
    ].join(", ")).first();
    await expect(answerControl, "a selectable answer control should render").toBeVisible();
    await answerControl.click();
    await page.getByRole("button", { name: /^submit$/i }).click();

    const tutorEntry = page.locator(".nclex-tutor-box__entry");
    await expect(tutorEntry, "the rationale should expose Ask Clarity AI").toBeVisible({ timeout: 20_000 });
    const questionUrl = page.url();
    await tutorEntry.click();
    const inlineTutor = page.getByTestId("inline-tutor");
    await expect(inlineTutor, "the tutor should expand inside the rationale").toBeVisible();
    await expect(page.getByRole("dialog", { name: "Clarity AI tutor" })).toHaveCount(0);
    expect(page.url(), "opening the tutor should not navigate away from the question").toBe(questionUrl);
    expect(await inlineTutor.evaluate((node) => Boolean(node.closest(".nclex-rationale-panel"))), "the tutor should remain inside the question results").toBe(true);

    await page.getByPlaceholder("Ask the tutor...").fill("Give me the highest-priority clue in one sentence.");
    await page.getByRole("button", { name: "Ask Clarity AI" }).click();
    const reply = page.getByTestId("tutor-message-assistant").last();
    await expect.poll(async () => (await reply.textContent())?.trim().length ?? 0, {
      message: "the tutor should stream a substantive coaching reply",
      timeout: 40_000,
    }).toBeGreaterThan(80);
  });

  test("premium gates hold (anon)", async ({ request }) => {
    const exam = await request.get("/api/quiz/practice-exams/nclex-sim-1");
    expect(exam.status(), "practice exam requires auth").toBe(401);
  });

  test("readiness exam 1 serves a full premium form with access @desktopOnly", async ({ request }) => {
    // Building an exam is CPU-heavy on a cold isolate and can blip with a 5xx;
    // the client retries, so mirror that here. Per-student order is applied
    // client-side (Fisher–Yates on the returned set), so we assert the API
    // health + form completeness, not order.
    // The exam build is CPU-heavy on a cold isolate and can take several seconds
    // to warm (the client retries too). Give it real headroom before failing.
    let questions: Array<{ id: string; rationale?: string }> = [];
    for (let attempt = 0; attempt < 7; attempt++) {
      const r = await request.get("/api/quiz/practice-exams/nclex-sim-1", { headers: { cookie: demoKeyCookie() } });
      if (r.ok()) {
        const body = await r.json();
        questions = (body.data ?? body).questions ?? [];
        break;
      }
      if (attempt === 6) expect(r.status(), "free readiness exam serves with access").toBe(200);
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    expect(questions.length, "readiness exam returns a full form").toBeGreaterThanOrEqual(50);
    expect(String(questions[0]?.rationale ?? "").length, "questions carry rationale content").toBeGreaterThan(20);
  });

  test("signup exposes an optional access-key field", async ({ page }) => {
    await page.goto("/auth/signup", { waitUntil: "networkidle" });
    const toggle = page.getByTestId("access-key-toggle");
    await expect(toggle, "access-key toggle renders on signup").toBeVisible({ timeout: 15_000 });
    // Retry the click until the input appears — the first click can land before the
    // client component has hydrated on a freshly deployed bundle.
    await expect(async () => {
      await toggle.click();
      await expect(page.getByTestId("access-key-input")).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
  });

  test("study dashboard is auth-gated (anon → login)", async ({ page }) => {
    await page.goto("/study", { waitUntil: "domcontentloaded" });
    expect(page.url(), "anon /study should redirect to login").toContain("/auth/login");
  });

  test("/dashboard is auth-gated for students (anon → login, not guild-access)", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/auth/login**", { timeout: 10_000 });
    expect(page.url(), "anon /dashboard should land on login").toContain("/auth/login");
  });

  test("/instructor is auth-gated (anon → login)", async ({ page }) => {
    await page.goto("/instructor", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/auth/login**", { timeout: 10_000 });
    expect(page.url(), "anon /instructor should land on login").toContain("/auth/login");
  });

  test("study evaluation API fails soft for anon", async ({ request }) => {
    const resp = await request.get("/api/study/evaluation");
    expect(resp.status(), "evaluation returns 200").toBe(200);
    const body = await resp.json();
    expect((body.data ?? body).evaluation, "anon gets null evaluation, never an error").toBeNull();
  });

  test("/account resolves to the billing surface (auth-gated)", async ({ page }) => {
    await page.goto("/account", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/auth/login**", { timeout: 10_000 });
    expect(page.url(), "anon /account should land on login for billing").toContain("/auth/login");
  });

  test("adaptive endless params accepted by quiz/start @desktopOnly", async ({ request }) => {
    let questions: Array<{ id: string }> = [];
    let lastStatus = 0;
    for (let attempt = 0; attempt < 5; attempt++) {
      const resp = await request.post("/api/quiz/start", {
        data: { exam: "nclex", count: 25, adaptive: true, excludeIds: ["smoke-nonexistent-id"] },
        headers: { cookie: demoKeyCookie() },
      });
      lastStatus = resp.status();
      if (resp.ok()) {
        const body = await resp.json();
        questions = (body.data ?? body).questions ?? [];
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
    expect(lastStatus, "adaptive start").toBe(200);
    expect(questions.length, "adaptive batch returns questions").toBeGreaterThanOrEqual(1);
    expect(questions.some((q: { id: string }) => q.id === "smoke-nonexistent-id"), "excludeIds honored").toBe(false);
  });

  test("start-here picker recommends a readiness exam for a close test date", async ({ page }) => {
    await gotoStable(page, "/quiz");
    await page.locator("button", { hasText: "Not sure where to start" }).first().click();
    const picker = page.getByTestId("start-here-picker");
    await picker.locator("button", { hasText: "NCLEX" }).first().click();
    await picker.locator("button", { hasText: "Under 4 weeks" }).click();
    await picker.locator("button", { hasText: "Test-day readiness" }).click();
    await expect(page.getByTestId("start-here-launch"), "recommendation link renders").toBeVisible();
    expect(await page.getByTestId("start-here-launch").getAttribute("href"), "close date → timed readiness exam")
      .toContain("practiceExam=nclex-sim-1");
  });

  test("catalog hero: green Study now bank + orange readiness exam side by side", async ({ page }) => {
    await gotoStable(page, "/quiz");
    const studyNow = page.locator(".quiz-catalog-hero__cta");
    await expect(studyNow, "green Study now CTA renders").toBeVisible({ timeout: 15_000 });
    await expect(studyNow, "CTA is labeled Study now").toContainText("Study now");
    await expect(page.locator(".quiz-catalog-baseline__cta"), "orange readiness exam CTA renders").toBeVisible();
    await expect(page.locator(".quiz-catalog-advanced__summary"), "filters panel available below").toBeVisible();
  });

  test("five readiness exams render below the hero (NCLEX)", async ({ page }) => {
    await gotoStable(page, "/quiz");
    const cards = page.getByTestId("readiness-exam-grid").locator(".quiz-readiness-card");
    await expect(cards, "five NCLEX readiness forms").toHaveCount(5, { timeout: 15_000 });
    await expect(cards.nth(0), "first readiness exam is free").toContainText("free with account");
    await expect(cards.nth(4), "later readiness exams are premium").toContainText("premium");
  });

  test("free plan shows the 200-question allowance pill (anon)", async ({ page }) => {
    await gotoStable(page, "/quiz");
    await expect(page.locator(".quiz-catalog-free-pill"), "free allowance pill renders")
      .toContainText(/200 free|free questions/i);
  });

  test("quiz catalog defaults to Unlimited deck size (inside filters)", async ({ page }) => {
    await gotoStable(page, "/quiz");
    await page.locator(".quiz-catalog-advanced__summary").click();
    const unlimited = page.locator(".quiz-catalog-advanced button", { hasText: "Unlimited" }).first();
    await expect(unlimited, "Unlimited toggle exists").toBeVisible({ timeout: 15_000 });
    await expect(unlimited, "Unlimited is the default").toHaveClass(/is-active/);
  });

  test("pricing shows Pass Pledge + FAQ accordion", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("The Clarity Pass Pledge").first()).toBeVisible();
    expect(await page.locator("details").count(), "FAQ items render").toBeGreaterThanOrEqual(5);
    // First FAQ opens and reveals its answer
    const first = page.locator("details summary").first();
    await first.click();
    await expect(page.locator("details[open] p").first()).toBeVisible();
  });
});

test.describe("mobile 390px integrity @mobileOnly", () => {
  test("mobile header exposes sign in and start free", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator('header a[href="/auth/login"]'), "mobile sign-in action is visible").toBeVisible();
    await expect(page.locator('header a[href="/auth/signup"]'), "mobile start-free action is visible").toBeVisible();
  });

  for (const path of ["/", "/quiz", "/pricing", "/nclex"]) {
    test(`no horizontal page overflow: ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      // Sample at three moments to catch transient/hydration overflow (F2 class)
      for (const wait of [300, 1200, 3500]) {
        await page.waitForTimeout(wait);
        const m = await page.evaluate(() => ({
          s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth,
        }));
        expect(m.s, `${path} must not scroll sideways (sampled)`).toBeLessThanOrEqual(m.c + 2);
      }
    });
  }
});
