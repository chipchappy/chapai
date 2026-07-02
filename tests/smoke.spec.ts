import { test, expect, type Page } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// SMOKE SUITE — gates every deploy (see ../scripts/deploy-stable.sh).
// Read-only against the target site. Covers the non-negotiables:
// canonical nav labels, theme persistence on every tab, zero console errors,
// quiz renders, mobile 390px integrity, SEO fingerprint.
// ─────────────────────────────────────────────────────────────────────────────

const KEY_PAGES = ["/", "/quiz", "/pricing", "/nclex", "/ccrn", "/auth/signup", "/free"];
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

test.describe("theme persists across every tab (hard requirement)", () => {
  test.skip(({ browserName }, testInfo) => testInfo.project.name !== "desktop", "desktop covers nav clicks");
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
    const rendered = page.locator("text=/Item \\d+ of \\d+/").first()
      .or(page.getByRole("button", { name: /submit/i }).first());
    await expect(rendered, "a live question should render").toBeVisible({ timeout: 20_000 });
    expect(getErrors()).toEqual([]);
  });

  test("premium gates hold (anon)", async ({ request }) => {
    const exam = await request.get("/api/quiz/practice-exams/nclex-sim-1");
    expect(exam.status(), "practice exam requires auth").toBe(401);
  });
});

test.describe("mobile 390px integrity", () => {
  test.skip(({ browserName }, testInfo) => testInfo.project.name !== "mobile-390", "mobile project only");
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
