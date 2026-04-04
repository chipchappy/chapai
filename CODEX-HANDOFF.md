# ChapAI — Codex Handoff Document
## What exists. What's next. How to continue.

> **Last updated by:** Claude (Sonnet 4.6) — 2026-03-26
> **Sprint day:** 2 (UI components + billing live)
> **Next agent to pick up:** Codex-Frontend (Day 3 tasks)

---

## WHAT HAS BEEN BUILT

### ✅ Scaffold complete
```
chapai/
├── apps/web/
│   ├── package.json              ← all deps, scripts defined
│   ├── wrangler.jsonc            ← Cloudflare config (IDs need filling)
│   ├── open-next.config.ts       ← @opennextjs/cloudflare config
│   ├── next.config.ts            ← Next.js 15 config
│   ├── tailwind.config.ts        ← full ChapAI design system
│   └── src/
│       ├── styles/globals.css    ← CSS variables + component classes
│       ├── lib/
│       │   ├── types.ts          ← ALL domain types (Question, Session, etc.)
│       │   ├── db.ts             ← Drizzle + Env bindings
│       │   ├── quiz-engine.ts    ← selectQuestions, createSession, recordAnswer
│       │   └── sm2.ts            ← Spaced repetition SM-2 algorithm
│       └── app/api/
│           ├── quiz/start/       ← POST: create session, return questions
│           ├── quiz/answer/      ← POST: record answer, return correct+rationale
│           ├── quiz/results/     ← GET:  session summary + category breakdown
│           ├── tutor/ask/        ← POST: streaming Claude Haiku tutor response
│           └── stripe/webhook/   ← POST: handle subscription events
├── packages/db/drizzle/
│   ├── schema.ts                 ← complete Drizzle ORM schema
│   └── migration-0001.sql        ← run this against D1 to init the DB
├── package.json                  ← turborepo root
└── turbo.json
```

### ✅ Design tokens (use these everywhere)
```
teal:       #2e7d8c  (primary — buttons, borders, accents)
terra:      #d97757  (secondary — CTAs, warm accents)
sage:       #5a8a5e  (success, correct answers)
bg:         #f8f7f3  (page background)
surface:    #ffffff  (card background)
dark:       #1a1f2e  (text)
muted:      #6b7280  (secondary text)
border:     #e5e3dc  (card borders)
error:      #c74b3f  (wrong answers)
radius:     12px
font-head:  DM Sans
font-body:  Source Serif 4
```

### ✅ Utility CSS classes (defined in globals.css)
- `.answer-option` — base answer card, with `.selected`, `.correct`, `.incorrect` modifiers
- `.btn-primary` — teal filled button
- `.btn-secondary` — outlined button
- `.btn-terra` — terra CTA button
- `.card` / `.card-hover` — standard card
- `.progress-bar` / `.progress-fill` — progress indicator
- `.rationale-box` — teal-tinted rationale container
- `.question-stem` — serif, large, for clinical vignette text

---

## WHAT TO BUILD NEXT (Day 2 — Codex-Frontend priority)

### TASK FE-001: QuizQuestion Component
**File:** `apps/web/src/components/quiz/QuizQuestion.tsx`

```
BUILD: QuizQuestion
SPEC: MCQ question display with stem, 4 options, submit, and rationale reveal.
  After submit: correct option turns sage green, selected wrong option turns red.
  Rationale accordion slides open below the options.
  "Ask AI Tutor" button appears in rationale area.
DESIGN: use .question-stem, .answer-option with modifier classes, .rationale-box
FRAMEWORK: Next.js 15 App Router + Tailwind + Framer Motion
CONSTRAINTS: "use client" required (interactive). Mobile-first. SSR-safe.
```

**Props interface** (from `src/lib/types.ts`):
```typescript
interface QuizQuestionProps {
  question: QuizQuestion;
  onAnswer: (selectedId: string, timeSpentMs: number) => Promise<{
    correct: boolean;
    correctAnswer: string;
    rationale: string;
    distractorRationales?: Record<string, string>;
  }>;
  onNext: () => void;
  onAskTutor: () => void;
  showTutor: boolean; // false if free tier
  questionNumber: number;
  totalQuestions: number;
}
```

