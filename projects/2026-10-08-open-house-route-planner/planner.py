#!/usr/bin/env python3
"""Build an explainable itinerary from synthetic open-house listings."""

from __future__ import annotations

import argparse
import html
import itertools
import json
import math
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Listing:
    id: str
    name: str
    neighborhood: str
    x: float
    y: float
    open_start: int
    open_end: int
    visit_minutes: int
    priority: int
    reasons: tuple[str, ...]


@dataclass(frozen=True)
class Stop:
    listing: Listing
    travel_minutes: int
    arrival: int
    start: int
    end: int


def load_listings(path: Path) -> list[Listing]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    required = {"id", "name", "neighborhood", "x", "y", "open_start", "open_end", "visit_minutes", "priority", "reasons"}
    listings = []
    for item in raw["listings"]:
        missing = required - item.keys()
        if missing:
            raise ValueError(f"{item.get('id', 'listing')} missing: {', '.join(sorted(missing))}")
        if not 0 <= item["priority"] <= 100:
            raise ValueError(f"{item['id']} priority must be between 0 and 100")
        if item["open_start"] >= item["open_end"] or item["visit_minutes"] <= 0:
            raise ValueError(f"{item['id']} has an invalid time window")
        listings.append(Listing(**{**item, "reasons": tuple(item["reasons"])}))
    if len({item.id for item in listings}) != len(listings):
        raise ValueError("listing IDs must be unique")
    return listings


def travel_minutes(a: tuple[float, float], b: tuple[float, float]) -> int:
    """Convert synthetic map distance into demo travel minutes."""
    return max(5, math.ceil(math.dist(a, b) * 7))


def schedule_order(order: tuple[Listing, ...], start: tuple[float, float], day_start: int, day_end: int) -> list[Stop] | None:
    now, position, stops = day_start, start, []
    for listing in order:
        travel = travel_minutes(position, (listing.x, listing.y))
        arrival = now + travel
        visit_start = max(arrival, listing.open_start)
        visit_end = visit_start + listing.visit_minutes
        if visit_end > listing.open_end or visit_end > day_end:
            return None
        stops.append(Stop(listing, travel, arrival, visit_start, visit_end))
        now, position = visit_end, (listing.x, listing.y)
    return stops


def plan_route(listings: list[Listing], start: tuple[float, float], day_start: int, day_end: int) -> list[Stop]:
    best: list[Stop] = []
    best_key = (-1, -1, float("-inf"))
    for length in range(1, len(listings) + 1):
        for order in itertools.permutations(listings, length):
            stops = schedule_order(order, start, day_start, day_end)
            if stops is None:
                continue
            key = (sum(stop.listing.priority for stop in stops), len(stops), -stops[-1].end)
            if key > best_key:
                best, best_key = stops, key
    return best


def clock(minutes: int) -> str:
    hour, minute = divmod(minutes, 60)
    suffix = "AM" if hour < 12 else "PM"
    display_hour = hour % 12 or 12
    return f"{display_hour}:{minute:02d} {suffix}"


def skip_reason(listing: Listing, selected: set[str], day_start: int, day_end: int) -> str:
    if listing.id in selected:
        return "Scheduled"
    if max(day_start, listing.open_start) + listing.visit_minutes > min(day_end, listing.open_end):
        return "Its viewing window cannot fit inside the available day."
    return "Not selected because the chosen combination provides a stronger total priority fit within the time and travel constraints."


