from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "src" / "styles" / "globals.css"

css = r"""
/* ---------- Round 11 — UTM banner, toasts, share download, testimonial ---------- */

/* UTM source banner on dashboard */
.dash-utm-banner {
  padding: 14px 18px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--c-gold) 32%, transparent);
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--c-gold) 14%, transparent),
    color-mix(in srgb, var(--c-sage) 8%, transparent));
}

.dash-utm-banner__kicker {
  display: inline-block;
  font-family: var(--font-cta);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--c-gold-deep);
}

[data-theme="dark"] .dash-utm-banner__kicker { color: var(--c-gold); }

.dash-utm-banner__copy {
  margin-top: 4px;
  font-family: var(--font-inter);
  font-size: 0.94rem;
  line-height: 1.5;
  color: var(--c-text-body);
}

/* Share streak download button */
.dash-share-streak {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.dash-share-streak__download {
  appearance: none;
  border: 1px solid var(--c-border-strong);
  background: transparent;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 999px;
  font-family: var(--font-cta);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--c-text-muted);
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.dash-share-streak__download:hover {
  border-color: var(--c-gold-deep);
  color: var(--c-gold-deep);
  background: color-mix(in srgb, var(--c-gold) 10%, transparent);
}

[data-theme="dark"] .dash-share-streak__download:hover {
  border-color: var(--c-gold);
  color: var(--c-gold);
}

/* Achievement toasts — stacked bottom-right */
.dash-toasts {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 70;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: calc(100vw - 40px);
  width: 380px;
  pointer-events: none;
}

@media (max-width: 480px) {
  .dash-toasts {
    bottom: 14px;
    right: 14px;
    left: 14px;
    width: auto;
  }
}

.dash-toast {
  pointer-events: auto;
  padding: 16px 18px;
  border-radius: 22px;
  background: var(--c-bg-elevated);
  border: 1px solid var(--c-border-strong);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.16);
  animation: dashToastIn 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.05) both;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@keyframes dashToastIn {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.dash-toast__kicker {
  font-family: var(--font-cta);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--c-adobe);
}

.dash-toast__title {
  display: block;
  margin-top: 4px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.12rem;
  color: var(--c-text-strong);
  letter-spacing: -0.012em;
  line-height: 1.2;
}

.dash-toast__body {
  margin-top: 6px;
  font-family: var(--font-inter);
  font-size: 0.86rem;
  line-height: 1.5;
  color: var(--c-text-muted);
}

.dash-toast__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.dash-toast__btn {
  appearance: none;
  border: 1px solid var(--c-border-strong);
  background: transparent;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 999px;
  font-family: var(--font-cta);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--c-text-body);
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.dash-toast__btn:hover {
  border-color: var(--c-text-strong);
  color: var(--c-text-strong);
}

.dash-toast__btn--primary {
  background: var(--c-sage-deep);
  color: #fcf8ee;
  border-color: var(--c-sage-deep);
}

.dash-toast__btn--primary:hover {
  background: var(--c-sage-deep-hover);
  border-color: var(--c-sage-deep-hover);
  color: #fcf8ee;
}

[data-theme="dark"] .dash-toast__btn--primary {
  background: var(--c-sage);
  color: #15171a;
  border-color: var(--c-sage);
}

[data-theme="dark"] .dash-toast__btn--primary:hover {
  background: var(--c-sage-deep-hover);
  color: #f1eadc;
  border-color: var(--c-sage-deep-hover);
}

/* Pricing testimonial */
.pricing-personalized__testimonial {
  margin: 20px 0 4px;
  padding: 18px 22px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--c-bg-elevated) 78%, transparent);
  border: 1px solid var(--c-border-soft);
  border-left: 3px solid var(--c-sage-deep);
}

[data-theme="dark"] .pricing-personalized__testimonial {
  border-left-color: var(--c-sage);
}

.pricing-personalized__testimonial blockquote {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--c-text-strong);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.005em;
}

.pricing-personalized__testimonial figcaption {
  margin-top: 8px;
  font-family: var(--font-cta);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: var(--c-text-muted);
}
"""

with open(target, "a", encoding="utf-8") as fh:
    fh.write(css)

print(f"Appended {len(css)} chars")
