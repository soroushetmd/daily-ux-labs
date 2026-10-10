# Reward Choice Lab

A dependency-free Game UX prototype that lets players compare gameplay, rewarded advertising, and a simulated purchase before choosing how to earn an upgrade. Created by **Soroush Etemadfar**.

## Problem

Freemium reward prompts can emphasize the reward while obscuring what the player exchanges: time, attention, or money. Pressure patterns can also make a technically optional choice feel mandatory.

## Interaction

The player starts with a demo wallet and chooses among three permanently visible paths. Every card presents the reward, monetary cost, time, advertising exposure, and consequence together. The simulation updates crystals, demo ad usage, and simulated spend. Rewarded ads stop at an explicit daily limit while gameplay remains available.

## UX decisions

- Gameplay, advertising, and purchase paths receive equal visual access.
- The price and exact reward appear before the action.
- No fake countdown, scarcity, preselected option, or punishment for declining.
- A frequency cap prevents a repeatable ad loop.
- The interface repeatedly states that no real ad or transaction occurs.
- Values are synthetic and demonstrate interaction logic, not an optimized economy.

## Accessibility

- Semantic articles, description lists, native buttons, and a keyboard skip link.
- Visible focus states and an `aria-live` status message.
- Disabled state includes explanatory button text, not color alone.
- Responsive single-column layout and reduced-motion support.

## Stack and architecture

- Semantic HTML and responsive CSS
- Vanilla JavaScript ES modules
- `economy.mjs` owns disclosure formatting, frequency-cap logic, immutable state updates, and option auditing.
- `app.mjs` renders the interface and handles interaction.
- Node's built-in test runner validates logic without dependencies.

## Run

Requires a modern browser and any static server:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` from this project directory.

## Test

Requires Node.js 18 or newer:

```bash
node --test economy.test.mjs
node --check app.mjs
```

No dependency file is required because the project uses browser APIs and Node's standard library only.

## What I learned

Monetization choices become easier to evaluate when each exchange is described with the same information architecture. The goal is not to declare one option universally correct; it is to keep consent meaningful and the non-monetized path genuinely available.

## Limits

This is a fictional interaction prototype. It contains no production economy, advertising SDK, payment integration, player research, analytics, revenue result, or legal/compliance assessment.
