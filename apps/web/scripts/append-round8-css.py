from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "src" / "styles" / "globals.css"

css = r"""
/* ---------- Round 8 — comparison card, adaptive badge, settings ---------- */

/* Readiness comparison card */
.dash-card--comparison { grid-column: span 6; }

@media (max-width: 1024px) {
  .dash-card--comparison { grid-column: span 2; }
}

.dash-comparison {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 28px;
}

@media (max-width: 760px) {
  .dash-comparison { grid-template-columns: 1fr; }
}

.dash-comparison__row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dash-comparison__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.dash-comparison__name {
  font-family: var(--font-inter);
  font-weight: 600;
  font-size: 0.96rem;
  color: var(--c-text-strong);
}

.dash-comparison__delta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-cta);
  font-size: 0.86rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}

.dash-comparison__row--up .dash-comparison__delta {
  color: var(--c-sage-deep);
  background: color-mix(in srgb, var(--c-sage) 18%, transparent);
}

[data-theme="dark"] .dash-comparison__row--up .dash-comparison__delta {
  color: var(--c-sage);
}

.dash-comparison__row--down .dash-comparison__delta {
  color: var(--c-adobe);
  background: color-mix(in srgb, var(--c-adobe) 16%, transparent);
}

.dash-comparison__row--flat .dash-comparison__delta {
  color: var(--c-text-muted);
  background: color-mix(in srgb, var(--c-bg-elevated) 70%, transparent);
}

.dash-comparison__bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dash-comparison__bar {
  height: 8px;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.dash-comparison__bar--earliest {
  background: color-mix(in srgb, var(--c-gold) 45%, var(--c-border-soft));
  opacity: 0.55;
}

.dash-comparison__bar--latest {
  background: linear-gradient(90deg, var(--c-sage-deep) 0%, var(--c-gold) 100%);
}

.dash-comparison__row--down .dash-comparison__bar--latest {
  background: linear-gradient(90deg, var(--c-adobe) 0%, var(--c-gold) 100%);
}

.dash-comparison__meta {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-cta);
  font-size: 0.78rem;
  color: var(--c-text-muted);
  letter-spacing: 0.04em;
}

/* Adaptive badge above the practice center start CTA */
.quiz-catalog-hero__adaptive-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--c-adobe) 16%, transparent),
    color-mix(in srgb, var(--c-gold) 14%, transparent));
  border: 1px solid color-mix(in srgb, var(--c-adobe) 28%, transparent);
  font-family: var(--font-cta);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--c-text-body);
  width: fit-content;
  margin-bottom: 6px;
}

[data-theme="dark"] .quiz-catalog-hero__adaptive-badge {
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--c-adobe) 22%, transparent),
    color-mix(in srgb, var(--c-gold) 16%, transparent));
}

/* Account settings page */
.settings-grid {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.settings-section {
  border-radius: 24px;
  padding: 22px 22px 18px;
  border: 1px solid var(--c-border-soft);
  background: color-mix(in srgb, var(--c-bg-elevated) 55%, transparent);
}

.settings-section__head {
  margin-bottom: 18px;
}

.settings-section__title {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.32rem;
  color: var(--c-text-strong);
  letter-spacing: -0.015em;
}

.settings-section__hint {
  margin-top: 4px;
  font-family: var(--font-inter);
  font-size: 0.88rem;
  color: var(--c-text-muted);
}

.settings-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 18px;
}

@media (max-width: 540px) {
  .settings-row { grid-template-columns: 1fr; }
}

.settings-row__copy { min-width: 0; }

.settings-row__title {
  font-family: var(--font-inter);
  font-weight: 600;
  font-size: 1rem;
  color: var(--c-text-strong);
}

.settings-row__body {
  margin-top: 4px;
  font-family: var(--font-inter);
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--c-text-muted);
}

.settings-row__message {
  grid-column: 1 / -1;
  margin-top: 8px;
  font-family: var(--font-cta);
  font-size: 0.82rem;
  color: var(--c-sage-deep);
}

[data-theme="dark"] .settings-row__message { color: var(--c-sage); }

.settings-row__message--error { color: var(--c-adobe); }

/* Toggle switch */
.settings-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.settings-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.settings-toggle__track {
  display: inline-block;
  width: 52px;
  height: 30px;
  border-radius: 999px;
  background: var(--c-border-soft);
  position: relative;
  transition: background 0.2s ease;
  border: 1px solid var(--c-border-strong);
}

.settings-toggle__track::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--c-bg-elevated);
  border: 1px solid var(--c-border-strong);
  transition: transform 0.22s ease, background 0.22s ease;
}

.settings-toggle input:checked + .settings-toggle__track {
  background: var(--c-sage-deep);
  border-color: var(--c-sage-deep);
}

[data-theme="dark"] .settings-toggle input:checked + .settings-toggle__track {
  background: var(--c-sage);
  border-color: var(--c-sage);
}

.settings-toggle input:checked + .settings-toggle__track::after {
  transform: translateX(22px);
  background: #fcf8ee;
  border-color: #fcf8ee;
}

[data-theme="dark"] .settings-toggle input:checked + .settings-toggle__track::after {
  background: #1c1e22;
  border-color: #1c1e22;
}

.settings-toggle__label {
  font-family: var(--font-cta);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--c-text-muted);
  text-transform: uppercase;
  min-width: 30px;
}

.settings-toggle input:focus-visible + .settings-toggle__track {
  outline: 3px solid color-mix(in srgb, var(--c-sage) 60%, white);
  outline-offset: 3px;
}
"""

with open(target, "a", encoding="utf-8") as fh:
    fh.write(css)

print(f"Appended {len(css)} chars")
