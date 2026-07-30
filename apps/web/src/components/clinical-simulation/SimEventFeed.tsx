"use client";

import { useMemo, useState } from "react";
import { Activity, ClipboardList, Gauge, ListChecks, MessageSquare } from "lucide-react";
import type { PatientState } from "@/lib/clinical-simulation/engine";
import { buildAchievements, achievementSummary } from "@/lib/clinical-simulation/achievements";
import { summarizeStateChanges } from "@/lib/clinical-simulation/clinical-language";
import { buildConcerns } from "@/lib/clinical-simulation/concerns";
import { gradeBestPracticeRoute } from "@/lib/clinical-simulation/best-practice";
import type { ClinicalScenario } from "@/lib/clinical-simulation/schema";
import styles from "./sim-event-feed.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Clinical console.
//
// The right-hand column used to be one unbounded feed that mixed decisions,
// physiology, vitals ticks and team chatter, and printed the engine's raw state
// deltas. It is now five modes over one derived event model:
//
//   Live         everything, newest first
//   Feedback     only decisions, with priority rating and rationale
//   Data         vitals and result progression
//   Tasks        what still needs attention, ranked A-B-C-D
//   Performance  score, competency streak, achievements
//
// Colour semantics are unchanged and still derived from the engine's own action
// classifications, so the console can never disagree with what the simulation did:
//
//   green   optimal / timely nursing intervention
//   yellow  acceptable but not the priority, or performed late
//   red     unsafe or incorrect
//   blue    vital-sign updates
//   gold    results, consequences, scenario progression
//   purple  messages from the care team
//
// One decision produces exactly ONE card carrying its rating, rationale, the
// patient's observable response and any team reply — not four separate entries.
// ─────────────────────────────────────────────────────────────────────────────

export type FeedKind = "optimal" | "acceptable" | "unsafe" | "vitals" | "progression" | "team";

type FeedMode = "live" | "feedback" | "data" | "tasks" | "performance";

export type FeedEntry = {
  id: string;
  minute: number;
  kind: FeedKind;
  title: string;
  detail?: string;
  /** Human-readable clinical priority rating for a decision. */
  rating?: string;
  /** Observable patient response, already translated out of engine paths. */
  response?: string;
  responseDirection?: "improved" | "worsened" | "neutral";
  /** Reply from the provider, RRT, RT or pharmacy. */
  team?: string;
  /** Set when the action's own definition expects a follow-up assessment. */
  reassess?: boolean;
  /** Index into the action log; enables "rewind to just before this decision". */
  actionIndex?: number;
};

const kindLabel: Record<FeedKind, string> = {
  optimal: "Intervention",
  acceptable: "Not priority",
  unsafe: "Unsafe",
  vitals: "Vitals",
  progression: "Change",
  team: "Team",
};

/** Engine action classification -> feed colour semantics. */
function kindForClassification(classification: string): FeedKind {
  if (["essential", "high_priority", "appropriate"].includes(classification)) return "optimal";
  if (["acceptable_alternative", "unnecessary_but_harmless", "low_value", "incomplete", "premature", "delayed"].includes(classification)) return "acceptable";
  if (["unsafe", "critical_error"].includes(classification)) return "unsafe";
  return "acceptable";
}

/** Engine classification -> the wording a debriefing instructor would use. */
const RATING_LABEL: Record<string, string> = {
  essential: "Strong clinical judgment",
  high_priority: "Strong clinical judgment",
  appropriate: "Appropriate action",
  acceptable_alternative: "Acceptable, not the priority",
  unnecessary_but_harmless: "Low-value action",
  low_value: "Low-value action",
  incomplete: "Incomplete assessment",
  premature: "Premature — sequence it later",
  delayed: "Delayed intervention",
  unsafe: "Unsafe action",
  critical_error: "Critical safety concern",
};

