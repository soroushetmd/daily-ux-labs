# Inclusive Transit Planner

A dependency-free public-service UX prototype that compares transit routes using accessibility needs—not travel time alone.

> All routes and operational details are synthetic demo data. This prototype is not a live trip planner.

## The problem

Route planners often optimise for the fastest arrival while treating step-free access, walking distance, elevator availability, transfers, and sensory load as secondary details. That can make the recommended route unusable for many riders.

## The interaction

People select any needs that matter for the current trip:

- step-free travel;
- less than 450 metres of walking;
- confirmed elevator access;
- lower sensory load.

The prototype re-ranks three sample routes, keeps every option visible, and explains matches and trade-offs in plain language.

## UX decisions

- Preferences describe the trip, not the person's identity or medical condition.
- Routes that miss a preference remain visible to preserve choice and transparency.
- The recommendation changes only after the user expresses a need.
- Sample-data labelling prevents the prototype from appearing operational.
- Semantic form controls, keyboard interaction, visible focus states, an ARIA live update, responsive layouts, high contrast, and reduced-motion support improve accessibility.

## Stack

HTML · CSS · Vanilla JavaScript

## Run locally

Open `index.html` in any modern browser. No build step or dependency installation is required.

## What I learned

Inclusive route planning is not a single accessibility toggle. The interface should make constraints visible, preserve user agency, and explain why one route is recommended over another.

Designed and built by **Soroush Etemadfar** · September 2026
