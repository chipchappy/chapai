type AnatomyArtProps = {
  className?: string;
};

/**
 * NCLEX aurora orb v7 — no-rectangle fix via viewBox margin.
 * ViewBox "0 0 1020 1160", cx=510 cy=520 → 90-100px margin beyond r=420 blur edge.
 */
export default function NclexAnatomyArt({ className }: AnatomyArtProps) {
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
        {/* Mint ambient — slightly more vivid for dark bg. 90-100px margin to viewBox edges. */}
        <radialGradient id="n-mint" cx={cx} cy={cy} r="420" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6cd4b8" stopOpacity="0.00" />
          <stop offset="28%"  stopColor="#6cd4b8" stopOpacity="0.06" />
          <stop offset="50%"  stopColor="#6cd4b8" stopOpacity="0.40" />
          <stop offset="65%"  stopColor="#6cd4b8" stopOpacity="0.74" />
          <stop offset="76%"  stopColor="#6cd4b8" stopOpacity="0.86" />
          <stop offset="86%"  stopColor="#6cd4b8" stopOpacity="0.66" />
          <stop offset="94%"  stopColor="#6cd4b8" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#6cd4b8" stopOpacity="0.00" />
        </radialGradient>

        <radialGradient id="n-pink-outer" cx={cx} cy={cy} r="355" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#ecaed2" stopOpacity="0.65" />
          <stop offset="32%"  stopColor="#ea98c6" stopOpacity="0.50" />
          <stop offset="62%"  stopColor="#e280b6" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#d668a6" stopOpacity="0.00" />
        </radialGradient>

        <radialGradient id="n-pink-mid" cx={cx} cy={cy} r="265" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#ea88be" stopOpacity="0.90" />
          <stop offset="30%"  stopColor="#e270b2" stopOpacity="0.74" />
          <stop offset="60%"  stopColor="#d658a2" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#c64092" stopOpacity="0.00" />
        </radialGradient>

        <radialGradient id="n-pink-deep" cx={cx} cy={cy} r="192" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#da68aa" stopOpacity="0.92" />
          <stop offset="32%"  stopColor="#ce54a2" stopOpacity="0.76" />
          <stop offset="64%"  stopColor="#be4092" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ae2c82" stopOpacity="0.00" />
        </radialGradient>

        <radialGradient id="n-yellow" cx={cx} cy={cy} r="125" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#f6cc6e" stopOpacity="0.96" />
          <stop offset="30%"  stopColor="#f2b856" stopOpacity="0.80" />
          <stop offset="62%"  stopColor="#eca03e" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#e28826" stopOpacity="0.00" />
        </radialGradient>

        <radialGradient id="n-teal" cx={cx} cy={cy} r="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#50ccc4" stopOpacity="1.00" />
          <stop offset="28%"  stopColor="#3cbab4" stopOpacity="0.88" />
          <stop offset="58%"  stopColor="#28a6a0" stopOpacity="0.44" />
          <stop offset="100%" stopColor="#14908c" stopOpacity="0.00" />
        </radialGradient>

        <filter id="n-mint-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="n-pink-blur" x="-24%" y="-24%" width="148%" height="148%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
        <filter id="n-teal-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r="420" fill="url(#n-mint)" filter="url(#n-mint-blur)" />
      <circle cx={cx} cy={cy} r="355" fill="url(#n-pink-outer)" filter="url(#n-pink-blur)" />
      <circle cx={cx} cy={cy} r="265" fill="url(#n-pink-mid)" />
      <circle cx={cx} cy={cy} r="192" fill="url(#n-pink-deep)" />
      <circle cx={cx} cy={cy} r="125" fill="url(#n-yellow)" />
      <circle cx={cx} cy={cy} r="65"  fill="url(#n-teal)" filter="url(#n-teal-glow)" />
      <circle cx={cx} cy={cy} r="44"  fill="url(#n-teal)" />
    </svg>
  );
}
