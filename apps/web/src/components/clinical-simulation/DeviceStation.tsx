"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./device-station.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Device station.
//
// Clicking a device in the room (computer, ventilator, pump, phone, crash cart)
// zooms INTO that device: a near-fullscreen surface, as if the student had
// stepped up to it. Closing zooms back out to the whole room.
//
// One shell for every station so the interaction is identical everywhere —
// escape closes, focus is trapped, the room stays visible behind at low opacity
// so spatial context is never lost.
// ─────────────────────────────────────────────────────────────────────────────

export default function DeviceStation({
  open,
  title,
  subtitle,
  tone = "neutral",
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  tone?: "neutral" | "screen" | "phone" | "emergency";
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      // Keep focus inside the station while it is open.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.stationScrim} data-testid="device-station" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panelRef} className={styles.station} data-tone={tone} role="dialog" aria-modal="true" aria-label={title}>
        <header className={styles.stationHeader}>
          <div>
            <span>{subtitle ?? "Bedside device"}</span>
            <strong>{title}</strong>
          </div>
          <button ref={closeRef} type="button" className={styles.stationClose} onClick={onClose} aria-label={`Close ${title} and return to the room`}>
            <X size={17} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.stationBody}>{children}</div>
      </div>
    </div>
  );
}
