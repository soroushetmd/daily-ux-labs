PRAGMA foreign_keys = ON;

CREATE TABLE flows (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  owner TEXT NOT NULL CHECK(owner IN ('Customer', 'Provider', 'Admin'))
);

CREATE TABLE states (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL
);

CREATE TABLE coverage (
  flow_id INTEGER NOT NULL REFERENCES flows(id),
  state_id INTEGER NOT NULL REFERENCES states(id),
  status TEXT NOT NULL CHECK(status IN ('designed', 'partial', 'missing', 'not-applicable')),
  note TEXT NOT NULL DEFAULT '',
  PRIMARY KEY(flow_id, state_id)
);

CREATE VIEW coverage_summary AS
SELECT f.id, f.name, f.owner,
       SUM(c.status = 'designed') AS designed,
       SUM(c.status = 'partial') AS partial,
       SUM(c.status = 'missing') AS missing,
       SUM(c.status != 'not-applicable') AS applicable,
       ROUND(100.0 * SUM(c.status = 'designed') / NULLIF(SUM(c.status != 'not-applicable'), 0), 0) AS completion
FROM flows f
JOIN coverage c ON c.flow_id = f.id
GROUP BY f.id;