def render_report(listings: list[Listing], stops: list[Stop], day_start: int, day_end: int) -> str:
    selected = {stop.listing.id for stop in stops}
    cards = "".join(
        f"""<article class="stop"><p class="time">{clock(stop.start)}–{clock(stop.end)}</p>
        <h3>{html.escape(stop.listing.name)}</h3><p>{html.escape(stop.listing.neighborhood)} · {stop.travel_minutes} min demo travel</p>
        <p><strong>Priority {stop.listing.priority}/100:</strong> {html.escape('; '.join(stop.listing.reasons))}</p></article>"""
        for stop in stops
    ) or '<p class="empty">No feasible itinerary was found.</p>'
    rows = "".join(
        f"<tr><th scope=" + '"row"' + f">{html.escape(item.name)}</th><td>{item.priority}</td><td>{'Yes' if item.id in selected else 'No'}</td><td>{html.escape(skip_reason(item, selected, day_start, day_end))}</td></tr>"
        for item in sorted(listings, key=lambda value: (-value.priority, value.name))
    )
    total = sum(stop.listing.priority for stop in stops)
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Open House Route Planner</title><style>
    :root{{--ink:#17201b;--muted:#5e6861;--paper:#f3f0e7;--panel:#fffef9;--line:#d0d5ce;--accent:#17604a}}*{{box-sizing:border-box}}
    body{{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 system-ui,sans-serif}}header,main,footer{{width:min(1040px,calc(100% - 2rem));margin:auto}}
    header{{padding:4rem 0 2rem;border-bottom:1px solid var(--line)}}h1{{margin:.2rem 0;font:800 clamp(2.7rem,8vw,5.8rem)/.92 Georgia,serif;letter-spacing:-.05em}}
    h2{{margin-top:2.5rem}}.eyebrow,.time{{color:var(--accent);font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:.78rem}}.notice{{padding:1rem;border-left:4px solid var(--accent);background:#e4e9df}}
    .summary{{display:flex;gap:1rem;flex-wrap:wrap;margin:1.5rem 0}}.metric,.stop{{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:1rem}}.metric strong{{display:block;font-size:1.8rem}}
    .route{{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem}}.stop h3{{margin:.2rem 0}}table{{width:100%;border-collapse:collapse;background:var(--panel)}}th,td{{padding:.75rem;text-align:left;border:1px solid var(--line);vertical-align:top}}caption{{text-align:left;padding:.7rem 0;font-weight:700}}footer{{padding:3rem 0;color:var(--muted)}}
    @media(max-width:700px){{table,thead,tbody,tr,th,td{{display:block}}thead{{position:absolute;clip:rect(0 0 0 0)}}tr{{padding:.7rem;border-bottom:2px solid var(--line)}}th,td{{border:0;padding:.25rem .7rem}}td:nth-child(2)::before{{content:'Priority: ';font-weight:700}}td:nth-child(3)::before{{content:'Scheduled: ';font-weight:700}}}}
    </style></head><body><header><p class="eyebrow">Synthetic real-estate UX prototype</p><h1>Open House Route Planner</h1>
    <p>One explainable plan for a limited viewing day—without pretending that an algorithm knows the “best” home.</p><p class="notice"><strong>Demo only:</strong> Listings, coordinates, travel times, priorities, and preferences are fictional.</p></header>
    <main><div class="summary"><div class="metric"><strong>{len(stops)}</strong>viewings</div><div class="metric"><strong>{total}</strong>combined priority</div><div class="metric"><strong>{clock(day_start)}–{clock(day_end)}</strong>available window</div></div>
    <section aria-labelledby="route-title"><h2 id="route-title">Suggested itinerary</h2><div class="route">{cards}</div></section>
    <section aria-labelledby="why-title"><h2 id="why-title">Why each listing was or was not scheduled</h2><table><caption>Decision details for all synthetic listings</caption><thead><tr><th scope="col">Listing</th><th scope="col">Priority</th><th scope="col">Scheduled</th><th scope="col">Explanation</th></tr></thead><tbody>{rows}</tbody></table></section>
    <section><h2>How to use this output</h2><p>Treat the itinerary as a planning draft. Confirm availability and real travel times, then change the input priorities when a preference is wrong. Priority is explicit input—not a prediction of property quality.</p></section></main>
    <footer>Designed and built by <strong>Soroush Etemadfar</strong>.</footer></body></html>"""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="JSON file containing synthetic listings")
    parser.add_argument("--output", type=Path, default=Path("itinerary.html"))
    parser.add_argument("--start", type=int, default=600, help="day start as minutes after midnight")
    parser.add_argument("--end", type=int, default=900, help="day end as minutes after midnight")
    args = parser.parse_args()
    if args.start >= args.end:
        parser.error("--start must be earlier than --end")
    listings = load_listings(args.input)
    stops = plan_route(listings, (0, 0), args.start, args.end)
    args.output.write_text(render_report(listings, stops, args.start, args.end), encoding="utf-8")
    print(f"Wrote {args.output}: {len(stops)} viewings, {sum(stop.listing.priority for stop in stops)} priority points")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
