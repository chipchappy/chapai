from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "src" / "styles" / "globals.css"

css = r"""
/* ---------- Round 12 — radar chart + drug card link + testimonial disclaimer ---------- */

.dash-radar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-top: 14px;
  margin-bottom: 18px;
}

.dash-radar__svg {
  max-width: 340px;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 12px 28px rgba(46, 36, 20, 0.07));
}

[data-theme="dark"] .dash-radar__svg {
  filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.35));
}

.dash-radar__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
  font-family: var(--font-cta);
  font-size: 0.74rem;
  letter-spacing: 0.06em;
  color: var(--c-text-muted);
}

.dash-radar__swatch {
  display: inline-block;
  width: 14px;
  height: 10px;
  border-radius: 4px;
  border: 1.5px solid transparent;
}

.dash-radar__swatch--earliest {
  background: color-mix(in srgb, var(--c-gold) 28%, transparent);
  border-color: var(--c-gold-deep);
}

.dash-radar__swatch--latest {
  background: color-mix(in srgb, var(--c-sage) 34%, transparent);
  border-color: var(--c-sage-deep);
}

[data-theme="dark"] .dash-radar__swatch--latest { border-color: var(--c-sage); }

.dash-radar__swatch--threshold {
  background: transparent;
  border-style: dashed;
  border-color: var(--c-border-strong);
  height: 6px;
  margin-top: 2px;
}

/* Testimonial disclaimer */
.pricing-personalized__testimonial-disclaimer {
  margin-top: 10px;
  font-family: var(--font-cta);
  font-size: 0.7rem;
  line-height: 1.45;
  letter-spacing: 0.04em;
  color: var(--c-text-quiet);
  font-style: normal;
}

.pricing-personalized__testimonial[data-fictional="true"] {
  border-left-color: var(--c-gold-deep);
}

[data-theme="dark"] .pricing-personalized__testimonial[data-fictional="true"] {
  border-left-color: var(--c-gold);
}

/* Optional: drug card link surface (used when a question has a related card) */
.quiz-drug-card-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-gold) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-gold) 32%, transparent);
  font-family: var(--font-cta);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--c-gold-deep);
  text-decoration: none;
}

[data-theme="dark"] .quiz-drug-card-link { color: var(--c-gold); }

.quiz-drug-card-link:hover {
  background: color-mix(in srgb, var(--c-gold) 26%, transparent);
}
"""

with open(target, "a", encoding="utf-8") as fh:
    fh.write(css)

print(f"Appended {len(css)} chars")
