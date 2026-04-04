## Daily Question Email System

### Goal
Capture prospective nurses, ICU nurses, and educators with one sleek daily question email that:
- teaches something useful in under 60 seconds
- builds trust in question quality
- links directly into the app
- converts free readers into paid cram-pass or package buyers

### Fastest implementation
1. Add a simple email capture form on the homepage and exam pages.
2. Store subscribers in a lightweight table or JSON-backed list first if needed.
3. Send one daily question with:
   - short subject line
   - one question stem
   - 4 answer choices or a simplified clinical prompt
   - a `see rationale` link
   - a `start 24-hour cram` CTA
4. Rotate by exam track:
   - CCRN: hemodynamics, vents, shock, neuro, ethics
   - NCLEX: delegation, safety, pharm, priority, maternity and peds

### Best stack
- Capture: existing Next app route
- Delivery: Resend or Postmark when ready
- Authoring: pull from approved daily-question queue
- Tracking: opens, clicks, exam interest, conversion path

### First automation path
- Mercury prepares the copy shell.
- Hume picks the question and checks rationale quality.
- Kepler owns the delivery path and signup route.
- Kuhn tracks open issues and daily send health.

### CTA strategy
- Free daily question
- $10 / 24-hour cram pass
- monthly package second

### What makes this stand out
- cleaner than a newsletter
- clinically useful every day
- one question, one insight, one link
