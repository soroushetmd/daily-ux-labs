# Focus Flow Contract

A dependency-free TypeScript tool for reviewing declared keyboard focus paths, skip links, and modal focus contracts before implementation handoff.

## Problem

Focus-order defects often appear late because design annotations, DOM structure, and modal behavior are reviewed separately. A screen can look correct while hidden content stays focusable, controls have no accessible name, skip links point nowhere, or modal focus escapes into the page.

## Interaction

Describe a page as JSON, including interactive elements, regions, focus order, and optional modal entry/return targets. The CLI validates the schema, audits structural rules, and creates a standalone HTML report with the declared path and explainable findings.

## UX decisions

- Findings name the exact rule and affected element; there is no opaque accessibility score.
- `blocking` and `review` signals remain separate.
- The visual path preserves order, role, region, and label for design–engineering discussion.
- Modal entry, return, and background containment are checked as one contract.
- The report explicitly distinguishes static checks from real browser and assistive-technology testing.

## Accessibility

The generated report uses semantic landmarks, headings, an ordered path, a captioned table with scoped headers, visible text severity labels, responsive overflow, visible focus styles, and reduced-motion support. Meaning does not depend on colour.

## Stack and architecture

- TypeScript executed with Node.js native type stripping
- Node.js standard library only; no packages or network access
- Pure `validateSpec`, `audit`, and `renderReport` functions
- Built-in `node:test` suite
- JSON input and standalone HTML output

## Run and test

Requires Node.js 22.18 or newer. No install step is required.

```sh
npm test
npm run sample
```

Direct execution:

```sh
node focus_flow.ts sample-flow.json sample-report.html
```

Exit codes are `0` for no blocking findings, `1` when blocking findings exist, and `2` for invalid input or usage.

## What I learned

Focus behavior is easier to review when it is treated as a small state contract rather than a visual annotation. Static automation can surface contradictions early, but it cannot prove the behavior of the implemented DOM, keyboard handlers, focus indicator, or screen-reader output.

Designed and engineered by **Soroush Etemadfar**.
