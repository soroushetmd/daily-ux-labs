#!/usr/bin/env python3
"""Review a synthetic XR panel layout and generate a self-contained HTML report."""
from __future__ import annotations

import argparse
import html
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any

DEFAULTS = {
    "min_distance_m": 0.6,
    "max_distance_m": 3.0,
    "max_yaw_deg": 35.0,
    "max_pitch_deg": 25.0,
    "max_angular_width_deg": 45.0,
    "min_target_angle_deg": 1.2,
}


@dataclass(frozen=True)
class Signal:
    panel: str
    rule: str
    evidence: str
    suggestion: str


def angular_size(size_m: float, distance_m: float) -> float:
    if size_m <= 0 or distance_m <= 0:
        raise ValueError("size and distance must be positive")
    return math.degrees(2 * math.atan(size_m / (2 * distance_m)))


def load_layout(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not data.get("name") or not isinstance(data.get("panels"), list):
        raise ValueError("layout requires a name and panels array")
    if not data["panels"]:
        raise ValueError("layout must contain at least one panel")
    allowed = {"id", "label", "distance_m", "yaw_deg", "pitch_deg", "width_m", "target_height_m"}
    seen: set[str] = set()
    for panel in data["panels"]:
        unknown = set(panel) - allowed
        if unknown:
            raise ValueError(f"unknown panel field: {sorted(unknown)[0]}")
        missing = allowed - set(panel)
        if missing:
            raise ValueError(f"panel is missing field: {sorted(missing)[0]}")
        if panel["id"] in seen:
            raise ValueError(f"duplicate panel id: {panel['id']}")
        seen.add(panel["id"])
        for key in ("distance_m", "width_m", "target_height_m"):
            if not isinstance(panel[key], (int, float)) or panel[key] <= 0:
                raise ValueError(f"{panel['id']} {key} must be positive")
        for key in ("yaw_deg", "pitch_deg"):
            if not isinstance(panel[key], (int, float)):
                raise ValueError(f"{panel['id']} {key} must be numeric")
    return data


def review(layout: dict[str, Any], thresholds: dict[str, float] | None = None) -> list[Signal]:
    t = DEFAULTS | (thresholds or {})
    signals: list[Signal] = []
    for panel in layout["panels"]:
        name = panel["label"]
        distance = panel["distance_m"]
        width_angle = angular_size(panel["width_m"], distance)
        target_angle = angular_size(panel["target_height_m"], distance)
        if distance < t["min_distance_m"]:
            signals.append(Signal(name, "Near placement", f"{distance:.2f} m from viewer", "Review visual comfort and whether the panel needs to be this close."))
        if distance > t["max_distance_m"]:
            signals.append(Signal(name, "Distant placement", f"{distance:.2f} m from viewer", "Review legibility at the intended display and headset resolution."))
        if abs(panel["yaw_deg"]) > t["max_yaw_deg"]:
            signals.append(Signal(name, "Large horizontal turn", f"{abs(panel['yaw_deg']):.0f}° from forward", "Consider a more central placement or an intentional recenter action."))
        if abs(panel["pitch_deg"]) > t["max_pitch_deg"]:
            signals.append(Signal(name, "Large vertical turn", f"{abs(panel['pitch_deg']):.0f}° from eye level", "Review neck movement and seated/standing variants."))
        if width_angle > t["max_angular_width_deg"]:
            signals.append(Signal(name, "Wide visual span", f"{width_angle:.1f}° angular width", "Break content into focused regions or test scanning effort."))
        if target_angle < t["min_target_angle_deg"]:
            signals.append(Signal(name, "Small target angle", f"{target_angle:.2f}° target height", "Increase target size or move it closer, then test with the intended input method."))
    return sorted(signals, key=lambda signal: (signal.panel, signal.rule))


def _plot_point(panel: dict[str, Any], scale: float = 55.0) -> tuple[float, float]:
    angle = math.radians(panel["yaw_deg"])
    return 250 + math.sin(angle) * panel["distance_m"] * scale, 250 - math.cos(angle) * panel["distance_m"] * scale


def render(layout: dict[str, Any], signals: list[Signal]) -> str:
    by_panel: dict[str, int] = {}
    for signal in signals:
        by_panel[signal.panel] = by_panel.get(signal.panel, 0) + 1
    dots = []
    rows = []
    for panel in layout["panels"]:
        x, y = _plot_point(panel)
        label = html.escape(panel["label"])
        count = by_panel.get(panel["label"], 0)
        color = "#a64032" if count else "#16705a"
        dots.append(f'<g><circle cx="{x:.1f}" cy="{y:.1f}" r="12" fill="{color}"/><text x="{x + 17:.1f}" y="{y + 5:.1f}">{label}</text></g>')
        rows.append(f'<tr><th scope="row">{label}</th><td>{panel["distance_m"]:.2f} m</td><td>{panel["yaw_deg"]:.0f}°</td><td>{panel["pitch_deg"]:.0f}°</td><td>{angular_size(panel["width_m"], panel["distance_m"]):.1f}°</td><td>{count}</td></tr>')
    cards = "".join(
        f'<article class="signal"><p class="tag">{html.escape(s.rule)}</p><h3>{html.escape(s.panel)}</h3><p><strong>Evidence:</strong> {html.escape(s.evidence)}</p><p><strong>Review prompt:</strong> {html.escape(s.suggestion)}</p></article>'
        for s in signals
    ) or '<article class="clear"><h3>No configured signals found</h3><p>The layout still needs headset testing with representative users and intended input methods.</p></article>'
    thresholds = ", ".join(f"{key.replace('_', ' ')}: {value:g}" for key, value in DEFAULTS.items())
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(layout['name'])} — XR Spatial UI Review</title><style>
body{{margin:0;background:#f2f1ec;color:#17201e;font:16px/1.55 system-ui,sans-serif}}main,footer{{width:min(1050px,calc(100% - 2rem));margin:auto}}header{{padding:3rem 0 2rem}}h1{{font:750 clamp(2.6rem,7vw,5rem)/.95 Georgia,serif;letter-spacing:-.04em;margin:.2rem 0}}.eyebrow,.tag{{color:#12634f;font-size:.78rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase}}.notice,.viz,.signal,.clear{{background:#fff;border:1px solid #d1d8d5;border-radius:14px;padding:1.2rem;margin:1rem 0}}.notice{{border-left:5px solid #a15508}}.summary{{display:flex;gap:1rem;flex-wrap:wrap}}.metric{{padding:.8rem 1rem;background:#e5f2ed;border-radius:10px}}.metric strong{{display:block;font-size:1.7rem}}svg{{width:100%;height:auto}}svg text{{font:14px system-ui;fill:#17201e}}table{{width:100%;border-collapse:collapse;background:#fff}}th,td{{padding:.7rem;text-align:left;border-bottom:1px solid #d1d8d5}}thead th{{background:#e9eeec}}.signal{{border-left:5px solid #a64032}}.clear{{border-left:5px solid #16705a}}footer{{padding:2rem 0 3rem;color:#596662}}@media(max-width:700px){{.table-wrap{{overflow-x:auto}}}}@media(prefers-reduced-motion:reduce){{*{{scroll-behavior:auto!important}}}}</style></head><body><main><header><p class="eyebrow">Spatial UX · review artifact</p><h1>{html.escape(layout['name'])}</h1><p>Explainable review signals for a synthetic XR panel layout.</p></header><section class="notice" aria-labelledby="scope"><h2 id="scope">Prototype scope</h2><p>These configurable thresholds are design assumptions for discussion—not standards, clinical guidance, accessibility certification, or user-research findings. Validate decisions in the target headset with representative users.</p></section><div class="summary"><div class="metric"><strong>{len(layout['panels'])}</strong>panels</div><div class="metric"><strong>{len(signals)}</strong>review signals</div></div><section class="viz" aria-labelledby="map-title"><h2 id="map-title">Top-view placement map</h2><svg viewBox="0 0 500 500" role="img" aria-labelledby="map-svg-title map-svg-desc"><title id="map-svg-title">XR panel positions around the viewer</title><desc id="map-svg-desc">Top-view diagram. Red points have one or more configured review signals; green points have none.</desc><circle cx="250" cy="250" r="16" fill="#17201e"/><text x="273" y="255">Viewer</text><path d="M250 225 L238 205 L262 205 Z" fill="#17201e"/><circle cx="250" cy="250" r="165" fill="none" stroke="#c7cfcb" stroke-dasharray="5 6"/>{''.join(dots)}</svg></section><section aria-labelledby="signals-title"><h2 id="signals-title">Review signals</h2>{cards}</section><section aria-labelledby="data-title"><h2 id="data-title">Exact panel values</h2><div class="table-wrap"><table><caption>Panel placement values and signal counts</caption><thead><tr><th scope="col">Panel</th><th scope="col">Distance</th><th scope="col">Yaw</th><th scope="col">Pitch</th><th scope="col">Angular width</th><th scope="col">Signals</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div></section><details><summary>Prototype thresholds</summary><p>{html.escape(thresholds)}</p></details></main><footer>Created by <strong>Soroush Etemadfar</strong>. All panel data is synthetic.</footer></body></html>'''


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    try:
        layout = load_layout(args.input)
        signals = review(layout)
        args.output.write_text(render(layout, signals), encoding="utf-8")
    except (OSError, ValueError, json.JSONDecodeError) as error:
        parser.error(str(error))
    print(f"Reviewed {len(layout['panels'])} panels; wrote {len(signals)} signals to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
