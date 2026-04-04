export type MarketingArtworkSpec = {
  src: string;
  alt: string;
  panelClassName: string;
  imageClassName: string;
  panelTone?: string;
};

export const marketingArtwork = {
  home: {
    src: "/assets/adobe-home-hero.png",
    alt: "Premium anatomical illustration for Clarity Clinical Prep",
    panelClassName: "aspect-[4/5] max-w-[30rem] bg-[#F4EFE6]",
    imageClassName: "scale-[1.0] mix-blend-multiply",
    panelTone: "#F4EFE6",
  },
  ccrn: {
    src: "/assets/adobe-ccrn-hero.jpg",
    alt: "Critical care anatomical illustration for CCRN prep",
    panelClassName: "aspect-[4/3] max-w-[32rem] bg-[#E5E9E3]",
    imageClassName: "scale-[1.0] object-cover",
    panelTone: "#E5E9E3",
  },
  nclex: {
    src: "/assets/adobe-nclex-hero.jpg",
    alt: "Clinical anatomical illustration for NCLEX prep",
    panelClassName: "aspect-[4/3] max-w-[32rem] bg-[#F5F1E8]",
    imageClassName: "scale-[1.0] object-cover",
    panelTone: "#F5F1E8",
  },
  support: {
    src: "/assets/adobe-quiz-hero.png",
    alt: "Editorial anatomical support plate",
    panelClassName: "aspect-[4/5] max-w-[28rem] bg-[#F5F1E8]",
    imageClassName: "scale-[1.0] mix-blend-multiply",
    panelTone: "#F5F1E8",
  },
} satisfies Record<string, MarketingArtworkSpec>;

export function getArtworkForExam(exam: "ccrn" | "nclex"): MarketingArtworkSpec {
  return exam === "ccrn" ? marketingArtwork.ccrn : marketingArtwork.nclex;
}

export function getArtworkForIntent(input: {
  examPill?: string;
  title: string;
  accentLabel?: string;
}): MarketingArtworkSpec {
  const haystack = `${input.examPill ?? ""} ${input.title} ${input.accentLabel ?? ""}`.toLowerCase();

  if (haystack.includes("ai tutor") || haystack.includes("study plan") || haystack.includes("compare")) {
    return marketingArtwork.support;
  }

  if (haystack.includes("nclex")) {
    return marketingArtwork.nclex;
  }

  if (haystack.includes("ccrn")) {
    return marketingArtwork.ccrn;
  }

  if (haystack.includes("home") || haystack.includes("sprint")) {
    return marketingArtwork.home;
  }

  return marketingArtwork.support;
}

export function getBackgroundForIntent(examPill?: string): string {
  const exam = (examPill ?? "").toLowerCase();
  if (exam.includes("nclex")) {
    return "#F5F1E8";
  }
  if (exam.includes("ccrn")) {
    return "#E5E9E3";
  }
  return "#F4EFE6";
}
