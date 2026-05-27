# UI Canon — Front-Page Design Source of Truth

> **For any agent (Hermes, Codex, Claude) editing the marketing UI: read this first.**
> The front-page aesthetic is **locked**. Do not redesign it. Build *on top of* the
> canonical components below. Reverting to older "globe", "reframed", "anatomy
> linework", or "brain illustration" designs is a regression and is not allowed.

---

## The aesthetic (do not change)

- **Background:** warm sand `--c-bg: #F7F1E6`, elevated `--c-bg-elevated: #FBF7EE`,
  tinted `--c-bg-tinted: #F0E9DB`. A faint **soft paper-fiber texture** overlays the
  sand (see `globals.css` → "CANONICAL UI — Soft paper-fiber texture"). Keep it.
- **Accents:** sage green (`--c-sage-deep` for primary buttons), gold (`--c-gold`).
- **Hero visual:** the **aurora orb** — a layered radial-gradient SVG
  (mint/seafoam → soft pink → rose → magenta → peach-yellow → bright teal core).
- **Logo:** the Clarity "C" brand mark appears in the header and footer.
- **Type:** serif display (`newsreader`) for headlines, `inter` for body.

## Canonical components (these are LIVE — edit these, don't replace them)

| Surface | Component | Notes |
|---|---|---|
| Home hero | `components/marketing/HeroCTA.tsx` (`heroArt="home"`) | aurora orb |
| NCLEX hero | `components/marketing/HeroCTA.tsx` (`heroArt="nclex"`) | aurora orb |
| CCRN hero | `components/marketing/PremiumArtHero.tsx` | same aurora orb components |
| Aurora orb SVGs | `components/marketing/heroAnatomy/{Home,Nclex,Ccrn}AnatomyArt.tsx` | viewBox `0 0 1020 1160`, cx/cy `510/520` |
| Testing-env demo | `components/marketing/frontpage/CompetitiveStudySystem.tsx` | responsive Pearson-style sim |
| Header | `components/marketing/BrandHeader.tsx` | sticky, `min(1440px)` inner |
| Footer | `components/marketing/FooterMinimal.tsx` | |
| CTAs | `components/marketing/CtaButtons.tsx` | |
| Pricing | `components/marketing/PricingCards.tsx` | |
| Daily-question signup | `components/marketing/DailyQuestionSignup.tsx` | **ready to drop onto any page** |

## FORBIDDEN — do not reintroduce

These are removed/dead. Do **not** recreate them or swap them back in:

- Any `.hero-globe-*`, `.hero-shell-reframed`, `.hero-grid-reframed`,
  `.hero-premium-*`, `.hero-medical-*`, `.hero-anatomy-*` (linework) CSS.
- Deleted components: `BackgroundFigure`, `AnatomyFocalCard`,
  `HomepageBrainIllustration`, `NclexBrainIllustration`.
- The spinning/breathing "globe" hero visual. The hero visual is the **aurora orb** only.

## Blog / SEO posts (built 2026-05-21)

The blog is live at `/blog` and `/blog/[slug]`, with posts driving organic traffic.
**To add a post (hermes/codex/any agent):** append one object to `blogPosts` in
`src/content/blog/posts.ts`. The index, post page, and sitemap update automatically.

```ts
// src/content/blog/posts.ts
{
  slug: "your-url-slug",
  title: "Post title",
  description: "One-sentence meta description for SEO.",
  date: "2026-05-22",            // ISO; newest sorts first
  author: "Clarity Clinical Prep",
  exam: "nclex",                  // "nclex" | "ccrn" | "both"
  readingTime: "5 min read",
  tags: ["NCLEX", "Study plan"],
  body: [
    { type: "p",  text: "Opening paragraph..." },
    { type: "h2", text: "A section heading" },
    { type: "ul", items: ["point one", "point two"] },
  ],
}
```

Rules: content is bundled at build time (no runtime fs — safe on Workers). Keep
`body` as plain-text blocks (no raw HTML). Each post auto-gets canonical URL,
OpenGraph tags, BlogPosting JSON-LD, and a sitemap entry. Linked from the footer.

## How to extend safely (examples)

- **Add the free daily-question email signup to the front page:**
  import the existing component and drop it into `app/page.tsx` (and/or
  `app/nclex/page.tsx`) between sections:
  ```tsx
  import DailyQuestionSignup from "@/components/marketing/DailyQuestionSignup";
  // ...inside <main>, e.g. after <CompetitiveStudySystem .../>:
  <DailyQuestionSignup source="home-front-page" exam="both" />
  ```
  Required prop: `source` (string, for analytics). Optional: `exam` ("ccrn" |
  "nclex" | "both"), `title`, `body`. Posts to `/api/daily-question-signup`
  (endpoint already live).
- **Change the practice-question example** to better match the live testing env:
  edit `CompetitiveStudySystem.tsx` (the simulator chrome + NGN previews live there).
  Keep the responsive breakpoints intact.
- **New marketing section:** add a new component under `components/marketing/`
  and compose it in the relevant `app/*/page.tsx`. Use `--c-*` color variables and
  the existing rounded-card / shadow patterns; never hardcode off-palette colors.

## Build & deploy (Windows)

```bash
cd apps/web
npx next build          # produces .next (must contain routes-manifest.json)
npm run build:worker    # bundles .open-next/worker.js
npx wrangler deploy --keep-vars
```
### Bundle-size guardrails (worker must stay < 3 MB gzipped)

**Never `import` large data files into the app module graph.** They get baked into
the worker script and break deploys ("exceeded size limits" / 413). Confirmed offenders:

- ❌ `import nclexLiveStatic from ".../reviewed-curated-live.unique.json"` in
  `lib/content-bank.ts` — bundled the **27 MB** question bank, blew the worker 4×.
  `content-bank.ts` already loads questions correctly at runtime via `fs` reads;
  do **not** add static JSON imports as a "fallback".
- ❌ `import ... from "unified-guild-state-snapshot.ts"` when that file is large —
  a 165 MB regeneration once produced a 377 MB bundle.

If a route needs the full question bank in the worker, serve it from R2/D1/KV at
runtime — never via a static `import`. Healthy baseline: `handler.mjs` ≈ 7–8 MB,
upload gzip ≈ 2.2 MB.