**Acceptance criteria:**
- [ ] Renders `question.stem` in `.question-stem` (Source Serif 4)
- [ ] 4 answer option cards using `.answer-option` class
- [ ] Selected state: teal border + bg (`.answer-option.selected`)
- [ ] After submit: correct = `.answer-option.correct` (sage green), wrong selected = `.answer-option.incorrect` (red)
- [ ] Submit button disabled until an option is selected
- [ ] Rationale accordion (`.rationale-box`) animates open with Framer Motion
- [ ] "Ask AI Tutor" button in rationale area (disabled/locked if `!showTutor`)
- [ ] "Next Question →" button appears after answering
- [ ] Timer runs from mount to submit (feeds `onAnswer` with `timeSpentMs`)
- [ ] Mobile: full-width single column below 640px

---

### TASK FE-002: QuizProgress Component
**File:** `apps/web/src/components/quiz/QuizProgress.tsx`

```typescript
interface QuizProgressProps {
  current: number;     // 1-based
  total: number;
  correct: number;
  exam: "nclex" | "ccrn";
  category?: string;
}
```
- Progress bar (`.progress-bar` + `.progress-fill`) showing current/total
- "Question X of Y" counter (DM Sans, semibold)
- Live score badge: "N correct" in teal
- Exam/category breadcrumb at top

---

### TASK FE-003: QuizResults Component
**File:** `apps/web/src/components/quiz/QuizResults.tsx`

```typescript
interface QuizResultsProps {
  results: QuizResults; // from src/lib/types.ts
  onRetry: () => void;
  onReviewMissed: () => void;
  onNewQuiz: () => void;
  isAuthenticated: boolean;
}
```
- Big score circle: percentage in teal (e.g. "72%")
- Passed/needs work message based on score threshold (≥65% = pass)
- Category breakdown: horizontal bars for each category
- Weak categories highlighted in terra color with "Focus here" label
- 3 CTAs: "Review Missed" | "New Quiz" | "Upgrade" (if free + at limit)

---

### TASK BE-001: Quiz History + Spaced Repetition API
**Files:** `apps/web/src/app/api/quiz/history/route.ts` and `apps/web/src/app/api/quiz/review-queue/route.ts`

quiz/history GET:
- Returns last 10 sessions for the user
- Groups by exam type
- Returns overall stats (total questions, overall accuracy, streak)

quiz/review-queue GET:
- Queries `review_schedule` where `next_review_at <= now()`
- Returns up to 20 questions due for review, ordered by most overdue
- Requires auth (returns 401 if no session)

---

## HOW TO WIRE THE QUIZ FLOW

```
page.tsx (Server Component)
  └── <QuizPage /> (client:
        state: { session, currentIndex, answers }

        1. POST /api/quiz/start → { sessionId, questions }
        2. Render <QuizProgress /> + <QuizQuestion />
        3. On answer → POST /api/quiz/answer → { correct, rationale }
        4. On next → increment currentIndex
        5. On complete → GET /api/quiz/results?sessionId=... → <QuizResults />
```

---

## ENVIRONMENT VARIABLES NEEDED

All set via `npx wrangler secret put <NAME>`:

| Variable | Value | Where to get it |
|---|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` | Generate locally |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe CLI: `stripe listen` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Anthropic console |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC...` | @BotFather |

D1/KV/R2 IDs needed in `wrangler.jsonc`:
```bash
npx wrangler d1 create chapai-prod         → copy database_id
npx wrangler kv namespace create chapai-kv → copy id
npx wrangler r2 bucket create chapai-cache → no ID needed
```

---

## CONTENT PIPELINE STATUS

| Source | Format | Location | Status |
|---|---|---|---|
| CCRN app (static JS) | window.CCRN_QUESTION_BANK | `ccrn-agent/app/questions.js` | 125 Qs live |
| Draft batches (markdown) | See format below | `ccrn-agent/drafts/original-ccrn-*.md` | Sets 1-37 (many unintegrated) |
| NCLEX draft batches | markdown | `ccrn-agent/drafts/original-nclex-*.md` | Sets 1-11 |

**To import existing CCRN questions into D1:**
The `ccrn-agent/app/questions.js` file has 125 questions in `window.CCRN_QUESTION_BANK` format.
A conversion script is needed: parse JS array → transform to D1 schema → bulk INSERT.

