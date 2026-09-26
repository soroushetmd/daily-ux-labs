# Form Friction Profiler

A dependency-free C++ command-line tool that turns form event logs into an accessible HTML report. Built by **Soroush Etemadfar** as a small UX analytics and software engineering experiment.

## Problem

Completion rates alone can hide where a multi-step form becomes difficult. This prototype summarizes abandonment and median time per step so a team can decide where to investigate. The included dataset is synthetic; the tool does not claim to identify causes or replace qualitative research.

## Interaction and UX decisions

- One command converts a CSV into a portable report.
- Risk labels use transparent thresholds: low below 15%, medium from 15–34%, and high from 35%.
- Exact values accompany visual bars so color and shape are never the only signal.
- The report explicitly separates observed signals from explanations.
- Session IDs are used only while reading the source and never appear in the report.

## Accessibility

The generated report uses semantic headings, articles, a captioned data table with scoped headers, strong focus-independent labels, responsive layout, dark-mode support, and reduced-motion awareness.

## Stack and architecture

- C++17 standard library only
- CSV parser → aggregate step metrics → self-contained HTML renderer
- Integer counts and double-precision durations
- `Makefile` for reproducible build, test, and demo commands

## Run

Requires a C++17 compiler such as GCC 9+ or Clang 10+.

```bash
make
./friction-profiler sample-events.csv sample-report.html
```

Open `sample-report.html` in any browser. Input must use this exact header:

```csv
session_id,step,status,duration_seconds
```

`status` must be `completed` or `abandoned`.

## Test

```bash
make test
```

Tests cover aggregation, median calculation, HTML escaping, report generation, privacy copy, and malformed-header rejection. The compiler runs with warnings treated as errors.

## What I learned

A useful UX analytics tool should make its assumptions inspectable. Showing thresholds, exact values, privacy behavior, and the limit of behavioral data creates a more responsible handoff than a dashboard that presents a single opaque score.
