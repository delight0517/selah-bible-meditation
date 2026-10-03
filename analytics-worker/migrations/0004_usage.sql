CREATE TABLE IF NOT EXISTS usage_events (
  event_id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  country TEXT NOT NULL,
  locale TEXT NOT NULL,
  client TEXT NOT NULL,
  device_class TEXT NOT NULL,
  feature TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS usage_events_visitor_time ON usage_events(visitor_id, occurred_at);
CREATE INDEX IF NOT EXISTS usage_events_time ON usage_events(occurred_at);
