from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "src" / "styles" / "globals.css"

css = r"""
/* ---------- Round 4 improvements ---------- */

/* Streak pill on practice center hero */
.quiz-catalog-head__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.quiz-catalog-streak-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-adobe) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-adobe) 32%, transparent);
  font-family: var(--font-cta);
  font-size: 0.82rem;
  letter-spacing: 0.02em;
  color: var(--c-text-body);
}

.quiz-catalog-streak-pill strong {
  font-weight: 700;
  color: var(--c-adobe);
}

.quiz-catalog-streak-pill__sep {
  color: var(--c-text-quiet);
  opacity: 0.6;
}

/* Baseline chip on dashboard hero */
.dash-hero__eyebrow-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.dash-baseline-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-sage) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-sage) 30%, transparent);
  font-family: var(--font-cta);
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  color: var(--c-text-body);
}

.dash-baseline-chip__dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--c-sage-deep);
  color: #fcf8ee;
  font-size: 0.72rem;
  font-weight: 700;
}

[data-theme="dark"] .dash-baseline-chip__dot {
  background: var(--c-sage);
  color: #15171a;
}

.dash-baseline-chip__link {
  text-decoration: none;
  font-weight: 600;
  color: var(--c-adobe);
  margin-left: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-adobe) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-adobe) 30%, transparent);
  transition: background 0.2s ease;
}

.dash-baseline-chip__link:hover {
  background: color-mix(in srgb, var(--c-adobe) 28%, transparent);
}

/* 70% pace tick on category tile progress bars */
.quiz-catalog-tile__progress-track {
  position: relative;
}

.quiz-catalog-tile__progress-track::after {
  content: "";
  position: absolute;
  top: -3px;
  bottom: -3px;
  left: 70%;
  width: 2px;
  border-radius: 1px;
  background: color-mix(in srgb, var(--c-text-strong) 28%, transparent);
  pointer-events: none;
}

[data-theme="dark"] .quiz-catalog-tile__progress-track::after {
  background: color-mix(in srgb, var(--c-text-strong) 38%, transparent);
}

/* 70% pace tick on dashboard mastery bars */
.dash-mastery__track {
  position: relative;
}

.dash-mastery__track::after {
  content: "";
  position: absolute;
  top: -3px;
  bottom: -3px;
  left: 70%;
  width: 2px;
  border-radius: 1px;
  background: color-mix(in srgb, var(--c-text-strong) 28%, transparent);
  pointer-events: none;
}

[data-theme="dark"] .dash-mastery__track::after {
  background: color-mix(in srgb, var(--c-text-strong) 38%, transparent);
}

/* Color-blind safety icons on tile progress meta */
.quiz-catalog-tile__icon {
  display: inline-block;
  font-weight: 700;
  margin-right: 4px;
}

.quiz-catalog-tile__icon.is-strong { color: var(--c-sage-deep); }
.quiz-catalog-tile__icon.is-weak { color: var(--c-adobe); }
.quiz-catalog-tile__icon.is-mid { color: var(--c-gold-deep); }

[data-theme="dark"] .quiz-catalog-tile__icon.is-strong { color: var(--c-sage); }
[data-theme="dark"] .quiz-catalog-tile__icon.is-mid { color: var(--c-gold); }

/* Empty-bank / locked-track pill state */
.quiz-catalog-pill.is-locked {
  opacity: 0.5;
  cursor: not-allowed;
  position: relative;
  background: color-mix(in srgb, var(--c-bg-elevated) 60%, transparent) !important;
  color: var(--c-text-quiet) !important;
  text-decoration: line-through;
  text-decoration-color: color-mix(in srgb, var(--c-text-strong) 30%, transparent);
  text-decoration-thickness: 1.5px;
  box-shadow: none !important;
}

.quiz-catalog-pill__lock {
  font-size: 0.7em;
  margin-left: 2px;
  text-decoration: none;
  display: inline-block;
  letter-spacing: 0;
}

/* Mobile pass for readiness exam strip — explicit 1- or 2-column at small widths */
@media (max-width: 720px) {
  .quiz-catalog-exam-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .quiz-catalog-exam-row {
    grid-template-columns: 1fr;
  }
  .quiz-catalog-exam-card { padding: 16px; }
  .quiz-catalog-exam-card__label { font-size: 0.96rem; }
}

/* Resume card (component exists but not wired by default — styles ready for future) */
.quiz-resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  border-radius: 24px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--c-gold) 14%, transparent),
    color-mix(in srgb, var(--c-bg-elevated) 50%, transparent));
  border: 1px solid color-mix(in srgb, var(--c-gold) 32%, transparent);
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.quiz-resume__copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1 1 240px;
}

.quiz-resume__kicker {
  font-family: var(--font-cta);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-gold-deep);
}

[data-theme="dark"] .quiz-resume__kicker { color: var(--c-gold); }

.quiz-resume__title {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.1rem;
  color: var(--c-text-strong);
  letter-spacing: -0.012em;
}

.quiz-resume__track {
  height: 6px;
  border-radius: 999px;
  background: var(--c-border-soft);
  overflow: hidden;
}

.quiz-resume__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--c-gold) 0%, var(--c-sage) 100%);
}

.quiz-resume__meta {
  font-family: var(--font-cta);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: var(--c-text-muted);
}

.quiz-resume__cta {
  appearance: none;
  border: 0;
  cursor: pointer;
  padding: 12px 22px;
  border-radius: 999px;
  background: var(--c-gold-deep);
  color: #fcf8ee;
  font-family: var(--font-cta);
  font-weight: 700;
  font-size: 0.96rem;
  white-space: nowrap;
  transition: filter 0.2s ease, transform 0.2s ease;
}

.quiz-resume__cta:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}
"""

with open(target, "a", encoding="utf-8") as fh:
    fh.write(css)

print(f"Appended {len(css)} chars")