**Script to write (BE task):**
`packages/content/scripts/import-ccrn-questions.ts`
- Load `questions.js` content
- Map fields: `id` → `id`, `topic` → `category`, `stem` → `stem`, etc.
- Set `exam = "ccrn"`, `type = "mcq"`
- Output SQL INSERT statements or use D1 REST API

---

## NEMOTRON INTEGRATION

Nemoclaw/Nemotron is running in WSL2 Ubuntu. Files it needs live in:
`C:\Users\Chapman\Desktop\ai\ccrn-agent\` (the ccrn-agent project)

**Question generation prompt for Nemotron** (add to `ccrn-agent/.openclaw/` or bot_ops):
```
You are a question generator for a commercial NCLEX/CCRN exam prep product.
Generate exactly 10 ORIGINAL draft questions per batch: 5 CCRN + 5 NCLEX.

Rules:
- Never copy copyrighted question banks. All content must be original.
- Use original stems, options, scenarios, rationales.
- Rationales must be detailed and educational.
- Output valid JSON only. No markdown. No preamble.
- Vary topic, setting, and structure across each batch.
- NCLEX items: emphasize clinical judgment and NGN-compatible formats.
- CCRN items: reflect adult critical care reasoning, not generic med-surg.

Output JSON array, each object:
{
  "id": "ccrn_cardio_101",
  "exam": "ccrn",
  "category": "cardiovascular",
  "subcategory": "hemodynamics",
  "difficulty": 3,
  "stem": "Clinical vignette (2-4 sentences).",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "answer": "B",
  "rationale": "Why B is correct (2-3 sentences). Why others wrong (1 sentence each).",
  "tags": ["MAP", "cardiogenic_shock"],
  "blueprint_pct": 13
}
```

**Output location:** `packages/content/questions/ccrn/` and `packages/content/questions/nclex/`
**QA process:** Claude reviews 10% sample before bulk import to D1.

---

## STRIPE SETUP (Day 5)

Create 4 products in Stripe dashboard, then update `src/lib/types.ts`:
```
PLUS Monthly  $29/mo  → add price ID to STRIPE_PRICES.plus_monthly
PLUS Annual   $290/yr → STRIPE_PRICES.plus_annual
PRO Monthly   $59/mo  → STRIPE_PRICES.pro_monthly
PRO Annual    $590/yr → STRIPE_PRICES.pro_annual
```

Metadata to add to each Stripe Price: `{ "tier": "plus" }` or `{ "tier": "pro" }`
This flows through webhook → DB update.

---

## DEPLOYMENT CHECKLIST (Day 11)

```bash
# 1. Install deps
npm install

# 2. Create Cloudflare resources
npx wrangler d1 create chapai-prod
npx wrangler kv namespace create chapai-kv
npx wrangler r2 bucket create chapai-cache

# 3. Update wrangler.jsonc with IDs from step 2

# 4. Run DB migration
npx wrangler d1 execute chapai-prod --file=packages/db/drizzle/migration-0001.sql

# 5. Set secrets
npx wrangler secret put AUTH_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN

# 6. Build + deploy
cd apps/web
npm run build:worker
npm run deploy

# 7. Add custom domain in Cloudflare dashboard
#    chapaisolutions.com → chapai-web worker
```

---

## QUICK REFERENCE: Agent Routing

| Task type | Send to | Context to provide |
|---|---|---|
| UI components | Codex-Frontend | FE-00X task spec from this doc |
| API routes | Codex-Backend | BE-00X task spec + schema.ts |
| Question generation | Codex-Content / Nemotron | Prompt template above |
| Architecture/QA | Claude-O | Full repo context |
| Status/deploy | Telegram Bot | /status /deploy commands |

---

## SPRINT PROGRESS

- [x] Day 1: Monorepo scaffold, Drizzle schema, design system, core types, quiz API routes, tutor API, Stripe webhook
- [ ] Day 2: QuizQuestion component, QuizProgress, QuizSidebar, quiz state machine
- [ ] Day 3: QuizResults, ExamSelector, StudyDashboard, quiz flow wiring
- [ ] Day 4: AiTutor panel component, streaming display
- [ ] Day 5: PricingPage, CheckoutButton, BillingPortal, Stripe products
- [ ] Day 6: Landing page (Hero + proof + pricing + FAQ)
- [ ] Day 7-10: NGN types, analytics, Telegram bot, content QA
- [ ] Day 11-14: Deploy, test, launch
