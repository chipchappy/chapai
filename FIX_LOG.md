# FIX_LOG.md

## F7 — deploys re-anchored to `stable` (protect item)
- **Root cause:** the 2026-07-01 rollback was runtime-only; git `main` retained 4
  newer commits, so any deploy from `main` would silently re-ship everything the
  rollback removed — the engine of the revert cycle.
- **Change:** created branch `stable` at tag `stable-baseline-2026-07-01`
  (commit 5ebaf52 = the live build's source). `main` is retired from deployment
  and serves as the Phase-4 proposal shelf. All fixes land on `stable`, one
  commit each, shipped only via `scripts/deploy-stable.sh`.
- **Verified:** stable pushed to origin; deploy gate refuses non-stable branches.

## F1 — public question count showed all rows, not playable questions
- **Root cause:** live build predates commit 88a940c; `live-bank-stats.ts`
  counted every row per exam with no `publish_state` filter → homepage displayed
  ~6,015 while only ~2,494 questions are published/playable.
- **Change:** cherry-picked `88a940c` onto `stable` as `9909022`
  (1 file, +5/−4: adds `publish_state='published'` filter to the count queries).
- **Verified:** post-deploy homepage stat vs D1
  `SELECT COUNT(*) … WHERE publish_state='published'` — see deploy record below.

## F2 — /quiz horizontal overflow at 390px — NOT REPRODUCIBLE (no code change)
- **Investigation:** original audit measured `scrollWidth 445 vs 390` once. Two
  follow-up probes (plain 390px viewport, then exact audit conditions: iPhone UA
  + touch + domcontentloaded, sampled at 300ms/1.2s/3s/6s) measured 390/390 every
  time, zero offending elements. The "clipped card" in the screenshot is the
  peek-scroll carousel affordance (container scrolls; page does not).
- **Verdict:** transient one-frame hydration measurement; per protocol, no
  symptom-patching without a reproducible root cause.
- **Protection:** smoke suite now samples page overflow at 3 timings on 4 routes
  per run — if this is real-but-intermittent, the gate will catch and attribute it.

## Deploy record
| Date | Version | Commits | Gate result |
|---|---|---|---|
| 2026-07-07 (2) | `74da845d-c055-45ff-a0da-55fa0c234185` | 3721966 (instructor Phase 1) + gate warm-up fix | **GREEN — 62/62** (retry). Gate 33 RED on the signup access-key test — hydration flake (signup page chunk not warmed pre-smoke) → auto-rolled-back; added /auth/signup + /auth/login to the gate warm-up. Instructor role + cohort + faculty /instructor dashboard (cohort analytics, at-risk-first roster, banded pass-probability, per-student recs); instructors scoped strictly to own cohort; routing separation. Demo instructor key CLARITY-FACULTY-47F07A (cohort = demo student key's). |
| 2026-07-07 | `2da28508-d1db-46df-a4df-6c5babda1f2f` | 2531c43 (rationale primary) | **GREEN — 61/61.** Fixed regression: populating structured_rationale had made short whyCorrect REPLACE the 600-char deep rationale (and structured whyWrong replace vetted distractors). Deep rationale now always primary; structured overview/mechanism + diagram are supplemental; distractors prefer vetted content. |
| 2026-07-05 (7) | `46071893-c6d7-46bf-a634-1ecf4260894a` | a0d3411 (diagram renderer) + f1bb117 (gate settle fix) | **GREEN — 61/61** (retry). Gate 30 RED on ChunkLoadError (/quiz chunk not edge-propagated at 8s settle) → auto-rolled-back; ROOT-CAUSED the recurring flake (gates 26/28/30) → gate now settles 25s + warms / /quiz /pricing /nclex + JS chunks before smoke. RationaleDiagram: uniform renderer for visual_rationale (trend/flow/pathway/signal/overview); bank is 0% diagrams → generation next. |
| 2026-07-05 (6) | `a7bd4f21-fae7-4799-b3cf-cf23e6ba9a3e` | 85fbf83 (readiness difficulty) | **GREEN — 61/61.** 5 readiness exams now rank each blueprint bucket hardest+premium first (difficulty + structured-rationale bonus, seeded jitter); forms cascade from toughest down via cross-form ID reservation — all challenging, non-overlapping. Blueprint proportions unchanged. |
| 2026-07-05 (5) | `ab1f849f-0ff9-4086-ac2d-d2f99ebe5456` | 8b34353 (review-pane overhaul) | **GREEN — verified** (transient ChunkLoadError on /quiz during propagation cleared on retry; live /quiz 200 + catalog renders confirmed). Emphasized correct rationale (sage card) + always-open distractors (no dropdowns) + periwinkle AI-tutor chat box (opens working Gemini tutor) + H&P tab mirrors Nurses' Notes when no dedicated exhibit. Renders for BOTH study + readiness via PracticeTerminalPane→NclexExamPane. |
| 2026-07-05 (4) | `53d59505-5e07-4c91-b65d-0032bb3a69ff` | 3d1e7b6 (institutional access-key trial system) | **GREEN — 61/61** (retry). Prior attempt gate-26 RED (2 bare-404 console flakes on /,/quiz,/pricing during post-deploy asset propagation) → auto-rolled-back to f874c6a9; verified all shared assets 200 live + commit touches no shared/layout resource → transient, retried clean. Signup optional access key → 30-day full-premium trial via trialing userEntitlements row; data persists past expiry; admin CLI + grant ledger. Ran via bash.exe (Git Bash PATH broke this session). |
| 2026-07-01 | `76f73fb7-1e54-4e01-a181-b0fc4406f9a2` | 9909022 (F1) + harness | **GREEN — 24/24 smoke passed** (desktop + mobile-390); F1 verified exactly: homepage 2,600 = D1 published 2,600; nav/theme/design fingerprint unchanged. Recorded as last-good. |
| 2026-07-02 | `4b952009` | 5424708+ddf2f09+c5e3032+391ff6c | **RED — auto-rolled-back** to 76f73fb7 in seconds. Smoke caught /favicon.ico 404 → exposed a REAL pre-existing defect: the entire favicon set (8 files) was missing from this lineage (audit's earlier 200 was an edge-cache fluke). |
| 2026-07-02 | `c947849a-5807-4afc-ad16-afa9a2658e6a` | + 113199c (favicon restore from 010c77c) | **GREEN — 31/31 smoke passed.** Live-verified: favicon set 200s, closing CTA, case-study stat live from D1 (239+), Quiz JSON-LD, Clarity branding, truthful count 2,745, nav canon + theme intact. Recorded as last-good. |
| 2026-07-02 (2) | `f24b8f08-cffc-4b6b-a5a1-6281720421f8` | fe6e112+ea66674 (R1 adaptive endless + stranding fix), dbecdc0 (R2 CSP enforced), c600a0d (P0-4 Pass Pledge), 323390a (P0-3 pricing FAQ + schema), aa9ff30 (smoke coverage) | **GREEN — 37/37 smoke passed.** Live-verified: CSP enforced header, Unlimited default active on /quiz, adaptive+excludeIds honored (25-q batch), Pass Pledge + FAQ render, nav canon + truthful count (2,769) intact. Recorded as last-good. |
| 2026-07-05 (3) | `f874c6a9-8cac-4d2c-b714-ade2212c8043` | 3f070f5 (tight-crop favicon) | **GREEN — 59/59.** Favicon was correct mark but heavily padded → unrecognizable at 16-32px (Google showed generic globe). Regenerated whole set from clarity-c-logo.jpg trimmed + 86% fill; 16/32/48/96/144/192/512 + apple-180 + hand-built multi-size .ico (validated); manifest repointed to c-logo; ?v=3 cache-bust. Live bytes match. Google recrawl = days/weeks (Search Console reindex nudges). |
| 2026-07-05 (2) | `9c234c2e-b48b-47e7-ba94-0ce97f0f3791` | e46b987 (advertise free offer) | **GREEN — 59/59.** Free pricing card leads with "200 free practice questions" + "1 free readiness exam"; home closing CTA matched. Live-verified on /pricing. |
| 2026-07-05 | `0e2e8f9f-b8ae-4f11-81e0-5003ff24b122` | 5a3d9e7 (freemium structure) | **GREEN — 59/59.** 1 free readiness exam (nclex-sim-1, skips unlock accounting); other 4 → PREMIUM_REQUIRED. Free plan = 200 lifetime questions (server-enforced in quiz/start via quiz_answers count) → 403 FREE_LIMIT_REACHED. Diversified round-robin free sampling. Live meter pill + free/premium card badges + See-plans CTA. Live: sim-1/2 both 401 anon (auth-first). |
| 2026-07-04 (15) | `ee0efd0d-58e4-4491-9924-7a47d4b13909` | 9832965 (dashboard sand/stone palette + grander console) | **GREEN — 57/57.** Light = sand/beige panels (bronze borders); dark = stone + sage/adobe tints with text-dark/text-muted remapped in-scope (dashboard previously had NO dark overrides). Weak points folded into console strip; Recent sessions full-width; 4 surfaces total. |
| 2026-07-04 (14) | `f2151385-55e6-49a1-a450-b8b82d30efdd` | c4ac3f9 (gamified dashboard redesign) | **GREEN — 57/57.** Tabs removed (one page); sage/blue accuracy rings vs 65% line; gold/clay milestone bars (answered 50→5000, streak 3→100); weak-point accuracy bars + drill CTA; Next-move panel (objective + 3 links); banner retitled "Predicted NCLEX readiness". |
| 2026-07-04 (13) | `48c476cf-d863-44a8-a1de-440cc75e803a` | 872ad2f (dashboard minimalist pass) | **GREEN — 57/57.** Slim hero, 4 stat tiles, Momentum removed, AI evaluation promoted. |
| 2026-07-04 (12) | `ad833450-9b66-4710-a3ed-620e48674085` | 64683ed (pricing under HighlightsBand + Pass Pledge ribbons home+/pricing) + 2b4c0d8 (tutor: real AI via Gemini 2.5 Flash — ANTHROPIC_API_KEY never existed on worker, premium tutor had been serving canned fallback) | **GREEN — 57/57.** Ribbon live-verified. Two prior build attempts (gates 17–18) failed pre-deploy: an improperly backgrounded gate died mid-compile → corrupt .next (ENOENT) + orphaned next workers (0xC0000409 crash); fixed by cleaning .next + killing stray workers. Gate refused to ship throughout — prod never regressed. |
| 2026-07-04 (11) | `069eabdf-7e87-4f0b-911e-538e4abef865` | 5316ee9 (user-directed: grand two-card hero, five earth-gold readiness cards, categories/type/lanes/sims sections removed → filters, sun/moon theme icon) | **GREEN — 57/57.** Scoped CSS appended only. |
| 2026-07-04 (10) | `ee454d9b-9b17-486a-a8b1-b94103581b3a` | 880cb11 (dashboard intelligence) | **GREEN — 55/55.** Pass-likelihood chip + NCLEX-standard comparison in readiness banner; /api/study/evaluation (Gemini 2.5 Flash, 6h memo, soft-null fallback — live-verified anon → null); AI evaluation panel on dashboard. |
| 2026-07-04 (9) | `23899491-849d-4440-ab9e-32c6a12c2dda` | b612ebc+9c6b240 (user-directed catalog restore) | **GREEN — 53/53.** Green sage "Study now" unlimited bank + customize-filters panel below + adobe-orange "Readiness exam" card beside it (baseline-010c77c layout, surviving quiz-catalog-* CSS). |
| 2026-07-04 (8) | `(rolled back)` | b612ebc | **RED — auto-rolled-back.** Test-selector collision only: hero CTA meta "Unlimited NCLEX questions" matched the unscoped Unlimited locator. App markup was correct; selector scoped to filters panel and re-shipped green. |
| 2026-07-04 (7) | `19876ffa-ebd5-4851-8023-11aa3a127205` | 0011999 (dashboard student routing) | **GREEN — 51/51.** /dashboard was guild-key-gated — every signed-in student bounced to /guild-access; now students render StudyDashboard, guild keys keep mission control, anon → login. Stale "Guild Dashboard - ChapAI" title fixed. |
| 2026-07-04 (6) | `a949c7ef-72d2-4321-a1ba-e004c9bbbc61` | e56c233 (P2-1 peer percentile) | **GREEN — 49/49.** /api/quiz/history computes 7-day accuracy percentile vs peers (null unless ≥20 answers + ≥10 peers); /study pill renders only when real. Recorded as last-good. |
| 2026-07-04 (5) | `f9060127-0d53-45a5-89ae-538810c1c277` | a86fece (P2-3 start-here picker) | **GREEN — 49/49.** 3-question picker on /quiz catalog → existing deep links; full flow smoke-tested both projects. Recorded as last-good. |
| 2026-07-04 (4) | `1335e811-3ddd-4029-81a8-e69a16cd14f7` | 7b35f20+c1306a1 (P2-6 billing discoverability + force-dynamic fix) | **GREEN — 47/47 smoke passed.** /account now resolves to the billing surface, auth-gated (browser-verified both projects); "Account & billing" row live on /study. Audit F8 CLOSED. Recorded as last-good. |
| 2026-07-04 (3) | `(rolled back)` | 7b35f20 | **RED — auto-rolled-back to 3e84b796 in seconds.** Root cause: `redirect()` in a statically prerendered /account page degrades to a client-side meta refresh (200), not an HTTP redirect — smoke asserted URL at domcontentloaded before the refresh fired. Fix: `force-dynamic` on the page + smoke waits for the redirect chain. Only the new feature's own test failed; 45 others green. |
| 2026-07-04 | `5618d72a-7ef8-444c-bc2a-4b1363a795b4` | 5f4c1c4 (P2-2 readiness verdict banner on /study) | **GREEN — 43/43 smoke passed.** Honest verdict from real aggregate accuracy + volume (bands mirror readiness calculator: ≥65 On Track / 55–64 cusp / <55 building; 25-answer gate). Pairs with Pass Pledge. Smoke +1: /study auth-gate. |
| 2026-07-04 (2) | `3e84b796-79b0-42c1-ba21-a4f774f55e11` | 6272813 (R3 Kaplan compare page + sitemap + smoke) | **GREEN — 44/44 smoke passed.** Page live 200, sitemap entry verified. Recorded as last-good. |
| 2026-07-03 | `337fc193-55be-4716-b5db-a0a12e5da8a8` | 61e4500 (home stats 60s memo), 6d4fbc9 (smoke: +lab-values/+glossary) | **GREEN — 41/41 smoke passed.** Perf fix live-verified: home TTFB was **2,839ms** on cache miss (force-dynamic + 4 D1 stat queries); after the in-isolate 60s memo, 4 consecutive cache-busted hits measured **130–340ms** (~20× faster). Truthful count 2,862 = D1, nav canon + theme intact. Recorded as last-good. |

## 2026-07-02 batch (approved: "continue with next best fixes")
- **F4 titles — FALSE POSITIVE, corrected.** Real `<title>` tags are clean
  ("NCLEX Countdown Timer — Days, Hours, Minutes…"); the audit's regex mangled
  multibyte punctuation. No change; audit item closed as PASS.
- **F3 cloze scaffold (commit 5424708):** root cause = hardcoded fallback sentence
  in `NclexExamPane.renderClozeSentence()` fabricating "safest priority response"
  framing on any item lacking a clozeTemplate. Replaced with neutral prompts.
- **F5 branding (commit ddf2f09):** 16 "ChapAI" mentions → "Clarity" on the
  UWorld/Archer compare pages; slugs + canonicals untouched.
- **P0 pack + F6 (commit c5e3032):** closing CTA section on home (existing tokens,
  `CtaButtons surface=home-closing`); HighlightsBand case-study stat now live from
  D1 (223 actual vs hardcoded "50+"); Quiz JSON-LD node added to home @graph.
- **Gate refusal incident (working as designed) + chore commit:** first gate run
  REFUSED on a dirty tree — tracked `tsconfig.typecheck.tsbuildinfo` cache is
  rewritten by every tsc run. Untracked + gitignored so the clean-tree check
  stays meaningful.

## Harness fixes found during first gate run (test-code only, no app changes)
- iPhone device preset requires WebKit (not installed) → mobile project switched to
  Chromium-based emulation.
- `.or()` locator strict-mode violation when both alternatives visible → `.first()`.
- Conditional `test.skip(fixtures, testInfo)` signature invalid → replaced with
  per-project `grepInvert` tags (`@mobileOnly` / `@desktopOnly`).
