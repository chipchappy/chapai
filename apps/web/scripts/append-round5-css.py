from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "src" / "styles" / "globals.css"

css = r"""
/* ---------- Round 5 — readiness history, free-tier pill, NGN mix slider ---------- */

.quiz-catalog-head__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* Free-tier indicator pill */
.quiz-catalog-free-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px 7px 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-gold) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-gold) 32%, transparent);
  font-family: var(--font-cta);
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  color: var(--c-text-body);
  text-decoration: none;
  transition: background 0.2s ease, transform 0.2s ease;
}

.quiz-catalog-free-pill:hover {
  background: color-mix(in srgb, var(--c-gold) 24%, transparent);
  transform: translateY(-1px);
}

.quiz-catalog-free-pill__cta {
  font-weight: 700;
  color: var(--c-gold-deep);
  padding-left: 8px;
  border-left: 1px solid color-mix(in srgb, var(--c-gold) 35%, transparent);
}

[data-theme="dark"] .quiz-catalog-free-pill__cta { color: var(--c-gold); }

/* Last-attempt accuracy badge on readiness exam cards */
.quiz-catalog-exam-card {
  position: relative;
}

.quiz-catalog-exam-card.has-attempt {
  border-color: color-mix(in srgb, var(--c-sage) 28%, transparent);
}

.quiz-catalog-exam-card__attempt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-bg-elevated) 60%, transparent);
  border: 1px solid var(--c-border-soft);
  font-family: var(--font-cta);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: var(--c-text-body);
  width: fit-content;
}

.quiz-catalog-exam-card__attempt strong {
  font-weight: 700;
}

.quiz-catalog-exam-card__attempt.is-strong {
  background: color-mix(in srgb, var(--c-sage) 16%, transparent);
  border-color: color-mix(in srgb, var(--c-sage) 32%, transparent);
}
.quiz-catalog-exam-card__attempt.is-strong strong { color: var(--c-sage-deep); }
[data-theme="dark"] .quiz-catalog-exam-card__attempt.is-strong strong { color: var(--c-sage); }

.quiz-catalog-exam-card__attempt.is-weak {
  background: color-mix(in srgb, var(--c-adobe) 14%, transparent);
  border-color: color-mix(in srgb, var(--c-adobe) 30%, transparent);
}
.quiz-catalog-exam-card__attempt.is-weak strong { color: var(--c-adobe); }

.quiz-catalog-exam-card__attempt.is-mid {
  background: color-mix(in srgb, var(--c-gold) 14%, transparent);
  border-color: color-mix(in srgb, var(--c-gold) 30%, transparent);
}
.quiz-catalog-exam-card__attempt.is-mid strong { color: var(--c-gold-deep); }
[data-theme="dark"] .quiz-catalog-exam-card__attempt.is-mid strong { color: var(--c-gold); }

.quiz-catalog-exam-card__attempt-date {
  color: var(--c-text-muted);
  opacity: 0.85;
  font-weight: 500;
  margin-left: 2px;
}

/* NGN mix pillset — allow 3 pills with descriptive text */
.quiz-catalog-advanced__group--wide .quiz-catalog-pillset {
  width: 100%;
  justify-content: stretch;
}

.quiz-catalog-advanced__group--wide .quiz-catalog-pill {
  flex: 1 1 auto;
}
"""

with open(target, "a", encoding="utf-8") as fh:
    fh.write(css)

print(f"Appended {len(css)} chars")
