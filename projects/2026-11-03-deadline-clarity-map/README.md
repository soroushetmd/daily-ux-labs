# Deadline Clarity Map

A dependency-free C11 tool that turns fictional public-service notices into a chronological, accessible HTML report.

## Problem

Service notices often mix the notice date, deadline, action, and contact channel in prose. People can miss the actual next step or mistake an old notice for an open one. This prototype preserves the source fields and adds a transparent time-status layer.

## Interaction

Provide a six-column CSV plus an explicit `as-of` date. The tool validates the data, sorts notices by deadline, and generates a standalone report with summary counts and a complete table. The sample data is fictional.

## UX decisions

- Dates, required actions, and channels stay visible instead of collapsing into an opaque score.
- `Due soon` has a disclosed 1–7 calendar-day rule.
- The as-of date is injected, so reports and tests are reproducible.
- Closed entries remain visible to preserve context.
- Invalid dates, duplicate IDs, and deadlines before notice dates stop generation.
- The report states that it is not policy or legal guidance.

## Accessibility

The output uses semantic headings, a captioned table, scoped column headers, machine-readable `time` elements, text status labels, visible focus, responsive overflow, and a reduced-motion safeguard. Meaning does not depend on colour.

## Stack and architecture

- C11 standard library only
- `deadline_map.c`: parsing, date arithmetic, validation, ordering, HTML escaping, report generation
- `main.c`: command-line boundary and file handling
- `test_deadline_map.c`: deterministic checks without a testing dependency
- CSV input and standalone HTML output

## Run

Requires a C11 compiler and `make`.

```sh
make
make test
make sample
```

Or run it directly:

```sh
./deadline-map sample-notices.csv sample-report.html 2026-11-03
```

CSV header and column order:

```text
id,service,notice_date,deadline_date,action,channel
```

## What I learned

Small information-design choices—an explicit reference date, disclosed thresholds, retained source fields, and a visible closed state—make deadline summaries easier to audit. Implementing the date and validation layer in C also makes the boundary between trustworthy input and presentation concrete.

Designed and engineered by **Soroush Etemadfar**.
