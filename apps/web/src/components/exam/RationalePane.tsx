import { FileText } from "lucide-react";
import BurnStagingTable from "./BurnStagingTable";
import HighlightStem from "./HighlightStem";
import IndicatedGrid from "./IndicatedGrid";
import PartialCreditPanel from "./PartialCreditPanel";
import RationaleSection from "./RationaleSection";
import type { ExamItem } from "@/lib/exam/itemTypes";
import styles from "./RationalePane.module.css";

type GridChoice = "indicated" | "not-indicated";

function getCredit(item: ExamItem, answers: Record<string, GridChoice | undefined>, highlighted: Set<string>) {
  if (item.type === "indicated-grid") {
    return item.rows.reduce((total, row) => total + (answers[row.id] === row.correct ? 1 : 0), 0);
  }

  let credit = 0;
  for (const row of item.bodySystemRows) {
    for (const segment of row.findings) {
      if (segment.correct && highlighted.has(segment.id)) {
        credit += 1;
      }
    }
  }
  return credit;
}

export default function RationalePane({
  item,
  submitted,
  highlighted,
  gridAnswers,
  onGridChange,
  onHighlightToggle,
  onSubmit,
}: {
  item: ExamItem;
  submitted: boolean;
  highlighted: Set<string>;
  gridAnswers: Record<string, GridChoice | undefined>;
  onGridChange: (rowId: string, value: GridChoice) => void;
  onHighlightToggle: (segmentId: string) => void;
  onSubmit: () => void;
}) {
  const credit = getCredit(item, gridAnswers, highlighted);

  return (
    <aside className={styles.pane} aria-label="Rationale pane">
      <p className={styles.prompt}>{item.prompt}</p>
      {item.type === "highlight" ? (
        <HighlightStem item={item} selected={highlighted} submitted={submitted} onToggle={onHighlightToggle} />
      ) : (
        <IndicatedGrid rows={item.rows} answers={gridAnswers} submitted={submitted} onChange={onGridChange} />
      )}

      {!submitted ? (
        <button className={styles.submit} type="button" onClick={onSubmit}>
          Submit
        </button>
      ) : null}

      {submitted ? (
        <PartialCreditPanel
          credit={credit}
          maxPoints={item.maxPoints}
          avgPointsScored={item.avgPointsScored}
          scoringRule={item.scoringRule}
          timeSpentSeconds={item.timeSpentSeconds ?? 34}
        />
      ) : null}

      {!submitted ? <p className={styles.empty}>Submit the item to review scoring, rationale, and key learning points.</p> : null}

      {submitted ? (
        <>

      <h2 className={styles.heading}>
        <FileText size={18} aria-hidden="true" /> Explanation
      </h2>
      <p className={styles.copy}>{item.rationale.framing}</p>

      <div className={styles.sections}>
        <RationaleSection title="Indicated:" bullets={item.rationale.indicated} />
        <RationaleSection title="Interventions that are not indicated include:" bullets={item.rationale.notIndicated} />
        <section className={styles.takeaway}>
          <h3>Key Takeaway</h3>
          <ul>
            {item.rationale.keyTakeaway.map((takeaway) => (
              <li key={takeaway}>{takeaway}</li>
            ))}
          </ul>
        </section>
      </div>

      {item.rationale.diagrams?.includes("burn-staging") ? (
        <div className={styles.diagram}>
          <BurnStagingTable />
        </div>
      ) : null}
        </>
      ) : null}
    </aside>
  );
}
