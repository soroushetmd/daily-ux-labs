#!/usr/bin/env python3
"""Compare design-token JSON snapshots and generate an accessible HTML report."""

from __future__ import annotations

import argparse
import html
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class Token:
    path: str
    value: Any
    declared_type: str


@dataclass(frozen=True)
class Change:
    path: str
    status: str
    before: Token | None
    after: Token | None
    risk: str


@dataclass(frozen=True)
class ContrastResult:
    label: str
    foreground_path: str
    background_path: str
    foreground: str
    background: str
    ratio: float
    threshold: float
    passes: bool


def load_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ValueError(f"File not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in {path}: line {exc.lineno}, column {exc.colno}") from exc
    if not isinstance(data, dict):
        raise ValueError(f"Top-level JSON value must be an object: {path}")
    return data


def flatten_tokens(node: Any, prefix: str = "") -> dict[str, Token]:
    tokens: dict[str, Token] = {}
    if not isinstance(node, dict):
        return tokens
    if "value" in node and prefix:
        declared = str(node.get("type", type(node["value"]).__name__))
        tokens[prefix] = Token(prefix, node["value"], declared)
        return tokens
    for key, value in node.items():
        if key == "meta":
            continue
        path = f"{prefix}.{key}" if prefix else key
        tokens.update(flatten_tokens(value, path))
    return tokens


def compare_tokens(before: dict[str, Token], after: dict[str, Token]) -> list[Change]:
    changes: list[Change] = []
    for path in sorted(before.keys() | after.keys()):
        old = before.get(path)
        new = after.get(path)
        if old is None:
            changes.append(Change(path, "Added", None, new, "Review"))
        elif new is None:
            changes.append(Change(path, "Removed", old, None, "Breaking"))
        elif old.declared_type != new.declared_type or type(old.value) is not type(new.value):
            changes.append(Change(path, "Type changed", old, new, "Breaking"))
        elif old.value != new.value:
            changes.append(Change(path, "Value changed", old, new, "Review"))
    return changes


def parse_hex_colour(value: str) -> tuple[int, int, int]:
    if not isinstance(value, str):
        raise ValueError("Colour value must be a string")
    raw = value.strip().lstrip("#")
    if len(raw) == 3:
        raw = "".join(character * 2 for character in raw)
    if len(raw) != 6:
        raise ValueError(f"Unsupported colour value: {value}")
    try:
        return tuple(int(raw[index:index + 2], 16) for index in (0, 2, 4))
    except ValueError as exc:
        raise ValueError(f"Unsupported colour value: {value}") from exc


def relative_luminance(colour: str) -> float:
    channels = [channel / 255 for channel in parse_hex_colour(colour)]
    linear = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in channels]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast_ratio(foreground: str, background: str) -> float:
    lighter, darker = sorted((relative_luminance(foreground), relative_luminance(background)), reverse=True)
    return (lighter + 0.05) / (darker + 0.05)


def check_contrast(document: dict[str, Any], tokens: dict[str, Token]) -> tuple[list[ContrastResult], list[str]]:
    pairs = document.get("meta", {}).get("contrastPairs", [])
    if not isinstance(pairs, list):
        return [], ["meta.contrastPairs must be an array"]
    results: list[ContrastResult] = []
    errors: list[str] = []
    for index, pair in enumerate(pairs, start=1):
        if not isinstance(pair, dict):
            errors.append(f"Contrast pair {index} must be an object")
            continue
        foreground_path = str(pair.get("foreground", ""))
        background_path = str(pair.get("background", ""))
        label = str(pair.get("label", f"Pair {index}"))
        if foreground_path not in tokens or background_path not in tokens:
            errors.append(f"{label}: referenced token path was not found")
            continue
        foreground = str(tokens[foreground_path].value)
        background = str(tokens[background_path].value)
        try:
            ratio = contrast_ratio(foreground, background)
        except ValueError as exc:
            errors.append(f"{label}: {exc}")
            continue
        threshold = 3.0 if bool(pair.get("largeText", False)) else 4.5
        results.append(ContrastResult(label, foreground_path, background_path, foreground, background, ratio, threshold, ratio >= threshold))
    return results, errors


def display_value(token: Token | None) -> str:
    if token is None:
        return "—"
    if isinstance(token.value, (dict, list)):
        return json.dumps(token.value, ensure_ascii=False)
    return str(token.value)


