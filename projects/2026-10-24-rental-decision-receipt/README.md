# Rental Decision Receipt

A dependency-free marketplace UX prototype that compares fictional rental listings without collapsing price, move-in cash, and claim confidence into one misleading score.

## Problem

Rental listings foreground base rent while recurring extras, upfront cash, and weakly supported claims can remain scattered. A renter needs a comparison they can inspect and keep—not an unexplained recommendation.

## Interaction

Select two or more sample listings. The interface calculates the complete monthly total, keeps move-in costs separate, marks the lowest monthly option, and shows the source behind each claim. The comparison can be downloaded as a JSON “decision receipt.”

## UX decisions

- No composite ranking: cost and evidence answer different questions.
- Advertised rent, monthly extras, and upfront amounts remain visibly separate.
- “Documented” and “Verify” use text labels, not color alone.
- The tool shows every selected option rather than hiding alternatives.
- All data is explicitly fictional; no availability, legal, or quality claim is made.
- Exported JSON preserves the inputs and reasoning for later review.

## Accessibility

The page uses native checkboxes and buttons, a skip link, semantic headings, visible keyboard focus, a polite status region, responsive layouts, high-contrast labels, and reduced-motion support.

## Stack and architecture

- Semantic HTML and responsive CSS
- Vanilla JavaScript modules
- Pure calculation functions separated from DOM rendering
- Node's built-in test runner
- No dependencies, network requests, tracking, or storage

## Run and test

Requires Node.js 20+ for tests. The interface itself runs in any modern browser.

```bash
node --test model.test.mjs
python3 -m http.server 8000
```

Open `http://localhost:8000`. Serving over HTTP is recommended because the interface uses JavaScript modules.

## What I learned

A trustworthy comparison does not need to choose for the user. Separating recurring affordability, immediate cash needs, and evidence quality makes the trade-off legible while leaving the final decision with the renter.

Created by **Soroush Etemadfar**.
