from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "src" / "styles" / "globals.css"

css = r"""
/* ---------- Practice center catalog v3 — big CTA + progress bars + baseline ---------- */

.quiz-catalog-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 22px;
  align-items: stretch;
}

@media (max-width: 980px) {
  .quiz-catalog-hero {
    grid-template-columns: 1fr;
  }
}

.quiz-catalog-hero__main {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.quiz-catalog-hero__cta {
  appearance: none;
  border: 0;
  cursor: pointer;
  padding: 36px 32px;
  border-radius: 28px;
  background: linear-gradient(135deg, var(--c-sage-deep) 0%, var(--c-sage-deep-hover) 100%);
  color: #fcf8ee;
  font-family: var(--font-cta);
  text-align: left;
  box-shadow: 0 22px 50px rgba(46, 36, 20, 0.16);
  transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  overflow: hidden;
  min-height: 168px;
  justify-content: center;
}

.quiz-catalog-hero__cta::after {
  content: "→";
  position: absolute;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 2.2rem;
  font-family: var(--font-cta);
  font-weight: 400;
  color: rgba(252, 248, 238, 0.7);
  transition: transform 0.3s ease, color 0.3s ease;
}

.quiz-catalog-hero__cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 28px 64px rgba(46, 36, 20, 0.22);
  filter: brightness(1.05);
}

.quiz-catalog-hero__cta:hover::after {
  color: #fcf8ee;
  transform: translateY(-50%) translateX(6px);
}

.quiz-catalog-hero__cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

[data-theme="dark"] .quiz-catalog-hero__cta {
  background: linear-gradient(135deg, var(--c-sage) 0%, var(--c-sage-deep) 100%);
  color: #15171a;
}
[data-theme="dark"] .quiz-catalog-hero__cta::after {
  color: rgba(21, 23, 26, 0.6);
}
[data-theme="dark"] .quiz-catalog-hero__cta:hover::after { color: #15171a; }

.quiz-catalog-hero__cta-text {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(2rem, 3.8vw, 2.8rem);
  letter-spacing: -0.022em;
  line-height: 1.05;
}

.quiz-catalog-hero__cta-meta {
  font-family: var(--font-cta);
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  opacity: 0.88;
}

/* Advanced disclosure rebuilt */
.quiz-catalog-advanced {
  border-radius: 22px;
  border: 1px solid var(--c-border-soft);
  background: color-mix(in srgb, var(--c-bg-elevated) 45%, transparent);
  padding: 14px 20px;
  transition: background 0.25s ease;
}

.quiz-catalog-advanced[open] {
  background: color-mix(in srgb, var(--c-bg-elevated) 70%, transparent);
}

.quiz-catalog-advanced__summary {
  cursor: pointer;
  font-family: var(--font-cta);
  font-size: 0.84rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  color: var(--c-text-muted);
  text-transform: uppercase;
  user-select: none;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quiz-catalog-advanced__summary::-webkit-details-marker { display: none; }

.quiz-catalog-advanced__summary::before {
  content: "+";
  font-weight: 700;
  font-size: 1rem;
  color: var(--c-gold-deep);
  width: 16px;
  display: inline-block;
}

.quiz-catalog-advanced[open] .quiz-catalog-advanced__summary::before { content: "−"; }

.quiz-catalog-advanced__grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: auto auto;
  gap: 18px 24px;
  align-items: end;
}

.quiz-catalog-advanced__grid .quiz-catalog-advanced__group--wide {
  grid-column: 1 / -1;
}

.quiz-catalog-advanced__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.quiz-catalog-advanced__toggles {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 6px;
  border-top: 1px dashed var(--c-border-soft);
}

/* Baseline suggestion card */
.quiz-catalog-baseline {
  border-radius: 28px;
  padding: 28px 28px 26px;
  background: linear-gradient(160deg,
    color-mix(in srgb, var(--c-adobe) 14%, transparent) 0%,
    color-mix(in srgb, var(--c-gold) 10%, transparent) 60%,
    color-mix(in srgb, var(--c-bg-elevated) 50%, transparent) 100%);
  border: 1px solid color-mix(in srgb, var(--c-adobe) 28%, transparent);
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  box-shadow: var(--c-shadow-card);
}

[data-theme="dark"] .quiz-catalog-baseline {
  background: linear-gradient(160deg,
    color-mix(in srgb, var(--c-adobe) 16%, transparent) 0%,
    color-mix(in srgb, var(--c-gold) 8%, transparent) 60%,
    color-mix(in srgb, var(--c-bg-elevated) 60%, transparent) 100%);
}

.quiz-catalog-baseline__kicker {
  font-family: var(--font-cta);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-adobe);
}

.quiz-catalog-baseline__title {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(1.4rem, 2.2vw, 1.7rem);
  color: var(--c-text-strong);
  letter-spacing: -0.018em;
  line-height: 1.1;
}

.quiz-catalog-baseline__body {
  font-family: var(--font-inter);
  font-size: 0.94rem;
  line-height: 1.55;
  color: var(--c-text-body);
}

.quiz-catalog-baseline__cta {
  appearance: none;
  border: 0;
  cursor: pointer;
  margin-top: 6px;
  padding: 12px 18px;
  border-radius: 999px;
  background: var(--c-adobe);
  color: #fff8ec;
  font-family: var(--font-cta);
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.01em;
  width: fit-content;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.quiz-catalog-baseline__cta:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

.quiz-catalog-baseline__cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quiz-catalog-baseline__meta {
  font-family: var(--font-cta);
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  color: var(--c-text-muted);
}

/* Category tile — progress bar variant */
.quiz-catalog-tile__progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quiz-catalog-tile__progress-track {
  height: 6px;
  border-radius: 999px;
  background: var(--c-border-soft);
  overflow: hidden;
}

.quiz-catalog-tile__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--c-gold) 0%, var(--c-sage) 100%);
  transition: width 0.5s ease, background 0.3s ease;
}

.quiz-catalog-tile__progress-fill.is-strong {
  background: linear-gradient(90deg, var(--c-sage) 0%, var(--c-sage-deep) 100%);
}

.quiz-catalog-tile__progress-fill.is-weak {
  background: linear-gradient(90deg, var(--c-adobe) 0%, var(--c-gold) 100%);
}

.quiz-catalog-tile__progress-meta {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-cta);
  font-size: 0.74rem;
  color: var(--c-text-muted);
  letter-spacing: 0.04em;
}

.quiz-catalog-tile__progress-meta span:last-child {
  color: var(--c-gold-deep);
  font-weight: 600;
}

[data-theme="dark"] .quiz-catalog-tile__progress-meta span:last-child {
  color: var(--c-gold);
}
"""

with open(target, "a", encoding="utf-8") as fh:
    fh.write(css)

print(f"Appended {len(css)} chars")
