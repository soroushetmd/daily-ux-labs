import json
import tempfile
import unittest
from pathlib import Path

from planner import Listing, clock, load_listings, plan_route, render_report, schedule_order, travel_minutes


def listing(identifier, x, window, priority=70, duration=30):
    return Listing(identifier, identifier.title(), "Demo", x, 0, window[0], window[1], duration, priority, ("demo reason",))


class PlannerTests(unittest.TestCase):
    def test_travel_has_a_minimum_and_rounds_up(self):
        self.assertEqual(travel_minutes((0, 0), (0, 0)), 5)
        self.assertEqual(travel_minutes((0, 0), (1, 0)), 7)

    def test_schedule_waits_until_opening(self):
        item = listing("later", 1, (660, 750))
        stop = schedule_order((item,), (0, 0), 600, 900)[0]
        self.assertEqual((stop.arrival, stop.start, stop.end), (607, 660, 690))

    def test_optimizer_prefers_stronger_feasible_combination(self):
        early = listing("early", 1, (600, 680), priority=45)
        strong = listing("strong", 2, (650, 760), priority=90)
        late = listing("late", 3, (720, 840), priority=85)
        stops = plan_route([early, strong, late], (0, 0), 600, 800)
        self.assertEqual([stop.listing.id for stop in stops], ["early", "strong", "late"])

    def test_invalid_input_is_rejected(self):
        payload = {"listings": [{"id": "bad"}]}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bad.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaises(ValueError):
                load_listings(path)

    def test_report_is_accessible_and_discloses_synthetic_data(self):
        item = listing("one", 1, (600, 720), priority=80)
        stops = plan_route([item], (0, 0), 600, 900)
        report = render_report([item], stops, 600, 900)
        for token in ('<caption>', 'scope="col"', 'scope="row"', "fictional", "Soroush Etemadfar"):
            self.assertIn(token, report)
        self.assertEqual(clock(780), "1:00 PM")


if __name__ == "__main__":
    unittest.main()
