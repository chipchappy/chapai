import Link from "next/link";
import { CcrnAnatomyArt, HomeAnatomyArt, NclexAnatomyArt } from "./heroAnatomy";
import type { MarketingRouteTheme } from "./marketingArtwork";

type HeroStat = {
  label: string;
  value: string;
  detail: string;
};

type PremiumArtHeroProps = {
  theme: MarketingRouteTheme;
  statItems?: HeroStat[];
};

function renderAction(action: MarketingRouteTheme["primaryAction"], isPrimary: boolean) {
  const baseClassName =
    "inline-flex items-center justify-center rounded-[18px] px-5 py-3 font-sans text-sm font-semibold tracking-[0.01em] transition duration-200 md:px-6";

  if (isPrimary) {
    return (
      <Link
        href={action.href}
        className={`${baseClassName} bg-[#1f2629] text-white shadow-[0_20px_36px_rgba(31,38,41,0.12)] hover:bg-[#2f393d]`.trim()}
      >
        {action.label}
      </Link>
    );
  }

  return (
    <Link
      href={action.href}
      className={`${baseClassName} border border-[rgba(24,34,36,0.12)] bg-[rgba(255,255,255,0.76)] text-[var(--color-dark)] hover:border-[rgba(24,34,36,0.22)] hover:bg-white`.trim()}
    >
      {action.label}
    </Link>
  );
}

function renderHeroArt(heroArt: MarketingRouteTheme["heroArt"]) {
  const className = "premium-hero-anatomy-svg";

  if (heroArt === "nclex") {
    return <NclexAnatomyArt className={className} />;
  }

  if (heroArt === "ccrn") {
    return <CcrnAnatomyArt className={className} />;
  }

  return <HomeAnatomyArt className={className} />;
}

export default function PremiumArtHero({ theme, statItems = [] }: PremiumArtHeroProps) {
  return (
    <section
      className="premium-hero-shell relative overflow-hidden border-b border-[rgba(74,85,89,0.08)] px-4 py-8 md:px-6 md:py-10 lg:px-8 lg:py-14"
      data-route={theme.key}
      style={
        theme.key === "nclex"
          ? {
              backgroundImage:
                "linear-gradient(90deg, rgba(15, 23, 25, 0.98) 0%, rgba(15, 23, 25, 0.92) 42%, rgba(15, 23, 25, 0.68) 66%, rgba(15, 23, 25, 0.78) 100%), url('/assets/adobe-nclex-hero.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center right",
            }
          : {
              background: `linear-gradient(180deg, ${theme.background.base}, ${theme.background.section})`,
            }
      }
    >
      <div className="premium-hero-atmosphere">
        <div className="premium-hero-atmosphere-grid" />
        <div className="premium-hero-atmosphere-wash premium-hero-atmosphere-wash-a" />
        <div className="premium-hero-atmosphere-wash premium-hero-atmosphere-wash-b" />
      </div>

      <div className="relative mx-auto max-w-[1180px]">
        <div className="premium-hero-layout">
          <div className="premium-hero-copy-panel">
            <div className="premium-hero-meta-row">
              <span className="premium-hero-dot" />
              <span className="premium-hero-brand">{theme.heroLabel}</span>
              <span className="premium-hero-divider" />
              <span className="premium-hero-note">{theme.heroNote}</span>
            </div>

            <p className="premium-hero-eyebrow">
              {theme.key === "home"
                ? "premium nclex and ccrn prep"
                : theme.key === "nclex"
                  ? "reviewed nclex qbank with tutor-ready follow-up"
                  : "critical-care review for bedside nurses"}
            </p>

            <h1 className="premium-hero-title">{theme.title}</h1>
            <p className="premium-hero-body">{theme.body}</p>

            {/* ── Stat chips ABOVE the CTAs so they land in the first viewport ── */}
            {statItems.length ? (
              <div className="premium-hero-chip-strip">
                {statItems.map((item) => (
                  <div key={item.label} className="premium-hero-chip-card">
                    <span className="premium-hero-chip-label">{item.label}</span>
                    <strong className="premium-hero-chip-value">{item.value}</strong>
                    <p className="premium-hero-chip-detail">{item.detail}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="premium-hero-actions">
              {renderAction(theme.primaryAction, true)}
              {renderAction(theme.secondaryAction, false)}
            </div>

            {theme.key === "nclex" ? (
              <div className="premium-hero-nclex-proof">
                <span>2026 test plan</span>
                <strong>Six-item NGN case studies, test-day pacing, and rationale review in the product.</strong>
              </div>
            ) : null}
          </div>
          <div className="premium-hero-art-panel" aria-hidden="true">
            <div className="premium-hero-art-figure">{renderHeroArt(theme.heroArt)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
