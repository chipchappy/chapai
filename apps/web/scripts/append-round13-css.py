from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "src" / "styles" / "globals.css"

css = r"""
/* ---------- Round 13 — drug card detail + milestones page ---------- */

.drug-card-main {
  min-height: 100vh;
  padding: 56px 16px 96px;
}

.drug-card {
  max-width: 880px;
  margin: 0 auto;
  border-radius: 32px;
  padding: 32px clamp(20px, 4vw, 44px);
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--c-bg-elevated) 60%, transparent),
    color-mix(in srgb, var(--c-bg-elevated) 30%, transparent));
  border: 1px solid var(--c-border-soft);
  box-shadow: var(--c-shadow-card);
}

.drug-card__head { margin-bottom: 20px; }

.drug-card__eyebrow {
  font-family: var(--font-cta);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-text-quiet);
}

.drug-card__name {
  margin-top: 8px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.06;
  letter-spacing: -0.022em;
  color: var(--c-text-strong);
}

.drug-card__brands {
  margin-top: 8px;
  font-family: var(--font-inter);
  font-size: 0.94rem;
  color: var(--c-text-muted);
}

.drug-card__class { margin-top: 10px; }

.drug-card__class-pill {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-sage) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-sage) 32%, transparent);
  font-family: var(--font-cta);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--c-sage-deep);
}

[data-theme="dark"] .drug-card__class-pill { color: var(--c-sage); }

.drug-card__blackbox {
  margin: 18px 0 6px;
  padding: 14px 18px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--c-adobe) 14%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--c-adobe) 42%, transparent);
}

.drug-card__blackbox strong {
  display: block;
  font-family: var(--font-cta);
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--c-adobe);
}

.drug-card__blackbox p {
  margin-top: 6px;
  font-family: var(--font-inter);
  font-size: 0.96rem;
  line-height: 1.55;
  color: var(--c-text-body);
}

.drug-card__grid {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 28px;
}

@media (max-width: 720px) {
  .drug-card__grid { grid-template-columns: 1fr; }
}

.drug-card__field {
  padding: 18px 20px;
  border-radius: 22px;
  background: color-mix(in srgb, var(--c-bg-elevated) 50%, transparent);
  border: 1px solid var(--c-border-soft);
}

.drug-card__label {
  font-family: var(--font-cta);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--c-gold-deep);
  margin-bottom: 8px;
}

[data-theme="dark"] .drug-card__label { color: var(--c-gold); }

.drug-card__value {
  font-family: var(--font-inter);
  font-size: 0.96rem;
  line-height: 1.6;
  color: var(--c-text-body);
}

.drug-card__tags {
  margin-top: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 18px;
  border-top: 1px dashed var(--c-border-soft);
}

.drug-card__tag {
  font-family: var(--font-cta);
  font-size: 0.74rem;
  letter-spacing: 0.04em;
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-bg-elevated) 70%, transparent);
  border: 1px solid var(--c-border-soft);
  color: var(--c-text-muted);
}

.drug-card__actions {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.drug-card__cta {
  padding: 12px 22px;
  border-radius: 999px;
  background: var(--c-sage-deep);
  color: #fcf8ee;
  font-family: var(--font-cta);
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  transition: background 0.2s ease, transform 0.2s ease;
}

.drug-card__cta:hover { background: var(--c-sage-deep-hover); transform: translateY(-1px); }

[data-theme="dark"] .drug-card__cta { background: var(--c-sage); color: #15171a; }
[data-theme="dark"] .drug-card__cta:hover { background: var(--c-sage-deep-hover); color: #f1eadc; }

.drug-card__cta--ghost {
  background: transparent;
  border: 1px solid var(--c-border-strong);
  color: var(--c-text-body);
}

.drug-card__cta--ghost:hover { border-color: var(--c-gold-deep); color: var(--c-gold-deep); background: transparent; }

/* Milestones page */
.milestones-list {
  margin-top: 28px;
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.milestones-item {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px 18px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--c-bg-elevated) 55%, transparent);
  border: 1px solid var(--c-border-soft);
}

.milestones-item__icon {
  font-size: 1.4rem;
  text-align: center;
}

.milestones-item__title {
  display: block;
  font-family: var(--font-inter);
  font-weight: 600;
  font-size: 0.98rem;
  color: var(--c-text-strong);
}

.milestones-item__body {
  margin-top: 2px;
  font-family: var(--font-inter);
  font-size: 0.84rem;
  color: var(--c-text-muted);
}

.milestones-item__date {
  font-family: var(--font-cta);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: var(--c-text-muted);
  white-space: nowrap;
}

.milestones-empty {
  margin-top: 28px;
  padding: 22px;
  border-radius: 22px;
  border: 1px dashed var(--c-border-strong);
  text-align: center;
}

.milestones-empty p {
  font-family: var(--font-inter);
  color: var(--c-text-body);
  margin-bottom: 14px;
}
"""

with open(target, "a", encoding="utf-8") as fh:
    fh.write(css)

print(f"Appended {len(css)} chars")
