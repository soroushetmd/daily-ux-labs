# Component Contract Drift

A dependency-free Python CLI that compares two synthetic design-system component manifests and explains API and keyboard-contract changes in accessible HTML and machine-readable JSON.

## Problem

A component can look unchanged while its prop types, required inputs, exports, or keyboard behavior drift. These changes affect designers, developers, documentation, tests, and consumers, but release notes often flatten them into an ambiguous “updated component” label.

## Interaction

Provide before and after JSON manifests. The tool identifies removed and added components, prop additions/removals, type changes, required-state changes, and keyboard-contract changes. Every finding includes severity, evidence, and a suggested action.

## UX decisions

- Breaking, review, and non-breaking categories remain separate instead of becoming a risk score.
- Keyboard changes are flagged for review rather than automatically declared safe or inaccessible.
- The HTML report contains a scannable card view and an exact tabular log.
- The JSON output supports CI and documentation workflows.
- `--strict` returns exit code 2 only when declared breaking changes exist.
- All manifests and version changes in the demo are synthetic.

## Accessibility

The report uses semantic headings, text severity labels, a captioned table with scoped headers, strong contrast, responsive overflow, and reduced-motion support. Manifest content is HTML-escaped.

## Stack and architecture

- Python 3.10+ standard library only
- Strict manifest validation and duplicate-name detection
- Pure deterministic comparison function
- HTML and JSON output
- `unittest` coverage plus strict-mode integration check

## Run

```bash
make test
make check
make report
```

Open `sample-report.html` or inspect `sample-report.json`.

For CI-style behavior:

```bash
python3 contract_drift.py before.json after.json --html report.html --json report.json --strict
```

No third-party package is required.

## What I learned

Design-system governance becomes more actionable when a release artifact states exactly which contract changed, why it matters, and what migration work is expected. Keyboard behavior deserves first-class versioning alongside props.

Created by **Soroush Etemadfar**.
