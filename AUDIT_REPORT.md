# AUDIT_REPORT — claritynclex.com stabilization pass
Date: 2026-07-01 · Auditor: Claude (lead engineer pass) · Status: **Phase 0 COMPLETE · Phase 1 ~80% complete**

## Canonical baseline (Phase 0)

| Item | Value |
|---|---|
| Live worker version (authoritative) | `8bd91ba1-ea58-464b-ab69-1390ff40b0fb` (built 2026-06-20T00:25Z; user rollback applied 2026-07-01T23:36Z) |
| Best-matching source commit | `5ebaf52` (fingerprint: nav=Study now/Dashboard ✓, count-fix absent ✓, CSP report-only ✓) |
| Sacred restore tag | `stable-baseline-2026-07-01` (pushed to origin) |
| 30-second rollback | `cd apps/web && npx wrangler rollback 8bd91ba1-ea58-464b-ab69-1390ff40b0fb --name chapai-web -y` |
| DB backup | `../chapai/.backups/chapai-prod-2026-07-01.sql` — 31.2 MB, 11,463 INSERTs (contains user PII — local only, never commit) |
| User-uploaded assets | None exist (all assets are build-bundled); KV holds ephemeral session/cache only — not exported, documented here |
| Route snapshots | `../chapai/.baseline-2026-07-01/*.html` + `shots/*.png` (desktop + 390px) + `routes.csv` + `browser-audit.json` |

**⚠️ Git↔live divergence (protect item):** `main` HEAD (`666a626`) is **ahead of the live build** by 4 commits (nav relabel bf85f34, adaptive endless quiz 8ffb07b, enforced CSP + Kaplan page 666a626, count fix 88a940c). A deploy from `main` HEAD would re-ship everything the rollback removed. **Do not deploy `main` until it is re-anchored to the baseline** (plan to be approved before execution — see Fix queue F7).

### Tech stack (as found)
Next.js 15.5.14 (App Router) → @opennextjs/cloudflare → Cloudflare Worker `chapai-web` (custom domains: claritynclex.com, www, 3 chapaisolutions subdomains). Data: D1 `chapai-prod` (binding DB), KV (sessions/cache), Workers AI binding (tutor). Auth: Supabase (`sb-*-auth-token` cookies) + AUTH_SECRET. Payments: Stripe (secret + webhook secret on worker). Analytics: GA4 via GTM. Build: `npm run build:worker` (next build + opennextjs-cloudflare). Deploy: wrangler via CI (`deploy.yml`: main→prod, dev→staging) or manual from this worktree. Env/secret **names** on prod worker: ADMIN_AUTHOR_SECRET, AUTH_SECRET, DEMO_KEY, GEMINI_API_KEY, GEN_NVIDIA_API_KEY, GUILD_TELEMETRY_SECRET, OPENROUTER_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY.

## Phase 1 results

### Navigation & layout
| Check | Result | Evidence |
|---|---|---|
| All top tabs load (NCLEX, CCRN, Study now, Dashboard, Pricing) | **PASS** | All 200; Dashboard anon → /auth/login redirect (correct auth gate) |
| **Theme persists across every tab click** (hard requirement) | **PASS** | Dark mode toggled, held on all 5 tab navigations (Playwright, `browser-audit.json`); no theme reset/FOUC observed |
| Logo renders (teal lowercase "c", no border artifacts) | **PASS** | Verified in screenshots desktop+mobile; favicon 200 |
| Parchment texture + aurora | **PASS** | `--c-bg` + orb markers present; visually confirmed in screenshots |
| Internal links (31 unique crawled from 6 pages) | **PASS** | 0 broken |
| Orphaned/404 probes | **PASS** | /account, /settings, /billing are 404 but never linked (no such routes in this build — see F8) |

### Core product
| Check | Result | Evidence |
|---|---|---|
| Question bank loads, quiz session starts (anon) | **PASS** | API returns 5/5 questions both exams; deep-link session renders NGN cloze item w/ chart tabs |
| Quiz flow start→answer→submit→review | **PARTIAL PASS** | Session + render + Submit UI confirmed (screenshot). Full scripted E2E needs type-aware automation (→ Phase 3 harness); cloze item blocked naive selector |
| NGN type rendering (each of 6 types) | **PENDING** | mcq/sata/matrix confirmed in API feed; per-type render matrix scheduled via harness deep-links |
| Rationales/citations display | **PASS (spot)** | Rationale panel present post-submit in prior manual sessions; scripted assert pending |
| Dashboard on empty/new account | **PASS (anon)** | Redirects to login; authed empty-state check pending |
| **Public question count truthful** | **FAIL → F1** | Homepage shows **6,015** = ALL rows; only **2,494** published/playable (D1). Count fix exists in git (88a940c) but is NOT in live build |
| Content mix | INFO | 2,494 published: includes 67 case studies (target 50+ met), 100% premium deep-rationale coverage maintained |

