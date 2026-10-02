#!/usr/bin/env python3
import argparse
import html
import json
from collections import Counter
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path


@dataclass(frozen=True)
class Finding:
    severity: str
    rule: str
    line: int
    element: str
    message: str
    suggestion: str


class SnapshotParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.stack = []
        self.text = {}

    def handle_starttag(self, tag, attrs):
        item = {"tag": tag, "attrs": dict(attrs), "line": self.getpos()[0], "index": len(self.elements)}
        self.elements.append(item)
        self.stack.append(item["index"])

    def handle_startendtag(self, tag, attrs):
        self.elements.append({"tag": tag, "attrs": dict(attrs), "line": self.getpos()[0], "index": len(self.elements)})

    def handle_endtag(self, tag):
        for position in range(len(self.stack) - 1, -1, -1):
            if self.elements[self.stack[position]]["tag"] == tag:
                self.stack = self.stack[:position]
                break

    def handle_data(self, data):
        for index in self.stack:
            self.text[index] = self.text.get(index, "") + data


def audit(source: str) -> list[Finding]:
    parser = SnapshotParser()
    parser.feed(source)
    findings = []
    elements = parser.elements
    ids = [item["attrs"].get("id") for item in elements if item["attrs"].get("id")]
    duplicates = {value for value, count in Counter(ids).items() if count > 1}
    label_targets = {item["attrs"].get("for") for item in elements if item["tag"] == "label" and item["attrs"].get("for")}

    html_node = next((item for item in elements if item["tag"] == "html"), None)
    if html_node and not html_node["attrs"].get("lang", "").strip():
        findings.append(make("high", "document-language", html_node, "The page language is not declared.", "Add a valid lang attribute to <html>."))

    previous_heading = 0
    for item in elements:
        tag, attrs = item["tag"], item["attrs"]
        name = accessible_name(item, parser.text)
        if tag == "img" and "alt" not in attrs:
            findings.append(make("high", "image-alt", item, "Image has no alt attribute.", "Add meaningful alt text or alt=\"\" when decorative."))
        if tag == "button" and not name:
            findings.append(make("high", "button-name", item, "Button has no accessible name.", "Add visible text or an aria-label."))
        if tag in {"input", "select", "textarea"} and attrs.get("type", "text") != "hidden":
            element_id = attrs.get("id")
            if not attrs.get("aria-label") and not attrs.get("aria-labelledby") and (not element_id or element_id not in label_targets):
                findings.append(make("high", "form-label", item, "Form control has no programmatic label.", "Associate a <label> using for/id or provide an accessible name."))
        if "tabindex" in attrs:
            try:
                if int(attrs["tabindex"]) > 0:
                    findings.append(make("medium", "positive-tabindex", item, "Positive tabindex changes the natural keyboard order.", "Use DOM order and tabindex=\"0\" only when necessary."))
            except ValueError:
                findings.append(make("medium", "invalid-tabindex", item, "tabindex is not an integer.", "Use -1 or 0 when tabindex is required."))
        if attrs.get("id") in duplicates:
            findings.append(make("medium", "duplicate-id", item, f'Duplicate id "{attrs["id"]}".', "Use a unique id for every element."))
        if len(tag) == 2 and tag.startswith("h") and tag[1].isdigit():
            level = int(tag[1])
            if previous_heading and level > previous_heading + 1:
                findings.append(make("medium", "heading-order", item, f"Heading level jumps from h{previous_heading} to h{level}.", "Use sequential heading levels to communicate structure."))
            previous_heading = level
    return findings


def accessible_name(item, text):
    attrs = item["attrs"]
    return (attrs.get("aria-label") or attrs.get("title") or text.get(item["index"], "")).strip()


def make(severity, rule, item, message, suggestion):
    marker = f'<{item["tag"]}' + (f' id="{item["attrs"]["id"]}"' if item["attrs"].get("id") else "") + ">"
    return Finding(severity, rule, item["line"], marker, message, suggestion)


def render_report(source_name: str, findings: list[Finding]) -> str:
    counts = Counter(item.severity for item in findings)
    cards = "".join(
        f'<article class="finding {item.severity}"><p class="meta">{html.escape(item.severity)} · line {item.line} · {html.escape(item.rule)}</p>'
        f'<h3>{html.escape(item.message)}</h3><code>{html.escape(item.element)}</code><p>{html.escape(item.suggestion)}</p></article>'
        for item in findings
    ) or '<p class="empty">No findings from the included rules. Automated checks cannot confirm full accessibility.</p>'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>A11y Snapshot report</title><style>
:root{{font-family:system-ui,sans-serif;color-scheme:light dark}}body{{max-width:960px;margin:auto;padding:2rem;line-height:1.55}}header{{max-width:68ch}}.summary{{display:flex;gap:1rem;flex-wrap:wrap;margin:2rem 0}}.metric,.finding{{border:1px solid #8888;border-radius:12px;padding:1rem}}.metric strong{{display:block;font-size:2rem}}.finding{{margin:1rem 0;border-left:6px solid #777}}.finding.high{{border-left-color:#c43b4d}}.finding.medium{{border-left-color:#b36b00}}.meta{{text-transform:uppercase;font-size:.78rem;font-weight:800;letter-spacing:.06em}}code{{background:#8882;padding:.25rem .4rem;border-radius:4px}}.note{{border-left:5px solid #3277b3;padding-left:1rem}}@media(max-width:600px){{body{{padding:1rem}}}}
</style></head><body><header><p>Accessibility engineering prototype</p><h1>A11y Snapshot</h1><p>Automated structural review of <strong>{html.escape(source_name)}</strong>.</p><p class="note"><strong>Scope:</strong> this report covers a small, transparent rule set. It does not replace keyboard, screen-reader, zoom, contrast, or user testing.</p></header><main><section class="summary" aria-label="Finding summary"><div class="metric"><strong>{len(findings)}</strong>Total</div><div class="metric"><strong>{counts["high"]}</strong>High</div><div class="metric"><strong>{counts["medium"]}</strong>Medium</div></section><section aria-labelledby="findings"><h2 id="findings">Findings</h2>{cards}</section></main><footer><p>Built by Soroush Etemadfar · Review results with human judgment.</p></footer></body></html>'''


def main():
    parser = argparse.ArgumentParser(description="Audit common HTML accessibility structure issues.")
    parser.add_argument("input", type=Path)
    parser.add_argument("--html", dest="html_output", type=Path, default=Path("a11y-report.html"))
    parser.add_argument("--json", dest="json_output", type=Path)
    parser.add_argument("--strict", action="store_true", help="Exit 1 when high-severity findings exist")
    args = parser.parse_args()
    findings = audit(args.input.read_text(encoding="utf-8"))
    args.html_output.write_text(render_report(args.input.name, findings), encoding="utf-8")
    if args.json_output:
        args.json_output.write_text(json.dumps([asdict(item) for item in findings], indent=2), encoding="utf-8")
    print(f"Wrote {args.html_output} with {len(findings)} finding(s).")
    raise SystemExit(1 if args.strict and any(item.severity == "high" for item in findings) else 0)


if __name__ == "__main__":
    main()
