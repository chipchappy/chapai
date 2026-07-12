import { test, expect, type Page } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// SMOKE SUITE — gates every deploy (see ../scripts/deploy-stable.sh).
// Read-only against the target site. Covers the non-negotiables:
// canonical nav labels, theme persistence on every tab, zero console errors,
// quiz renders, mobile 390px integrity, SEO fingerprint.
// ─────────────────────────────────────────────────────────────────────────────

const KEY_PAGES = ["/", "/quiz", "/pricing", "/nclex", "/ccrn", "/auth/signup", "/free", "/nclex-lab-values", "/nclex-glossary", "/compare/clarity-vs-kaplan"];
const CANONICAL_NAV = ["NCLEX", "CCRN", "Study now", "Dashboard", "Pricing"];

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

  test("design tokens present (sand bg + orb) and favicon serves", async ({ page, request }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const html = await page.content();
    expect(html, "sand design token --c-bg").toContain("--c-bg");
    expect(html.toLowerCase(), "aurora orb").toContain("orb");
    expect((await request.get("/favicon.ico")).status()).toBe(200);
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

// Study content is account-gated. Semi-public demo key exercises the full
// question flow in smoke without needing a throwaway Supabase account.
const DEMO_KEY_COOKIE = "chapai_preview_access=DEMO-NEURAL-2194";

async function grantDemoAccess(page: import("@playwright/test").Page) {
  const base = test.info().project.use.baseURL ?? "https://claritynclex.com";
  await page.context().addCookies([
    { name: "chapai_preview_access", value: "DEMO-NEURAL-2194", url: base },
  ]);
}

test.describe("core product", () => {
  test("quiz/start requires an account and serves questions with access", async ({ request }) => {
    const anon = await request.post("/api/quiz/start", { data: { exam: "nclex", count: 5 } });
    expect(anon.status(), "anon quiz/start is blocked").toBe(401);
    for (const exam of ["nclex", "ccrn"]) {
      const resp = await request.post("/api/quiz/start", {
        data: { exam, count: 5 },
        headers: { cookie: DEMO_KEY_COOKIE },
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

  test("premium gates hold (anon)", async ({ request }) => {
    const exam = await request.get("/api/quiz/practice-exams/nclex-sim-1");
    expect(exam.status(), "practice exam requires auth").toBe(401);
  });

  test("readiness exam 1 serves a full premium form with access", async ({ request }) => {
    // Building an exam is CPU-heavy on a cold isolate and can blip with a 5xx;
    // the client retries, so mirror that here. Per-student order is applied
    // client-side (Fisher–Yates on the returned set), so we assert the API
    // health + form completeness, not order.
    let questions: Array<{ id: string; rationale?: string }> = [];
    for (let attempt = 0; attempt < 4; attempt++) {
      const r = await request.get("/api/quiz/practice-exams/nclex-sim-1", { headers: { cookie: DEMO_KEY_COOKIE } });
      if (r.ok()) {
        const body = await r.json();
        questions = (body.data ?? body).questions ?? [];
        break;
      }
      if (attempt === 3) expect(r.status(), "free readiness exam serves with access").toBe(200);
      await new Promise((resolve) => setTimeout(resolve, 1500));
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

  test("adaptive endless params accepted by quiz/start", async ({ request }) => {
    const resp = await request.post("/api/quiz/start", {
      data: { exam: "nclex", count: 25, adaptive: true, excludeIds: ["smoke-nonexistent-id"] },
      headers: { cookie: DEMO_KEY_COOKIE },
    });
    expect(resp.status(), "adaptive start").toBe(200);
    const body = await resp.json();
    const questions = (body.data ?? body).questions ?? [];
    expect(questions.length, "adaptive batch returns questions").toBeGreaterThanOrEqual(1);
    expect(questions.some((q: { id: string }) => q.id === "smoke-nonexistent-id"), "excludeIds honored").toBe(false);
  });

  test("start-here picker recommends a readiness exam for a close test date", async ({ page }) => {
    await page.goto("/quiz", { waitUntil: "networkidle" });
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
    await page.goto("/quiz", { waitUntil: "networkidle" });
    const studyNow = page.locator(".quiz-catalog-hero__cta");
    await expect(studyNow, "green Study now CTA renders").toBeVisible({ timeout: 15_000 });
    await expect(studyNow, "CTA is labeled Study now").toContainText("Study now");
    await expect(page.locator(".quiz-catalog-baseline__cta"), "orange readiness exam CTA renders").toBeVisible();
    await expect(page.locator(".quiz-catalog-advanced__summary"), "filters panel available below").toBeVisible();
  });

  test("five readiness exams render below the hero (NCLEX)", async ({ page }) => {
    await page.goto("/quiz", { waitUntil: "networkidle" });
    const cards = page.getByTestId("readiness-exam-grid").locator(".quiz-readiness-card");
    await expect(cards, "five NCLEX readiness forms").toHaveCount(5, { timeout: 15_000 });
    await expect(cards.nth(0), "first readiness exam is free").toContainText("free with account");
    await expect(cards.nth(4), "later readiness exams are premium").toContainText("premium");
  });

  test("free plan shows the 200-question allowance pill (anon)", async ({ page }) => {
    await page.goto("/quiz", { waitUntil: "networkidle" });
    await expect(page.locator(".quiz-catalog-free-pill"), "free allowance pill renders")
      .toContainText(/200 free|free questions/i);
  });

  test("quiz catalog defaults to Unlimited deck size (inside filters)", async ({ page }) => {
    await page.goto("/quiz", { waitUntil: "networkidle" });
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
