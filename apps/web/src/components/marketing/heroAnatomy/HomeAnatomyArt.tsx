type AnatomyArtProps = {
  className?: string;
};

/**
 * Home aurora orb v7 — no-rectangle fix via viewBox margin.
 * ViewBox "0 0 1020 1160", cx=510 cy=520 → 90-100px margin beyond r=420 blur edge.
 */
export default function HomeAnatomyArt({ className }: AnatomyArtProps) {
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
        {/* Slightly warmer mint — leans aqua-green. 90-100px margin to viewBox edges. */}
        <radialGradient id="h-mint" cx={cx} cy={cy} r="420" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#84d4b4" stopOpacity="0.00" />
          <stop offset="28%"  stopColor="#84d4b4" stopOpacity="0.04" />
          <stop offset="50%"  stopColor="#84d4b4" stopOpacity="0.36" />
          <stop offset="65%"  stopColor="#84d4b4" stopOpacity="0.70" />
          <stop offset="76%"  stopColor="#84d4b4" stopOpacity="0.82" />
          <stop offset="86%"  stopColor="#84d4b4" stopOpacity="0.62" />
          <stop offset="94%"  stopColor="#84d4b4" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#84d4b4" stopOpacity="0.00" />
        </radialGradient>

        <radialGradient id="h-pink-outer" cx={cx} cy={cy} r="355" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#eeb0d2" stopOpacity="0.62" />
          <stop offset="32%"  stopColor="#ec9cc8" stopOpacity="0.48" />
          <stop offset="62%"  stopColor="#e484b8" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#d86ca8" stopOpacity="0.00" />
        </radialGradient>

        <radialGradient id="h-pink-mid" cx={cx} cy={cy} r="265" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#ec8abe" stopOpacity="0.88" />
          <stop offset="30%"  stopColor="#e474b2" stopOpacity="0.72" />
          <stop offset="60%"  stopColor="#d85ca2" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#c84492" stopOpacity="0.00" />
        </radialGradient>

        <radialGradient id="h-pink-deep" cx={cx} cy={cy} r="192" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#da6aaa" stopOpacity="0.90" />
          <stop offset="32%"  stopColor="#ce56a2" stopOpacity="0.74" />
          <stop offset="64%"  stopColor="#be4292" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#ae2e82" stopOpacity="0.00" />
        </radialGradient>

        <radialGradient id="h-yellow" cx={cx} cy={cy} r="125" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#f6cc72" stopOpacity="0.96" />
          <stop offset="30%"  stopColor="#f2ba5a" stopOpacity="0.78" />
          <stop offset="62%"  stopColor="#eca242" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#e28a2a" stopOpacity="0.00" />
        </radialGradient>

        <radialGradient id="h-teal" cx={cx} cy={cy} r="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#58ccbe" stopOpacity="1.00" />
          <stop offset="28%"  stopColor="#44baae" stopOpacity="0.88" />
          <stop offset="58%"  stopColor="#30a69e" stopOpacity="0.44" />
          <stop offset="100%" stopColor="#1c908c" stopOpacity="0.00" />
        </radialGradient>

        <filter id="h-mint-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="24" />
        </filter>
        <filter id="h-pink-blur" x="-24%" y="-24%" width="148%" height="148%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="h-teal-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="15" />
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r="420" fill="url(#h-mint)" filter="url(#h-mint-blur)" />
      <circle cx={cx} cy={cy} r="355" fill="url(#h-pink-outer)" filter="url(#h-pink-blur)" />
      <circle cx={cx} cy={cy} r="265" fill="url(#h-pink-mid)" />
      <circle cx={cx} cy={cy} r="192" fill="url(#h-pink-deep)" />
      <circle cx={cx} cy={cy} r="125" fill="url(#h-yellow)" />
      <circle cx={cx} cy={cy} r="65"  fill="url(#h-teal)" filter="url(#h-teal-glow)" />
      <circle cx={cx} cy={cy} r="44"  fill="url(#h-teal)" />
    </svg>
  );
}
