-- Surface premium rationale content through the already-deployed answer API.
-- Backend/data-only bridge: no source, schema, Stripe, auth, UI, layout, CSS, or navigation changes.
-- Scope: published NCLEX rows that have already passed final-curated-live review.

UPDATE questions
SET rationale =
      trim(rationale)
      || char(10) || char(10)
      || 'Deep rationale:' || char(10)
      || trim(deep_rationale)
      || char(10) || char(10)
      || 'References: '
      || COALESCE(
        (
          SELECT group_concat(
            COALESCE(json_extract(value,'$.title'), json_extract(value,'$.source')),
            '; '
          )
          FROM json_each(questions.references_json)
        ),
        'See source list'
      ),
    provenance=COALESCE(provenance,'gen') || '|surface-curated-rationales-001:deep-plus-reference-titles'
WHERE exam='nclex'
  AND publish_state='published'
  AND review_status='final-curated-live'
  AND deep_rationale IS NOT NULL
  AND length(trim(deep_rationale)) >= 500
  AND references_json IS NOT NULL
  AND json_valid(references_json)=1
  AND rationale NOT LIKE '%Deep rationale:%'
  AND rationale NOT LIKE '%References:%';
