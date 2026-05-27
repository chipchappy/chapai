export type FrontpageAction = {
  href: string;
  label: string;
  description?: string;
};

export type FrontpageFeatureCard = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  hrefLabel: string;
};

export type FrontpageTone = "warm" | "cool" | "sage";

export type FrontpageFeatureGridProps = {
  label: string;
  title: string;
  body: string;
  cards: FrontpageFeatureCard[];
  tone?: FrontpageTone;
  className?: string;
};

export type FrontpageRouteCtaBandProps = {
  label: string;
  title: string;
  body: string;
  primaryAction: FrontpageAction;
  secondaryAction?: FrontpageAction;
  note?: string;
  tone?: FrontpageTone;
  className?: string;
};
