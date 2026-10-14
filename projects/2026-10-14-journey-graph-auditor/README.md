# Journey Graph Auditor

A dependency-free Node.js CLI that audits a JSON product journey for structural UX gaps and generates an accessible, self-contained HTML report.

## Problem

Flow diagrams can look complete while still containing unreachable screens, accidental dead ends, or error states without recovery. Those gaps often surface late in design–engineering handoff. This project turns a small, reviewable JSON model into explicit evidence for a team conversation.

## Interaction

Describe states and transitions in JSON, then run the CLI. The report lists reachable-state coverage and every signal with its rule, evidence, and suggested next step. The included benefits-application scenario is synthetic.

## UX decisions

- Reports distinct signals instead of collapsing quality into an opaque score.
- Preserves state labels and concrete evidence so a designer can trace each issue.
- Treats intentional terminal states differently from accidental dead ends.
- Calls out error recovery separately because recovery is a user need, not only graph validity.
- Clearly says structural analysis is not usability research or accessibility conformance testing.

## Accessibility

The generated report uses semantic headings, landmarks, native text, high-contrast colors, responsive layout, visible focus styling, and a reduced-motion safeguard. HTML templates escape journey content by default.

## Stack and architecture

- Node.js 20+ standard library only
- JSON input with strict unknown-field checking
- Breadth-first traversal for reachability
- Deterministic findings sorted by state and rule
- Explicit HTML escaping for journey content
- Unit and integration-oriented tests with Node's built-in test runner

## Run

```bash
npm test
npm run report
```

Open `sample-report.html` in a browser. No package installation is required beyond Node.js 20+.

## What I learned

Graph validation becomes more useful to product teams when it explains the exact state, rule, and recovery opportunity. A small schema plus deterministic traversal can create a shared artifact for designers and developers without pretending to measure user experience.

Created by **Soroush Etemadfar**.
