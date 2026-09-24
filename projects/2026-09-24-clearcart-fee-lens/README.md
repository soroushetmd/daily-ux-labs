# ClearCart Fee Lens

A dependency-free full-stack marketplace prototype that shows buyers what they pay and sellers what they receive before checkout.

> All listings, prices, people, fees, tax rules, and payout rules are synthetic demo data. This is not a live marketplace or financial calculator.

## The problem

Marketplace checkout screens often reveal service fees late and explain seller economics separately, if at all. That can weaken trust on both sides of a transaction.

## The interaction

Choose one of three sample home-cooked meals, quantity, pickup or delivery, and an optional tip. The quote updates through a small JSON API and presents two synchronized views:

- **You pay:** item subtotal, delivery, service fee, demo tax, tip, and total.
- **Seller receives:** subtotal minus seller fee, plus the full tip.

Every line has a plain-language explanation, and a disclosure panel documents the demo rules before commitment.

## UX decisions

- Total price stays visible while inputs change.
- Buyer and seller perspectives share the same calculation, reducing contradictory explanations.
- Fees use descriptive labels rather than vague “other charges.”
- The seller fee is not added to the buyer total.
- Tips are shown as fully passed to the seller in this fictional model.
- Synthetic labels prevent the prototype from appearing operational or jurisdictionally accurate.

## Accessibility

Semantic form controls and tables, keyboard operation, visible focus, an ARIA live quote summary, sufficient contrast, responsive layout, and reduced-motion support are included. Colour is never the only indicator of a fee or payout.

## Stack and architecture

- Python 3.10+ standard library HTTP server
- SQLite listing store, created and seeded at startup
- Pure pricing module using integer cents
- JSON endpoints: `GET /api/listings` and `POST /api/quote`
- HTML, CSS, and vanilla JavaScript client
- Python `unittest` suite

No dependency file is required because there are no third-party packages.

## Run it

```bash
python3 server.py
```

Open `http://127.0.0.1:8000`.

Run the tests:

```bash
python3 -m unittest -v
```

## What I learned

Fee transparency works best as an information-architecture problem, not a tooltip problem. Showing both sides of the transaction from one calculation makes the trade-off easier to inspect and discuss.

Designed and built by **Soroush Etemadfar** · September 2026
