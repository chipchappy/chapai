# Clarity NCLEX — Competitor Analysis & Product Roadmap
Date: 2026-07-05 · Scope: Archer, UWorld, NCLEX Bootcamp, Kaplan → what to match/exceed in self-study.

## Executive summary
Clarity's price ($9.99–15.99/mo vs. $200–500+ competitor packages) and its NGN-first
reviewed bank are the wedge. The gap versus the leaders is **not content depth** — it's
**analytics believability, exam-mode realism, and remediation loop tightness**. This doc
maps each competitor's real strengths to concrete, self-study-only builds we can ship on
our stack (Next.js + D1 + Gemini) without live tutors, educator videos, or LMS integration.

---

## Per-competitor strengths (observed)

### UWorld — the analytics & rationale gold standard
- **Peer-percentile everywhere.** Every metric is framed against the cohort ("you're in the
  62nd percentile"). This is their stickiest retention mechanic.
- **Rationale quality**: illustrated, "why each distractor is wrong," clinical images.
- **Custom test builder**: subject × system × difficulty × "unused/incorrect/marked" filters.
- **Performance dashboard**: by subject, by system, over time, with a running average line.
- UX: fast, dense, exam-faithful test interface; a "notebook" for saved rationales.

### Archer (Nurse.com) — the readiness/probability play
- **Readiness Assessments** that output a **pass-probability band** ("High/Borderline/Low"),
  gated on completing full-length forms. Their pass-rate marketing hangs on this.
- Cheap relative to UWorld; "for nurses, by nurses" trust framing.
- Webinars + rapid-review content (out of scope for us — that's live/video).

### NCLEX Bootcamp — the UX & guarantee leader
- **Cleanest onboarding** in the category; the clearest headline ("Pass. Guaranteed.").
- **Daily study calendar / "readiness" gauge** that tells you what to do *today*.
- Concrete refund guarantee, testimonial outcomes with question counts.
- Gamified streaks and progress rings.

### Kaplan — structure & decision-tree pedagogy
- **Decision Tree** test-taking framework taught explicitly and reinforced in rationales.
- Big fixed-length CAT-style readiness exams; heavy diagnostic → prescriptive plan.
- Channel/video content (out of scope) but the **diagnostic → study plan** flow is copyable.

---

## Where Clarity already matches or leads
| Capability | Status |
|---|---|
| NGN item types (SATA, matrix, bow-tie, ordering, case studies) | ✅ Live, first-class |
| Detailed rationales + citations | ✅ 100% premium-deep coverage |
| 5 readiness/CAT exams | ✅ Live (now 1 free + 4 paid) |
| Adaptive endless practice (CAT-style weak-area weighting) | ✅ Live |
| Peer percentile | ✅ Shipped (7-day accuracy vs cohort, honest gates) |
| Readiness verdict + pass-likelihood | ✅ Shipped (On Track / Borderline / At risk vs 65% line) |
| AI tutor on every question | ✅ Live (Gemini) — **exceeds** Archer/Bootcamp (they have none) |
| Gamified dashboard (rings, milestones, streak) | ✅ Shipped |
| Price | ✅ ~10% of a UWorld/Kaplan package |

**We already out-feature Archer and Bootcamp on the AI tutor and match UWorld's percentile
+ Archer's readiness verdict.** The remaining deltas are polish and depth, below.

---

## Prioritized recommendations (self-study only, our stack)

### P0 — believability of what we already ship (small)
1. **Subject/system breakdown on the dashboard** (UWorld's core view): per-category accuracy
   over time, not just current. We store every answer — this is a query + a small chart.
2. **Custom test builder** (UWorld's stickiest power-user tool): let paid users filter a session
   by category × difficulty × "incorrect/marked/unused." Our `selectQuestions` already supports
   category/type; add difficulty + a "wrong-only/marked-only/unused-only" source filter.
3. **Rationale notebook / bookmarks**: persist "saved rationales" per user (drug-card bookmarks
   already exist as a pattern) → a review surface. Retention + "practice like you test."

### P1 — remediation loop (medium)
4. **Prescriptive study plan from a readiness exam** (Kaplan's diagnostic→plan): after a readiness
   exam, output "spend the next N days on X, Y, Z" tied to the weak lanes we already compute.
   Pairs with the existing readiness verdict + AI evaluation.
5. **"Why each distractor is wrong" in-line** (UWorld standard): we store distractor rationales;
   surface all of them in the review pane, not just the correct-answer rationale.
6. **Test-day simulation mode**: strict timer, no immediate feedback, exam-length, results at end
   (vs. tutor mode with instant rationale). We have timed practice exams; formalize the two modes
   ("Tutor mode" vs "Exam mode") like UWorld — this is the heart of "practice like you test."

### P2 — depth (larger, later)
7. **Illustrated rationales** for high-yield topics (UWorld's moat) — content effort, not code.
8. **Confidence tracking**: capture answer confidence, surface "confidently wrong" items — a
   differentiator none of the four do well.

### Explicitly out of scope (per your direction)
Live tutors, educator-linked videos, webinars, large LMS/institutional integrations.

---

## Product positioning — "practice like you test"
Lead every surface with exam realism, not quiz-app framing:
- **Two clearly-named modes**: *Exam mode* (timed, no feedback, results at end) and *Tutor mode*
  (instant rationale + AI follow-up). This single change most credibly delivers the promise.
- Keep the **NCLEX-style runner** (separate from the marketing chrome) — already done.
- Frame analytics as **readiness**, not vanity metrics: everything ladders to "are you ready?"
- The **AI tutor is our unique wedge** — position it as a built-in coach that Archer/UWorld/
  Bootcamp/Kaplan cannot match at any price, integrated into the rationale review (see below).

---

## Recommended build order
1. P0-2 custom test builder + P0-1 subject breakdown (turns our data into UWorld-grade analytics)
2. P1-6 Exam vs Tutor mode split (delivers "practice like you test")
3. P1-4 prescriptive plan + P1-5 distractor rationales (closes the remediation loop)
4. P0-3 rationale notebook (retention)
Each ships one-at-a-time through the deploy gate, same discipline as the stability work.
