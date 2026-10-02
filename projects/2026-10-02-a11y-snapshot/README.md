# A11y Snapshot

A dependency-free Python accessibility auditing tool by **Soroush Etemadfar**. It reviews common structural HTML issues and produces accessible HTML plus optional JSON reports.

## Problem

Accessibility problems are cheaper to address before formal QA, but many small projects lack a quick feedback loop. A11y Snapshot makes a limited set of checks easy to run and easy to discuss. It deliberately states that automated rules cannot establish WCAG conformance.

## Interaction and UX decisions

- One command converts an HTML file into a readable report.
- Each finding includes severity, rule, line, element, explanation, and remediation.
- The summary uses exact counts; severity is never communicated by color alone.
- `--strict` supports CI without making every warning a build failure.
- JSON output enables later integration with other tools.

## Included checks

- Missing document language
- Images without `alt`
- Buttons without an accessible name
- Form controls without programmatic labels
- Positive or invalid `tabindex`
- Duplicate IDs
- Skipped heading levels

## Accessibility

Generated reports use semantic landmarks and headings, explicit text labels, responsive layouts, system color-scheme support, and a plain-language limitation notice. The tool itself encourages—but does not replace—keyboard, screen-reader, zoom, contrast, and user testing.

## Stack and architecture

- Python 3.10+ standard library only
- `HTMLParser` for deterministic document inspection
- Pure `audit()` function separated from CLI and report rendering
- `unittest` test suite and Makefile
- No dependency file is needed because there are no third-party packages

## Run

```bash
python3 a11y_snapshot.py sample-page.html --html report.html --json report.json
```

For CI-style behavior:

```bash
python3 a11y_snapshot.py page.html --strict
```

`--strict` exits with code 1 when a high-severity finding exists.

## Test

```bash
make test
make demo
```

## What I learned

The most trustworthy audit output explains both what a rule found and what it cannot know. Transparent scope and actionable remediation make automation a better partner for designers, developers, and accessibility specialists.
