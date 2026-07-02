# IMPROVEMENT_PROPOSALS.md — Phase 4 (propose-first; nothing here ships without explicit approval)
Benchmarked 2026-07-01 against **anthropic.com** (design inspiration), **Archer Review**, **NCLEX Bootcamp** (fetched + analyzed), and UWorld (domain knowledge). Constraint honored throughout: **refine the existing layout/brand — never replace it.** Every proposal states what, why (competitor gap or conversion metric), effort (S/M/L), risk, and which smoke tests cover it.

## What the benchmarks actually do well (observed)
- **Anthropic:** typography carries the design (one serif display + quiet sans body, strong weight contrast); whitespace used as a design element with a consistent section rhythm; near-monochrome palette with ONE accent; restrained, action-verb CTAs; editorial metadata ("Date/Category") that signals credibility; repeated card patterns = calm consistency. *We already share this DNA (Yeseva display + sand palette + generous space) — the gap is consistency, not direction.*
- **Archer:** trust math up front ("98.98% pass rate", "219,000+ students in 2025"), authority faces ("for nurses, by nurses"), free-trial-first funnel, personalized "which course fits you?" quiz.
- **Bootcamp:** the clearest headline in the category ("Pass the NCLEX-RN®. Guaranteed."), a concrete refund-guarantee mechanic, testimonial carousels with *specific outcomes* ("passed in 85 questions"), expert-team faces, FAQ accordions, ONE repeated CTA label at every scroll depth, product screenshots.
- **UWorld:** rationale-quality reputation + performance dashboards with **peer-percentile comparison** (their single stickiest retention feature).

## P0 — conversion + truth (small, low-risk, no layout change)
| # | Proposal | Why | Effort | Risk | Smoke coverage |
|---|---|---|---|---|---|
| P0-1 | **One repeated primary CTA** ("Start free") closing every homepage/pricing section, identical label/style (Bootcamp pattern). Today the CTA appears in hero + pricing only. | More conversion opportunities without new design language | S | Low | pages-load-clean, visual |
| P0-2 | **Concrete, truthful trust strip**: "2,494+ questions (growing daily) · 67 NGN case studies · 5 CAT readiness exams · cancel anytime". No invented pass rates — we don't have the data yet (Archer/Bootcamp lead with theirs; ours must stay honest until we can measure). | Trust math is the category's #1 signal | S | Low | brand fingerprint, visual |
| P0-3 | **FAQ accordion** on /pricing (uses existing FAQPage content/schema) answering the 5 buying objections incl. refund policy. | Bootcamp's objection-handling pattern; we already have the content | S | Low | pages-load-clean |
| P0-4 | **Guarantee framing decision**: define a real, affordable guarantee (e.g. "score 'On Track' on all 5 readiness exams and fail → 3 free months"). Bootcamp's guarantee is their headline. Needs your business sign-off, then one pricing-page block. | Category-standard trust mechanic we currently lack | S (copy) | Low (needs policy decision) | pages-load-clean |

## P1 — Anthropic-style polish (token-level refinement of the existing aesthetic)
| # | Proposal | Why | Effort | Risk |
|---|---|---|---|---|
| P1-1 | **Spacing-scale normalization**: audit section paddings to one rhythm (e.g. 96/64/40px tokens). Anthropic's calm comes from rhythm consistency, not more whitespace. | Premium feel without changing layout | M | Low (CSS tokens only) |
| P1-2 | **Label discipline**: collapse our 3+ uppercase-tracking label styles (eyebrow/kicker/section-label) into one. | Typographic consistency = perceived quality | S | Low |
| P1-3 | **Editorial metadata stamps** ("Updated July 2026") on lab-values, glossary, state pages. | Anthropic-style credibility + SEO freshness | S | Low |
| P1-4 | **Real-outcome testimonials pipeline**: post-pass email asking "how many questions did you pass in?" → testimonial wall with concrete outcomes (Bootcamp pattern). Content-gated: only real quotes. | Social proof with specificity converts | M | Low |
| P1-5 | Fix queue leftovers as polish commits: malformed `<title>` on countdown/state templates (F4), "ChapAI" → "Clarity" on 2 compare pages (F5), generic cloze scaffold line (F3), `Quiz` JSON-LD (F6). | Brand/SEO hygiene | S each | Low |
| P1-6 | **Hero product proof**: swap the hero art panel's content for a styled live-question card (reuses existing card styles/anatomy space). Anthropic stays typographic; Bootcamp shows product — for a $9.99 challenger, showing the actual product wins. | "Show, don't tell" above the fold | M | Med (hero = visual-baseline update + approval) |

## P1 — re-land the queued features (one at a time, through the gate)
| # | Feature (kept on `main`) | Pre-conditions before re-landing |
|---|---|---|
| R1 | **Adaptive endless "Unlimited" quiz** (8ffb07b) | Fix first: anon/demo sessions ignore `excludeIds`, so endless mode can strand a user on the last question when append returns nothing new → add a finish fallback + smoke case; then cherry-pick to `stable`, deploy via gate |
| R2 | **Enforced CSP** (from 666a626) | Add smoke assertions that GA + Stripe scripts load post-enforcement; then re-land |
| R3 | **Kaplan compare page** (666a626) | Re-land with P1-5 branding fix bundled into compare-pages scope |
| R4 | **QOTD daily-question email** (planned, never built) | Net-new: Resend integration + cron route + subscriber query; L effort; build behind the gate |
| R5 | **Premium case-study/question growth** (running) | No deploy needed — D1-only, zero UI risk; continues unattended |

## P2 — bigger UX bets (UWorld/Archer patterns; each needs its own plan + approval)
| # | Proposal | Why | Effort | Risk |
|---|---|---|---|---|
| P2-1 | **Peer-percentile on dashboard** ("You're ahead of 68% of students this week") | UWorld's stickiest retention feature; we have the answer data | L | Med |
| P2-2 | **Readiness verdict banner** ("On track" / "Borderline" from the 5 CAT exams) | Archer's core hook (their pass-rate claim is gated on readiness scores) | M | Med |
| P2-3 | **Personalized start quiz** (3 questions → recommended plan/track), Archer's "Let's Go" pattern | Reduces choice paralysis on /quiz catalog | M | Low |
| P2-4 | **Mobile ergonomics pass**: sticky Submit in thumb zone at 390px, ≥44px option targets, rationale typography audit on small screens | 80% of traffic is phones | M | Med (touches quiz pane; heavy smoke + visual coverage exists) |
| P2-5 | **Stripe Payment Element + Apple/Google Pay** | Mobile checkout friction is the likeliest drop-off; category standard | M-L | Med (payments — staging first) |
| P2-6 | **/account page** with Stripe customer-portal link (audit F8: no billing surface found) | Subscribers currently lack self-serve billing | M | Low |
| P2-7 | **Micro-interaction pass**: skeleton loaders, answer-select feedback, progress-ring animation on dashboard | The "premium app" feel UWorld/Archer have | M | Low-Med |

## Recommended approval order
1. **P0-1 + P0-2 + P0-3** (one afternoon, pure conversion, near-zero risk)
2. **P1-5 hygiene batch** (titles/branding/schema — trivially low-risk copy commits, bundleable per the brief)
3. **R1 adaptive quiz** (your flagship differentiator; fix the anon edge, then gate-deploy)
4. **P0-4 guarantee decision** (your call on mechanics) + **P2-2 readiness verdict** (pairs with it)
5. **P2-5 payments** once a staging worker with Stripe test keys exists.
