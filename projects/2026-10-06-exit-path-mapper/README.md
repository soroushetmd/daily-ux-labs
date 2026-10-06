# Exit Path Mapper

A small, dependency-free prototype for comparing subscription cancellation paths without hiding friction inside a single score. Created by **Soroush Etemadfar**.

## Problem

Subscription teams often optimize acquisition and retention while the exit experience receives less design attention. Reviews can also focus on screen polish and miss the complete sequence: detours, forced answers, channel switches, delays, and unclear consequences.

## Interaction

Select one or more fictional exit paths. The interface displays every step, counts explicit review signals, identifies channel switches, and labels the review priority. The **Copy review snapshot** action exports a compact JSON summary for a design critique or handoff discussion.

## UX decisions

- Every step stays visible so a compact score cannot hide the source of friction.
- Signals are named in plain language instead of being presented as a proprietary metric.
- A pause option is treated as helpful only when permanent cancellation remains equally findable.
- Step count is shown as context, not as a claim that shorter is always better.
- Fictional data and the limits of the tool are stated in the interface and export.

## Accessibility

- Native checkboxes, button, ordered-list semantics, and a keyboard skip link.
- Visible focus states and status announcements through `aria-live`.
- Status is communicated with text, not color alone.
- Responsive layout, generous targets, and reduced-motion support.

## Stack and architecture

- Semantic HTML and responsive CSS
- Vanilla JavaScript ES modules
- `model.mjs` contains the data, classification, comparison, and export logic.
- `app.mjs` handles DOM rendering and browser interaction.
- Node's built-in test runner validates the model without dependencies.

## Run

Requires a modern browser and Python 3 (or any static server):

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` from this project directory.

## Test

Requires Node.js 18 or newer:

```bash
node --test model.test.mjs
node --check app.mjs
```

## What I learned

Cancellation quality is easier to discuss when a team can point to specific interruptions and channel changes. Keeping the model explicit makes disagreement useful: reviewers can challenge a category or step instead of debating an unexplained score.

## Limits

All plans and copy are synthetic. This prototype does not represent user research, production analytics, legal guidance, or a compliance assessment.
