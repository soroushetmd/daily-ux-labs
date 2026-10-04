#!/usr/bin/env python3
import argparse
import html
import sqlite3
from pathlib import Path


def build_database(schema: Path, seed: Path) -> sqlite3.Connection:
    database = sqlite3.connect(":memory:")
    database.executescript(schema.read_text(encoding="utf-8"))
    database.executescript(seed.read_text(encoding="utf-8"))
    return database


def get_matrix(database: sqlite3.Connection):
    states = [row[0] for row in database.execute("SELECT name FROM states ORDER BY sort_order")]
    rows = []
    for flow_id, name, owner, completion in database.execute("SELECT id, name, owner, completion FROM coverage_summary ORDER BY owner, name"):
        statuses = dict(database.execute("SELECT s.name, c.status FROM coverage c JOIN states s ON s.id=c.state_id WHERE c.flow_id=?", (flow_id,)))
        rows.append({"name": name, "owner": owner, "completion": int(completion or 0), "statuses": statuses})
    return states, rows


def get_gaps(database: sqlite3.Connection):
    return database.execute("""
        SELECT f.name, f.owner, s.name, c.status, c.note
        FROM coverage c JOIN flows f ON f.id=c.flow_id JOIN states s ON s.id=c.state_id
        WHERE c.status IN ('missing','partial')
        ORDER BY CASE c.status WHEN 'missing' THEN 0 ELSE 1 END, f.owner, f.name, s.sort_order
    """).fetchall()


def render(states, rows, gaps) -> str:
    headers = "".join(f'<th scope="col">{html.escape(state)}</th>' for state in states)
    body = ""
    for row in rows:
        cells = "".join(f'<td><span class="status {status}">{label(status)}</span></td>' for status in row["statuses"].values())
        body += f'<tr><th scope="row">{html.escape(row["name"])}<small>{html.escape(row["owner"])}</small></th><td>{row["completion"]}%</td>{cells}</tr>'
    gap_cards = "".join(
        f'<article class="gap"><p class="meta">{html.escape(status)} · {html.escape(owner)}</p><h3>{html.escape(flow)} — {html.escape(state)}</h3>'
        f'<p>{html.escape(note or "Define behavior, content, and recovery before engineering handoff.")}</p></article>'
        for flow, owner, state, status, note in gaps
    )
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Handoff Coverage Matrix</title><style>
:root{{--ink:#18202d;--paper:#f5f3ed;--panel:#fff;--line:#d8d3c8;--good:#16704a;--warn:#9b5c00;--bad:#aa3142;font-family:system-ui,sans-serif}}*{{box-sizing:border-box}}body{{margin:0;background:var(--paper);color:var(--ink);line-height:1.5}}header,main,footer{{width:min(1180px,calc(100% - 2rem));margin:auto}}header{{padding:4rem 0 2rem;max-width:1180px}}h1{{font-size:clamp(2.5rem,6vw,5.5rem);line-height:.95;letter-spacing:-.05em;max-width:11ch}}header>p{{max-width:65ch}}.panel{{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:1rem;overflow-x:auto}}table{{border-collapse:collapse;width:100%;min-width:900px}}caption{{text-align:left;font-weight:800;padding:.5rem}}th,td{{border-bottom:1px solid var(--line);padding:.8rem;text-align:left}}th small{{display:block;font-weight:400;color:#667}}.status{{display:inline-block;border-radius:999px;padding:.25rem .55rem;font-size:.76rem;font-weight:800}}.designed{{background:#d9f1e5;color:#12583b}}.partial{{background:#fff0ca;color:#764500}}.missing{{background:#f8dce1;color:#812332}}.not-applicable{{background:#eee;color:#555}}.legend{{display:flex;gap:.75rem;flex-wrap:wrap;margin:1rem 0}}.gaps{{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem}}.gap{{background:var(--panel);border:1px solid var(--line);border-left:5px solid var(--bad);border-radius:12px;padding:1rem}}.gap:has(.meta:first-child){{}}.meta{{font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--bad)}}footer{{padding:3rem 0;color:#667}}@media(max-width:600px){{header{{padding-top:2rem}}}}
</style></head><body><header><p>Design–engineering handoff prototype</p><h1>Handoff Coverage Matrix</h1><p>See which interaction states are ready, partial, missing, or not applicable before a product flow reaches implementation. All flows and statuses are synthetic.</p></header><main><div class="legend" aria-label="Status legend"><span class="status designed">Designed</span><span class="status partial">Partial</span><span class="status missing">Missing</span><span class="status not-applicable">Not applicable</span></div><section class="panel" aria-labelledby="matrix"><h2 id="matrix">Coverage by flow</h2><table><caption>State coverage and completion percentage</caption><thead><tr><th scope="col">Flow</th><th scope="col">Complete</th>{headers}</tr></thead><tbody>{body}</tbody></table></section><section aria-labelledby="gaps"><h2 id="gaps">Handoff gaps</h2><div class="gaps">{gap_cards}</div></section></main><footer>Built by <strong>Soroush Etemadfar</strong> · Coverage is a conversation aid, not a quality score.</footer></body></html>'''


def label(status):
    return {"designed": "Designed", "partial": "Partial", "missing": "Missing", "not-applicable": "N/A"}[status]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--schema", type=Path, default=Path("schema.sql"))
    parser.add_argument("--seed", type=Path, default=Path("seed.sql"))
    parser.add_argument("--output", type=Path, default=Path("coverage-report.html"))
    args = parser.parse_args()
    db = build_database(args.schema, args.seed)
    states, rows = get_matrix(db)
    gaps = get_gaps(db)
    args.output.write_text(render(states, rows, gaps), encoding="utf-8")
    print(f"Wrote {args.output}: {len(rows)} flows, {len(gaps)} gaps.")


if __name__ == "__main__":
    main()
