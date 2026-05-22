"use client";

import type { IndicatedGridRow } from "@/lib/exam/itemTypes";
import styles from "./IndicatedGrid.module.css";

type Choice = "indicated" | "not-indicated";

export default function IndicatedGrid({
  rows,
  answers,
  submitted,
  onChange,
}: {
  rows: IndicatedGridRow[];
  answers: Record<string, Choice | undefined>;
  submitted: boolean;
  onChange: (rowId: string, value: Choice) => void;
}) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Potential Nursing Interventions</th>
            <th scope="col">Indicated</th>
            <th scope="col">Not Indicated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td>{index + 1}. {row.text}</td>
              {(["indicated", "not-indicated"] as const).map((choice) => {
                const selected = answers[row.id] === choice;
                const isCorrect = row.correct === choice;
                return (
                  <td key={choice}>
                    <label className={styles.choice}>
                      {submitted && selected ? (
                        <span className={styles.marker} data-kind={isCorrect ? "correct" : "wrong"} aria-hidden="true">
                          {isCorrect ? "\u2713" : "\u00d7"}
                        </span>
                      ) : null}
                      <input
                        type="radio"
                        name={row.id}
                        value={choice}
                        checked={selected}
                        disabled={submitted}
                        aria-label={`${row.text}: ${choice}`}
                        onChange={() => onChange(row.id, choice)}
                      />
                    </label>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>Note: Each row must have 1 response option selected.</p>
    </div>
  );
}