### Auth & payments
| Check | Result | Evidence |
|---|---|---|
| Signup/login pages render, 0 console errors | **PASS** | 200s, forms present |
| Signup→login→logout→reset E2E | **PENDING** | Requires throwaway account on prod (approved approach TBD) |
| Stripe checkout E2E test-mode | **BLOCKED (documented)** | Prod runs LIVE Stripe keys — test-mode E2E is impossible against prod without real charges. Requires staging + test keys, or a $0/coupon flow. Checkout-session endpoint + webhook secrets verified present |
| Auth gating of premium content | **PASS (spot)** | practice-exams API → 401 anon with loginUrl; premium lock copy renders |

### Technical health
| Check | Result | Evidence |
|---|---|---|
| Console errors on 8 key pages (desktop) | **PASS** | Zero real errors (GA/adblock noise excluded) |
| API shapes | **PASS** | quiz/start ✓, quiz/answer 400 on garbage ✓, health/ready 200 ✓ |
| Structured data | **PASS w/ gap** | EducationalOrganization, FAQPage(+Q&A), SoftwareApplication+Offer, WebSite/SearchAction present & well-formed. **No `Quiz` schema found** (brief expects it) → F6 |
| Canonicals / OG / robots / sitemap | **PASS** | Present on all sampled pages; robots disallows /dashboard; sitemap 200 (all sampled entries 200) |
| SSL + redirects | **PASS** | HSTS on; http→https 308; www→apex canonical |
| Security headers | **PASS w/ note** | HSTS, nosniff, X-Frame DENY, Referrer-Policy, Permissions-Policy. CSP is **report-only** in this build (enforcement exists in git, rolled off) |
| **Mobile 390px overflow** | **FAIL → F2** | `/quiz` scrollWidth 445 vs 390 (~55px horizontal pan; "Start studying" card clipped — screenshot `mobile390_quiz.png`). Other 4 pages clean |
| Lighthouse baselines | **PENDING** | Scheduled (lighthouse CLI in tests workspace) |

## Fix queue (Phase 2 — nothing fixed yet, per protocol)
| # | Severity | Finding | Root cause (known?) | Proposed smallest diff |
|---|---|---|---|---|
| F1 | 1 (truth/marketing) | Public count 6,015 vs 2,494 playable | YES — live build predates 88a940c publish-filter | Branch from `stable-baseline-2026-07-01`, cherry-pick `88a940c` (1 file), build, deploy, verify |
| F2 | 1 (mobile hard req) | /quiz horizontal overflow @390px | To diagnose (suspect: Start-studying card carousel leaking page-level overflow) | CSS containment on offending container only |
| F3 | 3 (content polish) | Cloze scaffold text generic/mismatched ("safest priority response" on a VTE-order item) | Cloze template wrapper | Template text fix or per-item scaffold |
| F4 | 3 (SEO polish) | Malformed `<title>` on /tools/nclex-countdown + /nclex-requirements/* (layout text leaked into title) | Metadata template interpolation | Fix metadata strings |
| F5 | 3 (brand) | "ChapAI vs UWorld/Archer" legacy branding on 2 compare pages | Pre-rebrand copy | Copy-only rename to Clarity |
| F6 | 4 (SEO gap) | No `Quiz` JSON-LD schema | Never present in this build | Add Quiz schema (Phase 4 approval) |
| F7 | 1 (protect) | `main` HEAD would re-ship rolled-off changes on next deploy | Rollback was runtime-only | Present re-anchor plan (revert commits on main vs. `stable` branch as deploy source) — **needs approval, blast radius > 3 files** |
| F8 | 4 (UX gap) | No /account or /billing surface found | Billing managed via Stripe portal? To verify authed | Locate/verify authed billing path; document |

## Phase 1 remaining
Authed E2E (signup/login/logout/reset, dashboard empty-state, billing surface), per-NGN-type render matrix, Lighthouse mobile baselines, Stripe checkout-session smoke (create-only, no charge). Then Phase 2 fixes in severity order, one commit each.
