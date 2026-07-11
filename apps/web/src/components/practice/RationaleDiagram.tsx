import type { PracticeQuestion } from "@/lib/practice-types";

type VisualRationale = NonNullable<PracticeQuestion["visualRationale"]>;
type Node = NonNullable<VisualRationale["nodes"]>[number];
type Metric = NonNullable<VisualRationale["metrics"]>[number];

// v3 — premium clinical visuals.
// trend  → reference-range GAUGE per lab/vital: shaded normal band + patient
//          marker, status computed objectively from the band (matches how a
//          real lab report reads). Range comes from the authored metric.range,
//          else a built-in reference table, else a clean fallback bar.
// flow / pathway → flat top-down flowchart: solid trigger pill, quiet numbered
//          action cards joined by thin connectors, gold-tinted outcome card.

const STATUS = {
  high: { color: "#bb4a2f", tint: "rgba(187,74,47,0.12)", glyph: "▲", label: "high" },
  low: { color: "#3f5f70", tint: "rgba(63,95,112,0.12)", glyph: "▼", label: "low" },
  ok: { color: "#55715e", tint: "rgba(111,141,118,0.14)", glyph: "●", label: "in range" },
} as const;

// Adult reference bands keyed by label match — first hit wins. Kept deliberately
// conservative/common; authored metric.range always overrides.
const REFERENCE_RANGES: Array<{ match: RegExp; lo: number; hi: number; note: string }> = [
  { match: /potassium|k\+/i, lo: 3.5, hi: 5.0, note: "3.5–5.0" },
  { match: /sodium|na\+/i, lo: 135, hi: 145, note: "135–145" },
  { match: /inr/i, lo: 2.0, hi: 3.0, note: "goal 2.0–3.0" },
  { match: /glucose/i, lo: 70, hi: 110, note: "70–110" },
  { match: /\bph\b/i, lo: 7.35, hi: 7.45, note: "7.35–7.45" },
  { match: /hco3|bicarb/i, lo: 22, hi: 26, note: "22–26" },
  { match: /paco2/i, lo: 35, hi: 45, note: "35–45" },
  { match: /pao2/i, lo: 80, hi: 100, note: "80–100" },
  { match: /lactate/i, lo: 0.5, hi: 2.0, note: "0.5–2.0" },
  { match: /bnp/i, lo: 0, hi: 100, note: "under 100" },
  { match: /creatinine/i, lo: 0.6, hi: 1.2, note: "0.6–1.2" },
  { match: /platelet/i, lo: 150, hi: 400, note: "150–400k" },
  { match: /hemoglobin|hgb/i, lo: 12, hi: 17, note: "12–17" },
  { match: /wbc|white blood/i, lo: 4.5, hi: 11, note: "4.5–11k" },
  { match: /magnesium|mg\+/i, lo: 1.5, hi: 2.5, note: "1.5–2.5" },
  { match: /calcium/i, lo: 8.5, hi: 10.5, note: "8.5–10.5" },
  { match: /lithium/i, lo: 0.6, hi: 1.2, note: "0.6–1.2" },
  { match: /digoxin/i, lo: 0.8, hi: 2.0, note: "0.8–2.0" },
  { match: /ammonia/i, lo: 15, hi: 45, note: "15–45" },
  { match: /anion gap/i, lo: 8, hi: 12, note: "8–12" },
  { match: /osmolality/i, lo: 275, hi: 295, note: "275–295" },
  { match: /heart rate|\bhr\b|pulse/i, lo: 60, hi: 100, note: "60–100" },
  { match: /systolic|\bsbp\b/i, lo: 90, hi: 120, note: "90–120" },
  { match: /respiratory rate|\brr\b/i, lo: 12, hi: 20, note: "12–20" },
  { match: /spo2|oxygen sat/i, lo: 95, hi: 100, note: "95–100%" },
  { match: /temp/i, lo: 97.8, hi: 99.1, note: "97.8–99.1°F" },
];

