"use client";

import CaseStudyTabs from "./CaseStudyTabs";
import type { ExamItem } from "@/lib/exam/itemTypes";
import styles from "./QuestionPane.module.css";

export default function QuestionPane({
  item,
  questionNumber,
  totalQuestions,
}: {
  item: ExamItem;
  questionNumber: number;
  totalQuestions: number;
}) {
  return (
    <section className={styles.pane} aria-label="Question pane">
      <p className={styles.info}>The following scenario applies to the next {item.caseStudy.appliesTo} items.</p>
      <p className={styles.meta}>Item {questionNumber} of {totalQuestions}</p>
      <p className={styles.stem}>{item.caseStudy.stem}</p>
      <CaseStudyTabs exhibits={item.caseStudy.exhibits} />
    </section>
  );
}
