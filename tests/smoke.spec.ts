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

test.describe("core product", () => {
  test("quiz API serves questions (both exams)", async ({ request }) => {
    for (const exam of ["nclex", "ccrn"]) {
      const resp = await request.post("/api/quiz/start", { data: { exam, count: 5 } });
      expect(resp.status(), `quiz/start ${exam}`).toBe(200);
      const body = await resp.json();
      const questions = (body.data ?? body).questions ?? [];
      expect(questions.length, `${exam} returns questions`).toBeGreaterThanOrEqual(1);
      expect(String(questions[0].stem ?? "").length).toBeGreaterThan(20);
    }
  });

  test("quiz session renders in UI (anon deep-link)", async ({ page }) => {
    const getErrors = collectConsoleErrors(page);
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

  test("signup exposes an optional access-key field", async ({ page }) => {
    await page.goto("/auth/signup", { waitUntil: "domcontentloaded" });
    const toggle = page.getByTestId("access-key-toggle");
    await expect(toggle, "access-key toggle renders on signup").toBeVisible({ timeout: 10_000 });
    await toggle.click();
    await expect(page.getByTestId("access-key-input"), "access-key input appears when toggled").toBeVisible();
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
