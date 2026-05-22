import type { FrontpageTone } from "./frontpage/frontpage-types";

export type MarketingRouteKey = "home" | "nclex" | "ccrn";
export type HeroAnatomyArtKey = "home" | "nclex" | "ccrn";

export type MarketingAction = {
  href: string;
  label: string;
};

export type MarketingProofPoint = {
  label: string;
  text: string;
};

export type MarketingFocusCard = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  hrefLabel: string;
};

export type MarketingRouteTheme = {
  key: MarketingRouteKey;
  tone: FrontpageTone;
  heroSignal: "rings" | "anatomy";
  heroArt: HeroAnatomyArtKey;
  heroLabel: string;
  heroNote: string;
  title: string;
  body: string;
  primaryAction: MarketingAction;
  secondaryAction: MarketingAction;
  proofPoints: MarketingProofPoint[];
  sectionIntro: {
    label: string;
    title: string;
    body: string;
  };
  focusCards: MarketingFocusCard[];
  routeBand: {
    label: string;
    title: string;
    body: string;
    note?: string;
    primaryAction: MarketingAction;
    secondaryAction?: MarketingAction;
  };
  background: {
    base: string;
    section: string;
    sectionAlt: string;
    accent: string;
    border: string;
    statSurface: string;
  };
};

export const marketingThemes = {
  home: {
    key: "home",
    tone: "warm",
    heroSignal: "anatomy",
    heroArt: "home",
    heroLabel: "Clarity",
    heroNote: "Open the demo, see the study shell, then decide whether to unlock NCLEX, CCRN, or both.",
    title: "premium prep for nclex and ccrn.",
    body:
      "Clarity keeps the prompt, chart review, rationale, diagrams, citations, and AI tutor in one cleaner testing workflow with simpler pricing than the major prep brands.",
    primaryAction: {
      href: "/quiz",
      label: "Open practice",
    },
    secondaryAction: {
      href: "/upgrade",
      label: "See plans",
    },
    proofPoints: [
      { label: "One platform", text: "NCLEX and CCRN paths, aligned in one premium study surface." },
      { label: "AI tutor", text: "Bedside-style rationale and follow-up teaching after every answer." },
      { label: "Launch ready", text: "Quiz, exams, chart reading, NGN, and case flow built into one product." },
    ],
    sectionIntro: {
      label: "Why it feels different",
      title: "Built to prove the study product quickly, not trap buyers in vague marketing.",
      body:
        "The pages point straight to what matters: live question volume, simple pricing, tutor-backed review, and a calmer practice surface that feels worth paying for.",
    },
    focusCards: [
      {
        eyebrow: "Premium practice",
        title: "Standard questions, charts, NGN, and case-based review in one path.",
        body: "Move from quick reps to deeper clinical reasoning without leaving the product.",
        href: "/quiz",
        hrefLabel: "Open practice",
      },
      {
        eyebrow: "NCLEX path",
        title: "Prioritization, delegation, safety, and next-step logic for bedside readiness.",
        body: "A focused NCLEX route built for calmer review and stronger decision making.",
        href: "/nclex",
        hrefLabel: "Explore NCLEX",
      },
      {
        eyebrow: "CCRN path",
        title: "Hemodynamics, shock, vents, rhythms, and pattern recognition for ICU nurses.",
        body: "Critical care scenarios written to feel clinically serious and worth paying for.",
        href: "/ccrn",
        hrefLabel: "Explore CCRN",
      },
    ],
    routeBand: {
      label: "Start with the product",
      title: "Try the product first, then choose the plan that fits your week.",
      body:
        "Open live practice, see the rationale quality and tutor flow, then move into a $4.99 24-hour pass, a $9.99 full single-track plan, or the $15.99 Dual Premium plan when you are ready.",
      note: "Launch plans: $4.99 24-hour track access, $9.99 full single-track plans, $15.99 Dual Premium",
      primaryAction: {
        href: "/quiz",
        label: "Open practice center",
      },
      secondaryAction: {
        href: "/nclex",
        label: "Open NCLEX",
      },
    },
    background: {
      base: "#faf7f2",
      section: "#fdfbf8",
      sectionAlt: "#f5f1eb",
      accent: "#232a2d",
      border: "rgba(35, 42, 45, 0.1)",
      statSurface: "rgba(255, 255, 255, 0.82)",
    },
  },
  ccrn: {
    key: "ccrn",
    tone: "sage",
    heroSignal: "anatomy",
    heroArt: "ccrn",
    heroLabel: "Clarity CCRN",
    heroNote: "Preview the cardiac workstation, the bedside flow, and the chart-driven review before you buy.",
    title: "critical-care prep with a calmer bedside workflow.",
    body:
      "ClarityCCRN gives ICU nurses live bedside review for hemodynamics, vents, shock states, and simulation-ready practice with a more controlled chart-and-rationale workflow.",
    primaryAction: {
      href: "/quiz?exam=ccrn&mode=standard",
      label: "Open practice",
    },
    secondaryAction: {
      href: "/upgrade#ccrn",
      label: "See plans",
    },
    proofPoints: [
      { label: "Hemodynamics", text: "Shock, preload, afterload, cardiac output, and trend-based decision making." },
      { label: "Case realism", text: "Labs, vitals, deterioration patterns, and bedside pacing that feel serious." },
      { label: "Timed reps", text: "Move directly from marketing into live CCRN practice and exam simulation." },
    ],
    sectionIntro: {
      label: "Critical-care study flow",
      title: "CCRN prep with bedside reasoning, cited rationales, and chart-driven review.",
      body:
        "From hemodynamics to respiratory failure, the route shows what buyers actually get: live ICU questions, clearer answer review, and a direct path from a short pass into monthly access.",
    },
    focusCards: [
      {
        eyebrow: "Hemodynamics",
        title: "Study the numbers, the trend, and the intervention together.",
        body: "Questions and rationales are shaped to teach what the monitor, line, and patient are doing at the same time.",
        href: "/quiz?exam=ccrn&mode=chart",
        hrefLabel: "Open chart mode",
      },
      {
        eyebrow: "Bedside reasoning",
        title: "Work through respiratory, neuro, cardiac, and endocrine deterioration with context.",
        body: "The question surface gives dense material room to breathe, so the data reads clearly.",
        href: "/quiz?exam=ccrn&mode=case-study",
        hrefLabel: "Try a case study",
      },
      {
        eyebrow: "Simulation",
        title: "Full CCRN practice exams with the same premium interface and review flow.",
        body: "Timed exams, rationale review, and stronger continuity from front page to product.",
        href: "/quiz?exam=ccrn&mode=practice-exam",
        hrefLabel: "See practice exams",
      },
    ],
    routeBand: {
      label: "CCRN route to product",
      title: "Preview the ICU qbank, then choose the pass that matches your week.",
      body:
        "Test live CCRN questions, chart review, and exam flow first. Upgrade into the $4.99 CCRN 24-hour pass, the $9.99 CCRN Base plan, or the $15.99 Dual Premium plan for tutor and all 5 practice exams.",
      note: "Current CCRN path: live bank, chart mode, case mode, and 2 CCRN simulations",
      primaryAction: {
        href: "/quiz?exam=ccrn&mode=standard",
        label: "Test the CCRN route",
      },
      secondaryAction: {
        href: "/quiz?exam=ccrn&mode=case-study",
        label: "Preview case mode",
      },
    },
    background: {
      base: "#faf7f2",
      section: "#fdfbf8",
      sectionAlt: "#f5f1eb",
      accent: "#232a2d",
      border: "rgba(35, 42, 45, 0.1)",
      statSurface: "rgba(255, 255, 255, 0.82)",
    },
  },
  nclex: {
    key: "nclex",
    tone: "cool",
    heroSignal: "anatomy",
    heroArt: "nclex",
    heroLabel: "Clarity NCLEX",
    heroNote: "Updated for the 2026 NCLEX-RN test plan with realistic NGN case-study practice.",
    title: "pass the nclex-rn with realistic ngn practice.",
    body:
      "ClarityNCLEX puts six-item unfolding case studies, vitals, orders, matrix grids, cloze prompts, cited rationales, and AI review into one calmer test-day workflow.",
    primaryAction: {
      href: "/demo-access?next=%2Fquiz%3Fexam%3Dnclex%26mode%3Dcase-study",
      label: "Start practicing free",
    },
    secondaryAction: {
      href: "/upgrade#nclex",
      label: "See NCLEX plans",
    },
    proofPoints: [
      { label: "Reviewed unique items", text: "Learner-facing NCLEX counts follow the canonical unique reviewed bank." },
      { label: "Cited rationales", text: "Short rationales open into deeper explanation with source support." },
      { label: "Tutor on Dual Premium", text: "AI coaching sits on top of the same reviewed question object buyers study." },
    ],
    sectionIntro: {
      label: "NCLEX product proof",
      title: "Show the bank, the rationale quality, and the tutor flow clearly.",
      body:
        "The NCLEX route should prove pricing, reviewed live volume, question quality, and cited review before it asks a buyer to subscribe.",
    },
    focusCards: [
      {
        eyebrow: "Launch pricing",
        title: "Start with the $4.99 NCLEX 24-hour pass, then move into the $9.99 NCLEX Base plan if you want the full bank.",
        body: "The page should make the cheapest real path obvious before it asks for a bigger subscription decision.",
        href: "/quiz?exam=nclex&mode=case-study",
        hrefLabel: "Open NGN case study",
      },
      {
        eyebrow: "Reviewed live bank",
        title: "Show the current unique reviewed count, not an inflated raw total.",
        body: "Public bank size, tutor context, and practice availability should all come from the same learner-facing source.",
        href: "/quiz?exam=nclex&mode=standard",
        hrefLabel: "See reviewed items",
      },
      {
        eyebrow: "Tutor + rationale",
        title: "Preview the short rationale, deeper expansion, and citations buyers actually get.",
        body: "The proof surface should show one calm question flow from answer choice to cited explanation and tutor follow-up.",
        href: "/quiz?exam=nclex&mode=practice-exam",
        hrefLabel: "Preview the study flow",
      },
    ],
    routeBand: {
      label: "NCLEX route to product",
      title: "See the reviewed qbank first, then choose the right plan.",
      body:
        "Open live NCLEX practice, preview cited review quality, then step into the $4.99 NCLEX 24-hour pass, the $9.99 NCLEX Base plan, or the $15.99 Dual Premium plan when you want more depth.",
      note: "Current NCLEX path: reviewed unique live items, cited rationales, and tutor support on Dual Premium",
      primaryAction: {
        href: "/quiz?exam=nclex&mode=case-study",
        label: "Test the NCLEX route",
      },
      secondaryAction: {
        href: "/quiz?exam=nclex&mode=ngn",
        label: "Preview NGN mode",
      },
    },
    background: {
      base: "#faf7f2",
      section: "#fdfbf8",
      sectionAlt: "#f5f1eb",
      accent: "#232a2d",
      border: "rgba(35, 42, 45, 0.1)",
      statSurface: "rgba(255, 255, 255, 0.82)",
    },
  },
} satisfies Record<MarketingRouteKey, MarketingRouteTheme>;

export function getBackgroundForIntent(examPill?: string): string {
  const exam = (examPill ?? "").toLowerCase();
  if (exam.includes("nclex")) {
    return marketingThemes.nclex.background.base;
  }
  if (exam.includes("ccrn")) {
    return marketingThemes.ccrn.background.base;
  }
  return marketingThemes.home.background.base;
}

export function getMarketingTheme(route: MarketingRouteKey): MarketingRouteTheme {
  return marketingThemes[route];
}
