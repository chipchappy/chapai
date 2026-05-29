import type { ReadinessCategoryDelta } from "@/lib/student-dashboard";

type Props = {
  deltas: ReadinessCategoryDelta[];
};

function categoryLabel(category: string) {
  return category
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

// Up to 8 axes — enough for the NCLEX-RN client-need set without crowding.
const MAX_AXES = 8;

export default function DashReadinessRadar({ deltas }: Props) {
  if (deltas.length < 3) return null;

  const points = deltas.slice(0, MAX_AXES);
  const size = 280;
  const center = size / 2;
  const radius = size * 0.38;
  const angleStep = (Math.PI * 2) / points.length;

  // Polygon for earliest + latest. Each point is on its category axis,
  // scaled by accuracy (0-100 → 0-radius).
  function buildPath(values: number[]) {
    return values
      .map((v, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const r = (Math.max(3, Math.min(100, v)) / 100) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ") + " Z";
  }

  const earliestPath = buildPath(points.map((p) => p.earliest));
  const latestPath = buildPath(points.map((p) => p.latest));

  // Grid rings at 25, 50, 75, 100 + axis lines + labels
  const rings = [25, 50, 75, 100];

  return (
    <div className="dash-radar">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        role="img"
        aria-label="Readiness comparison radar"
        className="dash-radar__svg"
      >
        {/* concentric grid rings */}
        {rings.map((pct) => (
          <circle
            key={pct}
            cx={center}
            cy={center}
            r={(pct / 100) * radius}
            fill="none"
            stroke="var(--c-border-soft)"
            strokeWidth={1}
          />
        ))}
        {/* threshold ring at 70 */}
        <circle
          cx={center}
          cy={center}
          r={(70 / 100) * radius}
          fill="none"
          stroke="var(--c-border-strong)"
          strokeWidth={1.4}
          strokeDasharray="2 4"
        />
        {/* axis spokes */}
        {points.map((p, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={`axis-${p.category}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="var(--c-border-soft)"
              strokeWidth={1}
            />
          );
        })}
        {/* earliest polygon */}
        <path
          d={earliestPath}
          fill="color-mix(in srgb, var(--c-gold) 22%, transparent)"
          stroke="var(--c-gold-deep)"
          strokeWidth={1.6}
          strokeLinejoin="round"
          opacity={0.85}
        />
        {/* latest polygon */}
        <path
          d={latestPath}
          fill="color-mix(in srgb, var(--c-sage) 28%, transparent)"
          stroke="var(--c-sage-deep)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* axis labels */}
        {points.map((p, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const labelRadius = radius + 18;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          const anchor = Math.abs(Math.cos(angle)) < 0.2 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
          return (
            <text
              key={`label-${p.category}`}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontFamily="var(--font-cta)"
              fontSize={10}
              fontWeight={600}
              fill="var(--c-text-muted)"
            >
              {categoryLabel(p.category)}
            </text>
          );
        })}
      </svg>
      <div className="dash-radar__legend">
        <span className="dash-radar__swatch dash-radar__swatch--earliest" aria-hidden="true" />
        <span>Earliest exam</span>
        <span className="dash-radar__swatch dash-radar__swatch--latest" aria-hidden="true" />
        <span>Latest exam</span>
        <span className="dash-radar__swatch dash-radar__swatch--threshold" aria-hidden="true" />
        <span>70% threshold</span>
      </div>
    </div>
  );
}
