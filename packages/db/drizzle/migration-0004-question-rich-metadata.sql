-- ChapAI D1 question rich metadata migration
-- Run with: npx wrangler d1 execute chapai-prod --remote --file=packages/db/drizzle/migration-0004-question-rich-metadata.sql

ALTER TABLE questions ADD COLUMN scenario_title TEXT;
ALTER TABLE questions ADD COLUMN scenario TEXT;
ALTER TABLE questions ADD COLUMN additional_info TEXT;
ALTER TABLE questions ADD COLUMN exhibits TEXT;
ALTER TABLE questions ADD COLUMN chart_review TEXT;
ALTER TABLE questions ADD COLUMN matrix_columns TEXT;
ALTER TABLE questions ADD COLUMN matrix_rows TEXT;
ALTER TABLE questions ADD COLUMN visual_rationale TEXT;
ALTER TABLE questions ADD COLUMN references_json TEXT;
