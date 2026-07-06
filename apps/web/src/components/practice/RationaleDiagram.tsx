import type { PracticeQuestion } from "@/lib/practice-types";

type VisualRationale = NonNullable<PracticeQuestion["visualRationale"]>;

// Uniform, brand-styled diagram for the rationale review. One component renders
// every diagram type so the visual language stays consistent across the whole
// bank: trend (labeled metrics with direction), flow/pathway (ordered concept
// steps), and signal/overview (labeled cards). Populated from question
// visual_rationale JSON.
const DIRECTION = {
  up: { glyph: "↑", color: "#c0563f", bg: "rgba(196,86,63,0.1)" },
  down: { glyph: "↓", color: "#4f6f77", bg: "rgba(79,111,119,0.1)" },
  steady: { glyph: "→", color: "#55715e", bg: "rgba(111,141,118,0.12)" },
} as const;

export default function RationaleDiagram({ data }: { data: VisualRationale }) {
  const isFlow = data.type === "flow" || data.type === "pathway";
  const hasMetrics = Array.isArray(data.metrics) && data.metrics.length > 0;
  const hasNodes = Array.isArray(data.nodes) && data.nodes.length > 0;
  if (!hasMetrics && !hasNodes) return null;

  return (
    <figure className="rationale-diagram" aria-label={`Diagram: ${data.title}`}>
      <figcaption className="rationale-diagram__head">
        <span className="rationale-diagram__kicker">Visual rationale</span>
        <strong>{data.title}</strong>
        {data.caption ? <small>{data.caption}</small> : null}
      </figcaption>

      {hasMetrics ? (
        <div className="rationale-diagram__metrics">
          {data.metrics!.map((m, i) => {
            const dir = m.direction ? DIRECTION[m.direction] : null;
            return (
              <div key={`${m.label}-${i}`} className="rationale-diagram__metric">
                <span className="rationale-diagram__metric-label">{m.label}</span>
                <span className="rationale-diagram__metric-value">{m.value}</span>
                {dir ? (
                  <span className="rationale-diagram__dir" style={{ color: dir.color, background: dir.bg }}>
                    {dir.glyph} {m.directionLabel ?? m.direction}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {hasNodes ? (
        <ol className={`rationale-diagram__nodes ${isFlow ? "is-flow" : "is-grid"}`}>
          {data.nodes!.map((n, i) => (
            <li key={`${n.label}-${i}`} className="rationale-diagram__node">
              <span className="rationale-diagram__node-index">{i + 1}</span>
              <div>
                <strong>{n.label}</strong>
                {n.value ? <p>{n.value}</p> : null}
              </div>
              {isFlow && i < data.nodes!.length - 1 ? <span className="rationale-diagram__arrow" aria-hidden="true">↓</span> : null}
            </li>
          ))}
        </ol>
      ) : null}

      {data.conclusion ? <p className="rationale-diagram__conclusion">{data.conclusion}</p> : null}
    </figure>
  );
}
