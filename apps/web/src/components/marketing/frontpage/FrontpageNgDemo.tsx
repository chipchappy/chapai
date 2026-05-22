"use client";

import { useMemo, useState } from "react";
import { ClinicalReviewStation } from "@/components/practice/ClinicalReviewStation";
import { buildDemoChartReviewModel, type ChartReviewTab } from "@/lib/chart-review-model";
import type { MarketingRouteKey } from "../marketingArtwork";

type DemoStep = {
  id: string;
  eyebrow: string;
  title: string;
  stem: string;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  correct: string | string[];
  hpi: string[];
  timeline: string[];
  labs: Array<{ label: string; value: string; flag?: "high" | "low" | "critical" }>;
  orders: string[];
  diagnostics: string[];
  rationale: string;
};

type FrontpageNgDemoProps = {
  route?: MarketingRouteKey;
};

type DemoMonitorTab = ChartReviewTab;

const routeSteps: Record<MarketingRouteKey, DemoStep[]> = {
  home: [
    {
      id: "pulm-chart",
      eyebrow: "step 1 / chart review",
      title: "read the pulmonary trend first",
      stem: "A postpartum client becomes increasingly restless and short of breath 30 minutes after delivery. Which chart finding most strongly changes the nurse's priority?",
      prompt: "Treat this like test day: read the chart beside the prompt, identify the unstable pattern, then move.",
      options: [
        { id: "a", text: "Blood pressure 104/64 mmHg" },
        { id: "b", text: "Heart rate 132/min with SpO2 falling to 89%" },
        { id: "c", text: "Pain score 6/10 at the perineum" },
        { id: "d", text: "Urine output 45 mL in the last hour" },
      ],
      correct: "b",
      hpi: ["postpartum, 30 minutes after delivery", "new restlessness and dyspnea", "sudden oxygen requirement"],
      timeline: ["08:10 HR 104, SpO2 96%", "08:20 HR 118, SpO2 93%", "08:30 HR 132, SpO2 89%"],
      labs: [
        { label: "rr", value: "30/min", flag: "high" },
        { label: "d-dimer", value: "elevated", flag: "high" },
        { label: "hgb", value: "10.7 g/dL" },
      ],
      orders: ["high-flow oxygen", "rapid response", "focused cardiopulmonary assessment"],
      diagnostics: ["abg pending", "portable chest imaging ordered", "continuous pulse oximetry active"],
      rationale:
        "Worsening tachycardia plus hypoxemia changes the whole priority structure. The safest next move is to respond to the respiratory decline before comfort findings or lower-risk chart details.",
    },
    {
      id: "pulm-ngn",
      eyebrow: "step 2 / ngn follow-up",
      title: "select the stabilizing actions",
      stem: "The nurse now suspects acute cardiopulmonary compromise. Which actions should the nurse take next? Select all that apply.",
      prompt: "NGN follow-up rewards the stabilizing bundle first: support oxygenation, keep bedside control, and gather focused data.",
      options: [
        { id: "a", text: "Apply oxygen and raise the head of the bed" },
        { id: "b", text: "Stay with the client and call for immediate support" },
        { id: "c", text: "Ambulate the client to improve perfusion" },
        { id: "d", text: "Obtain a focused cardiopulmonary assessment" },
        { id: "e", text: "Delay evaluation until the provider arrives" },
      ],
      correct: ["a", "b", "d"],
      hpi: ["shortness of breath worsening", "priority is oxygenation and bedside reassessment"],
      timeline: ["SpO2 remains < 90%", "client reports chest tightness"],
      labs: [
        { label: "respiratory rate", value: "30/min", flag: "high" },
        { label: "abg", value: "pending" },
      ],
      orders: ["rapid escalation", "monitoring maintained", "diagnostic workup in progress"],
      diagnostics: ["telemetry attached", "portable chest imaging requested"],
      rationale:
        "The correct NGN moves stabilize first: oxygen, presence, support, and focused reassessment. Ambulation and delay both add risk.",
    },
    {
      id: "pulm-priority",
      eyebrow: "step 3 / final move",
      title: "commit to the safest bedside response",
      stem: "The provider arrives and asks which bedside action is most appropriate while diagnostics are being arranged. Which response by the nurse is best?",
      prompt: "Finish the sequence the same way students are tested: tie the pattern to one safest immediate action.",
      options: [
        { id: "a", text: "Encourage slow deep breathing and reassess in 15 minutes" },
        { id: "b", text: "Prepare the client for immediate transport without oxygen support" },
        { id: "c", text: "Maintain oxygen support, continuous monitoring, and rapid bedside reassessment" },
        { id: "d", text: "Offer oral fluids while waiting for imaging" },
      ],
      correct: "c",
      hpi: ["active instability persists", "ongoing monitoring is part of the intervention"],
      timeline: ["rapid response activated", "provider now bedside"],
      labs: [{ label: "status", value: "unstable", flag: "critical" }],
      orders: ["maintain oxygenation", "keep continuous monitoring", "prepare escalation based on diagnostics"],
      diagnostics: ["transport pending stabilization"],
      rationale:
        "The best answer stays on oxygenation, monitoring, and frequent reassessment. It does not drift back into comfort care or delay.",
    },
  ],
  nclex: [
    {
      id: "neuro-chart",
      eyebrow: "step 1 / chart review",
      title: "spot the neurologic change immediately",
      stem: "A post-thrombectomy client reports worsening headache and becomes harder to arouse. Which chart finding most strongly changes the nurse's priority?",
      prompt: "Read the neuro trend first. The right answer usually appears in the data before it appears in the options.",
      options: [
        { id: "a", text: "Blood pressure 146/82 mmHg" },
        { id: "b", text: "Pupils now unequal with new vomiting" },
        { id: "c", text: "Pain score 5/10 at the groin site" },
        { id: "d", text: "Urine output 40 mL over the last hour" },
      ],
      correct: "b",
      hpi: ["post-thrombectomy recovery", "new headache, vomiting, less responsiveness", "neuro deterioration suspected"],
      timeline: ["10:00 follows commands", "10:20 slower verbal response", "10:35 pupils unequal, vomiting"],
      labs: [
        { label: "gcs trend", value: "15 to 13", flag: "critical" },
        { label: "bp", value: "146/82 mmHg" },
      ],
      orders: ["keep HOB elevated", "activate stroke response", "prepare urgent imaging"],
      diagnostics: ["neuro checks q15", "transport CT requested", "anticoagulation history reviewed"],
      rationale:
        "New unequal pupils with declining responsiveness and vomiting suggests an acute neurologic complication. That finding changes the nurse's priority immediately.",
    },
    {
      id: "neuro-ngn",
      eyebrow: "step 2 / ngn follow-up",
      title: "bundle the safest neuro actions",
      stem: "Which immediate actions should the nurse take next? Select all that apply.",
      prompt: "Use the neurologic cue cluster to choose the stabilizing actions before comfort or delay.",
      options: [
        { id: "a", text: "Maintain head-of-bed elevation and airway readiness" },
        { id: "b", text: "Increase environmental stimulation to improve alertness" },
        { id: "c", text: "Stay with the client and obtain urgent help" },
        { id: "d", text: "Prepare for rapid repeat assessment and imaging" },
        { id: "e", text: "Offer oral pain medication before reassessing" },
      ],
      correct: ["a", "c", "d"],
      hpi: ["neuro decline is active", "safety and rapid reassessment come first"],
      timeline: ["new emesis", "pupil change persists"],
      labs: [{ label: "gcs", value: "13", flag: "critical" }],
      orders: ["stroke team alerted", "airway equipment ready"],
      diagnostics: ["urgent non-contrast CT pending"],
      rationale:
        "The correct NGN bundle protects airway, secures help, and moves the neurologic workup forward. Increasing stimulation or giving oral medication adds risk.",
    },
    {
      id: "neuro-priority",
      eyebrow: "step 3 / final move",
      title: "choose the safest final answer",
      stem: "While the team is preparing transport, which bedside response by the nurse is best?",
      prompt: "Finish the item the same way the exam does: pick the one action that protects the client while the next step is underway.",
      options: [
        { id: "a", text: "Keep the client supine and wait for CT staff" },
        { id: "b", text: "Maintain airway vigilance, frequent neuro reassessment, and rapid escalation" },
        { id: "c", text: "Reduce monitoring to avoid overstimulating the client" },
        { id: "d", text: "Encourage oral fluids because vomiting increases losses" },
      ],
      correct: "b",
      hpi: ["instability is ongoing", "the bedside nurse still owns the next safe move"],
      timeline: ["transport request placed", "team assembling"],
      labs: [{ label: "status", value: "unstable neuro change", flag: "critical" }],
      orders: ["frequent reassessment", "continuous monitoring", "prepare escalation"],
      diagnostics: ["CT pending"],
      rationale:
        "The bedside move is still airway vigilance, monitoring, and rapid reassessment. The safest answer maintains control while the diagnostic path is being executed.",
    },
  ],
  ccrn: [
    {
      id: "cardiac-chart",
      eyebrow: "step 1 / chart review",
      title: "find the hemodynamic danger signal",
      stem: "A septic ICU patient on vasopressor support develops cool extremities and rising lactate. Which monitor trend most strongly changes the nurse's priority?",
      prompt: "Read the monitor like a bedside workstation. The worsening perfusion pattern should stand out immediately.",
      options: [
        { id: "a", text: "MAP 70 mmHg on stable infusion" },
        { id: "b", text: "CVP 8 mmHg with urine output 45 mL/hr" },
        { id: "c", text: "ScvO2 falling while lactate rises and cap refill worsens" },
        { id: "d", text: "Sinus tachycardia at 104/min" },
      ],
      correct: "c",
      hpi: ["septic shock, vasopressor support", "cool extremities, rising lactate", "perfusion worsening"],
      timeline: ["12:00 lactate 2.8", "13:00 lactate 3.9", "14:00 lactate 4.8 with delayed cap refill"],
      labs: [
        { label: "scvo2", value: "58%", flag: "low" },
        { label: "lactate", value: "4.8 mmol/L", flag: "critical" },
        { label: "map", value: "68 mmHg" },
      ],
      orders: ["trend hemodynamics", "reassess perfusion", "prepare provider escalation"],
      diagnostics: ["arterial line active", "central line active", "urine output trending down"],
      rationale:
        "Falling ScvO2 with rising lactate and worsening perfusion signals inadequate oxygen delivery. That pattern changes the bedside priority more than the isolated MAP or heart rate.",
    },
    {
      id: "cardiac-ngn",
      eyebrow: "step 2 / bedside actions",
      title: "stabilize before you refine",
      stem: "Which immediate actions should the ICU nurse take next? Select all that apply.",
      prompt: "Stay with perfusion. The right bundle should protect oxygen delivery while the team narrows the cause.",
      options: [
        { id: "a", text: "Reassess lines, waveform quality, and perfusion findings" },
        { id: "b", text: "Escalate the worsening lactate and ScvO2 trend" },
        { id: "c", text: "Delay action until the next scheduled lactate draw" },
        { id: "d", text: "Prepare to support fluids or vasoactive adjustments per bedside response" },
        { id: "e", text: "Reduce monitoring to limit alarm fatigue" },
      ],
      correct: ["a", "b", "d"],
      hpi: ["hemodynamic deterioration is active", "bedside reassessment and escalation come first"],
      timeline: ["ScvO2 dropping", "extremities cooler each hour"],
      labs: [{ label: "lactate", value: "4.8 mmol/L", flag: "critical" }],
      orders: ["repeat perfusion exam", "prepare hemodynamic response"],
      diagnostics: ["line waveform check", "bedside ultrasound availability"],
      rationale:
        "The safest ICU response is to reassess, validate the data, escalate the trend, and prepare to support perfusion. Delay and reduced monitoring both increase harm.",
    },
    {
      id: "cardiac-priority",
      eyebrow: "step 3 / final move",
      title: "finish the bedside sequence",
      stem: "While the provider is entering new orders, which nursing response is best?",
      prompt: "Choose the answer that preserves control of the patient while the hemodynamic plan is being updated.",
      options: [
        { id: "a", text: "Maintain current monitoring, reassess perfusion continuously, and prepare rapid intervention" },
        { id: "b", text: "Pause trending until the next set of labs returns" },
        { id: "c", text: "Lower the monitor volume and address documentation first" },
        { id: "d", text: "Encourage rest and reduce bedside checks to limit stress" },
      ],
      correct: "a",
      hpi: ["perfusion remains unstable", "continuous bedside ownership still matters"],
      timeline: ["provider entering orders", "vasoactive plan under review"],
      labs: [{ label: "status", value: "shock trend worsening", flag: "critical" }],
      orders: ["maintain monitoring", "continue perfusion reassessment"],
      diagnostics: ["repeat lactate planned", "bedside ultrasound available"],
      rationale:
        "The correct answer keeps the bedside nurse in active control of the instability while the broader hemodynamic plan is being finalized.",
    },
  ],
};

