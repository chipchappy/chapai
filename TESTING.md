# TESTING.md — regression harness (the fix for the rollback cycle)

**The rule: nothing deploys without a green smoke suite.** The only sanctioned
production path is `bash scripts/deploy-stable.sh`, which gates on branch,
typecheck, fresh build, then runs the smoke suite against prod and
**auto-rolls-back** if it fails.

## Layout
- `tests/` — Playwright workspace (own package.json; `npm install` once inside it).
- `tests/smoke.spec.ts` — deploy-gating checks (see coverage below).
- `tests/visual.spec.ts` — screenshot regression (advisory; not in the gate yet).
- `scripts/deploy-stable.sh` — the gated deploy (refuse → build → deploy → smoke → record/rollback).
- `scripts/rollback-stable.sh` — one-command rollback to last-good (or sacred baseline).
- `scripts/.last-good-version` / `.last-good-commit` — written only after a verified deploy.

## Run it
```bash
cd tests && npm install            # first time only
npx playwright install chromium    # first time only
npm run smoke                      # full gate suite (desktop + mobile-390)
npm run visual                     # screenshot diffs vs committed baselines
npm run visual:update              # regenerate baselines (INTENTIONAL changes only)
BASE_URL=https://staging.example npm run smoke   # point at another env
```

## Smoke coverage (every item runs on desktop AND 390px mobile where relevant)
| Area | Assertion |
|---|---|
| Availability | 7 key pages return 200 |
| Console | zero real console errors on every key page + during quiz flow (GA/adblock noise excluded) |
| **Nav canon** | header tabs are exactly: NCLEX · CCRN · Study now · Dashboard · Pricing |
| **Theme persistence** | dark theme survives clicking every tab (the hard requirement) |
| Brand | `--c-bg` sand token + aurora orb present; favicon 200 |
| SEO | canonical link, JSON-LD, OG tags on home |
| Product | quiz/start returns questions (both exams); a live question renders in the UI anon; practice exams 401 anon |
| Mobile | no horizontal page overflow on /, /quiz, /pricing, /nclex — sampled at 3 timings to catch transient hydration overflow |

## Deploy protocol (one change → one commit → one verified deploy)
1. Branch state: work lands on **`stable`** only, one commit per change
   (`fix(scope): what broke — what changed — how verified`).
2. `bash scripts/deploy-stable.sh` — do not deploy any other way; do not use
   `wrangler deploy` directly; never deploy from `main` (it is the proposal
   shelf, several features ahead of canonical).
3. If the gate rolls you back: fix forward on `stable`, never patch prod by hand.
4. Sacred fallback (pre-harness baseline): worker version
   `8bd91ba1-ea58-464b-ab69-1390ff40b0fb`, git tag `stable-baseline-2026-07-01`.

## Re-landing the queued features (kept on `main`)
Adaptive endless quiz (8ffb07b), enforced CSP + Kaplan page (666a626), nav
relabel (bf85f34 — superseded; canonical nav is Study now/Dashboard) are staged
as Phase-4 proposals. Each re-lands as: cherry-pick onto a branch off `stable` →
review vs constraints → `deploy-stable.sh` (smoke-gated) → visual:update if the
change is intentionally visible. One feature at a time, never batched.

## Known limitations (honest)
- No staging environment with Stripe **test** keys → checkout E2E is not in the
  gate (prod uses live keys; a full test would create real charges). Gate covers
  pricing-page render + auth gates. Add a staging worker to close this gap.
- Visual suite is advisory until baselines prove stable across CF cache states.
- Suite runs read-only against prod; authed flows (dashboard data, billing
  portal) need a dedicated test account — tracked in AUDIT_REPORT Phase 1 remaining.