export function buildFeed(state: PatientState, scenario?: ClinicalScenario): FeedEntry[] {
  const entries: FeedEntry[] = [];

  state.actionLog.forEach((entry, index) => {
    const definition = scenario?.actions.find((candidate) => candidate.id === entry.actionId);
    const response = summarizeStateChanges(entry.stateChanges);
    entries.push({
      id: `act-${entry.id}`,
      minute: entry.virtualMinute,
      kind: kindForClassification(entry.classification),
      title: entry.label,
      detail: entry.feedback,
      rating: RATING_LABEL[entry.classification] ?? "Action recorded",
      response: response?.text,
      responseDirection: response?.direction,
      team: entry.teamResponse ?? undefined,
      reassess: Boolean(definition?.medication?.reassessmentMinutes) || Boolean(definition?.delayedEffects.length),
      actionIndex: index,
    });
  });

  // Scenario events and deterioration notices that were not tied to an action.
  for (const notice of state.notices) {
    if (state.actionLog.some((entry) => entry.id === notice.id)) continue;
    const response = summarizeStateChanges(notice.stateChanges);
    entries.push({
      id: `note-${notice.id}`,
      minute: notice.virtualMinute,
      kind: notice.severity === "info" ? "progression" : "progression",
      title: notice.severity === "critical" ? "Critical change" : notice.severity === "warning" ? "Clinical change" : "Update",
      detail: notice.message,
      response: response?.text,
      responseDirection: response?.direction,
    });
  }

  // Vitals trend. Only sampled where something actually moved, so a stable
  // patient does not generate an identical card every five minutes.
  const history = state.vitalsHistory ?? [];
  let lastReported: (typeof history)[number] | null = null;
  for (const sample of history) {
    if (sample.minute === 0 || sample.minute % 5 !== 0) continue;
    const moved = !lastReported
      || Math.abs(sample.heartRate - lastReported.heartRate) >= 6
      || Math.abs(sample.map - lastReported.map) >= 5
      || Math.abs(sample.spo2 - lastReported.spo2) >= 2
      || Math.abs(sample.respiratoryRate - lastReported.respiratoryRate) >= 3;
    if (!moved) continue;
    lastReported = sample;
    entries.push({
      id: `vit-${sample.minute}`,
      minute: sample.minute,
      kind: "vitals",
      title: `HR ${Math.round(sample.heartRate)} · MAP ${Math.round(sample.map)} · SpO₂ ${Math.round(sample.spo2)}% · RR ${Math.round(sample.respiratoryRate)}`,
      detail: "Monitored vital signs updated.",
    });
  }

  return entries.sort((a, b) => b.minute - a.minute || b.id.localeCompare(a.id));
}

const MODES: Array<{ id: FeedMode; label: string; icon: typeof Activity }> = [
  { id: "live", label: "Live", icon: Activity },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "data", label: "Data", icon: ClipboardList },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "performance", label: "Score", icon: Gauge },
];

