# Notification Rhythm Lab

A dependency-free C++17 prototype that applies a visible notification-delivery policy to synthetic events and produces an accessible HTML timeline plus an exact decision log.

## Problem

Notification systems often optimize delivery one event at a time. Users experience the combined interruption pattern, yet batching logic can remain invisible and difficult to contest. This prototype makes the rule and reason behind every decision inspectable.

## Interaction

Provide a CSV containing arrival time, channel, priority, and title. The tool keeps explicitly urgent events immediate, batches low-priority items, and batches standard items during a fictional focus window. The report shows when every item arrives, when it is delivered, and why.

## UX decisions

- Urgency is an explicit input; the tool does not infer importance from message content.
- Every delivery decision includes a human-readable reason.
- A complete decision table accompanies the visual timeline.
- The fictional policy is shown in the report instead of being hidden in code.
- Overnight deferral is labelled “next day.”
- The report makes no claim about productivity, wellbeing, or tested outcomes.

## Accessibility

The generated report uses semantic headings, articles, a captioned table with scoped headers, text labels in addition to color, responsive overflow, high contrast, and reduced-motion support. CSV content is HTML-escaped.

## Stack and architecture

- C++17 standard library only
- Validated CSV parser with quoted-field support
- Pure, deterministic decision function
- Stable chronological sort of scheduled deliveries
- Self-contained HTML/CSS output
- Assertions plus invalid-input integration testing

## Build, test, and run

Requires a C++17 compiler and `make`:

```bash
make test
make report
```

Open `sample-report.html` in a browser. No third-party packages are required.

## What I learned

Digital-wellbeing features become more accountable when the system exposes both the configured policy and the reason for each decision. A small deterministic model is enough to compare interruption patterns without pretending to know what matters to a person.

Created by **Soroush Etemadfar**.
