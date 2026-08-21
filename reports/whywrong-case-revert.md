# whyWrong option-key case repair — revert manifest

**Applied:** 2026-08-14
**Rows changed:** 243 (`publish_state='published'`)
**Column touched:** `structured_rationale`, `$.whyWrong` **keys only**. Values, sibling
keys (`overview`, `mechanism`, `whyCorrect`, `citations`) and all other columns
are byte-identical. Verified on `gen-nemotron-1780592018-1-t4tir`: length 954
before and after.

## What was wrong

`apps/web/src/lib/distractor-rationale-display.ts:64` filters `whyWrong` entries
with `optionIds.has(optionId)` — an exact string match, no case folding. 243
published rows stored keys as `"A"`, `"C"`, `"D"` while their `options` used ids
`"a"`, `"c"`, `"d"`. Every distractor explanation on those rows was silently
dropped before render. No error, no console warning — students simply saw nothing
in the "why the other options are wrong" section.

Mostly Cerebras- and case-study-generated batches (`genv-cerebras-*`, `cs-gen-*`).

## Excluded on purpose (5 rows)

- `genv-cerebras-1783141717-63-we29b` — a matrix item whose `whyWrong` is keyed by
  finding text ("Maternal hypotension (systolic <90 mmHg)…"), not option ids.
  Lowercasing would corrupt it. Needs separate handling.
- 4 further rows where `lower(key)` matched no id in `options`. Left untouched and
  reported rather than guessed at.

## Revert

The inverse is exact: every changed key was a single `[A-Z]` and became the same
single `[a-z]`. To roll back, uppercase the single-letter keys on the ids listed
in `whywrong-case-revert-ids.txt`:

```sql
UPDATE questions
SET structured_rationale = json_set(
  structured_rationale, '$.whyWrong',
  json((SELECT json_group_object(upper(je.key), je.value)
        FROM json_each(json_extract(questions.structured_rationale,'$.whyWrong')) je))
)
WHERE id IN (<ids from whywrong-case-revert-ids.txt>);
```

## Applied statement

```sql
UPDATE questions
SET structured_rationale = json_set(
  structured_rationale, '$.whyWrong',
  json((SELECT json_group_object(lower(je.key), je.value)
        FROM json_each(json_extract(questions.structured_rationale,'$.whyWrong')) je))
)
WHERE publish_state='published'
  AND structured_rationale GLOB '*"whyWrong":{"[A-Z]"*'
  AND options GLOB '*"id":"[a-z]"*'
  AND NOT EXISTS (SELECT 1 FROM json_each(json_extract(questions.structured_rationale,'$.whyWrong')) k
                  WHERE k.key NOT GLOB '[A-Z]')
  AND NOT EXISTS (SELECT 1 FROM json_each(json_extract(questions.structured_rationale,'$.whyWrong')) k
                  WHERE instr(questions.options, '"id":"' || lower(k.key) || '"') = 0);
```

Note: SQLite `LIKE` is case-insensitive for ASCII and will match both cases —
`GLOB` is required for any case-sensitive check here.
