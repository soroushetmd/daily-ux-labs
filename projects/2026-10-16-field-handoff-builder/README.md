# Field Handoff Builder

A dependency-free web prototype for turning raw hardware inspection observations into a clear handoff for technicians, Engineering, and Quality.

## Problem

Free-form field notes can mix observation, diagnosis, status, and next steps. That makes an urgent blocker easy to miss and forces the next person to reconstruct context. This prototype separates evidence from assumptions and makes the work state explicit.

## Interaction

The operator identifies an asset, records the observed condition and completed checks, selects a status, and names the next safe action or owner. The tool creates a readable preview and a minimal JSON object for a downstream record. All included equipment and observations are synthetic.

## UX decisions

- “Observed” wording encourages evidence instead of an unverified root cause.
- Status is a required structured choice rather than a phrase buried in notes.
- Blocked and safety items require a next action or owner.
- The output records provenance without adding a hidden score or recommendation.
- No employee name, email, timestamp, geolocation, or asset telemetry is collected.
- The page states that it cannot diagnose equipment or authorize work.

## Accessibility

The interface uses semantic sections, native form controls, fieldsets and legends, visible labels, inline errors, keyboard focus, an `aria-live` preview, strong contrast, a skip link, and reduced-motion support. Status is communicated with text as well as color.

## Stack and architecture

- Semantic HTML and responsive CSS
- Vanilla JavaScript ES modules
- Pure validation, normalization, export, and HTML-escaping functions in `model.mjs`
- Node.js built-in test runner; no runtime dependencies

## Run

Requires Node.js 20+ only for tests; the prototype itself runs in a modern browser.

```bash
npm test
npm run check
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## What I learned

A useful handoff is not simply a longer note. Separating observable evidence, completed checks, operational state, and ownership creates a more scannable shared artifact while keeping decision authority with trained people and approved procedures.

Created by **Soroush Etemadfar**.