def generate_report(changes: list[Change], contrasts: list[ContrastResult], errors: list[str]) -> str:
    breaking = sum(change.risk == "Breaking" for change in changes)
    failures = sum(not result.passes for result in contrasts)
    review = sum(change.risk == "Review" for change in changes)
    change_rows = "".join(
        f"<tr><td><code>{html.escape(change.path)}</code></td>"
        f"<td><span class='pill {change.risk.lower()}'>{html.escape(change.status)}</span></td>"
        f"<td>{html.escape(display_value(change.before))}</td>"
        f"<td>{html.escape(display_value(change.after))}</td>"
        f"<td>{html.escape(change.risk)}</td></tr>"
        for change in changes
    ) or "<tr><td colspan='5'>No token changes detected.</td></tr>"
    contrast_rows = "".join(
        f"<tr><td>{html.escape(result.label)}</td>"
        f"<td><code>{html.escape(result.foreground_path)}</code><br><span class='swatch' style='background:{html.escape(result.foreground)}'></span>{html.escape(result.foreground)}</td>"
        f"<td><code>{html.escape(result.background_path)}</code><br><span class='swatch' style='background:{html.escape(result.background)}'></span>{html.escape(result.background)}</td>"
        f"<td>{result.ratio:.2f}:1</td><td>{result.threshold:.1f}:1</td>"
        f"<td><span class='pill {'pass' if result.passes else 'fail'}'>{'Pass' if result.passes else 'Fail'}</span></td></tr>"
        for result in contrasts
    ) or "<tr><td colspan='6'>No contrast pairs declared.</td></tr>"
    error_list = "".join(f"<li>{html.escape(error)}</li>" for error in errors)
    error_section = f"<section class='notice'><h2>Input notices</h2><ul>{error_list}</ul></section>" if errors else ""
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Token Guard report</title><style>
:root{{--ink:#19191d;--muted:#606069;--paper:#f3f1ec;--surface:#fff;--line:#d9d6cf;--violet:#5542b8;--red:#a62e2e;--green:#14663f;--amber:#7c5200}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui,sans-serif}} main{{width:min(1120px,calc(100% - 32px));margin:auto;padding:52px 0 70px}}
.eyebrow{{color:var(--violet);font-size:.75rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}} h1{{max-width:760px;margin:.15em 0;font-size:clamp(2.8rem,7vw,5.5rem);line-height:.95;letter-spacing:-.055em}} .lede{{max-width:700px;color:var(--muted);font-size:1.15rem}}
.summary{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:45px 0}} .metric{{padding:22px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}} .metric strong{{display:block;font-size:2rem}} .metric span{{color:var(--muted)}}
section.table-card,.notice{{margin-top:24px;padding:24px;border:1px solid var(--line);border-radius:18px;background:var(--surface);overflow:hidden}} h2{{margin:0 0 4px}} .hint{{margin:0 0 18px;color:var(--muted)}} .table-wrap{{overflow-x:auto}} table{{width:100%;border-collapse:collapse;text-align:left}} th{{padding:11px;border-bottom:2px solid var(--ink);font-size:.72rem;letter-spacing:.06em;text-transform:uppercase}} td{{padding:14px 11px;border-bottom:1px solid var(--line);vertical-align:top}} code{{font-size:.82rem}} .pill{{display:inline-block;padding:4px 8px;border-radius:999px;font-size:.75rem;font-weight:800}} .breaking,.fail{{background:#f8dede;color:var(--red)}} .review{{background:#fff0c9;color:var(--amber)}} .pass{{background:#d9f2e4;color:var(--green)}} .swatch{{display:inline-block;width:13px;height:13px;margin:7px 6px 0 0;border:1px solid #777;border-radius:3px;vertical-align:-2px}}
footer{{display:flex;justify-content:space-between;gap:20px;margin-top:45px;padding-top:20px;border-top:1px solid var(--line);color:var(--muted);font-size:.8rem}} a:focus-visible{{outline:3px solid var(--violet);outline-offset:3px}} @media(max-width:650px){{.summary{{grid-template-columns:1fr}}footer{{flex-direction:column}}}}
</style></head><body><main>
<p class="eyebrow">Design-system change review</p><h1>Token Guard report</h1><p class="lede">A human-readable comparison of token changes and declared text contrast pairs. Automated findings are review prompts, not a replacement for design and accessibility QA.</p>
<div class="summary" aria-label="Report summary"><div class="metric"><strong>{breaking}</strong><span>breaking token risks</span></div><div class="metric"><strong>{failures}</strong><span>contrast failures</span></div><div class="metric"><strong>{review}</strong><span>changes to review</span></div></div>
{error_section}
<section class="table-card"><h2>Token changes</h2><p class="hint">Removed tokens and type changes are marked as breaking risks.</p><div class="table-wrap"><table><thead><tr><th scope="col">Token path</th><th scope="col">Change</th><th scope="col">Before</th><th scope="col">After</th><th scope="col">Risk</th></tr></thead><tbody>{change_rows}</tbody></table></div></section>
<section class="table-card"><h2>Contrast pairs</h2><p class="hint">Thresholds: 4.5:1 for normal text and 3:1 for declared large text.</p><div class="table-wrap"><table><thead><tr><th scope="col">Usage</th><th scope="col">Foreground</th><th scope="col">Background</th><th scope="col">Ratio</th><th scope="col">Threshold</th><th scope="col">Result</th></tr></thead><tbody>{contrast_rows}</tbody></table></div></section>
<footer><span>Generated by Token Guard</span><span>Designed and built by <strong>Soroush Etemadfar</strong></span></footer>
</main></body></html>"""


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Compare design-token snapshots and generate an HTML report.")
    parser.add_argument("before", type=Path, help="Path to the previous token JSON file")
    parser.add_argument("after", type=Path, help="Path to the new token JSON file")
    parser.add_argument("--out", type=Path, default=Path("token-guard-report.html"), help="Output HTML path")
    parser.add_argument("--strict", action="store_true", help="Exit 1 when breaking changes or contrast failures exist")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        before_document = load_json(args.before)
        after_document = load_json(args.after)
        before_tokens = flatten_tokens(before_document)
        after_tokens = flatten_tokens(after_document)
        changes = compare_tokens(before_tokens, after_tokens)
        contrasts, errors = check_contrast(after_document, after_tokens)
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(generate_report(changes, contrasts, errors), encoding="utf-8")
    except (OSError, ValueError) as exc:
        print(f"Token Guard error: {exc}", file=sys.stderr)
        return 2
    breaking = sum(change.risk == "Breaking" for change in changes)
    failures = sum(not result.passes for result in contrasts)
    print(f"Report written to {args.out} | {len(changes)} changes | {breaking} breaking risks | {failures} contrast failures")
    return 1 if args.strict and (breaking or failures or errors) else 0


if __name__ == "__main__":
    raise SystemExit(main())
