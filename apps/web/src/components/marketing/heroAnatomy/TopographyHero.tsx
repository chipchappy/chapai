type TopographyHeroProps = {
  className?: string;
};

/**
 * The home hero's right-hand artwork: a contour-map rendering of the Clarity
 * mark, replacing the aurora orb.
 *
 * Served as pre-optimised WebP rather than through next/image, because image
 * optimisation needs a loader that is not wired up under the Cloudflare Workers
 * adapter — a bare next/image here would ship the original bytes. The source PNG
 * is 1.75MB; these variants are 80/50/18KB, which matters when roughly four in
 * five sessions are on a phone.
 *
 * The art is drawn on the same sand ground as the page and is composed as a
 * right-side vignette, so it bleeds off the edge instead of sitting in a frame.
 * `sizes` reflects that: it occupies about half the viewport on desktop and is
 * deliberately allowed to overflow on small screens.
 */
export default function TopographyHero({ className }: TopographyHeroProps) {
  return (
    <img
      className={className}
      src="/brand/hero-topography-1400.webp"
      // Two breakpoints, not three: downscaling multiplies the high-frequency
      // alpha noise in the contour lines, so the 900w build encoded LARGER
      // (185KB) than the 1400w one (99KB). Not worth shipping a heavier file to
      // smaller screens.
      srcSet="/brand/hero-topography-560.webp 560w, /brand/hero-topography-1400.webp 1400w"
      sizes="(max-width: 767px) 90vw, 50vw"
      width={1122}
      height={1402}
      alt=""
      aria-hidden="true"
      // Hero art is above the fold: eager + high priority so it is not
      // discovered late by the preload scanner and does not pop in after copy.
      loading="eager"
      fetchPriority="high"
      decoding="async"
      draggable={false}
    />
  );
}
