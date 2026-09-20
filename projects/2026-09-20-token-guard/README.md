# Token Guard

A dependency-free Python tool that compares two design-token snapshots, flags risky changes, checks declared text/background contrast pairs, and generates an accessible HTML review report.

> The included token files are synthetic demo data. This project does not claim results from a real product or design system.

## The problem

Small token changes can quietly remove a semantic alias, change a value type, or reduce text contrast across many screens. Raw JSON diffs are precise, but they are difficult for designers, engineers, and accessibility reviewers to scan together.

## The interaction

Run the command with a “before” and “after” JSON file. Token Guard:

1. flattens nested token paths;
2. classifies additions, removals, value changes, and type changes;
3. evaluates declared foreground/background pairs;
4. writes a standalone HTML report with a summary and review tables;
5. optionally returns a failing exit code in `--strict` mode for CI workflows.

## UX decisions

- The report separates breaking risks from ordinary changes instead of producing one opaque score.
- Removed tokens and type changes receive explicit explanations.
- Contrast results show the actual ratio and threshold, not only pass/fail colour.
- Colour is reinforced with text labels, icons, and table structure.
- The report remains a review aid; it does not imply that automated checks replace design-system governance or manual accessibility testing.

## Accessibility

The generated report uses semantic headings and tables, visible focus states, high-contrast text, redundant status labels, responsive layouts, and no motion. Contrast checks use the WCAG 2.2 Level AA thresholds of 4.5:1 for normal text and 3:1 for large text.

## Stack and architecture

- Python 3.10+ standard library only
- JSON input
- Standalone HTML output with embedded CSS
- `unittest` coverage for token flattening, comparison, colour parsing, contrast calculation, and report generation

No dependency file is needed because the project has no third-party packages.

## Run it

```bash
python3 token_guard.py samples/before.json samples/after.json --out report.html
```

Open `report.html` in a browser. To make accessibility regressions, removals, or type changes fail a CI step:

```bash
python3 token_guard.py samples/before.json samples/after.json --out report.html --strict
```

Run the tests:

```bash
python3 -m unittest -v
```

You can also inspect the committed [sample report](sample-report.html) generated from the two demo snapshots.

## Input convention

A token is any object containing a `value` property. Optional `type` values improve type-change reporting. Contrast pairs live under `meta.contrastPairs` and reference dot-separated token paths.

## What I learned

Design-system tooling is most useful when its output creates shared language between design and engineering. A readable explanation of risk is more actionable than a raw diff or a binary gate alone.

Designed and built by **Soroush Etemadfar** · September 2026

## Reference

- [W3C: Understanding WCAG 2.2 Success Criterion 1.4.3 — Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
