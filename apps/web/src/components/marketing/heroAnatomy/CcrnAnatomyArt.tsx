type AnatomyArtProps = {
  className?: string;
};

/**
 * CCRN aurora orb v7 — no-rectangle fix via viewBox margin.
 *
 * Root cause of rectangle: Gaussian blur spreads color ~3σ (~72px) past the gradient's
 * 0-opacity edge. Placing the gradient edge (r=420) at the viewBox boundary means that
 * blur spread is visible at the container edges → rectangle appears.
 *
 * Fix: give the gradient edge 100px of breathing room to every viewBox edge.
 * ViewBox "0 0 1020 1160", cx=510 cy=520 → gradient at r=420 leaves:
 *   top margin:  520-420 = 100px  (4.2σ → 0.003% residual → invisible)
 *   left/right:  510-420 =  90px  (3.75σ → 0.018% → invisible)
 *   bottom: 640px → no issue
 */
export default function CcrnAnatomyArt({ className }: AnatomyArtProps) {
  const cx = 510;
  const cy = 520;

  return (
    <svg
      className={className}
      viewBox="0 0 1020 1160"
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Mint ambient — r=420, 90-100px inside every viewBox edge → blur fully dissipates */}
        <radialGradient id="c-mint" cx={cx} cy={cy} r="420" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#7ed4b8" stopOpacity="0.00" />
          <stop offset="28%"  stopColor="#7ed4b8" stopOpacity="0.04" />
          <stop offset="50%"  stopColor="#7ed4b8" stopOpacity="0.35" />
          <stop offset="65%"  stopColor="#7ed4b8" stopOpacity="0.68" />
          <stop offset="76%"  stopColor="#7ed4b8" stopOpacity="0.80" />
          <stop offset="86%"  stopColor="#7ed4b8" stopOpacity="0.62" />
          <stop offset="94%"  stopColor="#7ed4b8" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#7ed4b8" stopOpacity="0.00" />
        </radialGradient>

        {/* ── OUTER SOFT PINK HALO ── */}
        <radialGradient id="c-pink-outer" cx={cx} cy={cy} r="355" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#eaaed0" stopOpacity="0.62" />
          <stop offset="32%"  stopColor="#e898c4" stopOpacity="0.48" />
          <stop offset="62%"  stopColor="#e080b4" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#d468a4" stopOpacity="0.00" />
        </radialGradient>

        {/* ── MEDIUM PINK / ROSE RING ── */}
        <radialGradient id="c-pink-mid" cx={cx} cy={cy} r="265" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#e888bc" stopOpacity="0.88" />
          <stop offset="30%"  stopColor="#e070b0" stopOpacity="0.72" />
          <stop offset="60%"  stopColor="#d458a0" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#c44090" stopOpacity="0.00" />
        </radialGradient>

        {/* ── DEEP PINK / MAGENTA ── */}
        <radialGradient id="c-pink-deep" cx={cx} cy={cy} r="192" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#d868a8" stopOpacity="0.90" />
          <stop offset="32%"  stopColor="#cc54a0" stopOpacity="0.74" />
          <stop offset="64%"  stopColor="#bc4090" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#ac2c80" stopOpacity="0.00" />
        </radialGradient>

        {/* ── PEACH / YELLOW INNER ── */}
        <radialGradient id="c-yellow" cx={cx} cy={cy} r="125" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#f4cc70" stopOpacity="0.96" />
          <stop offset="30%"  stopColor="#f0b858" stopOpacity="0.78" />
          <stop offset="62%"  stopColor="#eaa040" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#e08828" stopOpacity="0.00" />
        </radialGradient>

        {/* ── BRIGHT TEAL CORE ── */}
        <radialGradient id="c-teal" cx={cx} cy={cy} r="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#5ccac0" stopOpacity="1.00" />
          <stop offset="28%"  stopColor="#48b8b0" stopOpacity="0.88" />
          <stop offset="58%"  stopColor="#34a4a0" stopOpacity="0.44" />
          <stop offset="100%" stopColor="#208e8c" stopOpacity="0.00" />
        </radialGradient>

        <filter id="c-mint-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="24" />
        </filter>
        <filter id="c-pink-blur" x="-24%" y="-24%" width="148%" height="148%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="c-teal-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="15" />
        </filter>
      </defs>

      {/* 1. Mint ambient field */}
      <circle cx={cx} cy={cy} r="420" fill="url(#c-mint)" filter="url(#c-mint-blur)" />

      {/* 2. Pink layers — outer to inner */}
      <circle cx={cx} cy={cy} r="355" fill="url(#c-pink-outer)" filter="url(#c-pink-blur)" />
      <circle cx={cx} cy={cy} r="265" fill="url(#c-pink-mid)" />
      <circle cx={cx} cy={cy} r="192" fill="url(#c-pink-deep)" />

      {/* 3. Warm yellow inner */}
      <circle cx={cx} cy={cy} r="125" fill="url(#c-yellow)" />

      {/* 4. Bright teal core */}
      <circle cx={cx} cy={cy} r="65" fill="url(#c-teal)" filter="url(#c-teal-glow)" />
      <circle cx={cx} cy={cy} r="44" fill="url(#c-teal)" />
    </svg>
  );
}
