"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ChartReviewItem,
  ChartReviewMetric,
  ChartReviewModel,
  ChartReviewTab,
  RationaleNode,
} from "@/lib/chart-review-model";
import styles from "./ClinicalReviewStation.module.css";

type ClinicalReviewStationProps = {
  model: ChartReviewModel;
  defaultTab?: ChartReviewTab;
  resetKey?: string;
  variant?: "study" | "demo";
  className?: string;
  onOpenTutor?: () => void;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function metricTone(metric: ChartReviewMetric) {
  return metric.flag ?? "normal";
}

function itemTone(item: ChartReviewItem) {
  return item.tone ?? "normal";
}

const tabIcons: Record<ChartReviewTab, string> = {
  hpi: "hx",
  timeline: "tm",
  labs: "lb",
  orders: "rx",
  diagnostics: "dx",
  notes: "nt",
  rationale: "ra",
  sources: "so",
  aiTutor: "ai",
};

export function RationalePathwayDiagram({ nodes }: { nodes: RationaleNode[] }) {
  return (
    <div className={cx("clinical-review-diagram", styles.diagram)} aria-label="rationale pathway diagram">
      {nodes.slice(0, 4).map((node, index) => (
        <div key={`${node.label}-${node.value}-${index}`} className="clinical-review-diagram-node">
          <em>{String(index + 1).padStart(2, "0")}</em>
          <span>{node.label}</span>
          <strong>{node.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function ClinicalReviewStation({
  model,
  defaultTab,
  resetKey,
  variant = "study",
  className = "",
  onOpenTutor,
}: ClinicalReviewStationProps) {
  const initialTab = defaultTab ?? (model.answered ? "rationale" : model.tabs.find((tab) => tab.priority)?.id ?? "hpi");
  const [activeTab, setActiveTab] = useState<ChartReviewTab>(initialTab);
  const panelId = `clinical-review-panel-${activeTab}`;

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, resetKey]);

  const activePanel = model.panels[activeTab] ?? model.panels.hpi;
  const visibleTabs = useMemo(() => model.tabs.slice(0, 9), [model.tabs]);
  const isDebrief = model.answered && activeTab === "rationale";
  const primaryButtonLabel = model.canOpenTutor ? "open ai tutor" : "submit to unlock tutor";
  const tabValue = (tabId: ChartReviewTab) => model.tabs.find((tab) => tab.id === tabId)?.value ?? "";
  const commandCards = [
    {
      label: "station",
      value: model.stationLabel,
      detail: model.stationMode,
    },
    {
      label: "mode",
      value: model.answered ? "debrief open" : "answer blind",
      detail: model.answered ? "rationale unlocked" : "no answer reveal",
    },
    {
      label: "chart state",
      value: activePanel.eyebrow,
      detail: activePanel.title,
    },
    {
      label: "handoff",
      value: model.canOpenTutor ? "tutor ready" : "tutor locked",
      detail: model.sources.length ? `${model.sources.length} source cues` : "sources attached",
    },
  ];
  const workflowZones: Array<{
    id: ChartReviewTab;
    label: string;
    value: string;
    hint: string;
    tone: "case" | "flow" | "data" | "locked" | "open";
  }> = [
    {
      id: "hpi",
      label: "case",
      value: tabValue("hpi") || "hpi",
      hint: "chief concern, history, baseline",
      tone: "case",
    },
    {
      id: "timeline",
      label: "timeline",
      value: tabValue("timeline") || "events",
      hint: "what changed first and what changed last",
      tone: "flow",
    },
    {
      id: "labs",
      label: "data",
      value: `${tabValue("labs") || "labs"} / ${tabValue("orders") || "orders"}`,
      hint: "labs, orders, diagnostics",
      tone: "data",
    },
    {
      id: "rationale",
      label: "debrief",
      value: model.answered ? "open" : "locked",
      hint: model.answered ? "rationale, diagram, sources" : "answer first to reveal",
      tone: model.answered ? "open" : "locked",
    },
    {
      id: "aiTutor",
      label: "tutor",
      value: model.canOpenTutor ? "ready" : "locked",
      hint: model.canOpenTutor ? "ask with chart context attached" : "unlocks after submit",
      tone: model.canOpenTutor ? "open" : "locked",
    },
  ];

  return (
    <section
      className={cx("clinical-review-station", styles.shell, `is-${variant}`, className)}
      data-answered={model.answered ? "true" : "false"}
      data-active-tab={activeTab}
      data-agent-directive="claude-ui-redesign-2026-05-07"
      data-claude-redesign="true"
    >
      <header className={cx("clinical-review-titlebar", styles.titlebar)}>
        <div className="clinical-review-leds" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div>
          <span>{model.stationLabel}</span>
          <h3>{model.answered ? "rationale control room" : "clinical decision workspace"}</h3>
        </div>
        <em>{model.statusLabel}</em>
        <span className="sr-only" aria-live="polite">
          {model.answered ? "Answer submitted. Rationale and tutor review are available." : "Pre-answer mode. Correct answer and rationale are locked."}
        </span>
      </header>

      <div className={styles.commandBand} aria-label="Claude directed review controls">
        {commandCards.map((card) => (
          <div key={card.label} className={styles.commandCell}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <em>{card.detail}</em>
          </div>
        ))}
      </div>

      <div className={cx("clinical-review-patient-banner", styles.patientBanner)}>
        <button type="button" className={cx("clinical-review-patient-main", styles.patientMain)} onClick={() => setActiveTab("hpi")}>
          <span>patient snapshot</span>
          <strong>{model.patientTitle}</strong>
          <em>{model.patientCaption}</em>
        </button>
        <div className={cx("clinical-review-patient-stats", styles.patientStats)}>
          {model.patientStats.slice(0, 4).map((item) => (
            <button
              key={`${item.label}-${item.value}`}
              type="button"
              data-tone={itemTone(item)}
              onClick={() => setActiveTab(item.label === "alerts" ? "diagnostics" : "hpi")}
            >
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </button>
          ))}
        </div>
      </div>

      <nav className={cx("clinical-review-tabs", styles.tabs)} role="tablist" aria-label="chart review sections">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cx(activeTab === tab.id && "is-active", tab.locked && "is-locked", tab.priority && "is-priority")}
            aria-selected={activeTab === tab.id}
            aria-disabled={tab.locked || undefined}
            aria-controls={`clinical-review-panel-${tab.id}`}
            id={`clinical-review-tab-${tab.id}`}
            data-has-badge={tab.value ? "true" : "false"}
            role="tab"
          >
            <em aria-hidden="true">{tabIcons[tab.id]}</em>
            <span>{tab.label}</span>
            <strong>{tab.value}</strong>
          </button>
        ))}
      </nav>

      <div className={cx("clinical-review-workflow-strip", styles.workflow)} aria-label="case study workflow">
        {workflowZones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            className={cx(activeTab === zone.id && "is-active")}
            data-zone={zone.tone}
            aria-pressed={activeTab === zone.id}
            onClick={() => setActiveTab(zone.id)}
          >
            <span>{zone.label}</span>
            <strong>{zone.value}</strong>
            <em>{zone.hint}</em>
          </button>
        ))}
      </div>

      <div className={cx("clinical-review-body", styles.body)}>
        <aside className={cx("clinical-review-cue-panel", styles.cuePanel)} aria-label="priority cues">
          <div>
            <span>priority cues</span>
            <strong>{model.answered ? "debrief focus" : "review before answer"}</strong>
          </div>
          <div className={cx("clinical-review-cue-list", styles.cueList)}>
            {model.priorityCues.slice(0, 4).map((cue) => (
              <button key={cue} type="button" onClick={() => setActiveTab(model.answered ? "rationale" : "diagnostics")}>
                {cue}
              </button>
            ))}
          </div>
          <button type="button" className={cx("clinical-review-primary-action", styles.primaryAction)} disabled={!model.canOpenTutor} onClick={onOpenTutor}>
            {primaryButtonLabel}
          </button>
        </aside>

        <section
          id={panelId}
          className={cx("clinical-review-panel", styles.panel, `is-${activeTab}`, isDebrief && "is-debrief")}
          role="tabpanel"
          aria-labelledby={`clinical-review-tab-${activeTab}`}
        >
          <div className={cx("clinical-review-panel-head", styles.panelHead)}>
            <div>
              <p>{activePanel.eyebrow}</p>
              <strong>{activePanel.title}</strong>
            </div>
            <div className={cx("clinical-review-panel-actions", styles.panelActions)}>
              <button type="button" onClick={() => setActiveTab(model.answered ? "rationale" : "diagnostics")}>
                {model.answered ? "rationale" : "abnormal cues"}
              </button>
              <button type="button" onClick={() => setActiveTab("sources")}>
                sources
              </button>
              <button type="button" onClick={() => setActiveTab("aiTutor")}>
                tutor
              </button>
            </div>
          </div>

          {activeTab === "rationale" ? (
            <div className="clinical-review-rationale">
              <div className={cx("clinical-review-debrief-banner", styles.debriefBanner, model.answered ? "is-open" : "is-locked")}>
                <span>{model.answered ? model.resultLabel ?? "debrief open" : "locked before submit"}</span>
                <strong>{model.answered ? `target: ${model.answerTarget}` : "submit first to reveal the answer"}</strong>
              </div>
              <div className={cx("clinical-review-rationale-hero", styles.rationaleHero)}>
                <span>{model.resultLabel ?? (model.answered ? "debrief" : "locked")}</span>
                <strong>{model.rationaleTitle}</strong>
                <p>{model.rationaleText}</p>
              </div>
              <RationalePathwayDiagram nodes={model.diagramNodes} />
              <div className="clinical-review-footer-row">
                <button type="button" onClick={() => setActiveTab("sources")}>
                  {model.sources.length} source cues
                </button>
                <button type="button" disabled={!model.canOpenTutor} onClick={onOpenTutor}>
                  {primaryButtonLabel}
                </button>
              </div>
            </div>
          ) : activeTab === "aiTutor" ? (
            <div className="clinical-review-tutor">
              <div className={cx("clinical-review-rationale-hero", styles.rationaleHero)}>
                <span>{model.canOpenTutor ? "context attached" : "locked"}</span>
                <strong>{activePanel.title}</strong>
                <p>{activePanel.summary}</p>
              </div>
              <div className={cx("clinical-review-tutor-grid", styles.tutorGrid)}>
                {model.tutorPrompts.slice(0, 4).map((prompt) => (
                  <details key={`${prompt.label}-${prompt.value}`} className={cx("clinical-review-expand-card", styles.expandCard)} data-tone={model.canOpenTutor ? "open" : "locked"}>
                    <summary>
                      <span>{prompt.label ?? "tutor"}</span>
                      <strong>{prompt.value}</strong>
                    </summary>
                    <p>{model.canOpenTutor ? "Open the tutor to review this exact chart, answer, and rationale context." : "Submit an answer to unlock the AI tutor handoff."}</p>
                    <button type="button" disabled={!model.canOpenTutor} onClick={onOpenTutor}>
                      {primaryButtonLabel}
                    </button>
                  </details>
                ))}
              </div>
            </div>
          ) : (
            <div className={cx("clinical-review-panel-content", styles.panelContent)}>
              <p>{activePanel.summary}</p>
              {activePanel.metrics?.length ? (
                <div className={cx("clinical-review-metric-grid", styles.metricGrid)}>
                  {activePanel.metrics.slice(0, 6).map((metric) => (
                    <details
                      key={`${metric.label}-${metric.value}`}
                      className={cx("clinical-review-metric clinical-review-expand-card", styles.expandCard, `is-${metricTone(metric)}`)}
                      data-tone={metricTone(metric)}
                      aria-label={`${metric.label}: ${metric.value}${metric.flag && metric.flag !== "normal" ? `, ${metric.flag}` : ""}`}
                    >
                      <summary>
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                        <em>{metric.detail ?? metric.flag ?? "expected"}</em>
                      </summary>
                      <p>{metric.detail ?? (metric.flag && metric.flag !== "normal" ? `${metric.flag} value. Compare it to the clinical trend before selecting.` : "Expected value for this decision.")}</p>
                    </details>
                  ))}
                </div>
              ) : (
                <div className={cx("clinical-review-item-grid", styles.itemGrid)}>
                  {(activeTab === "sources" ? model.sources : activePanel.items ?? []).slice(0, 6).map((item) => (
                    <details
                      key={`${item.label}-${item.value}`}
                      className={cx("clinical-review-item clinical-review-expand-card", styles.expandCard, `is-${itemTone(item)}`)}
                      data-tone={itemTone(item)}
                    >
                      <summary>
                        {item.label ? <span>{item.label}</span> : null}
                        <strong>{item.value}</strong>
                      </summary>
                      <p>{item.value}</p>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      <footer className={cx("clinical-review-footer-dock", styles.footerDock)} aria-label="chart review quick actions">
        <button type="button" onClick={() => setActiveTab("hpi")} className={activeTab === "hpi" ? "is-active" : ""}>
          case context
        </button>
        <button type="button" onClick={() => setActiveTab("labs")} className={activeTab === "labs" ? "is-active" : ""}>
          labs/orders
        </button>
        <button type="button" onClick={() => setActiveTab("rationale")} className={activeTab === "rationale" ? "is-active" : ""}>
          {model.answered ? "rationale" : "rationale locked"}
        </button>
        <button type="button" onClick={() => setActiveTab("aiTutor")} className={activeTab === "aiTutor" ? "is-active" : ""}>
          {model.canOpenTutor ? "ai tutor" : "tutor locked"}
        </button>
      </footer>
    </section>
  );
}
