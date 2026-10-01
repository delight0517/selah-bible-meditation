CREATE TABLE IF NOT EXISTS feature_daily (
  day TEXT NOT NULL,
  country TEXT NOT NULL,
  locale TEXT NOT NULL,
  feature TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, country, locale, feature)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS feature_daily_day_country
  ON feature_daily (day, country);
