CREATE TABLE tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  home_zone TEXT NOT NULL
);
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id TEXT NOT NULL REFERENCES tools(id),
  event_type TEXT NOT NULL CHECK(event_type IN ('checkout','return','move','missing')),
  observed_zone TEXT,
  occurred_at TEXT NOT NULL,
  expected_return TEXT
);
