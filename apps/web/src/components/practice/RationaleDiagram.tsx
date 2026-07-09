import type { PracticeQuestion } from "@/lib/practice-types";

type VisualRationale = NonNullable<PracticeQuestion["visualRationale"]>;
type Node = NonNullable<VisualRationale["nodes"]>[number];
type Metric = NonNullable<VisualRationale["metrics"]>[number];

// Genuine diagrams (not numbered lists): flow/pathway render as a top-down
// SVG flowchart with a trigger node, action boxes joined by arrow connectors,
// and a highlighted outcome; trend renders as a proportional bar chart of the
// relevant labs/vitals. Same visual_rationale data shape as before.

const DIR = {
  up: { glyph: "▲", color: "#c0563f", tint: "rgba(196,86,63,0.12)", label: "high" },
  down: { glyph: "▼", color: "#3f6f9c", tint: "rgba(63,111,156,0.12)", label: "low" },
  steady: { glyph: "●", color: "#55715e", tint: "rgba(111,141,118,0.14)", label: "stable" },
} as const;

function firstNumber(s: string): number | null {
  const m = String(s).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function ArrowConnector() {
  return (
    <svg className="rd2-arrow" width="24" height="26" viewBox="0 0 24 26" aria-hidden="true" focusable="false">
      <line x1="12" y1="0" x2="12" y2="16" stroke="#c1b291" strokeWidth="2" />
      <path d="M6 15 L12 24 L18 15 Z" fill="#c1b291" />
    </svg>
  );
}

function TrendChart({ metrics }: { metrics: Metric[] }) {
  const nums = metrics.map((m) => firstNumber(m.value));
  const usable = nums.filter((n): n is number => n !== null);
  const max = usable.length ? Math.max(...usable, 1) : 1;
  return (
    <div className="rd2-bars" role="img" aria-label="Value chart">
      {metrics.map((m, i) => {
        const dir = m.direction ? DIR[m.direction] : null;
        const n = nums[i];
        const pct = n !== null ? Math.max(8, Math.round((Math.abs(n) / max) * 100)) : m.direction === "up" ? 88 : m.direction === "down" ? 34 : 60;
        return (
          <div className="rd2-bar-row" key={`${m.label}-${i}`}>
            <span className="rd2-bar-label">{m.label}</span>
            <span className="rd2-bar-track">
              <span className="rd2-bar-fill" style={{ width: `${pct}%`, background: dir?.color ?? "#7e9d86" }} />
            </span>
            <span className="rd2-bar-value">
              {m.value}
              {dir ? <em style={{ color: dir.color, background: dir.tint }}>{dir.glyph} {m.directionLabel ?? dir.label}</em> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Flowchart({ nodes }: { nodes: Node[] }) {
  const last = nodes.length - 1;
  return (
    <div className="rd2-flow" role="img" aria-label="Clinical flowchart">
      {nodes.map((n, i) => {
        const role = i === 0 ? "start" : i === last ? "end" : "step";
        return (
          <div className="rd2-flow-unit" key={`${n.label}-${i}`}>
            <div className={`rd2-box is-${role}`}>
              {role === "step" ? <span className="rd2-box-tag" aria-hidden="true">{i}</span> : null}
              <div className="rd2-box-body">
                <strong>{n.label}</strong>
                {n.value ? <p>{n.value}</p> : null}
              </div>
            </div>
            {i < last ? <ArrowConnector /> : null}
          </div>
        );
      })}
    </div>
  );
}

export default function RationaleDiagram({ data }: { data: VisualRationale }) {
  const hasMetrics = Array.isArray(data.metrics) && data.metrics.length > 0;
  const hasNodes = Array.isArray(data.nodes) && data.nodes.length > 0;
  if (!hasMetrics && !hasNodes) return null;
  const isTrend = data.type === "trend" && hasMetrics;

  return (
    <figure className={`rationale-diagram is-${data.type}`} aria-label={`Diagram: ${data.title}`}>
      <figcaption className="rationale-diagram__head">
        <span className="rationale-diagram__kicker">{isTrend ? "Lab / vital chart" : "Study flowchart"}</span>
        <strong>{data.title}</strong>
        {data.caption ? <small>{data.caption}</small> : null}
      </figcaption>

      {isTrend ? <TrendChart metrics={data.metrics!} /> : hasNodes ? <Flowchart nodes={data.nodes!} /> : hasMetrics ? <TrendChart metrics={data.metrics!} /> : null}

      {data.conclusion ? <p className="rationale-diagram__conclusion">{data.conclusion}</p> : null}
    </figure>
  );
}
