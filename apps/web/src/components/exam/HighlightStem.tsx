"use client";

import type { HighlightItem } from "@/lib/exam/itemTypes";
import styles from "./HighlightStem.module.css";

export default function HighlightStem({
  item,
  selected,
  submitted,
  onToggle,
  echoOnly = false,
}: {
  item: HighlightItem;
  selected: Set<string>;
  submitted: boolean;
  onToggle?: (segmentId: string) => void;
  echoOnly?: boolean;
}) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Body System</th>
            <th scope="col">Findings</th>
          </tr>
        </thead>
        <tbody>
          {item.bodySystemRows.map((row) => (
            <tr key={row.system}>
              <td className={styles.system}>{row.system}</td>
              <td>
                {row.findings.map((segment, index) => {
                  const isSelected = selected.has(segment.id);
                  const shouldMarkCorrect = submitted && segment.correct;
                  const shouldMarkWrong = submitted && isSelected && !segment.correct;
                  return (
                    <span key={segment.id}>
                      <button
                        className={styles.segment}
                        type="button"
                        data-selected={isSelected}
                        data-correct={submitted && segment.correct ? true : echoOnly ? segment.correct : undefined}
                        disabled={submitted || echoOnly}
                        onClick={() => onToggle?.(segment.id)}
                      >
                        {shouldMarkCorrect ? <span className={styles.marker} data-kind="correct" aria-hidden="true">{"\u2713"}</span> : null}
                        {shouldMarkWrong ? <span className={styles.marker} data-kind="wrong" aria-hidden="true">{"\u00d7"}</span> : null}
                        {segment.label}
                      </button>
                      {index < row.findings.length - 1 ? "; " : ""}
                    </span>
                  );
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
