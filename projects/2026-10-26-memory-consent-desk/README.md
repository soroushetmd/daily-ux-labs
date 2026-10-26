# Memory Consent Desk

A dependency-free Human–AI Interaction prototype for reviewing proposed assistant memories before they are stored.

## Problem

Personal assistants become more useful when they retain context, but invisible or indefinite memory can make personalization difficult to understand or control. Users need to see the exact proposed fact, its purpose, sensitivity, and retention period before consenting.

## Interaction

Review three fictional memory proposals. For each one, choose a retention period and allow it, or reject storage. A shortcut approves only pending low-sensitivity items. After every item has a decision, export a JSON consent receipt.

## UX decisions

- Consent is granular: no single “accept all” control.
- Purpose and sensitivity appear beside the exact proposed value.
- Retention is selected before approval and cleared after rejection.
- The bulk action is intentionally limited to low-sensitivity proposals.
- Export remains unavailable until every proposal has been reviewed.
- The prototype makes no claim that interface consent alone provides legal compliance.

## Accessibility

The interface uses native buttons and selects, a skip link, semantic regions, a polite live status, visible keyboard focus, text labels in addition to color, responsive layouts, and reduced-motion support.

## Stack and architecture

- Semantic HTML and responsive CSS
- Vanilla JavaScript modules
- Immutable decision state transitions
- Pure summary and receipt-generation functions
- Node.js built-in test runner
- No dependencies, storage, telemetry, or network requests

## Run and test

Node.js 20+ is required for the tests. Serve the interface over HTTP because it uses JavaScript modules.

```bash
node --test model.test.mjs
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## What I learned

An AI memory control is clearer when it treats consent as a reviewable contract: the user can inspect the exact value, understand its proposed benefit, limit its lifetime, refuse it, and keep a portable record of the decision.

Created by **Soroush Etemadfar**.
