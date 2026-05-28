CREATE TABLE IF NOT EXISTS drug_cards (
  id TEXT PRIMARY KEY,
  generic_name TEXT NOT NULL,
  brand_names TEXT DEFAULT '[]',
  drug_class TEXT NOT NULL,
  mechanism TEXT,
  indications TEXT DEFAULT '[]',
  contraindications TEXT DEFAULT '[]',
  black_box_warning TEXT,
  source_name TEXT,
  source_href TEXT,
  priority_labs TEXT DEFAULT '[]',
  patient_teaching TEXT DEFAULT '[]',
  nursing_implications TEXT DEFAULT '[]',
  related_tags TEXT DEFAULT '[]',
  publish_state TEXT NOT NULL DEFAULT 'published',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_drug_cards_generic_name ON drug_cards(generic_name);
CREATE INDEX IF NOT EXISTS idx_drug_cards_drug_class ON drug_cards(drug_class);
CREATE INDEX IF NOT EXISTS idx_drug_cards_publish_state ON drug_cards(publish_state);
