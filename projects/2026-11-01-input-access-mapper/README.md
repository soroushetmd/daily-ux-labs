# Input Access Mapper

A dependency-free Game UX accessibility prototype for reviewing keyboard and gamepad control schemes before implementation handoff.

## Problem

Control schemes can look complete while required actions are unbound, two actions compete for one input, an alternative device is missing, or a hold-only interaction creates avoidable friction. Designers and engineers need an inspectable review, not an unexplained accessibility score.

## Interaction

Choose a standard, one-hand, or intentionally conflicted fictional preset. Edit any keyboard or gamepad binding. The interface immediately reports blocking conflicts, missing required paths, missing device alternatives, and hold-only actions. Export the complete configuration and findings as JSON.

## UX decisions

- Required and optional actions are labelled explicitly.
- Blocking issues and review signals remain separate.
- No composite score hides the underlying problem.
- The one-hand preset demonstrates an alternative, not a claim of universal accessibility.
- Hold-only actions prompt consideration of a toggle but are not automatically rejected.
- Every result remains tied to a specific action or duplicated input.

## Accessibility

The prototype uses native inputs, labels, tables with a caption and scoped headers, a skip link, a polite live region, visible keyboard focus, text labels in addition to color, responsive overflow, and reduced-motion support.

## Stack and architecture

- Semantic HTML and responsive CSS
- Vanilla JavaScript modules
- Pure immutable binding updates and audit functions
- Node.js built-in test runner
- JSON export for design/engineering handoff
- No dependencies, network calls, storage, or telemetry

## Run and test

Requires Node.js 20+ for tests. Serve over HTTP because the interface uses JavaScript modules.

```bash
node --test model.test.mjs
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## What I learned

An accessible control review is more useful when it distinguishes a broken path from a prompt for further testing. Structural checks can make conflicts visible early, but reach, fatigue, timing, remapping quality, and assistive setups still require testing with real players and target hardware.

Created by **Soroush Etemadfar**.
