# Open House Route Planner

An explainable Python prototype that creates a feasible open-house itinerary from time windows, synthetic travel distances, visit duration, and user-defined priorities. Created by **Soroush Etemadfar**.

## Problem

Property shortlists can become difficult to act on when open-house windows overlap. A route optimizer can help, but an unexplained “best match” hides trade-offs and may imply more certainty than the data supports.

## Interaction

The command-line tool reads a JSON shortlist, evaluates feasible visit orders, and produces a self-contained HTML itinerary. The report shows visit times, demo travel time, explicit priority reasons, and why every unselected listing was omitted.

## UX decisions

- Priorities and reasons are inputs, not inferred judgments about a home.
- Every listing remains visible in the decision-details table.
- The result explains constraints instead of presenting a mysterious match score.
- The report tells users to confirm real availability and travel time.
- All demo addresses, coordinates, priorities, and preferences are explicitly synthetic.

## Accessibility

- Semantic headings, sections, articles, table caption, and scoped headers.
- Explanations use text rather than color alone.
- Responsive table treatment keeps labels on narrow screens.
- System fonts, strong contrast, and a reading order that matches the visual layout.

## Stack and architecture

- Python 3 standard library only
- JSON input
- Exhaustive permutation search, suitable for a small shortlist
- Escaped, self-contained HTML output
- `unittest` coverage for travel, scheduling, optimization, validation, and report structure

The exhaustive approach is intentionally limited to small lists. A production service would need a bounded search or routing solver for larger inputs and a real travel-time provider.

## Run

```bash
python3 planner.py listings.json --output itinerary.html
```

Optional time controls use minutes after midnight:

```bash
python3 planner.py listings.json --start 600 --end 900
```

Open the generated HTML file in a browser.

## Test

```bash
make test
make demo
```

No dependency file is needed because the project uses only Python's standard library.

## What I learned

Optimization becomes more useful in a product when its inputs and omissions stay inspectable. A technically feasible route is only a draft; the interface must preserve user control and communicate what the model does not know.
