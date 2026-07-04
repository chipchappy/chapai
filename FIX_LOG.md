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
| 2026-07-01 | `76f73fb7-1e54-4e01-a181-b0fc4406f9a2` | 9909022 (F1) + harness | **GREEN — 24/24 smoke passed** (desktop + mobile-390); F1 verified exactly: homepage 2,600 = D1 published 2,600; nav/theme/design fingerprint unchanged. Recorded as last-good. |
| 2026-07-02 | `4b952009` | 5424708+ddf2f09+c5e3032+391ff6c | **RED — auto-rolled-back** to 76f73fb7 in seconds. Smoke caught /favicon.ico 404 → exposed a REAL pre-existing defect: the entire favicon set (8 files) was missing from this lineage (audit's earlier 200 was an edge-cache fluke). |
| 2026-07-02 | `c947849a-5807-4afc-ad16-afa9a2658e6a` | + 113199c (favicon restore from 010c77c) | **GREEN — 31/31 smoke passed.** Live-verified: favicon set 200s, closing CTA, case-study stat live from D1 (239+), Quiz JSON-LD, Clarity branding, truthful count 2,745, nav canon + theme intact. Recorded as last-good. |
| 2026-07-02 (2) | `f24b8f08-cffc-4b6b-a5a1-6281720421f8` | fe6e112+ea66674 (R1 adaptive endless + stranding fix), dbecdc0 (R2 CSP enforced), c600a0d (P0-4 Pass Pledge), 323390a (P0-3 pricing FAQ + schema), aa9ff30 (smoke coverage) | **GREEN — 37/37 smoke passed.** Live-verified: CSP enforced header, Unlimited default active on /quiz, adaptive+excludeIds honored (25-q batch), Pass Pledge + FAQ render, nav canon + truthful count (2,769) intact. Recorded as last-good. |
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
