# AGENTS.md — DropRoute is separate; THIS repo is Clarity NCLEX (chapai-web)

Multiple agents (Claude, Codex, Hermes) add/refine NCLEX questions in the
**shared production D1 `chapai-prod`**. Follow this contract so no agent breaks
the live service or clobbers another's work. (A file re-sync already silently
dropped the live pool from ~1,900 → 182 by overwriting `publish_state`. Don't
repeat that.)

## The one invariant that protects students
**The live service ONLY serves `questions` rows where `publish_state='published'`.**
Drafts and `NULL` publish_state are invisible to students. So: *adding* questions
is always safe as long as you add them as drafts. *Changing/removing* `published`
rows is what breaks the live site.

## State conventions (use these exact values)
- `publish_state`: `draft` (new, unreviewed) → `published` (live) | `unpublished` (rejected/retired)
- `review_status`: `needs_review` (draft awaiting review) → `final-curated-live` (premium, human/Claude-approved) | `rejected`
- A question goes live ONLY after review: `publish_state='published'` **and** `review_status='final-curated-live'`.

## Rules for ALL agents
1. **Add new questions as drafts only:** `publish_state='draft'`, `review_status='needs_review'`. Never insert directly as `published`. A human/Claude review pass promotes the good ones.
2. **Use your own ID prefix** so inserts never collide/overwrite:
   - `gen-gemini-*`, `gen-nemotron-*`, `cs-prem-*` → Claude pipeline
   - `hermes-*` → Hermes agent
   - `codex-*` → Codex agent
   Use `INSERT OR IGNORE` (or `ON CONFLICT(id) DO NOTHING`) — never blind-overwrite an existing id.
3. **NEVER downgrade or delete a row that is `published` or `review_status IN ('final-curated-live','rejected')`.** That is live content or a recorded review decision.
4. **NEVER run `DELETE FROM questions`, `--reset-questions`, or a bulk `publish_state` rewrite against `chapai-prod`.** The sync script (`scripts/sync-d1-question-bank.mjs`) is now guarded to preserve published/curated rows on both upsert and reset — keep it that way.
5. **Dedup before insert:** skip if a near-identical stem already exists (`SELECT 1 FROM questions WHERE substr(stem,1,70)=? LIMIT 1`).
6. **Content updates to draft/NULL rows are fine.** Improving rationales, fixing typos on non-live rows won't affect students.

## Safe shared write path (preferred)
Add drafts via the existing route instead of raw D1 writes:
`POST /api/admin/generate-questions` (x-author-secret) — validates schema,
dedups, inserts as `draft`/`needs_review`. The 15-min cron
`/api/cron/generate-drafts` does this automatically and self-throttles at a
120-draft backlog. Claude reviews the draft queue and promotes premium ones.

## Why this works
Because the live selector filters `publish_state='published'`, any number of
agents can pour drafts into D1 with zero risk to the live bank. The only ways
to break production are (a) deleting/downgrading published rows or (b) a
destructive sync — both now prohibited by rule and guarded in code.
