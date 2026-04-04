import Image from "next/image";
import type { ReactNode } from "react";
import type { MarketingArtworkSpec } from "./marketingArtwork";

type PremiumArtHeroProps = {
  backgroundColor: string;
  eyebrow?: string;
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  artwork?: MarketingArtworkSpec;
  illustration?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageClassName?: string;
  imageFrameClassName?: string;
  backdropClassName?: string;
};

export default function PremiumArtHero({
  backgroundColor,
  eyebrow = "Clarity Clinical Prep",
  title,
  body,
  ctaHref,
  ctaLabel,
  artwork,
  illustration,
  imageSrc,
  imageAlt = "",
  imageWidth = 640,
  imageHeight = 560,
  imageClassName = "",
  imageFrameClassName = "",
  backdropClassName,
}: PremiumArtHeroProps) {
  return (
    <section
      className="overflow-hidden rounded-[36px] border border-[rgba(74,85,89,0.08)] shadow-[0_28px_80px_rgba(52,48,41,0.08)]"
      style={{ backgroundColor }}
    >
      <div className="mx-auto grid min-h-[34rem] max-w-7xl items-center gap-10 px-6 py-10 md:px-10 lg:min-h-[38rem] lg:grid-cols-[1.02fr_0.98fr] lg:px-14 lg:py-14">
        <div className="max-w-[35rem]">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-[#70777B]">
            {eyebrow}
          </span>
          <h1 className="mt-4 max-w-[13ch] font-serif text-[clamp(3.9rem,7.2vw,7rem)] leading-[0.9] tracking-tight text-[#1E2328]">
            {title}
          </h1>
          <p className="mt-6 max-w-[30rem] font-sans text-[1.04rem] leading-8 text-[#5A5F63]">{body}</p>

          <div className="mt-8">
            <a
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-full bg-[#4A5559] px-7 py-3.5 font-sans text-sm font-semibold text-white transition hover:bg-[#3B4549]"
            >
              {ctaLabel}
            </a>
          </div>
        </div>

        <div className="relative flex min-h-[22rem] items-center justify-center lg:min-h-[36rem] lg:justify-end">
          {artwork ? (
            <figure
              className={`relative w-full overflow-hidden rounded-[28px] border border-[rgba(74,85,89,0.07)] shadow-[0_32px_72px_rgba(63,55,47,0.11)] ${artwork.panelClassName}`.trim()}
              style={{ backgroundColor: artwork.panelTone ?? backgroundColor }}
            >
              <Image
                src={artwork.src}
                alt={artwork.alt}
                fill
                priority
                unoptimized
                sizes="(min-width: 1024px) 44vw, 100vw"
                className={`object-cover ${artwork.imageClassName}`.trim()}
              />
            </figure>
          ) : illustration ? (
            <div className="relative z-10 flex w-full items-center justify-center">{illustration}</div>
          ) : imageSrc ? (
            <>
              {backdropClassName ? <div className={`absolute ${backdropClassName}`.trim()} /> : null}
              <div className={`relative z-10 flex w-full items-center justify-center ${imageFrameClassName}`.trim()}>
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  width={imageWidth}
                  height={imageHeight}
                  priority
                  unoptimized
                  sizes="(min-width: 1024px) 42vw, 90vw"
                  className={`h-auto w-full object-contain mix-blend-multiply contrast-[1.02] ${imageClassName}`.trim()}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
