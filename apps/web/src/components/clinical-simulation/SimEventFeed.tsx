"use client";

import { useMemo } from "react";
import type { PatientState } from "@/lib/clinical-simulation/engine";
import styles from "./sim-event-feed.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Rolling clinical feed.
//
// One always-on column that makes cause and effect legible. Every entry is
// typed and colour-coded so a student can scan what just happened and why:
//
//   green   optimal / timely nursing intervention
//   yellow  acceptable but not the priority, or performed late
//   red     unsafe or incorrect
//   blue    vital-sign updates
//   gold    results, consequences, scenario progression
//   purple  messages from the care team
//
// Types are derived from the engine's own action classifications and notices,
// so the feed can never disagree with what the simulation actually did.
// ─────────────────────────────────────────────────────────────────────────────

export type FeedKind = "optimal" | "acceptable" | "unsafe" | "vitals" | "progression" | "team";

export type FeedEntry = {
  id: string;
  minute: number;
  kind: FeedKind;
  title: string;
  detail?: string;
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

export function buildFeed(state: PatientState): FeedEntry[] {
  const entries: FeedEntry[] = [];

  state.actionLog.forEach((entry, index) => {
    const isTeam = entry.category === "communication";
    entries.push({
      id: `act-${entry.id}`,
      minute: entry.virtualMinute,
      kind: kindForClassification(entry.classification),
      title: entry.label,
      detail: entry.feedback,
      actionIndex: index,
    });
    // A provider/team reply is its own event so the student sees the response.
    if (isTeam && entry.teamResponse) {
      entries.push({
        id: `team-${entry.id}`,
        minute: entry.virtualMinute,
        kind: "team",
        title: "Care team response",
        detail: entry.teamResponse,
      });
    }
    // Physiologic consequences of the decision.
    if (entry.stateChanges.length) {
      const summary = entry.stateChanges
        .slice(0, 4)
        .map((c) => `${c.path.split(".").pop()}: ${String(c.before)} → ${String(c.after)}`)
        .join(" · ");
      entries.push({
        id: `chg-${entry.id}`,
        minute: entry.virtualMinute,
        kind: "progression",
        title: "Patient response",
        detail: summary,
      });
    }
  });

  // Scenario events + deterioration notices that were not tied to an action.
  for (const notice of state.notices) {
    if (state.actionLog.some((entry) => entry.id === notice.id)) continue;
    entries.push({
      id: `note-${notice.id}`,
      minute: notice.virtualMinute,
      kind: notice.severity === "info" ? "progression" : "progression",
      title: notice.severity === "critical" ? "Critical change" : notice.severity === "warning" ? "Clinical change" : "Update",
      detail: notice.message,
    });
  }

  // Periodic vitals snapshots so the timeline shows the physiologic trajectory.
  const history = state.vitalsHistory ?? [];
  for (const sample of history) {
    if (sample.minute === 0 || sample.minute % 5 !== 0) continue;
    entries.push({
      id: `vit-${sample.minute}`,
      minute: sample.minute,
      kind: "vitals",
      title: `HR ${sample.heartRate} · MAP ${sample.map} · SpO₂ ${sample.spo2}% · RR ${sample.respiratoryRate}`,
    });
  }

  return entries.sort((a, b) => b.minute - a.minute || b.id.localeCompare(a.id));
}

export default function SimEventFeed({ state, onRewind, busy = false }: { state: PatientState; onRewind?: (keepActions: number) => void; busy?: boolean }) {
  const entries = useMemo(() => buildFeed(state), [state]);

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

  return (
    <aside className={styles.feed} aria-label="Clinical event feed" data-testid="sim-event-feed">
      <header>
        <span>Clinical feed</span>
        <em>{entries.length} events</em>
      </header>
      <div className={styles.feedScore} aria-label="Clinical judgment score">
        <div><span>Best practice</span><strong>{scoring.pct == null ? "—" : `${scoring.pct}%`}</strong></div>
        <div><span>Streak</span><strong data-hot={scoring.streak >= 3}>{scoring.streak}{scoring.streak >= 3 ? " 🔥" : ""}</strong></div>
        <div><span>Decisions</span><strong>{scoring.total}</strong></div>
      </div>
      <ol className={styles.feedList} aria-live="polite">
        {entries.length ? entries.map((entry) => (
          <li key={entry.id} data-kind={entry.kind}>
            <div className={styles.feedMeta}>
              <time>+{entry.minute}m</time>
              <span className={styles.feedTag}>{kindLabel[entry.kind]}</span>
            </div>
            <strong>{entry.title}</strong>
            {entry.detail ? <p>{entry.detail}</p> : null}
            {entry.actionIndex != null && onRewind ? (
              <button type="button" className={styles.feedRewind} disabled={busy} onClick={() => onRewind(entry.actionIndex as number)} title="Rewind to just before this decision and try a different route">
                ↺ Rewind to here
              </button>
            ) : null}
          </li>
        )) : <li data-kind="progression"><strong>You have assumed care of the patient.</strong><p>Assess, act, and reassess — every decision is recorded here.</p></li>}
      </ol>
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