const routeMeta: Record<MarketingRouteKey, { title: string; body: string; monitor: string; monitorMode: string }> = {
  home: {
    title: "a live 3-step demo of the testing workflow.",
    body: "The prompt stays left, the clinical workstation stays right, and the rationale opens in the same frame without a pile of extra marketing.",
    monitor: "pulmonary review station",
    monitorMode: "hpi / bronchioles / alveoli / labs / rationale",
  },
  nclex: {
    title: "preview the nclex workflow before buying the qbank.",
    body: "Priority logic, NGN follow-up, and final bedside action all stay inside one clean terminal deck.",
    monitor: "neural review station",
    monitorMode: "hpi / neuro trend / labs / rationale / tutor",
  },
  ccrn: {
    title: "preview the ccrn bedside flow before buying the bank.",
    body: "Trend interpretation, ICU escalation, and the final bedside move stay in one compact monitor-and-canvas view.",
    monitor: "cardiac review station",
    monitorMode: "hpi / pressures / labs / orders / rationale",
  },
};

const routeMonitorDefaultTab: Record<MarketingRouteKey, ChartReviewTab> = {
  home: "timeline",
  nclex: "timeline",
  ccrn: "labs",
};

function isCorrect(step: DemoStep, choice: string) {
  return Array.isArray(step.correct) ? step.correct.includes(choice) : step.correct === choice;
}

