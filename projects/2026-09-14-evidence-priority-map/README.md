# Evidence Priority Map

A dependency-free information-visualization prototype for comparing usability findings without flattening evidence into a single priority score.

> Every finding in this prototype is synthetic demo data. No user research or product outcome is claimed.

## The problem

Research readouts often become long lists where frequent annoyances compete with rare but severe blockers. A single score can hide uncertainty and make prioritisation look more objective than the evidence supports.

## The interaction

The map positions six sample findings by observed frequency and task impact. People can filter by journey stage, reveal evidence-confidence labels, focus or click a point for its rationale, and switch to a sortable-equivalent table view.

## UX decisions

- Frequency and impact stay separate instead of collapsing into a misleading total.
- Confidence is shown as a third, explicitly labelled evidence dimension.
- The “investigate first” region is a discussion prompt, not an automated decision.
- Filtering preserves context by reporting how many findings remain visible.
- Synthetic-data labelling avoids implying that the observations came from real participants.

## Accessibility

The prototype uses semantic controls, visible keyboard focus, an ARIA live region, descriptive SVG labelling, keyboard-focusable chart points, a complete table alternative, sufficient contrast, responsive layouts, and reduced-motion support.

## Stack

HTML · CSS · Vanilla JavaScript · inline SVG

## Run locally

Open `index.html` in any modern browser. No build step or dependency installation is required.

## What I learned

An honest prioritisation interface should expose the dimensions and uncertainty behind a recommendation. A chart can support discussion, but it should not replace the team's judgment or exclude people who cannot use the visual view.

Designed and built by **Soroush Etemadfar** · September 2026
