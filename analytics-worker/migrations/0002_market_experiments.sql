CREATE TABLE IF NOT EXISTS market_experiment_daily (
  day TEXT NOT NULL,
  country TEXT NOT NULL,
  region_code TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL,
  experiment TEXT NOT NULL,
  variant TEXT NOT NULL,
  event TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, country, region_code, locale, experiment, variant, event)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS market_experiment_daily_day_market
  ON market_experiment_daily (day, country, region_code);