export default function SimEventFeed({
  scenario,
  state,
  onRewind,
  busy = false,
}: {
  scenario: ClinicalScenario;
  state: PatientState;
  onRewind?: (keepActions: number) => void;
  busy?: boolean;
}) {
  const [mode, setMode] = useState<FeedMode>("live");
  const entries = useMemo(() => buildFeed(state, scenario), [scenario, state]);

  // Live scoring: optimal decisions build a streak, unsafe ones break it.
  const scoring = useMemo(() => {
    let optimal = 0, acceptable = 0, unsafe = 0, streak = 0, best = 0;
    for (const entry of state.actionLog) {
      const kind = kindForClassification(entry.classification);
      if (kind === "optimal") { optimal += 1; streak += 1; best = Math.max(best, streak); }
      else if (kind === "unsafe") { unsafe += 1; streak = 0; }
      else { acceptable += 1; streak = 0; }
    }
    const total = optimal + acceptable + unsafe;
    return { optimal, acceptable, unsafe, streak, best, total, pct: total ? Math.round((optimal / total) * 100) : null };
  }, [state.actionLog]);

  const achievements = useMemo(() => buildAchievements(scenario, state), [scenario, state]);
  const badges = achievementSummary(achievements);
  const nextUp = achievements.filter((a) => !a.earned && (a.progress ?? 0) > 0).sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))[0];
  const concerns = useMemo(() => buildConcerns(state), [state]);
  const grade = useMemo(() => gradeBestPracticeRoute(scenario, state), [scenario, state]);

  // Required care that has not happened yet — the "what am I forgetting" list.
  const outstanding = useMemo(
    () => scenario.completion.requiredActionIds
      .filter((id) => !state.completedActionIds.includes(id))
      .map((id) => scenario.actions.find((action) => action.id === id))
      .filter((action): action is NonNullable<typeof action> => Boolean(action)),
    [scenario.actions, scenario.completion.requiredActionIds, state.completedActionIds],
  );

  const visible = useMemo(() => {
    if (mode === "feedback") return entries.filter((entry) => entry.actionIndex != null);
    if (mode === "data") return entries.filter((entry) => entry.kind === "vitals" || entry.kind === "progression");
    return entries;
  }, [entries, mode]);

  const unsafeCount = scoring.unsafe;

  return (
    <aside className={styles.feed} aria-label="Clinical console" data-testid="sim-event-feed">
      <header>
        <span>Clinical console</span>
        <em>{entries.length} events</em>
      </header>

      <nav className={styles.feedModes} aria-label="Console view">
        {MODES.map((item) => {
          const Icon = item.icon;
          const badge = item.id === "tasks" ? concerns.filter((c) => c.severity === "critical").length + outstanding.length : 0;
          return (
            <button
              key={item.id}
              type="button"
              data-active={mode === item.id}
              onClick={() => setMode(item.id)}
              aria-current={mode === item.id}
              title={item.label}
              // Announce the count as part of the tab rather than letting the badge
              // glyph leak into the accessible name as a bare number.
              aria-label={badge > 0 ? `${item.label}, ${badge} needing attention` : item.label}
            >
              <Icon size={14} aria-hidden="true" />
              <span>{item.label}</span>
              {badge > 0 ? <em aria-hidden="true">{badge}</em> : null}
            </button>
          );
        })}
      </nav>

      {mode === "tasks" ? (
        <div className={styles.feedPane}>
          <h3 className={styles.feedPaneTitle}>Needs attention</h3>
          {concerns.length ? (
            <ol className={styles.taskList}>
              {concerns.map((concern) => (
                <li key={concern.id} data-severity={concern.severity}>
                  <strong>{concern.label}</strong>
                  <p>{concern.detail}</p>
                </li>
              ))}
            </ol>
          ) : <p className={styles.feedEmpty}>No active red flags from the current vital signs, labs, or symptoms.</p>}

          <h3 className={styles.feedPaneTitle}>Not yet done</h3>
          {outstanding.length ? (
            <ol className={styles.taskList}>
              {outstanding.map((action) => (
                <li key={action.id} data-severity="pending">
                  <strong>{action.label}</strong>
                  <p>{action.description}</p>
                </li>
              ))}
            </ol>
          ) : <p className={styles.feedEmpty}>Every required element of care has been addressed.</p>}
        </div>
      ) : mode === "performance" ? (
        <div className={styles.feedPane}>
          <div className={styles.feedScore} data-band={grade.band} aria-label="Clinical judgment score">
            <div><span>Best practice</span><strong>{grade.score}%</strong></div>
            <div><span>Streak</span><strong data-hot={scoring.streak >= 3}>{scoring.streak}{scoring.streak >= 3 ? " 🔥" : ""}</strong></div>
            <div><span>Decisions</span><strong>{scoring.total}</strong></div>
          </div>
          <p className={styles.feedHeadline}>{grade.headline}</p>
          <dl className={styles.feedMetrics}>
            <div><dt>Coverage</dt><dd>{grade.coverage}%</dd></div>
            <div><dt>Timeliness</dt><dd>{grade.timeliness}%</dd></div>
            <div><dt>Ordering</dt><dd>{grade.ordering}%</dd></div>
            <div><dt>Unsafe decisions</dt><dd data-bad={unsafeCount > 0}>{unsafeCount}</dd></div>
            <div><dt>Best streak</dt><dd>{scoring.best}</dd></div>
          </dl>
          {grade.nextFocus ? <p className={styles.feedFocus}><strong>Next focus</strong>{grade.nextFocus}</p> : null}
          <h3 className={styles.feedPaneTitle}>Competencies</h3>
          <div className={styles.feedBadgeRow}>
            {achievements.map((badge) => (
              <span key={badge.id} className={styles.feedBadge} data-earned={badge.earned} title={`${badge.label} — ${badge.detail}`} aria-label={`${badge.label}${badge.earned ? " earned" : " not yet earned"}`}>
                {badge.icon}
              </span>
            ))}
          </div>
          <small className={styles.feedBadgeNote}>
            {badges.earned}/{badges.total} earned
            {badges.latest ? <> · latest <b>{badges.latest.label}</b></> : null}
            {!badges.latest && nextUp ? <> · closest <b>{nextUp.label}</b></> : null}
          </small>
        </div>
      ) : (
        <ol className={styles.feedList} aria-live="polite">
          {visible.length ? visible.map((entry) => (
            <li key={entry.id} data-kind={entry.kind}>
              <div className={styles.feedMeta}>
                <time>+{entry.minute}m</time>
                <span className={styles.feedTag}>{entry.rating ?? kindLabel[entry.kind]}</span>
              </div>
              <strong>{entry.title}</strong>
              {entry.detail ? <p>{entry.detail}</p> : null}
              {entry.response ? (
                <p className={styles.feedResponse} data-direction={entry.responseDirection}>
                  <span>Patient response</span> {entry.response}
                </p>
              ) : null}
              {entry.team ? (
                <p className={styles.feedTeam}><span>Care team</span> {entry.team}</p>
              ) : null}
              {entry.reassess ? <span className={styles.feedReassess}>Reassessment required</span> : null}
              {entry.actionIndex != null && onRewind ? (
                <button type="button" className={styles.feedRewind} disabled={busy} onClick={() => onRewind(entry.actionIndex as number)} title="Rewind to just before this decision and try a different route">
                  ↺ Rewind to here
                </button>
              ) : null}
            </li>
          )) : (
            <li data-kind="progression">
              <strong>{mode === "feedback" ? "No decisions recorded yet." : mode === "data" ? "No trend data yet." : "You have assumed care of the patient."}</strong>
              <p>Assess, act, and reassess — every decision is recorded here.</p>
            </li>
          )}
        </ol>
      )}

      <footer className={styles.feedLegend} aria-hidden="true">
        <span data-kind="optimal">Optimal</span>
        <span data-kind="acceptable">Not priority</span>
        <span data-kind="unsafe">Unsafe</span>
        <span data-kind="vitals">Vitals</span>
        <span data-kind="progression">Change</span>
        <span data-kind="team">Team</span>
      </footer>
    </aside>
  );
}
