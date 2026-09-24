"""Pure pricing rules for the synthetic ClearCart marketplace."""

from dataclasses import dataclass, asdict

BUYER_FEE_RATE = 0.07
SELLER_FEE_RATE = 0.10
DEMO_TAX_RATE = 0.13
DELIVERY_CENTS = 499


@dataclass(frozen=True)
class Quote:
    subtotal: int
    delivery: int
    buyer_fee: int
    demo_tax: int
    tip: int
    total: int
    seller_fee: int
    seller_receives: int

    def to_dict(self):
        return asdict(self)


def calculate_quote(price_cents: int, quantity: int, fulfilment: str, tip_percent: int) -> Quote:
    if price_cents < 0:
        raise ValueError("Price cannot be negative")
    if quantity not in range(1, 11):
        raise ValueError("Quantity must be between 1 and 10")
    if fulfilment not in {"pickup", "delivery"}:
        raise ValueError("Fulfilment must be pickup or delivery")
    if tip_percent not in {0, 10, 15, 20}:
        raise ValueError("Tip must be 0, 10, 15, or 20 percent")

    subtotal = price_cents * quantity
    delivery = DELIVERY_CENTS if fulfilment == "delivery" else 0
    buyer_fee = round(subtotal * BUYER_FEE_RATE)
    taxable = subtotal + delivery + buyer_fee
    demo_tax = round(taxable * DEMO_TAX_RATE)
    tip = round(subtotal * tip_percent / 100)
    seller_fee = round(subtotal * SELLER_FEE_RATE)
    total = subtotal + delivery + buyer_fee + demo_tax + tip
    seller_receives = subtotal - seller_fee + tip
    return Quote(subtotal, delivery, buyer_fee, demo_tax, tip, total, seller_fee, seller_receives)
