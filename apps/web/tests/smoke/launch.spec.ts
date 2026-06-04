import { expect, test } from "@playwright/test";

test("homepage and plans page load", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: /^pricing$/i })).toBeVisible();

  await page.goto("/upgrade");
  await expect(page.getByRole("heading", { name: /premium prep, priced on your side/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "7-Day Pass", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Premium", exact: true })).toBeVisible();
  await expect(page.getByText("$4.99").first()).toBeVisible();
  await expect(page.getByText("$15.99", { exact: true })).toBeVisible();

  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: /sign in to continue/i })).toBeVisible();

  await page.goto("/account/billing");
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("client JavaScript hydrates interactive controls", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/quiz");
  await expect(page.getByRole("group", { name: "Study theme" })).toBeVisible();
  await page.getByRole("button", { name: "dark" }).click();
  await expect(page.locator(".quiz-terminal-app")).toHaveAttribute("data-study-theme", "dark");

  expect(consoleErrors.filter((message) => message.includes("/_next/static"))).toEqual([]);
});

test("mobile quiz catalog scrolls at page level", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/quiz");
  await expect(page.getByRole("heading", { name: /launch the qbank/i })).toBeVisible();

  const metrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }));
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);

  await page.mouse.wheel(0, 650);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
});

test("health endpoints respond", async ({ request }) => {
  const live = await request.get("/api/health/live");
  expect(live.ok()).toBeTruthy();

  const ready = await request.get("/api/health/ready");
  expect([200, 503]).toContain(ready.status());
});

test("quiz session can start", async ({ request }) => {
  const response = await request.post("/api/quiz/start", {
    data: { exam: "nclex", count: 10 },
  });

  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.success).toBeTruthy();
  expect(payload.data.sessionId).toBeTruthy();
  expect(payload.data.questions.length).toBeGreaterThan(0);
});

test("checkout requires authentication", async ({ request }) => {
  const response = await request.post("/api/checkout", {
    data: { planCode: "nclex_base_monthly", acceptedTerms: true, acceptedPrivacy: true },
  });

  expect(response.status()).toBe(401);
  const payload = await response.json();
  expect(payload.code).toBe("AUTH_REQUIRED");
});
