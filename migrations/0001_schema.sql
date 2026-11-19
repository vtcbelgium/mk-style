-- Apply to staging first. Do not apply to production before Murat validates business data.
CREATE TABLE IF NOT EXISTS site_config (
  id TEXT PRIMARY KEY CHECK(id = 'main'),
  config_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK(version >= 1),
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS site_revisions (
  version INTEGER PRIMARY KEY,
  before_json TEXT NOT NULL,
  after_json TEXT NOT NULL,
  actor TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('manual','ai')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_daily_usage (
  actor TEXT NOT NULL,
  day TEXT NOT NULL,
  requests INTEGER NOT NULL CHECK(requests >= 0),
  PRIMARY KEY (actor, day)
);
