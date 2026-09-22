# Fair Play Difficulty Lab

A dependency-free Game UX prototype that demonstrates transparent, player-controlled adaptive difficulty through a short target-finding game.

> The scoring model and play session are a design prototype. No player research, retention result, or commercial outcome is claimed.

## The problem

Dynamic difficulty can keep a game approachable, but invisible adjustments may feel patronising or unfair. Players also need practical assistance without being pushed into a separate “easy mode” identity.

## The interaction

Players complete ten rounds by selecting a highlighted cell with touch/mouse or by moving a keyboard cursor with the arrow keys and pressing Space. After each round, the engine may adjust the response window using recent performance. The interface explains every adjustment and lets the player lock the pace at any time.

Assist Mode independently offers a larger target and extra response time. These choices are visible, reversible, and never reduce the displayed score.

## UX decisions

- Adaptation is explained in plain language instead of happening invisibly.
- Difficulty responds gradually and stays inside fixed bounds.
- Players can lock the pace without ending the session.
- Assistance changes interaction conditions, not player identity or reward legitimacy.
- Results separate accuracy, response time, and pace changes rather than collapsing performance into a mysterious rank.

## Accessibility

- Complete keyboard and pointer operation
- DOM-based grid rather than an inaccessible canvas
- Visible cursor and focus states
- ARIA live announcements for targets, outcomes, and pace changes
- No audio dependency; shape and text reinforce colour
- Reduced-motion support and optional larger targets/extra time

## Stack and architecture

- Semantic HTML and responsive CSS
- Vanilla JavaScript UI controller
- Pure ES module difficulty engine
- Node's built-in test runner; no third-party dependencies

`engine.mjs` contains deterministic, independently tested adaptation rules. `game.js` owns timing, input, announcements, and rendering.

## Run it

Serve the folder because the browser loads an ES module:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

Run the tests:

```bash
node --test engine.test.mjs
```

## What I learned

Adaptive difficulty is a trust problem as much as a balancing problem. Giving players an explanation, a lock, and independent assistance settings makes the system easier to understand and contest.

Designed and built by **Soroush Etemadfar** · September 2026
