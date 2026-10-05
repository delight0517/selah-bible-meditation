CREATE TABLE IF NOT EXISTS bible_edition_interest_daily (
  day TEXT NOT NULL,
  country TEXT NOT NULL,
  locale TEXT NOT NULL,
  language TEXT NOT NULL,
  edition_key TEXT NOT NULL,
  edition_id TEXT NOT NULL DEFAULT '',
  edition_name TEXT NOT NULL,
  interest_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, country, locale, language, edition_key, interest_type)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS bible_edition_interest_daily_day
  ON bible_edition_interest_daily (day, language, edition_key);
