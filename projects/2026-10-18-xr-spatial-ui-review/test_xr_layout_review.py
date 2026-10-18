import json
import tempfile
import unittest
from pathlib import Path

from xr_layout_review import angular_size, load_layout, render, review


class XRLayoutReviewTests(unittest.TestCase):
    def test_angular_size(self):
        self.assertAlmostEqual(angular_size(1.0, 1.0), 53.1301, places=3)

    def test_review_finds_explainable_signals(self):
        layout = {"name":"Demo","panels":[{"id":"p","label":"Panel","distance_m":0.4,"yaw_deg":50,"pitch_deg":30,"width_m":0.8,"target_height_m":0.005}]}
        rules = {signal.rule for signal in review(layout)}
        self.assertEqual(rules, {"Near placement", "Large horizontal turn", "Large vertical turn", "Wide visual span", "Small target angle"})

    def test_comfortable_fixture_has_no_signals(self):
        layout = load_layout(Path("fixtures/comfortable-layout.json"))
        self.assertEqual(review(layout), [])

    def test_rejects_duplicate_ids_and_unknown_fields(self):
        panel = {"id":"p","label":"Panel","distance_m":1,"yaw_deg":0,"pitch_deg":0,"width_m":0.5,"target_height_m":0.03}
        for panels in ([panel, panel], [panel | {"score": 10}]):
            with tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / "layout.json"
                path.write_text(json.dumps({"name":"Demo","panels":panels}), encoding="utf-8")
                with self.assertRaises(ValueError):
                    load_layout(path)

    def test_report_escapes_input_and_has_accessible_alternative(self):
        layout = {"name":"<script>alert(1)</script>","panels":[{"id":"p","label":"<b>Panel</b>","distance_m":1.2,"yaw_deg":0,"pitch_deg":0,"width_m":0.5,"target_height_m":0.03}]}
        report = render(layout, review(layout))
        self.assertNotIn("<script>alert", report)
        self.assertIn("&lt;b&gt;Panel", report)
        self.assertIn('<table>', report)
        self.assertIn('role="img"', report)
        self.assertIn("Soroush Etemadfar", report)


if __name__ == "__main__":
    unittest.main()
