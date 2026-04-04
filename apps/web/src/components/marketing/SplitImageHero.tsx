import Image from "next/image";
import type { MarketingArtworkSpec } from "./marketingArtwork";

type SplitImageHeroProps = {
  backgroundColor: string;
  title: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
  artwork: MarketingArtworkSpec;
  eyebrow?: string;
  titleClassName?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  supportLine?: string;
  priority?: boolean;
};

export default function SplitImageHero({
  backgroundColor,
  title,
  body,
  buttonLabel,
  buttonHref,
  artwork,
  eyebrow = "Clarity Clinical Prep",
  titleClassName = "",
  secondaryLabel,
  secondaryHref,
  supportLine = "Original questions, clearer rationale, and a cleaner study flow.",
  priority = false,
}: SplitImageHeroProps) {
  return (
    <section
      className="overflow-hidden rounded-[36px] border border-[rgba(74,85,89,0.08)] shadow-[0_28px_80px_rgba(52,48,41,0.08)]"
      style={{ backgroundColor }}
    >
      <div className="mx-auto grid min-h-[70vh] max-w-7xl items-center gap-12 px-6 py-8 md:px-10 lg:grid-cols-2 lg:px-14 lg:py-14">
        <div className="max-w-[34rem]">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-[#70777B]">{eyebrow}</span>
          <h1
            className={`mt-5 font-serif text-[clamp(3.8rem,8vw,7.4rem)] leading-[0.88] tracking-tight text-[#1E2328] ${titleClassName}`.trim()}
          >
            {title}
          </h1>
          <p className="mt-6 max-w-[30rem] font-sans text-[1.1rem] leading-8 text-[#5A5F63]">{body}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={buttonHref}
              className="inline-flex items-center justify-center rounded-full bg-[#4A5559] px-7 py-3.5 font-sans text-sm font-semibold text-white transition hover:bg-[#3B4549]"
            >
              {buttonLabel}
            </a>
            {secondaryLabel && secondaryHref ? (
              <a
                href={secondaryHref}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(74,85,89,0.12)] bg-[rgba(255,255,255,0.62)] px-7 py-3.5 font-sans text-sm font-semibold text-[#2C3338] transition hover:border-[rgba(74,85,89,0.24)] hover:bg-[rgba(255,255,255,0.82)]"
              >
                {secondaryLabel}
              </a>
            ) : null}
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="h-px w-20 bg-[rgba(98,105,108,0.22)]" />
            <p className="font-sans text-sm text-[#7A7067]">{supportLine}</p>
          </div>
        </div>

        <div className="relative flex min-h-[24rem] items-center justify-center lg:min-h-[38rem] lg:justify-end">
          <figure
            className={`relative w-full overflow-hidden rounded-[34px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.72)] shadow-[0_24px_60px_rgba(63,55,47,0.08)] ${artwork.panelClassName}`.trim()}
            style={{ backgroundColor: artwork.panelTone ?? backgroundColor }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_42%,rgba(255,255,255,0.68),transparent_58%)]" />
            <div className="absolute inset-0 p-4 md:p-6">
              <div className="relative h-full w-full overflow-hidden rounded-[28px]">
                <Image
                  src={artwork.src}
                  alt={artwork.alt}
                  fill
                  priority={priority}
                  unoptimized
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className={`relative z-10 object-contain ${artwork.imageClassName}`.trim()}
                />
              </div>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
