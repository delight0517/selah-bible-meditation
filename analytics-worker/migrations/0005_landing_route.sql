CREATE TABLE market_experiment_daily_v4 (
  day TEXT NOT NULL,
  country TEXT NOT NULL,
  region_code TEXT NOT NULL DEFAULT '',
  landing_route TEXT NOT NULL DEFAULT 'unattributed',
  locale TEXT NOT NULL,
  client TEXT NOT NULL DEFAULT 'unknown',
  device_class TEXT NOT NULL DEFAULT 'unknown',
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  experiment TEXT NOT NULL,
  variant TEXT NOT NULL,
  event TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, country, region_code, landing_route, locale, client, device_class, utm_source, utm_medium, utm_campaign, experiment, variant, event)
) WITHOUT ROWID;

INSERT INTO market_experiment_daily_v4 (day, country, region_code, landing_route, locale, client, device_class, utm_source, utm_medium, utm_campaign, experiment, variant, event, count)
SELECT day, country, region_code, 'unattributed', locale, client, device_class, utm_source, utm_medium, utm_campaign, experiment, variant, event, count
FROM market_experiment_daily;

DROP TABLE market_experiment_daily;
ALTER TABLE market_experiment_daily_v4 RENAME TO market_experiment_daily;

CREATE INDEX market_experiment_daily_day_market
  ON market_experiment_daily (day, country, region_code, landing_route, client, device_class);
