"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NCLEXChrome from "./NCLEXChrome";
import QuestionPane from "./QuestionPane";
import RationalePane from "./RationalePane";
import { trackEvent } from "@/lib/analytics";
import { sampleExamItems } from "@/lib/exam/itemTypes";

type GridChoice = "indicated" | "not-indicated";

export default function SampleExamRunner({ initialIndex = 0 }: { initialIndex?: number }) {
  const router = useRouter();
  const [index, setIndex] = useState(Math.min(Math.max(initialIndex, 0), sampleExamItems.length - 1));
  const [submittedById, setSubmittedById] = useState<Record<string, boolean>>({});
  const [gridAnswers, setGridAnswers] = useState<Record<string, GridChoice | undefined>>({});
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

  const item = sampleExamItems[index];
  const submitted = Boolean(submittedById[item.id]);

  function submit() {
    setSubmittedById((value) => ({ ...value, [item.id]: true }));
    trackEvent("quiz_question_answered", {
      mode: "sample",
      itemType: item.type,
      correct: false,
      partialCredit: 0,
    });
    if (item.id === "sample-highlight" || item.id === "sample-indicated-grid") {
      trackEvent("sample_question_completed", { itemType: item.type });
    }
  }

  function goNext() {
    setIndex((value) => Math.min(value + 1, sampleExamItems.length - 1));
  }

  function goPrevious() {
    setIndex((value) => Math.max(value - 1, 0));
  }

  return (
    <NCLEXChrome
      questionNumber={index + 1}
      totalQuestions={sampleExamItems.length}
      submitted={submitted}
      onEnd={() => {
        if (window.confirm("End this sample test and return to the dashboard?")) {
          router.push("/dashboard");
        }
      }}
      onPrevious={goPrevious}
      onNext={goNext}
      onMarkForReview={() => trackEvent("quiz_marked_for_review", { mode: "sample", itemType: item.type })}
      onStatus={(status) => trackEvent("quiz_status_set", { status })}
    >
      <QuestionPane
        item={item}
        questionNumber={index + 1}
        totalQuestions={sampleExamItems.length}
      />
      <RationalePane
        item={item}
        submitted={submitted}
        gridAnswers={gridAnswers}
        highlighted={highlighted}
        onGridChange={(rowId, value) => setGridAnswers((answers) => ({ ...answers, [rowId]: value }))}
        onHighlightToggle={(segmentId) => {
          setHighlighted((current) => {
            const next = new Set(current);
            if (next.has(segmentId)) {
              next.delete(segmentId);
            } else {
              next.add(segmentId);
            }
            return next;
          });
        }}
        onSubmit={submit}
      />
    </NCLEXChrome>
  );
}
