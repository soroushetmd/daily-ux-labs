# Shared Tool Signal

A dependency-free Python and SQLite prototype that turns fictional shared-tool events into an explainable availability board without tracking individual workers.

## Problem

Teams lose time when shared tools are checked out, returned to a different zone, or not returned at all. A useful interface should answer “Where was it last seen, what does the status mean, and what needs attention?” without turning an inventory problem into employee surveillance.

## Interaction

The command reads a JSON inventory and event stream, loads it into an in-memory SQLite database, selects the latest event for each tool with a window query, classifies its state, and creates a self-contained HTML report. The snapshot time is injectable for reproducible reviews.

## UX decisions

- Every status includes a plain-language reason.
- Available, checked out, overdue, misplaced, and missing remain distinct.
- The interface shows last observed zones, not employee identities.
- No worker ranking, blame score, productivity claim, or fabricated outcome is included.
- Unknown tools, duplicate IDs, invalid timestamps, and unsupported events stop processing.
- All inventory, locations, times, and events are explicitly fictional.

## Accessibility

The report uses semantic headings, a captioned table with scoped headers, text labels in addition to color, high contrast, responsive overflow, and reduced-motion support. Input text is HTML-escaped.

## Stack and architecture

- Python 3.10+ standard library
- In-memory SQLite and a window-function query
- JSON input and self-contained HTML/CSS output
- Pure status-classification function with injected time
- `unittest` test suite
- No dependencies, network requests, telemetry, or persistent database

## Run and test

```bash
python3 -m unittest -v
python3 tool_signal.py sample-data.json sample-report.html --as-of 2026-10-30T16:00:00Z
```

Open `sample-report.html` in a browser.

## What I learned

Operational UX becomes more trustworthy when the interface explains the latest evidence instead of implying certainty. Separating “misplaced,” “overdue,” and “missing” suggests different next actions while avoiding an opaque risk score or blame-oriented dashboard.

Created by **Soroush Etemadfar**.
