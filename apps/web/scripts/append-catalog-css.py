from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "src" / "styles" / "globals.css"

css = r"""
/* ---------- Practice center catalog v2 — streamlined ---------- */

.quiz-catalog-shell {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 36px;
  padding: 32px 16px 64px;
}

.quiz-catalog-head { text-align: left; max-width: 60rem; }

.quiz-catalog-eyebrow {
  font-family: var(--font-cta);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--c-text-quiet);
}

.quiz-catalog-title {
  margin-top: 12px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(2.4rem, 4.5vw, 3.8rem);
  line-height: 1.02;
  letter-spacing: -0.025em;
  color: var(--c-text-strong);
}

.quiz-catalog-sub {
  margin-top: 14px;
  font-family: var(--font-inter);
  font-size: 1rem;
  line-height: 1.65;
  color: var(--c-text-muted);
  max-width: 48rem;
}

.quiz-catalog-label {
  font-family: var(--font-cta);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--c-text-quiet);
}

/* Start panel */
.quiz-catalog-start {
  border-radius: 30px;
  border: 1px solid var(--c-border-soft);
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--c-bg-elevated) 65%, transparent),
    color-mix(in srgb, var(--c-bg-elevated) 35%, transparent));
  padding: 26px 28px 22px;
  box-shadow: var(--c-shadow-card);
}

.quiz-catalog-start__controls {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  gap: 22px;
  align-items: end;
}

@media (max-width: 980px) {
  .quiz-catalog-start__controls { grid-template-columns: 1fr 1fr; }
  .quiz-catalog-start__cta { grid-column: span 2; }
}

.quiz-catalog-start__group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.quiz-catalog-pillset {
  display: inline-flex;
  gap: 6px;
  border-radius: 999px;
  padding: 4px;
  background: color-mix(in srgb, var(--c-bg-elevated) 80%, transparent);
  border: 1px solid var(--c-border-soft);
  width: fit-content;
}

.quiz-catalog-pill {
  appearance: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 8px 18px;
  border-radius: 999px;
  font-family: var(--font-cta);
  font-weight: 600;
  font-size: 0.86rem;
  letter-spacing: 0.04em;
  color: var(--c-text-muted);
  transition: background 0.25s ease, color 0.25s ease;
}

.quiz-catalog-pill:hover { color: var(--c-text-strong); }

.quiz-catalog-pill.is-active {
  background: var(--c-sage-deep);
  color: #fcf8ee;
  box-shadow: 0 6px 16px rgba(46, 36, 20, 0.10);
}

[data-theme="dark"] .quiz-catalog-pill.is-active {
  background: var(--c-sage);
  color: #15171a;
}

.quiz-catalog-pill:disabled { opacity: 0.4; cursor: not-allowed; }

.quiz-catalog-select {
  appearance: none;
  width: 100%;
  font-family: var(--font-inter);
  font-size: 0.96rem;
  padding: 12px 38px 12px 16px;
  border-radius: 18px;
  border: 1px solid var(--c-border-strong);
  background-color: var(--c-bg-elevated);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 14px center;
  color: var(--c-text-strong);
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s ease;
}

.quiz-catalog-select:focus { border-color: var(--c-sage-deep); }

.quiz-catalog-start__cta {
  appearance: none;
  border: 0;
  cursor: pointer;
  padding: 14px 28px;
  border-radius: 999px;
  background: var(--c-sage-deep);
  color: #fcf8ee;
  font-family: var(--font-cta);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.01em;
  box-shadow: 0 14px 30px rgba(46, 36, 20, 0.12);
  transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
}

.quiz-catalog-start__cta:hover {
  background: var(--c-sage-deep-hover);
  transform: translateY(-1px);
  box-shadow: 0 18px 36px rgba(46, 36, 20, 0.18);
}

.quiz-catalog-start__cta:disabled { opacity: 0.6; cursor: not-allowed; }

[data-theme="dark"] .quiz-catalog-start__cta {
  background: var(--c-sage);
  color: #15171a;
}

[data-theme="dark"] .quiz-catalog-start__cta:hover {
  background: var(--c-sage-deep-hover);
  color: #f1eadc;
}

/* Advanced disclosure */
.quiz-catalog-advanced {
  margin-top: 20px;
  border-top: 1px dashed var(--c-border-soft);
  padding-top: 16px;
}

.quiz-catalog-advanced__summary {
  cursor: pointer;
  font-family: var(--font-cta);
  font-size: 0.84rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--c-text-muted);
  text-transform: uppercase;
  user-select: none;
  list-style: none;
}

.quiz-catalog-advanced__summary::-webkit-details-marker { display: none; }

.quiz-catalog-advanced__summary::before {
  content: "+";
  display: inline-block;
  width: 18px;
  font-weight: 700;
  color: var(--c-gold-deep);
}

.quiz-catalog-advanced[open] .quiz-catalog-advanced__summary::before { content: "−"; }

.quiz-catalog-advanced__inner {
  margin-top: 16px;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(220px, 320px) 1fr;
  align-items: end;
}

@media (max-width: 720px) {
  .quiz-catalog-advanced__inner { grid-template-columns: 1fr; }
}

.quiz-catalog-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quiz-catalog-field select {
  appearance: none;
  font-family: var(--font-inter);
  font-size: 0.94rem;
  padding: 11px 34px 11px 14px;
  border-radius: 16px;
  border: 1px solid var(--c-border-soft);
  background-color: var(--c-bg-elevated);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 12px center;
  color: var(--c-text-strong);
}

.quiz-catalog-advanced__toggles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.quiz-catalog-reset {
  appearance: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-family: var(--font-cta);
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--c-gold-deep);
  letter-spacing: 0.04em;
  padding: 6px 12px;
  border-radius: 999px;
  transition: color 0.2s ease, background 0.2s ease;
}

.quiz-catalog-reset:hover {
  color: var(--c-adobe);
  background: color-mix(in srgb, var(--c-bg-elevated) 60%, transparent);
}

.quiz-catalog-active-summary {
  font-family: var(--font-inter);
  font-size: 0.86rem;
  color: var(--c-text-muted);
}

/* Section block */
.quiz-catalog-block { display: flex; flex-direction: column; gap: 18px; }

.quiz-catalog-block__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.quiz-catalog-block__hint {
  font-family: var(--font-inter);
  font-size: 0.88rem;
  color: var(--c-text-muted);
}

/* Category tiles */
.quiz-catalog-tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

@media (max-width: 1024px) { .quiz-catalog-tiles { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 720px)  { .quiz-catalog-tiles { grid-template-columns: repeat(2, 1fr); } }

.quiz-catalog-tile {
  appearance: none;
  cursor: pointer;
  text-align: left;
  padding: 22px 22px 18px;
  border-radius: 22px;
  border: 1px solid var(--c-border-soft);
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--c-bg-elevated) 55%, transparent),
    color-mix(in srgb, var(--c-bg-elevated) 25%, transparent));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
  min-height: 132px;
  transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
}

.quiz-catalog-tile:hover {
  transform: translateY(-2px);
  border-color: var(--c-gold-deep);
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--c-bg-elevated) 78%, transparent),
    color-mix(in srgb, var(--c-bg-elevated) 48%, transparent));
  box-shadow: var(--c-shadow-card);
}

.quiz-catalog-tile.is-active {
  border-color: var(--c-sage-deep);
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--c-sage) 14%, transparent),
    color-mix(in srgb, var(--c-bg-elevated) 35%, transparent));
}

.quiz-catalog-tile__name {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.18rem;
  line-height: 1.18;
  color: var(--c-text-strong);
  letter-spacing: -0.015em;
}

.quiz-catalog-tile__cta {
  font-family: var(--font-cta);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--c-gold-deep);
  text-transform: uppercase;
}

.quiz-catalog-tile:hover .quiz-catalog-tile__cta { color: var(--c-adobe); }

/* Practice exam strip */
.quiz-catalog-exam-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.quiz-catalog-exam-card {
  appearance: none;
  cursor: pointer;
  text-align: left;
  padding: 18px 18px 16px;
  border-radius: 22px;
  border: 1px solid var(--c-border-soft);
  background: color-mix(in srgb, var(--c-bg-elevated) 50%, transparent);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
}

.quiz-catalog-exam-card:hover {
  transform: translateY(-2px);
  border-color: var(--c-adobe);
  background: color-mix(in srgb, var(--c-bg-elevated) 78%, transparent);
}

.quiz-catalog-exam-card__exam {
  font-family: var(--font-cta);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--c-adobe);
}

.quiz-catalog-exam-card__label {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.04rem;
  color: var(--c-text-strong);
  letter-spacing: -0.012em;
  line-height: 1.2;
}

.quiz-catalog-exam-card__meta {
  font-family: var(--font-cta);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  color: var(--c-text-muted);
}

.quiz-catalog-exam-card__locked {
  font-family: var(--font-cta);
  font-size: 0.72rem;
  color: var(--c-gold-deep);
  margin-top: 2px;
}

/* Welcome banner (dashboard) */
.dash-welcome-banner {
  border-radius: 24px;
  padding: 22px 26px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--c-sage) 16%, transparent),
    color-mix(in srgb, var(--c-gold) 8%, transparent));
  border: 1px solid color-mix(in srgb, var(--c-sage) 28%, transparent);
}

.dash-welcome-banner h2 {
  margin-top: 8px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(1.4rem, 2.4vw, 1.8rem);
  color: var(--c-text-strong);
  letter-spacing: -0.015em;
  line-height: 1.18;
}

.dash-welcome-banner p {
  margin-top: 8px;
  font-family: var(--font-inter);
  font-size: 0.96rem;
  line-height: 1.6;
  color: var(--c-text-body);
}
"""

with open(target, "a", encoding="utf-8") as fh:
    fh.write(css)

print(f"Appended {len(css)} chars to {target}")