function prettyFlag(flag?: "high" | "low" | "critical") {
  return flag ?? "normal";
}

export default function FrontpageNgDemo({ route = "home" }: FrontpageNgDemoProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const steps = routeSteps[route];
  const active = steps[index];
  const selected = answers[active.id] ?? [];
  const submitted = selected.length > 0;
  const meta = routeMeta[route];

  const label = useMemo(() => {
    if (!submitted) return "interactive demo";
    return selected.every((choice) => isCorrect(active, choice)) && selected.length === (Array.isArray(active.correct) ? active.correct.length : 1)
      ? "clinical read locked"
      : "open rationale";
  }, [active, selected, submitted]);

  const chartReviewModel = useMemo(
    () => buildDemoChartReviewModel({ step: active, route, submitted, selected }),
    [active, route, selected, submitted],
  );

  function toggleChoice(id: string) {
    setAnswers((current) => {
      const existing = current[active.id] ?? [];
      const next = Array.isArray(active.correct)
        ? existing.includes(id)
          ? existing.filter((item) => item !== id)
          : [...existing, id]
        : [id];
      return { ...current, [active.id]: next };
    });
  }

  return (
    <section className="px-4 py-10 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="frontpage-demo-head">
          <div className="max-w-[42rem]">
            <p className="section-label">demo</p>
            <h2 className="frontpage-demo-title">{meta.title}</h2>
            <p className="frontpage-compare-copy">{meta.body}</p>
          </div>
          <div className="frontpage-demo-progress">
            {steps.map((step, stepIndex) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setIndex(stepIndex)}
                className={`frontpage-demo-progress-pill ${stepIndex === index ? "is-active" : ""}`}
              >
                {stepIndex + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="frontpage-demo-shell">
          <div className="frontpage-demo-canvas">
            <div className="frontpage-demo-canvas-head">
              <div>
                <p className="frontpage-demo-eyebrow">{active.eyebrow}</p>
                <h3 className="frontpage-demo-question-title">{active.title}</h3>
              </div>
              <span className="frontpage-demo-state">{label}</span>
            </div>

            <div className="frontpage-demo-stem">
              <p>{active.stem}</p>
            </div>

            <div className="frontpage-demo-prompt">{active.prompt}</div>

            <div className="frontpage-demo-options">
              {active.options.map((option) => {
                const chosen = selected.includes(option.id);
                const correct = submitted && isCorrect(active, option.id);
                const incorrect = submitted && chosen && !correct;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleChoice(option.id)}
                    className={`frontpage-demo-option ${chosen ? "is-selected" : ""} ${correct ? "is-correct" : ""} ${incorrect ? "is-incorrect" : ""}`}
                  >
                    <span>{option.id.toUpperCase()}</span>
                    <strong>{option.text}</strong>
                  </button>
                );
              })}
            </div>

            <div className="frontpage-demo-dock">
              <span>{submitted ? active.rationale : "answer once to open the rationale and source-ready review."}</span>
              <div className="frontpage-demo-dock-actions">
                <button type="button" onClick={() => setIndex((current) => Math.max(0, current - 1))} className="frontpage-demo-link">prev</button>
                <button type="button" onClick={() => setIndex((current) => Math.min(steps.length - 1, current + 1))} className="frontpage-demo-primary">next</button>
              </div>
            </div>
          </div>

          <div className="frontpage-demo-monitor">
            <div className="frontpage-demo-monitor-bezel">
              <div className="frontpage-demo-monitor-top">
                <div className="frontpage-demo-monitor-brand">
                  <span className="frontpage-demo-monitor-leds" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>{meta.monitor}</span>
                </div>
                <span>{meta.monitorMode}</span>
              </div>
              <div className="frontpage-demo-monitor-housing" aria-hidden="true">
                <span className="frontpage-demo-monitor-corner frontpage-demo-monitor-corner-a" />
                <span className="frontpage-demo-monitor-corner frontpage-demo-monitor-corner-b" />
                <span className="frontpage-demo-monitor-corner frontpage-demo-monitor-corner-c" />
                <span className="frontpage-demo-monitor-corner frontpage-demo-monitor-corner-d" />
                <span className="frontpage-demo-monitor-vent frontpage-demo-monitor-vent-a" />
                <span className="frontpage-demo-monitor-vent frontpage-demo-monitor-vent-b" />
              </div>
              <div className="frontpage-demo-monitor-screen">
                <div className="frontpage-demo-monitor-glow" />
                <div className="frontpage-demo-monitor-scan" />
                <div className="frontpage-demo-monitor-pixels" />
                <ClinicalReviewStation
                  model={chartReviewModel}
                  defaultTab={submitted ? "rationale" : routeMonitorDefaultTab[route]}
                  resetKey={`${active.id}-${submitted ? "submitted" : "active"}`}
                  variant="demo"
                  className="frontpage-demo-clinical-review"
                />
              </div>
              <div className="frontpage-demo-monitor-console">
                <span className="frontpage-demo-console-key">{active.timeline.length ? "timeline bus online" : "prompt bus online"}</span>
                <span className="frontpage-demo-console-key">{submitted ? "debrief live" : "await answer"}</span>
                <span className="frontpage-demo-console-key">{route === "home" ? "pulmonary station" : route === "nclex" ? "neural station" : "cardiac station"}</span>
              </div>
            </div>
            <div className="frontpage-demo-monitor-stand" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
