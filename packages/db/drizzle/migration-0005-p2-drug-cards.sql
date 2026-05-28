CREATE TABLE IF NOT EXISTS drug_cards (
  id TEXT PRIMARY KEY,
  generic_name TEXT NOT NULL,
  brand_names TEXT NOT NULL DEFAULT '[]',
  class TEXT NOT NULL,
  mechanism TEXT NOT NULL,
  priority_labs TEXT NOT NULL DEFAULT '[]',
  nursing_assessments TEXT NOT NULL DEFAULT '[]',
  contraindications TEXT NOT NULL DEFAULT '[]',
  black_box_warning TEXT,
  nclex_high_yield INTEGER NOT NULL DEFAULT 1,
  source_href TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_drug_cards_generic_name ON drug_cards(generic_name);
CREATE INDEX IF NOT EXISTS idx_drug_cards_high_yield ON drug_cards(nclex_high_yield);
