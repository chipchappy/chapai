from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "src" / "styles" / "globals.css"

css = r"""
/* ---------- Round 6 — countdown widget, onboarding tour, tutor stat pill ---------- */

/* New grid placement for the countdown card */
.dash-card--countdown { grid-column: span 3; }

@media (max-width: 1024px) {
  .dash-card--countdown { grid-column: span 2; }
}

.dash-countdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 220px;
}

.dash-countdown__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.dash-countdown__link {
  font-family: var(--font-cta);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--c-gold-deep);
  text-decoration: none;
}

.dash-countdown__link:hover { color: var(--c-adobe); }

[data-theme="dark"] .dash-countdown__link { color: var(--c-gold); }

.dash-countdown__date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--c-bg-elevated) 55%, transparent);
  border: 1px solid var(--c-border-soft);
}

.dash-countdown__date-label {
  font-family: var(--font-cta);
  font-size: 0.74rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.dash-countdown__date-input {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--c-text-strong);
  font-family: var(--font-inter);
  font-size: 0.96rem;
  outline: none;
  cursor: pointer;
  font-weight: 600;
}

.dash-countdown__date-input::-webkit-calendar-picker-indicator {
  filter: invert(0.4);
  cursor: pointer;
}

[data-theme="dark"] .dash-countdown__date-input::-webkit-calendar-picker-indicator {
  filter: invert(0.85);
}

.dash-countdown__numbers {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.dash-countdown__number {
  background: color-mix(in srgb, var(--c-bg-elevated) 50%, transparent);
  border: 1px solid var(--c-border-soft);
  border-radius: 18px;
  padding: 14px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.dash-countdown__number strong {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(1.6rem, 2.6vw, 2.2rem);
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--c-text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dash-countdown__number--wide strong {
  font-size: clamp(1rem, 1.5vw, 1.18rem);
  line-height: 1.2;
  white-space: normal;
}

.dash-countdown__number span {
  font-family: var(--font-cta);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.dash-countdown__footnote {
  font-family: var(--font-inter);
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--c-text-muted);
}

.dash-countdown__skeleton {
  flex: 1;
  border-radius: 18px;
  background: color-mix(in srgb, var(--c-bg-elevated) 50%, transparent);
  animation: dashSkeleton 2s ease-in-out infinite;
}

@keyframes dashSkeleton {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.85; }
}

/* Onboarding tour overlay */
.dash-tour {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
}

.dash-tour__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 22, 26, 0.45);
  backdrop-filter: blur(2px);
  pointer-events: auto;
  animation: dashTourFade 0.3s ease;
}

@keyframes dashTourFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dash-tour__spotlight {
  position: absolute;
  border-radius: 26px;
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--c-gold) 70%, transparent),
    0 0 0 9999px rgba(20, 22, 26, 0.55);
  pointer-events: none;
  transition: top 0.35s ease, left 0.35s ease, width 0.35s ease, height 0.35s ease;
}

.dash-tour__card {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 440px;
  width: calc(100% - 32px);
  background: var(--c-bg-elevated);
  border: 1px solid var(--c-border-strong);
  border-radius: 24px;
  padding: 22px 22px 20px;
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.30);
  pointer-events: auto;
  z-index: 1;
  animation: dashTourSlide 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.1);
}

@keyframes dashTourSlide {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.dash-tour__progress {
  display: inline-block;
  font-family: var(--font-cta);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-gold-deep);
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-gold) 14%, transparent);
}

[data-theme="dark"] .dash-tour__progress { color: var(--c-gold); }

.dash-tour__title {
  margin-top: 10px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.32rem;
  color: var(--c-text-strong);
  letter-spacing: -0.015em;
  line-height: 1.18;
}

.dash-tour__body {
  margin-top: 8px;
  font-family: var(--font-inter);
  font-size: 0.94rem;
  line-height: 1.55;
  color: var(--c-text-body);
}

.dash-tour__actions {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dash-tour__skip {
  appearance: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-family: var(--font-cta);
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--c-text-muted);
  padding: 8px 4px;
}

.dash-tour__skip:hover { color: var(--c-text-strong); }

.dash-tour__nav { display: flex; gap: 8px; }

.dash-tour__back {
  appearance: none;
  border: 1px solid var(--c-border-strong);
  background: transparent;
  cursor: pointer;
  padding: 10px 16px;
  border-radius: 999px;
  font-family: var(--font-cta);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--c-text-body);
  transition: border-color 0.2s ease;
}

.dash-tour__back:hover { border-color: var(--c-gold-deep); color: var(--c-text-strong); }

.dash-tour__next {
  appearance: none;
  border: 0;
  cursor: pointer;
  padding: 10px 22px;
  border-radius: 999px;
  background: var(--c-sage-deep);
  color: #fcf8ee;
  font-family: var(--font-cta);
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: background 0.2s ease, transform 0.2s ease;
}

.dash-tour__next:hover {
  background: var(--c-sage-deep-hover);
  transform: translateY(-1px);
}

[data-theme="dark"] .dash-tour__next {
  background: var(--c-sage);
  color: #15171a;
}

[data-theme="dark"] .dash-tour__next:hover {
  background: var(--c-sage-deep-hover);
  color: #f1eadc;
}

/* Tutor stat pill on the strengths card head — make sage pill emoji-friendly */
.dash-card--tools .dash-pill {
  font-size: 0.7rem;
  white-space: nowrap;
}
"""

with open(target, "a", encoding="utf-8") as fh:
    fh.write(css)

print(f"Appended {len(css)} chars")
