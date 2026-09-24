import tempfile
import unittest
from pathlib import Path

from database import get_listing, initialize, list_listings
from pricing import calculate_quote


class PricingTests(unittest.TestCase):
    def test_pickup_quote_uses_integer_cents(self):
        quote = calculate_quote(1000, 2, "pickup", 10)
        self.assertEqual(quote.subtotal, 2000)
        self.assertEqual(quote.buyer_fee, 140)
        self.assertEqual(quote.demo_tax, 278)
        self.assertEqual(quote.tip, 200)
        self.assertEqual(quote.total, 2618)
        self.assertEqual(quote.seller_receives, 2000)

    def test_delivery_is_visible_in_total_but_not_seller_payout(self):
        pickup = calculate_quote(1500, 1, "pickup", 0)
        delivery = calculate_quote(1500, 1, "delivery", 0)
        self.assertGreater(delivery.total, pickup.total)
        self.assertEqual(delivery.seller_receives, pickup.seller_receives)

    def test_invalid_inputs_are_rejected(self):
        with self.assertRaises(ValueError):
            calculate_quote(1000, 0, "pickup", 0)
        with self.assertRaises(ValueError):
            calculate_quote(1000, 1, "drone", 0)
        with self.assertRaises(ValueError):
            calculate_quote(1000, 1, "pickup", 17)


class DatabaseTests(unittest.TestCase):
    def test_database_seeds_three_synthetic_listings(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "test.db"
            initialize(path)
            initialize(path)
            self.assertEqual(len(list_listings(path)), 3)
            self.assertEqual(get_listing(path, 1)["seller"], "Nilo's Kitchen")


if __name__ == "__main__":
    unittest.main()
