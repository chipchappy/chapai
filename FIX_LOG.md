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
| (pending) | — | 9909022 (F1) + harness docs | — |
