const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const base = process.env.BASE_URL || "https://clarityhome.chapaisolutions.com";
const ts = Date.now();
const outDir = path.join(
  process.env.AUDIT_OUT_DIR || "C:/Users/Chapman/Desktop/ai/clarity-free-plan-qa-2026-05-22",
  `fresh-free-plan-pass-${ts}`,
);
const email = `codex.livefree+${ts}@chapaisolutions.com`;
const password = `Clarity!${ts}`;

function assert(condition, message, details) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function unwrap(payload) {
  return payload && typeof payload === "object" && "data" in payload ? payload.data : payload;
}

async function waitForAuthCookie(context, baseUrl) {
  for (let i = 0; i < 20; i += 1) {
    const cookies = await context.cookies(baseUrl);
    if (cookies.some((cookie) => cookie.name.startsWith("sb-") || cookie.name === "chapai_session")) {
      return cookies;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return context.cookies(baseUrl);
}

async function evaluateStable(page, callback) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      return await page.evaluate(callback);
    } catch (error) {
      if (!/Execution context was destroyed|Cannot find context/i.test(String(error?.message ?? error))) {
        throw error;
      }
      await page.waitForTimeout(500);
    }
  }
  return page.evaluate(callback);
}

async function waitForQuizPath(page) {
  await page.waitForURL((url) => url.pathname === "/quiz", { timeout: 45_000 });
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  await page.waitForTimeout(500);
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const report = {
    base,
    email,
    startedAt: new Date().toISOString(),
    steps: [],
    consoleErrors: [],
    pageErrors: [],
    failedResponses: [],
    artifacts: {},
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  page.on("console", (message) => {
    if (message.type() === "error") {
      report.consoleErrors.push({ text: message.text(), location: message.location() });
    }
  });
  page.on("pageerror", (error) => {
    report.pageErrors.push({ message: error.message, stack: error.stack });
  });
  page.on("response", (response) => {
    try {
      const url = new URL(response.url());
      if (url.hostname.endsWith("chapaisolutions.com") && response.status() >= 400) {
        report.failedResponses.push({ status: response.status(), url: response.url() });
      }
    } catch {
      // Ignore non-URL responses.
    }
  });

  try {
    await page.goto(base, { waitUntil: "domcontentloaded", timeout: 45_000 });
    const homepageBody = await page.locator("body").innerText({ timeout: 15_000 });
    assert(/NCLEX|Clarity|practice/i.test(homepageBody), "Homepage did not load expected study content.");
    report.steps.push({ name: "homepage logged-out load", ok: true });

    await page.goto(`${base}/auth/signup?next=/quiz?welcome=1`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    const newsletter = page.locator('input[name="newsletterOptIn"]');
    if (await newsletter.count()) {
      assert(!(await newsletter.first().isChecked()), "Newsletter opt-in is checked by default.");
    }
    const checkboxes = await page.locator('input[type="checkbox"]').elementHandles();
    for (const checkbox of checkboxes) {
      if ((await checkbox.getAttribute("name")) !== "newsletterOptIn") {
        await checkbox.check();
      }
    }
    const [signupResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().includes("/api/auth/signup"), { timeout: 45_000 }),
      page.getByRole("button", { name: /create account/i }).click(),
    ]);
    assert(signupResponse.status() === 200, "Signup API did not return 200.", signupResponse.status());
    const cookies = await waitForAuthCookie(context, base);
    assert(
      cookies.some((cookie) => cookie.name.startsWith("sb-") || cookie.name === "chapai_session"),
      "Signup did not persist auth cookies.",
      cookies.map((cookie) => cookie.name),
    );
    await waitForQuizPath(page);
    report.steps.push({
      name: "fresh signup persists auth and redirects to quiz",
      ok: true,
      cookieNames: cookies.map((cookie) => cookie.name),
    });

    const historyStart = await evaluateStable(page, async () => {
      const response = await fetch("/api/quiz/history", { credentials: "include" });
      return { status: response.status, payload: await response.json() };
    });
    assert(historyStart.status === 200 && !unwrap(historyStart.payload).requiresAuth, "Signed-in history still requires auth.", historyStart);
    report.steps.push({ name: "server recognizes fresh free account", ok: true });

    const launchCard = page.locator('.quiz-terminal-lane:has-text("Launch"), .study-mode-card').first();
    await launchCard.waitFor({ timeout: 30_000 });
    await launchCard.click();
    const modernOption = page.locator(".option-card").first();
    const legacyRadio = page.locator(".nclex-radio-cell").first();
    const legacyChoice = page.locator(".nclex-word-choice, .nclex-highlight-choice").first();
    await page.waitForSelector(".option-card, .nclex-radio-cell, .nclex-word-choice, .nclex-highlight-choice", { timeout: 45_000 });
    if (await modernOption.isVisible().catch(() => false)) {
      await modernOption.click();
      const selectedClass = await modernOption.getAttribute("class");
      assert(
        /border-\[#5A7F88\]|rgba\(90,127,136,0\.08\)|bg-\[rgba\(90,127,136/.test(selectedClass || ""),
        "Selected answer was not visibly highlighted.",
        selectedClass,
      );
      await page.getByRole("button", { name: /submit answer/i }).click();
    } else if (await legacyRadio.isVisible().catch(() => false)) {
      const matrixRows = await page.locator(".nclex-answer-matrix tbody tr").elementHandles();
      for (const row of matrixRows) {
        await row.$eval(".nclex-radio-cell", (button) => button.click());
      }
      const selectedClass = await legacyRadio.getAttribute("class");
      assert(/is-selected/.test(selectedClass || ""), "Selected matrix response was not visibly highlighted.", selectedClass);
      await page.locator(".nclex-submit").click();
    } else {
      await legacyChoice.click();
      const selectedClass = await legacyChoice.getAttribute("class");
      assert(/is-selected/.test(selectedClass || ""), "Selected response was not visibly highlighted.", selectedClass);
      await page.locator(".nclex-submit").click();
    }
    await page.waitForSelector(".reward-banner, .nclex-rationale-panel", { timeout: 30_000 });
    const debriefText = await page.locator("body").innerText({ timeout: 15_000 });
    assert(/Correct:|Explanation|Why this wins|Needs review|Answer locked in/i.test(debriefText), "Rationale/debrief did not render after submit.");
    await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(1_500);
    const reloadText = await page.locator("body").innerText({ timeout: 15_000 });
    assert(/Correct:|Explanation|Why this wins|Needs review|Answer locked in/i.test(reloadText), "Partial practice session did not survive refresh.");
    report.steps.push({ name: "practice UI answer highlight, rationale, refresh persistence", ok: true });

    const apiFlow = await evaluateStable(page, async () => {
      const startResponse = await fetch("/api/quiz/start", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam: "nclex", count: 10, questionType: "mcq" }),
      });
      const startPayload = await startResponse.json();
      const data = startPayload.data ?? startPayload;
      const answerResults = [];
      for (const question of data.questions || []) {
        const selected = question.options?.[0]?.id || "a";
        const answerResponse = await fetch("/api/quiz/answer", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: data.sessionId,
            questionId: question.id,
            selectedOptionId: selected,
            timeSpentMs: 1500,
          }),
        });
        answerResults.push({ status: answerResponse.status, payload: await answerResponse.json() });
      }
      const resultsResponse = await fetch(`/api/quiz/results?sessionId=${encodeURIComponent(data.sessionId)}`, { credentials: "include" });
      const historyResponse = await fetch("/api/quiz/history", { credentials: "include" });
      return {
        startStatus: startResponse.status,
        startPayload,
        sessionId: data.sessionId,
        questionCount: (data.questions || []).length,
        answerResults,
        resultsStatus: resultsResponse.status,
        resultsPayload: await resultsResponse.json(),
        historyStatus: historyResponse.status,
        historyPayload: await historyResponse.json(),
      };
    });
    const startData = unwrap(apiFlow.startPayload);
    assert(apiFlow.startStatus === 200 && startData.sessionId, "Server-side quiz did not start.", apiFlow);
    assert(!String(apiFlow.sessionId).startsWith("demo-"), "Logged-in quiz used demo fallback.", apiFlow.sessionId);
    assert(apiFlow.questionCount === 10, "Server-side MCQ session did not return 10 questions.", apiFlow.questionCount);
    assert(apiFlow.answerResults.every((item) => item.status === 200 && unwrap(item.payload).rationale), "One or more answers failed or omitted rationale.", apiFlow.answerResults);
    const results = unwrap(apiFlow.resultsPayload);
    const history = unwrap(apiFlow.historyPayload);
    assert(apiFlow.resultsStatus === 200 && results.totalQuestions === 10, "Results did not return completed 10-question session.", apiFlow.resultsPayload);
    assert(apiFlow.historyStatus === 200 && history.stats?.totalSessions >= 1 && history.stats?.totalQuestions >= 10, "Completed session did not persist in history.", apiFlow.historyPayload);
    report.steps.push({ name: "full 10-question server session persists to history", ok: true, sessionId: apiFlow.sessionId, score: results.score });

    await page.goto(`${base}/auth/logout?next=/`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    const loggedOut = await evaluateStable(page, async () => {
      const response = await fetch("/api/quiz/history", { credentials: "include" });
      return { status: response.status, payload: await response.json() };
    });
    assert(unwrap(loggedOut.payload).requiresAuth, "Logout did not clear auth for history.", loggedOut);
    await page.goto(`${base}/auth/login?next=/quiz`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    const loginCheckboxes = await page.locator('input[type="checkbox"]').elementHandles();
    for (const checkbox of loginCheckboxes) {
      await checkbox.check();
    }
    const [loginResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().includes("/api/auth/password-login"), { timeout: 60_000 }),
      page.getByRole("button", { name: /^sign in$/i }).click(),
    ]);
    assert(loginResponse.status() === 200, "Password login API did not return 200.", loginResponse.status());
    await waitForQuizPath(page);
    const relogged = await evaluateStable(page, async () => {
      const response = await fetch("/api/quiz/history", { credentials: "include" });
      return { status: response.status, payload: await response.json() };
    });
    assert(relogged.status === 200 && unwrap(relogged.payload).stats?.totalSessions >= 1, "Re-login did not restore history.", relogged);
    report.steps.push({ name: "logout/login restores account progress", ok: true });

    const mobile = await context.newPage();
    await mobile.setViewportSize({ width: 390, height: 844 });
    await mobile.goto(`${base}/auth/signup?next=/quiz`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await mobile.waitForSelector('input[name="email"]', { timeout: 15_000 });
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 3);
    assert(!overflow, "Mobile signup has horizontal overflow.", {
      scrollWidth: await mobile.evaluate(() => document.documentElement.scrollWidth),
      innerWidth: await mobile.evaluate(() => window.innerWidth),
    });
    await mobile.close();
    report.steps.push({ name: "mobile signup no horizontal overflow", ok: true });

    assert(report.pageErrors.length === 0, "Page runtime errors captured.", report.pageErrors);
    assert(report.consoleErrors.length === 0, "Console errors captured.", report.consoleErrors);
    assert(report.failedResponses.length === 0, "Unexpected first-party HTTP failures captured.", report.failedResponses);
    report.ok = true;
  } catch (error) {
    report.ok = false;
    report.error = { message: error.message, stack: error.stack, details: error.details };
    try {
      const screenshotPath = path.join(outDir, "failure.png");
      await page.screenshot({ path: screenshotPath, fullPage: true });
      report.artifacts.failureScreenshot = screenshotPath;
    } catch {
      // Screenshot is best-effort only.
    }
  } finally {
    report.finishedAt = new Date().toISOString();
    const reportPath = path.join(outDir, "audit-result.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    await browser.close();
    console.log(JSON.stringify({
      ok: report.ok,
      reportPath,
      email,
      steps: report.steps.map((step) => step.name),
      error: report.error,
    }, null, 2));
    if (!report.ok) {
      process.exit(1);
    }
  }
})();
