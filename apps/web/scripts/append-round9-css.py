from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "src" / "styles" / "globals.css"

css = r"""
/* ---------- Round 9 — equalized hero, locks, tutor card, upgrade banner, pricing, share ---------- */

.quiz-catalog-head--slim { padding-bottom: 0; }
.quiz-catalog-head--slim + .quiz-catalog-hero { margin-top: 4px; }

/* Equalize hero — green Start CTA + baseline card side-by-side at equal weight */
.quiz-catalog-hero {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

@media (max-width: 980px) {
  .quiz-catalog-hero { grid-template-columns: 1fr; }
}

.quiz-catalog-hero__cta { min-height: 200px; }
.quiz-catalog-baseline { min-height: 200px; }

/* Locked category tiles for free users */
.quiz-catalog-tile.is-locked {
  position: relative;
  opacity: 0.78;
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--c-bg-elevated) 30%, transparent),
    color-mix(in srgb, var(--c-bg-elevated) 14%, transparent));
}

.quiz-catalog-tile.is-locked:hover {
  border-color: var(--c-gold-deep);
  opacity: 0.96;
}

.quiz-catalog-tile__lock-icon {
  font-size: 0.86em;
  margin-left: 6px;
  filter: saturate(0.85);
}

.quiz-catalog-tile__cta--locked {
  color: var(--c-gold-deep);
}

[data-theme="dark"] .quiz-catalog-tile__cta--locked { color: var(--c-gold); }

/* Tutor follow-up card */
.dash-card--tutor { grid-column: span 3; }

@media (max-width: 1024px) {
  .dash-card--tutor { grid-column: span 2; }
}

.dash-tutor-list {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dash-tutor-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--c-bg-elevated) 50%, transparent);
  border: 1px solid var(--c-border-soft);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.dash-tutor-item:hover {
  border-color: var(--c-adobe);
  background: color-mix(in srgb, var(--c-bg-elevated) 75%, transparent);
}

.dash-tutor-item__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--font-cta);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.dash-tutor-item__cat { color: var(--c-adobe); font-weight: 700; }
.dash-tutor-item__ago { color: var(--c-text-quiet); }

.dash-tutor-item__stem {
  margin-top: 8px;
  font-family: var(--font-inter);
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--c-text-body);
}

.dash-tutor-item__actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.dash-tutor-item__cta {
  font-family: var(--font-cta);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--c-sage-deep);
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-sage) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-sage) 28%, transparent);
  transition: background 0.2s ease;
}

[data-theme="dark"] .dash-tutor-item__cta { color: var(--c-sage); }

.dash-tutor-item__cta:hover {
  background: color-mix(in srgb, var(--c-sage) 28%, transparent);
}

/* Upgrade celebration banner */
.dash-upgrade-banner {
  position: relative;
  overflow: hidden;
  padding: 26px 30px;
  border-radius: 28px;
  background:
    radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--c-adobe) 14%, transparent), transparent 50%),
    radial-gradient(circle at 0% 100%, color-mix(in srgb, var(--c-gold) 18%, transparent), transparent 60%),
    linear-gradient(135deg,
      color-mix(in srgb, var(--c-sage) 22%, var(--c-bg-elevated)),
      color-mix(in srgb, var(--c-gold) 14%, var(--c-bg-elevated)));
  border: 1px solid color-mix(in srgb, var(--c-sage) 36%, transparent);
  box-shadow: 0 22px 50px rgba(46, 36, 20, 0.10);
}

.dash-upgrade-banner__sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  color: color-mix(in srgb, var(--c-gold) 60%, transparent);
  font-size: 14px;
  opacity: 0.85;
}

.dash-upgrade-banner__sparkles span {
  position: absolute;
  animation: dashSparkle 3.6s ease-in-out infinite;
}

.dash-upgrade-banner__sparkles span:nth-child(1)  { top: 12%;  left: 6%;  animation-delay: 0s; }
.dash-upgrade-banner__sparkles span:nth-child(2)  { top: 22%;  left: 84%; animation-delay: 0.4s; }
.dash-upgrade-banner__sparkles span:nth-child(3)  { top: 70%;  left: 12%; animation-delay: 0.8s; }
.dash-upgrade-banner__sparkles span:nth-child(4)  { top: 50%;  left: 90%; animation-delay: 1.2s; }
.dash-upgrade-banner__sparkles span:nth-child(5)  { top: 86%;  left: 40%; animation-delay: 1.6s; }
.dash-upgrade-banner__sparkles span:nth-child(6)  { top: 30%;  left: 28%; animation-delay: 2.0s; font-size: 11px; }
.dash-upgrade-banner__sparkles span:nth-child(7)  { top: 60%;  left: 62%; animation-delay: 2.4s; font-size: 11px; }
.dash-upgrade-banner__sparkles span:nth-child(8)  { top: 16%;  left: 50%; animation-delay: 2.8s; font-size: 11px; }
.dash-upgrade-banner__sparkles span:nth-child(9)  { top: 80%;  left: 72%; animation-delay: 0.6s; font-size: 11px; }
.dash-upgrade-banner__sparkles span:nth-child(10) { top: 40%;  left: 70%; animation-delay: 1.4s; font-size: 11px; }

@keyframes dashSparkle {
  0%, 100% { opacity: 0; transform: scale(0.6); }
  50% { opacity: 1; transform: scale(1.1); }
}

.dash-upgrade-banner__eyebrow { color: var(--c-sage-deep); }
[data-theme="dark"] .dash-upgrade-banner__eyebrow { color: var(--c-sage); }

.dash-upgrade-banner__title {
  margin-top: 8px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  color: var(--c-text-strong);
  letter-spacing: -0.018em;
  line-height: 1.12;
  position: relative;
}

.dash-upgrade-banner__list {
  margin: 14px 0 0;
  padding-left: 20px;
  font-family: var(--font-inter);
  font-size: 0.96rem;
  line-height: 1.7;
  color: var(--c-text-body);
  position: relative;
}

.dash-upgrade-banner__list li {
  list-style: none;
  padding-left: 4px;
  position: relative;
}

.dash-upgrade-banner__list li::before {
  content: "✓";
  position: absolute;
  left: -20px;
  color: var(--c-sage-deep);
  font-weight: 700;
}

[data-theme="dark"] .dash-upgrade-banner__list li::before { color: var(--c-sage); }

/* Pricing personalized hero */
.pricing-personalized {
  max-width: 1180px;
  margin: 32px auto 0;
  padding: 0 16px;
}

.pricing-personalized__inner {
  border-radius: 28px;
  padding: 28px 30px 30px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--c-adobe) 14%, var(--c-bg-elevated)),
    color-mix(in srgb, var(--c-gold) 10%, var(--c-bg-elevated)));
  border: 1px solid color-mix(in srgb, var(--c-adobe) 28%, transparent);
  box-shadow: var(--c-shadow-card);
}

.pricing-personalized__kicker {
  font-family: var(--font-cta);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-adobe);
}

.pricing-personalized__title {
  margin-top: 8px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(1.8rem, 3.4vw, 2.6rem);
  color: var(--c-text-strong);
  letter-spacing: -0.022em;
  line-height: 1.1;
}

.pricing-personalized__body {
  margin-top: 14px;
  font-family: var(--font-inter);
  font-size: 1rem;
  line-height: 1.65;
  color: var(--c-text-body);
  max-width: 56rem;
}

.pricing-personalized__body strong {
  font-weight: 700;
  color: var(--c-sage-deep);
}

[data-theme="dark"] .pricing-personalized__body strong { color: var(--c-sage); }

.pricing-personalized__projection {
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.pricing-personalized__bar {
  position: relative;
  padding: 12px 16px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--c-bg-elevated) 80%, transparent);
  border: 1px solid var(--c-border-soft);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
  align-items: baseline;
  overflow: hidden;
}

.pricing-personalized__bar span {
  font-family: var(--font-cta);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--c-text-muted);
  z-index: 1;
}

.pricing-personalized__bar strong {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 500;
  color: var(--c-text-strong);
  letter-spacing: -0.02em;
  z-index: 1;
}

.pricing-personalized__bar-fill {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  z-index: 0;
}

.pricing-personalized__bar--current .pricing-personalized__bar-fill {
  background: linear-gradient(90deg, color-mix(in srgb, var(--c-gold) 30%, transparent), transparent);
}

.pricing-personalized__bar--projected .pricing-personalized__bar-fill {
  background: linear-gradient(90deg, color-mix(in srgb, var(--c-sage) 32%, transparent), transparent);
}

/* Streak share page */
.streak-share {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
}

.streak-share__inner {
  max-width: 720px;
  width: 100%;
  text-align: center;
  border-radius: 32px;
  padding: 44px 32px;
  background: linear-gradient(160deg,
    color-mix(in srgb, var(--c-adobe) 14%, var(--c-bg-elevated)),
    color-mix(in srgb, var(--c-gold) 12%, var(--c-bg-elevated)));
  border: 1px solid color-mix(in srgb, var(--c-adobe) 28%, transparent);
  box-shadow: var(--c-shadow-card);
}

.streak-share__eyebrow {
  font-family: var(--font-cta);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--c-gold-deep);
}

[data-theme="dark"] .streak-share__eyebrow { color: var(--c-gold); }

.streak-share__flame {
  font-size: clamp(3.4rem, 8vw, 5rem);
  margin-top: 12px;
  animation: streakFlame 2.6s ease-in-out infinite;
}

@keyframes streakFlame {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-4px) rotate(2deg); }
}

.streak-share__title {
  margin-top: 14px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(2rem, 5vw, 3.4rem);
  color: var(--c-text-strong);
  letter-spacing: -0.022em;
  line-height: 1.08;
}

.streak-share__metrics {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 28px;
  flex-wrap: wrap;
}

.streak-share__metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  min-width: 100px;
}

.streak-share__metric strong {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(2rem, 4vw, 2.8rem);
  color: var(--c-text-strong);
  letter-spacing: -0.02em;
  line-height: 1;
}

.streak-share__metric span {
  font-family: var(--font-cta);
  font-size: 0.74rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.streak-share__body {
  margin-top: 24px;
  font-family: var(--font-inter);
  font-size: 1rem;
  line-height: 1.65;
  color: var(--c-text-body);
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;
}

.streak-share__cta-row {
  margin-top: 26px;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.streak-share__cta {
  padding: 14px 26px;
  border-radius: 999px;
  background: var(--c-sage-deep);
  color: #fcf8ee;
  font-family: var(--font-cta);
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  transition: transform 0.2s ease, background 0.2s ease;
}

.streak-share__cta:hover {
  background: var(--c-sage-deep-hover);
  transform: translateY(-1px);
}

[data-theme="dark"] .streak-share__cta {
  background: var(--c-sage);
  color: #15171a;
}

.streak-share__cta--ghost {
  background: transparent;
  color: var(--c-text-body);
  border: 1px solid var(--c-border-strong);
}

.streak-share__cta--ghost:hover {
  background: var(--c-bg-elevated);
  color: var(--c-text-strong);
}
"""

with open(target, "a", encoding="utf-8") as fh:
    fh.write(css)

print(f"Appended {len(css)} chars")
