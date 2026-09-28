# AI Copy Review Queue

A dependency-free Human–AI Interaction prototype by **Soroush Etemadfar**. It helps a product team review synthetic AI-generated interface copy, surface rule-based risks, and preserve a transparent human decision log.

## Problem

AI-generated UX copy can sound confident while containing pressure, blame, or sensitive-data requests. Automatic scoring alone cannot understand product context. This prototype treats detection as a review aid and keeps approval, editing, or rejection with a human reviewer.

## Interaction

Reviewers move through four synthetic examples. They can edit the proposed copy, inspect live risk flags, add a note, and approve, save an edit, or reject. Rejection requires a rationale. At completion, the reviewer can export a structured JSON log.

## UX decisions

- Risk rules and labels are visible rather than hidden behind an opaque score.
- The interface says flags are prompts, not verdicts.
- Original and final copy are both preserved in the decision record.
- Rejection requires context for the next teammate.
- All content is clearly marked as synthetic; no research or business outcomes are claimed.

## Accessibility

The prototype uses semantic landmarks, explicit labels, a skip link, native progress and form controls, live status announcements, visible keyboard focus, responsive layouts, text labels alongside color, and reduced-motion support.

## Stack and architecture

- HTML and CSS
- Native JavaScript modules
- Pure review engine separated from DOM code
- Node.js built-in test runner; no packages or build step

`review-engine.mjs` contains deterministic risk and decision logic. `app.mjs` manages interface state and JSON export. This separation keeps policy rules independently testable.

## Run

Requires Node.js 18+ only for tests and the optional local server.

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. Serving over HTTP is recommended because the app uses JavaScript modules.

## Test

```bash
node --test review-engine.test.mjs
node --check app.mjs
node --check review-engine.mjs
```

## What I learned

Good human oversight is an interaction design problem, not merely a model-quality problem. Reviewers need understandable signals, meaningful actions, recovery from validation errors, and a record that explains what changed and why.
