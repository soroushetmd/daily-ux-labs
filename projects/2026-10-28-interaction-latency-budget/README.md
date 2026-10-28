# Interaction Latency Budget

A dependency-free C++17 tool that turns synthetic interaction traces into an accessible HTML review of visible-feedback and content-ready latency.

## Problem

Performance dashboards often collapse an interaction into one duration. Product teams then lose the distinction between immediate acknowledgment—did the interface react?—and usable completion—when could the person continue? This prototype keeps both milestones visible and traceable.

## Interaction

Provide a CSV with a trace ID, flow name, feedback time, and content-ready time. The tool validates the data, groups traces by flow, calculates nearest-rank p50 and p95 values, compares each milestone with explicit prototype budgets, and produces a self-contained HTML report.

## UX decisions

- Feedback and readiness remain separate instead of becoming one score.
- Every aggregate is backed by a complete trace table.
- Budget values are visible and configurable on the command line.
- A budget miss is labelled as a review signal, not a usability verdict.
- Synthetic sample traces are clearly distinguished from research or production telemetry.
- Invalid sequences, duplicate IDs, and malformed durations stop the analysis.

## Accessibility

The report uses semantic headings, captioned tables, scoped headers, text labels in addition to color, high contrast, responsive horizontal overflow, and reduced-motion support. All CSV text is HTML-escaped.

## Stack and architecture

- C++17 standard library only
- Validated CSV reader with quoted-field support
- Pure nearest-rank percentile and grouping functions
- Self-contained HTML/CSS report
- Assertion-based unit and integration tests
- No network access, telemetry, or third-party dependencies

## Build, test, and run

Requires a C++17 compiler and `make`:

```bash
make test
make report
```

Open `sample-report.html`. Custom prototype budgets can be supplied in milliseconds:

```bash
./latency-budget sample-traces.csv report.html 150 1000
```

## What I learned

Latency becomes a more useful UX conversation when a report shows which milestone missed which explicit budget and retains the underlying evidence. Percentiles help describe a distribution, but they do not replace contextual testing with real users and devices.

Created by **Soroush Etemadfar**.
