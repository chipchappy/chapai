"use client";

import type { BowTieQuestion } from "@/lib/types";
import type { PracticeAnswer } from "@/lib/practice-types";

type BowTieAnswer = {
  center?: string;
  leftActions?: string[];
  rightMonitoring?: string[];
};

interface BowTieSelectorProps {
  bowTie: BowTieQuestion;
  value: PracticeAnswer;
  correctAnswer?: PracticeAnswer;
  answered: boolean;
  disabled?: boolean;
  onChange: (answer: PracticeAnswer) => void;
}

function toBowTieAnswer(value: PracticeAnswer): BowTieAnswer {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return {
    center: typeof value.center === "string" ? value.center : undefined,
    leftActions: Array.isArray(value.leftActions) ? value.leftActions.map(String) : [],
    rightMonitoring: Array.isArray(value.rightMonitoring) ? value.rightMonitoring.map(String) : [],
  };
}

function correctIds(value: PracticeAnswer | undefined, key: keyof BowTieAnswer) {
  const answer = value ? toBowTieAnswer(value) : {};
  const entry = answer[key];
  return Array.isArray(entry) ? entry : typeof entry === "string" ? [entry] : [];
}

function toggleList(list: string[] | undefined, id: string, limit: number) {
  const current = list ?? [];
  if (current.includes(id)) {
    return current.filter((value) => value !== id);
  }
  return [...current, id].slice(-limit);
}

export function BowTieSelector({ bowTie, value, correctAnswer, answered, disabled, onChange }: BowTieSelectorProps) {
  const selected = toBowTieAnswer(value);
  const correctCenter = correctIds(correctAnswer, "center");
  const correctLeft = correctIds(correctAnswer, "leftActions");
  const correctRight = correctIds(correctAnswer, "rightMonitoring");

  const update = (next: BowTieAnswer) => onChange(next as PracticeAnswer);
  const cellClass = (zone: keyof BowTieAnswer, id: string, isCorrect: boolean) => {
    const selectedIds = zone === "center"
      ? selected.center === id
      : zone === "leftActions"
        ? selected.leftActions ?? []
        : selected.rightMonitoring ?? [];
    const isSelected = Array.isArray(selectedIds) ? selectedIds.includes(id) : Boolean(selectedIds);
    const showCorrect = answered && isCorrect;
    const showWrong = answered && isSelected && !isCorrect;
    return `nclex-bowtie-cell ${isSelected ? "is-selected" : ""} ${showCorrect ? "is-correct" : ""} ${showWrong ? "is-wrong" : ""}`;
  };

  return (
    <div className="nclex-bowtie" aria-label="bow-tie response">
      <div className="nclex-bowtie-zone">
        <div className="nclex-bowtie-heading">Actions to Take</div>
        {bowTie.leftActions.map((cell) => (
          <button
            key={cell.id}
            type="button"
            disabled={disabled}
            className={cellClass("leftActions", cell.id, correctLeft.includes(cell.id))}
            onClick={() => update({ ...selected, leftActions: toggleList(selected.leftActions, cell.id, 2) })}
          >
            {cell.text}
          </button>
        ))}
      </div>
      <div className="nclex-bowtie-zone is-center">
        <div className="nclex-bowtie-heading">Condition</div>
        <button
          type="button"
          disabled={disabled}
          className={cellClass("center", bowTie.center.id, correctCenter.includes(bowTie.center.id))}
          onClick={() => update({ ...selected, center: selected.center === bowTie.center.id ? undefined : bowTie.center.id })}
        >
          {bowTie.center.text}
        </button>
      </div>
      <div className="nclex-bowtie-zone">
        <div className="nclex-bowtie-heading">Parameters to Monitor</div>
        {bowTie.rightMonitoring.map((cell) => (
          <button
            key={cell.id}
            type="button"
            disabled={disabled}
            className={cellClass("rightMonitoring", cell.id, correctRight.includes(cell.id))}
            onClick={() => update({ ...selected, rightMonitoring: toggleList(selected.rightMonitoring, cell.id, 2) })}
          >
            {cell.text}
          </button>
        ))}
      </div>
    </div>
  );
}
