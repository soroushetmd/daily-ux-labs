# Handoff Coverage Matrix

A dependency-free Python and SQLite tool by **Soroush Etemadfar** that makes missing interaction states visible before design handoff.

## Problem

Happy-path screens can look complete while loading, empty, error, success, and assistive-technology behavior remain undefined. This prototype turns a small SQL dataset into a matrix and prioritized gap list so designers and engineers can review coverage together.

All included flows, statuses, notes, and completion values are synthetic examples. The percentage measures documented states only; it is not a usability or product-quality score.

## Interaction and UX decisions

- Every flow remains visible in one comparison matrix.
- Exact status labels accompany color.
- Completion excludes states marked not applicable.
- Missing and partial states appear again as actionable handoff cards.
- Ownership labels help teams route follow-up conversations.
- The report explains what its percentage does and does not mean.

## Accessibility

The generated report uses semantic headings, a captioned table, scoped row and column headers, text status labels, responsive overflow for the matrix, clear hierarchy, and system fonts. The keyboard/screen-reader state is treated as first-class coverage rather than a final checklist item.

## Stack and architecture

- Python 3.10+ standard library
- SQLite in memory through Python's built-in `sqlite3`
- SQL schema, constraints, seed data, and summary view
- Pure database/query/report functions with `unittest`
- Self-contained HTML output with no external assets

`schema.sql` defines data integrity and the summary view. `seed.sql` contains synthetic handoff data. `coverage.py` queries SQLite and renders the report.

## Run

```bash
python3 coverage.py --output coverage-report.html
```

Open the generated file in any browser. To use another dataset, edit `seed.sql` or pass alternate files:

```bash
python3 coverage.py --schema schema.sql --seed my-project.sql --output report.html
```

## Test

```bash
make test
make demo
```

## What I learned

Handoff quality improves when teams can discuss specific missing states instead of debating whether a flow is broadly “done.” A transparent matrix creates shared language without pretending that documentation coverage equals user experience quality.
