#!/usr/bin/env python3
import argparse, html, json, sqlite3
from datetime import datetime, timezone
from pathlib import Path

STATUSES=("available","checked-out","overdue","misplaced","missing")

def parse_time(value):
    if value is None:return None
    try:return datetime.fromisoformat(value.replace("Z","+00:00"))
    except ValueError as exc:raise ValueError(f"invalid ISO timestamp: {value}") from exc

def load_data(path):
    data=json.loads(Path(path).read_text())
    if set(data)!={"notice","tools","events"}:raise ValueError("input needs notice, tools, and events only")
    ids=[tool["id"] for tool in data["tools"]]
    if len(ids)!=len(set(ids)):raise ValueError("tool IDs must be unique")
    known=set(ids)
    for event in data["events"]:
        if event["tool_id"] not in known:raise ValueError(f"unknown tool: {event['tool_id']}")
        parse_time(event["occurred_at"]);parse_time(event.get("expected_return"))
    return data

def build_database(data,schema_path):
    db=sqlite3.connect(":memory:");db.executescript(Path(schema_path).read_text())
    db.executemany("INSERT INTO tools VALUES(:id,:name,:category,:home_zone)",data["tools"])
    db.executemany("INSERT INTO events(tool_id,event_type,observed_zone,occurred_at,expected_return) VALUES(:tool_id,:event_type,:observed_zone,:occurred_at,:expected_return)",[{**event,"observed_zone":event.get("observed_zone"),"expected_return":event.get("expected_return")} for event in data["events"]])
    return db

def latest_records(db):
    query="""WITH ranked AS (SELECT e.*,ROW_NUMBER() OVER(PARTITION BY tool_id ORDER BY occurred_at DESC,id DESC) AS rank FROM events e)
    SELECT t.id,t.name,t.category,t.home_zone,r.event_type,r.observed_zone,r.occurred_at,r.expected_return
    FROM tools t LEFT JOIN ranked r ON r.tool_id=t.id AND r.rank=1 ORDER BY t.name"""
    return [dict(zip(("id","name","category","home_zone","event_type","observed_zone","occurred_at","expected_return"),row)) for row in db.execute(query)]

def classify(record,as_of):
    event=record["event_type"]
    if event is None:return "missing","No location event has been recorded."
    if event=="missing":return "missing","The latest event explicitly reports the tool missing."
    if event=="checkout":
        expected=parse_time(record["expected_return"])
        if expected and expected<as_of:return "overdue",f"Expected back {expected.isoformat().replace('+00:00','Z')}."
        return "checked-out",f"Last observed at {record['observed_zone'] or 'an unspecified zone'}."
    if record["observed_zone"]!=record["home_zone"]:return "misplaced",f"Observed in {record['observed_zone'] or 'an unspecified zone'}; home is {record['home_zone']}."
    return "available",f"Returned to {record['home_zone']}."

def analyze(data,schema_path,as_of):
    db=build_database(data,schema_path);result=[]
    for record in latest_records(db):
        status,reason=classify(record,as_of);result.append({**record,"status":status,"reason":reason})
    db.close();return result

def render(records,notice,as_of):
    counts={status:sum(r["status"]==status for r in records) for status in STATUSES}
    cards="".join(f'<div class="metric"><span>{html.escape(s.replace("-"," ").title())}</span><strong>{counts[s]}</strong></div>' for s in STATUSES)
    rows="".join(f'<tr><th scope="row">{html.escape(r["name"])}</th><td>{html.escape(r["category"])}</td><td><span class="pill {r["status"]}">{html.escape(r["status"].replace("-"," ").title())}</span></td><td>{html.escape(r["observed_zone"] or "Unknown")}</td><td>{html.escape(r["reason"])}</td></tr>' for r in records)
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shared Tool Signal</title><style>
body{{margin:0;background:#f1efe8;color:#18201d;font:16px/1.55 system-ui,sans-serif}}main,footer{{width:min(1100px,calc(100% - 2rem));margin:auto}}header{{padding:4rem 0 2rem}}h1{{font:700 clamp(3rem,8vw,6rem)/.9 Georgia,serif;letter-spacing:-.05em;margin:.4rem 0}}.kicker{{text-transform:uppercase;letter-spacing:.12em;color:#176149;font-size:.75rem;font-weight:800}}.metrics{{display:grid;grid-template-columns:repeat(5,1fr);gap:.7rem}}.metric,section,.note{{background:#fffdf8;border:1px solid #c9c6bd;border-radius:16px;padding:1rem}}.metric span{{display:block;font-size:.78rem;text-transform:uppercase}}.metric strong{{font:700 2.4rem Georgia,serif}}section{{margin:1rem 0}}h2{{font:700 2rem Georgia,serif}}.wrap{{overflow:auto}}table{{width:100%;border-collapse:collapse}}th,td{{padding:.8rem;text-align:left;border-bottom:1px solid #ddd9cf}}thead th{{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em}}.pill{{display:inline-block;border-radius:99px;padding:.2rem .55rem;font-size:.72rem;font-weight:800}}.available{{background:#dcefe6;color:#176149}}.checked-out{{background:#dce8f5;color:#174c78}}.overdue,.missing{{background:#f4d7da;color:#922c35}}.misplaced{{background:#f6e5b8;color:#714d00}}.note{{border-left:5px solid #d8ef63;margin:1rem 0 3rem}}footer{{padding:2rem 0;border-top:1px solid #c9c6bd}}@media(max-width:750px){{.metrics{{grid-template-columns:repeat(2,1fr)}}header{{padding-top:2.5rem}}}}@media(prefers-reduced-motion:reduce){{*{{scroll-behavior:auto}}}}</style></head><body><main><header><p class="kicker">Field-service UX · fictional operational data</p><h1>Shared Tool Signal</h1><p>See where a shared tool was last observed, what its current state means, and what needs attention—without tracking or ranking workers.</p></header><div class="metrics">{cards}</div><section><h2>Availability board</h2><p>Snapshot at <strong>{html.escape(as_of.isoformat().replace('+00:00','Z'))}</strong>.</p><div class="wrap"><table><caption>Latest explainable status for every fictional tool</caption><thead><tr><th scope="col">Tool</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Last zone</th><th scope="col">Why</th></tr></thead><tbody>{rows}</tbody></table></div></section><aside class="note"><strong>Prototype boundary</strong><p>{html.escape(notice)} This board does not identify workers, infer responsibility, replace safety procedures, or prove inventory accuracy. A production system would require reliable scanning hardware, permissions, retention rules, and field validation.</p></aside></main><footer>Created by <strong>Soroush Etemadfar</strong> · UX/Product Design × Software Engineering</footer></body></html>'''

def main():
    parser=argparse.ArgumentParser();parser.add_argument("input");parser.add_argument("output");parser.add_argument("--as-of",default=datetime.now(timezone.utc).isoformat());args=parser.parse_args()
    try:
        data=load_data(args.input);as_of=parse_time(args.as_of);records=analyze(data,Path(__file__).with_name("schema.sql"),as_of);Path(args.output).write_text(render(records,data["notice"],as_of));print(f"Wrote {args.output} for {len(records)} tools")
    except (ValueError,KeyError,sqlite3.Error) as exc:parser.error(str(exc))
if __name__=="__main__":main()
