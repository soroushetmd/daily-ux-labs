#!/usr/bin/env python3
"""Compare two component-library manifests and explain contract drift."""
from __future__ import annotations

import argparse
import html
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class Change:
    severity: str
    component: str
    contract: str
    evidence: str
    action: str


def load_manifest(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not data.get("version") or not isinstance(data.get("components"), list):
        raise ValueError("manifest requires version and components array")
    allowed_component = {"name", "props", "keyboard"}
    names: set[str] = set()
    for component in data["components"]:
        unknown = set(component) - allowed_component
        if unknown:
            raise ValueError(f"unknown component field: {sorted(unknown)[0]}")
        if not component.get("name") or not isinstance(component.get("props"), dict) or not isinstance(component.get("keyboard"), list):
            raise ValueError("each component requires name, props object, and keyboard array")
        if component["name"] in names:
            raise ValueError(f"duplicate component: {component['name']}")
        names.add(component["name"])
        for prop, definition in component["props"].items():
            if not isinstance(definition, dict) or set(definition) != {"type", "required"}:
                raise ValueError(f"{component['name']}.{prop} needs type and required")
            if not isinstance(definition["type"], str) or not isinstance(definition["required"], bool):
                raise ValueError(f"{component['name']}.{prop} has invalid definition")
        if not all(isinstance(item, str) and item.strip() for item in component["keyboard"]):
            raise ValueError(f"{component['name']} keyboard items must be strings")
    return data


def compare(before: dict[str, Any], after: dict[str, Any]) -> list[Change]:
    old = {item["name"]: item for item in before["components"]}
    new = {item["name"]: item for item in after["components"]}
    changes: list[Change] = []
    for name in sorted(old.keys() - new.keys()):
        changes.append(Change("breaking", name, "Component", "Component was removed.", "Publish a migration path or restore the export."))
    for name in sorted(new.keys() - old.keys()):
        changes.append(Change("non-breaking", name, "Component", "Component was added.", "Document availability and intended use."))
    for name in sorted(old.keys() & new.keys()):
        old_props, new_props = old[name]["props"], new[name]["props"]
        for prop in sorted(old_props.keys() - new_props.keys()):
            changes.append(Change("breaking", name, f"Prop: {prop}", "Previously available prop was removed.", "Keep a deprecated alias or document a codemod."))
        for prop in sorted(new_props.keys() - old_props.keys()):
            required = new_props[prop]["required"]
            changes.append(Change("breaking" if required else "non-breaking", name, f"Prop: {prop}", f"New prop is {'required' if required else 'optional'}.", "Provide a default or migration guidance." if required else "Document the optional capability."))
        for prop in sorted(old_props.keys() & new_props.keys()):
            previous, current = old_props[prop], new_props[prop]
            if previous["type"] != current["type"]:
                changes.append(Change("breaking", name, f"Prop: {prop}", f"Type changed from {previous['type']} to {current['type']}.", "Support both forms temporarily or publish a migration."))
            if not previous["required"] and current["required"]:
                changes.append(Change("breaking", name, f"Prop: {prop}", "Optional prop became required.", "Provide a compatible default or migration."))
            if previous["required"] and not current["required"]:
                changes.append(Change("non-breaking", name, f"Prop: {prop}", "Required prop became optional.", "Document the default behavior."))
        old_keys, new_keys = set(old[name]["keyboard"]), set(new[name]["keyboard"])
        for key in sorted(old_keys - new_keys):
            changes.append(Change("review", name, "Keyboard contract", f"Removed interaction: {key}", "Verify the interaction remains reachable and document the replacement."))
        for key in sorted(new_keys - old_keys):
            changes.append(Change("non-breaking", name, "Keyboard contract", f"Added interaction: {key}", "Add the behavior to usage and accessibility documentation."))
    order = {"breaking": 0, "review": 1, "non-breaking": 2}
    return sorted(changes, key=lambda item: (order[item.severity], item.component, item.contract, item.evidence))


def summary(changes: list[Change]) -> dict[str, int]:
    return {level: sum(change.severity == level for change in changes) for level in ("breaking", "review", "non-breaking")}


def render_html(before: dict[str, Any], after: dict[str, Any], changes: list[Change]) -> str:
    counts = summary(changes)
    cards = "".join(
        f'<article class="card {html.escape(change.severity)}"><p class="tag">{html.escape(change.severity)}</p><h3>{html.escape(change.component)} · {html.escape(change.contract)}</h3><p><strong>Evidence:</strong> {html.escape(change.evidence)}</p><p><strong>Action:</strong> {html.escape(change.action)}</p></article>'
        for change in changes
    ) or '<article class="card clear"><h3>No contract drift found</h3><p>The compared manifest fields are unchanged.</p></article>'
    rows = "".join(
        f'<tr><td>{html.escape(change.severity)}</td><th scope="row">{html.escape(change.component)}</th><td>{html.escape(change.contract)}</td><td>{html.escape(change.evidence)}</td></tr>'
        for change in changes
    ) or '<tr><td colspan="4">No changes</td></tr>'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Component Contract Drift</title><style>body{{margin:0;background:#f2f1ec;color:#17201e;font:16px/1.55 system-ui,sans-serif}}main,footer{{width:min(1050px,calc(100% - 2rem));margin:auto}}header{{padding:3.5rem 0 2rem}}h1{{margin:.2rem 0;font:750 clamp(2.7rem,7vw,5rem)/.95 Georgia,serif;letter-spacing:-.045em}}.eyebrow,.tag{{color:#1b604f;font-size:.78rem;font-weight:850;letter-spacing:.09em;text-transform:uppercase}}.notice,.card{{background:#fff;border:1px solid #d0d8d4;border-radius:14px;padding:1.2rem;margin:1rem 0}}.notice{{border-left:5px solid #9a5800}}.metrics{{display:flex;gap:1rem;flex-wrap:wrap}}.metric{{padding:.8rem 1rem;background:#e7efec;border-radius:10px}}.metric strong{{display:block;font-size:1.8rem}}.breaking{{border-left:5px solid #a52c2c}}.review{{border-left:5px solid #9a5800}}.non-breaking,.clear{{border-left:5px solid #176b55}}table{{width:100%;border-collapse:collapse;background:#fff}}th,td{{padding:.7rem;text-align:left;border-bottom:1px solid #d0d8d4}}thead th{{background:#e7edeb}}footer{{padding:2rem 0 3rem;color:#596662}}@media(max-width:700px){{.table-wrap{{overflow-x:auto}}}}@media(prefers-reduced-motion:reduce){{*{{scroll-behavior:auto!important}}}}</style></head><body><main><header><p class="eyebrow">Design systems · API governance</p><h1>Component Contract Drift</h1><p>Explainable changes from <strong>{html.escape(before['version'])}</strong> to <strong>{html.escape(after['version'])}</strong>.</p></header><section class="notice"><h2>Prototype scope</h2><p>This report compares declared API and keyboard contracts. It does not prove implementation compatibility, accessibility conformance, visual stability, or test coverage.</p></section><section class="metrics" aria-label="Change summary"><div class="metric"><strong>{counts['breaking']}</strong>breaking</div><div class="metric"><strong>{counts['review']}</strong>review</div><div class="metric"><strong>{counts['non-breaking']}</strong>non-breaking</div></section><section aria-labelledby="changes"><h2 id="changes">Change evidence</h2>{cards}</section><section aria-labelledby="log"><h2 id="log">Exact change log</h2><div class="table-wrap"><table><caption>All declared contract changes</caption><thead><tr><th scope="col">Severity</th><th scope="col">Component</th><th scope="col">Contract</th><th scope="col">Evidence</th></tr></thead><tbody>{rows}</tbody></table></div></section></main><footer>Created by <strong>Soroush Etemadfar</strong>. Manifests and version changes in this demo are synthetic.</footer></body></html>'''


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("before", type=Path)
    parser.add_argument("after", type=Path)
    parser.add_argument("--html", type=Path, required=True)
    parser.add_argument("--json", type=Path, required=True)
    parser.add_argument("--strict", action="store_true", help="exit 2 when breaking changes exist")
    args = parser.parse_args()
    try:
        before, after = load_manifest(args.before), load_manifest(args.after)
        changes = compare(before, after)
        args.html.write_text(render_html(before, after, changes), encoding="utf-8")
        args.json.write_text(json.dumps({"from": before["version"], "to": after["version"], "summary": summary(changes), "changes": [asdict(change) for change in changes]}, indent=2) + "\n", encoding="utf-8")
    except (OSError, ValueError, json.JSONDecodeError) as error:
        parser.error(str(error))
    counts = summary(changes)
    print(f"Compared {before['version']} → {after['version']}: {counts['breaking']} breaking, {counts['review']} review, {counts['non-breaking']} non-breaking")
    return 2 if args.strict and counts["breaking"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