function firstNumber(s: string): number | null {
  const m = String(s).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function parseRange(metric: Metric): { lo: number; hi: number; note: string } | null {
  if (metric.range) {
    const m = String(metric.range).replace(/,/g, "").match(/(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
      const lo = Number(m[1]);
      const hi = Number(m[2]);
      if (Number.isFinite(lo) && Number.isFinite(hi) && hi > lo) return { lo, hi, note: `${m[1]}–${m[2]}` };
    }
  }
  const hit = REFERENCE_RANGES.find((r) => r.match.test(metric.label));
  return hit ? { lo: hit.lo, hi: hit.hi, note: hit.note } : null;
}

function GaugeRow({ metric }: { metric: Metric }) {
  const value = firstNumber(metric.value);
  const range = value !== null ? parseRange(metric) : null;

  // Fallback: no numeric value or no known band → clean flat bar, no fake reference.
  if (value === null || !range) {
    const dir = metric.direction === "up" ? STATUS.high : metric.direction === "down" ? STATUS.low : STATUS.ok;
    const width = metric.direction === "up" ? 88 : metric.direction === "down" ? 34 : 60;
    return (
      <div className="rd3-row">
        <span className="rd3-label">{metric.label}</span>
        <span className="rd3-track">
          <span className="rd3-fill" style={{ width: `${width}%`, background: dir.color }} />
        </span>
        <span className="rd3-value">
          {metric.value}
          {metric.direction ? (
            <em style={{ color: dir.color, background: dir.tint }}>{dir.glyph} {metric.directionLabel ?? dir.label}</em>
          ) : null}
        </span>
      </div>
    );
  }

  // Frame the scale so the band and the patient marker are both comfortably visible.
  const bandWidth = range.hi - range.lo || 1;
  const pad = Math.max(bandWidth * 0.55, Math.abs(value - (value > range.hi ? range.hi : range.lo)) * 0.25);
  const min = Math.min(range.lo, value) - pad;
  const max = Math.max(range.hi, value) + pad;
  const span = max - min || 1;
  const pct = (n: number) => Math.min(99, Math.max(1, ((n - min) / span) * 100));
  const status = value < range.lo ? STATUS.low : value > range.hi ? STATUS.high : STATUS.ok;

  return (
    <div className="rd3-row is-gauge">
      <span className="rd3-label">{metric.label}</span>
      <span className="rd3-gauge" role="img" aria-label={`${metric.label} ${metric.value}, normal ${range.note}`}>
        <span className="rd3-gauge-track">
          <span className="rd3-gauge-band" style={{ left: `${pct(range.lo)}%`, width: `${Math.max(4, pct(range.hi) - pct(range.lo))}%` }} />
          <span className="rd3-gauge-mark" style={{ left: `${pct(value)}%`, background: status.color }} />
        </span>
        <span className="rd3-gauge-scale">normal {range.note}</span>
      </span>
      <span className="rd3-value">
        {metric.value}
        <em style={{ color: status.color, background: status.tint }}>{status.glyph} {metric.directionLabel ?? status.label}</em>
      </span>
    </div>
  );
}

function Connector() {
  return (
    <svg className="rd3-connector" width="14" height="20" viewBox="0 0 14 20" aria-hidden="true" focusable="false">
      <line x1="7" y1="0" x2="7" y2="13" stroke="#cbb98f" strokeWidth="1.5" />
      <path d="M3.5 12.5 L7 18.5 L10.5 12.5 Z" fill="#cbb98f" />
    </svg>
  );
}

function Flowchart({ nodes }: { nodes: Node[] }) {
  const last = nodes.length - 1;
  let step = 0;
  return (
    <div className="rd3-flow" role="img" aria-label="Clinical flowchart">
      {nodes.map((n, i) => {
        const role = i === 0 ? "start" : i === last ? "end" : "step";
        if (role === "step") step += 1;
        return (
          <div className="rd3-flow-unit" key={`${n.label}-${i}`}>
            <div className={`rd3-node is-${role}`}>
              {role === "step" ? <span className="rd3-node-num" aria-hidden="true">{step}</span> : null}
              <div className="rd3-node-body">
                <strong>{n.label}</strong>
                {n.value ? <p>{n.value}</p> : null}
              </div>
            </div>
            {i < last ? <Connector /> : null}
          </div>
        );
      })}
    </div>
  );
}

type Option = NonNullable<VisualRationale["options"]>[number];
type Item = NonNullable<VisualRationale["items"]>[number];

// compare → a decision matrix: every answer option with a ✓/✗ verdict and the
// one-line crux. This is the visual form of the correct + distractor rationales,
// so the reader sees at a glance why the answer wins and each distractor loses.
function CompareMatrix({ options }: { options: Option[] }) {
  return (
    <div className="rd3-compare" role="table" aria-label="Option comparison">
      {options.map((o, i) => {
        const v = o.verdict === "correct" ? "correct" : o.verdict === "partial" ? "partial" : "wrong";
        const mark = v === "correct" ? "✓" : v === "partial" ? "≈" : "✕";
        return (
          <div className={`rd3-compare-row is-${v}`} role="row" key={`${o.label}-${i}`}>
            <span className="rd3-compare-mark" aria-hidden="true">{mark}</span>
            <div className="rd3-compare-body">
              <strong>{o.label}</strong>
              {o.note ? <p>{o.note}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// timeline → ordered items (fastest/first → slowest/last) with a time chip and a
// proportional bar, the winning move highlighted. Built for onset-speed and
// sequence discriminators, exactly the axis the distractors turn on.
function Timeline({ items }: { items: Item[] }) {
  const minutes = (s: string): number => {
    const t = String(s).toLowerCase();
    const n = firstNumber(t);
    if (n === null) return /hour|hr|day/.test(t) ? 600 : /min/.test(t) ? 20 : 30;
    if (/hour|hr/.test(t)) return n * 60;
    if (/day/.test(t)) return n * 1440;
    if (/sec/.test(t)) return n / 60;
    return n; // assume minutes
  };
  const vals = items.map((it) => minutes(it.value));
  const max = Math.max(...vals, 1);
  return (
    <div className="rd3-timeline" role="img" aria-label="Onset / sequence comparison">
      {items.map((it, i) => {
        const pct = Math.max(6, Math.round((Math.sqrt(vals[i]) / Math.sqrt(max)) * 100));
        return (
          <div className={`rd3-tl-row${it.highlight ? " is-win" : ""}`} key={`${it.label}-${i}`}>
            <div className="rd3-tl-head">
              <strong>{it.label}</strong>
              <span className="rd3-tl-time">{it.value}</span>
            </div>
            <span className="rd3-tl-track"><span className="rd3-tl-fill" style={{ width: `${pct}%` }} /></span>
            {it.note ? <p className="rd3-tl-note">{it.note}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

const KICKER: Record<string, string> = {
  trend: "Lab / vital chart",
  compare: "Answer breakdown",
  timeline: "Onset & priority",
};

export default function RationaleDiagram({ data }: { data: VisualRationale }) {
  const hasMetrics = Array.isArray(data.metrics) && data.metrics.length > 0;
  const hasNodes = Array.isArray(data.nodes) && data.nodes.length > 0;
  const hasOptions = Array.isArray(data.options) && data.options.length > 0;
  const hasItems = Array.isArray(data.items) && data.items.length > 0;
  if (!hasMetrics && !hasNodes && !hasOptions && !hasItems) return null;
  const isTrend = data.type === "trend" && hasMetrics;
  const kicker = KICKER[data.type] ?? "Study flowchart";

  return (
    <figure className={`rationale-diagram is-${data.type}`} aria-label={`Diagram: ${data.title}`}>
      <figcaption className="rationale-diagram__head">
        <span className="rationale-diagram__kicker">{kicker}</span>
        <strong>{data.title}</strong>
        {data.caption ? <small>{data.caption}</small> : null}
      </figcaption>

      {hasOptions ? (
        <CompareMatrix options={data.options!} />
      ) : hasItems ? (
        <Timeline items={data.items!} />
      ) : isTrend ? (
        <div className="rd3-rows">{data.metrics!.map((m, i) => <GaugeRow metric={m} key={`${m.label}-${i}`} />)}</div>
      ) : hasNodes ? (
        <Flowchart nodes={data.nodes!} />
      ) : hasMetrics ? (
        <div className="rd3-rows">{data.metrics!.map((m, i) => <GaugeRow metric={m} key={`${m.label}-${i}`} />)}</div>
      ) : null}

      {data.conclusion ? <p className="rationale-diagram__conclusion">{data.conclusion}</p> : null}
    </figure>
  );
}
