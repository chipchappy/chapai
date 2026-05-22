"use client";

import { useMemo, useState } from "react";
import type { CaseStudyExhibit } from "@/lib/exam/itemTypes";
import styles from "./CaseStudyTabs.module.css";

export default function CaseStudyTabs({ exhibits }: { exhibits: CaseStudyExhibit[] }) {
  const [activeLabel, setActiveLabel] = useState(exhibits[0]?.label ?? "");
  const active = useMemo(
    () => exhibits.find((exhibit) => exhibit.label === activeLabel) ?? exhibits[0],
    [activeLabel, exhibits],
  );

  if (!active) {
    return null;
  }

  return (
    <div>
      <div className={styles.tabs} role="tablist" aria-label="Case study exhibits">
        {exhibits.map((exhibit) => (
          <button
            key={exhibit.label}
            className={styles.tab}
            type="button"
            role="tab"
            aria-selected={active.label === exhibit.label}
            onClick={() => setActiveLabel(exhibit.label)}
          >
            {exhibit.label}
          </button>
        ))}
      </div>
      <div className={styles.panel} role="tabpanel">
        {active.kind === "notes" ? (
          <div className={styles.notes}>
            <strong>Day 1: Emergency Department</strong>
            {active.notes?.map((note) => (
              <p className={styles.note} key={`${note.time}-${note.text}`}>
                <strong>{note.time}:</strong>
                <span>{note.text}</span>
              </p>
            ))}
          </div>
        ) : (
          <table className={styles.table}>
            <tbody>
              {active.rows?.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
