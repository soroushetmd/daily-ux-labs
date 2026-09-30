# Service Access Navigator

A dependency-free Node.js web prototype by **Soroush Etemadfar** that helps people compare fictional public-service channels based on urgency, travel difficulty, digital comfort, and language-support needs.

## Problem

Public services often present channel choices—online, phone, or office—without helping people understand the tradeoffs. This prototype recommends a closest fit while keeping every alternative visible. It does not determine eligibility and all availability data is explicitly fictional.

## Interaction and UX decisions

- Four optional questions avoid collecting identity or case details.
- Results explain both reasons and cautions instead of showing an opaque score.
- The recommendation never hides alternatives or blocks user choice.
- A prominent notice separates demo wait times from real service information.
- Plain language and progressive disclosure reduce initial complexity.

## Accessibility

The interface uses semantic landmarks, a skip link, native checkboxes and fieldset, explicit labels, live status messages, visible keyboard focus, text labels in addition to color, responsive layouts, and reduced-motion support. The result heading receives focus before the page scrolls to the comparison.

## Stack and architecture

- Node.js built-in HTTP server
- HTML, CSS, and vanilla JavaScript
- Pure recommendation engine separated from HTTP delivery
- Node.js built-in tests and a reproducible Makefile
- No external packages

`navigator.mjs` owns deterministic scoring and explanations. `server.mjs` exposes the JSON endpoint and safely serves static files. The browser renders all options from the API response.

## Run

Requires Node.js 18+.

```bash
make run
```

Open `http://localhost:8080`.

## Test

```bash
make test
```

Tests cover digitally comfortable and assisted-service scenarios, preservation of all alternatives, and the API JSON contract. To manually inspect the endpoint:

```bash
curl "http://localhost:8080/api/recommend?urgent=true&mobility=false&digital=true&language=false"
```

## What I learned

An ethical recommendation experience should reveal why an option ranks first without turning that ranking into a command. Keeping alternatives, limitations, and fictional data visible makes the interface more trustworthy and useful.
