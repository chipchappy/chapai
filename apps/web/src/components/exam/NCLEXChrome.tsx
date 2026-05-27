"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, Calculator, Clock3, FileText, Pause, Settings } from "lucide-react";
import styles from "./NCLEXChrome.module.css";

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export default function NCLEXChrome({
  questionNumber,
  totalQuestions,
  submitted,
  children,
  onEnd,
  onPrevious,
  onNext,
  onMarkForReview,
  onStatus,
}: {
  questionNumber: number;
  totalQuestions: number;
  submitted: boolean;
  children: React.ReactNode;
  onEnd: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onMarkForReview: () => void;
  onStatus: (status: "learning" | "reviewing" | "mastered") => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [modal, setModal] = useState<"calculator" | "settings" | null>(null);
  const [calcValue, setCalcValue] = useState("");

  useEffect(() => {
    if (paused) {
      return;
    }
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const displayTime = useMemo(() => formatElapsed(elapsed), [elapsed]);

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div>NCLEX-RN Test (Tutored, Untimed)</div>
        <div className={styles.wordmark}>Clarity</div>
        <div className={styles.topRight}>
          <span className={styles.topItem}><Clock3 size={18} aria-hidden="true" /> {displayTime}</span>
          <span className={styles.topItem}><FileText size={18} aria-hidden="true" /> Question {questionNumber} of {totalQuestions}</span>
        </div>
      </header>

      <div className={styles.subbar}>
        <button className={styles.toolButton} type="button" onClick={() => setModal(modal === "calculator" ? null : "calculator")}>
          <Calculator size={18} aria-hidden="true" /> Calculator
        </button>
        <div className={styles.toolGroup}>
          <button className={styles.toolButton} type="button" onClick={() => setModal(modal === "settings" ? null : "settings")}>
            <Settings size={18} aria-hidden="true" /> Settings
          </button>
          <button className={styles.toolButton} type="button" onClick={onMarkForReview}>
            <Bookmark size={18} aria-hidden="true" /> Mark for Review
          </button>
        </div>
      </div>

      <main className={styles.content}>{children}</main>

      <footer className={styles.bottombar}>
        <div className={styles.bottomLeft}>
          <button className={styles.bottomButton} type="button" onClick={onEnd}>End</button>
          <button className={styles.bottomButton} type="button" onClick={() => setPaused((value) => !value)}>
            <Pause size={17} aria-hidden="true" /> {paused ? "Resume" : "Pause"}
          </button>
        </div>
        <div className={styles.bottomCenter}>
          {submitted ? (
            <>
              <button className={styles.status} data-status="learning" type="button" onClick={() => onStatus("learning")}>Learning</button>
              <button className={styles.status} data-status="reviewing" type="button" onClick={() => onStatus("reviewing")}>Reviewing</button>
              <button className={styles.status} data-status="mastered" type="button" onClick={() => onStatus("mastered")}>Mastered</button>
            </>
          ) : null}
        </div>
        <div className={styles.bottomRight}>
          <button className={styles.bottomButton} type="button" onClick={onPrevious}>Previous</button>
          <button className={styles.bottomButton} type="button">Navigate</button>
          <button className={styles.bottomButton} type="button" onClick={onNext}>Next</button>
        </div>
      </footer>

      {modal === "calculator" ? (
        <aside className={styles.modal} aria-label="Calculator">
          <div className={styles.modalHeader}>
            <span>Calculator</span>
            <button type="button" onClick={() => setModal(null)}>Close</button>
          </div>
          <div className={styles.modalBody}>
            <input aria-label="Calculator display" value={calcValue} readOnly />
            <div className={styles.calcKeys}>
              {["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "sqrt", "+"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === "sqrt") {
                      setCalcValue((value) => String(Math.sqrt(Number(value) || 0)));
                    } else {
                      setCalcValue((value) => `${value}${key}`);
                    }
                  }}
                >
                  {key}
                </button>
              ))}
              <button type="button" onClick={() => setCalcValue("")}>C</button>
              <button
                type="button"
                onClick={() => {
                  try {
                    setCalcValue(String(Function(`"use strict"; return (${calcValue || "0"})`)()));
                  } catch {
                    setCalcValue("Error");
                  }
                }}
              >
                =
              </button>
            </div>
          </div>
        </aside>
      ) : null}

      {modal === "settings" ? (
        <aside className={styles.modal} aria-label="Settings">
          <div className={styles.modalHeader}>
            <span>Settings</span>
            <button type="button" onClick={() => setModal(null)}>Close</button>
          </div>
          <div className={styles.modalBody}>
            <button className={styles.settingsButton} type="button">Standard contrast</button>
            <button className={styles.settingsButton} type="button">Large text</button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
