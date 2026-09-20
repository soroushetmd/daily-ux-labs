import tempfile
import unittest
from pathlib import Path

from token_guard import (
    Token,
    check_contrast,
    compare_tokens,
    contrast_ratio,
    flatten_tokens,
    generate_report,
    parse_hex_colour,
)


class TokenGuardTests(unittest.TestCase):
    def test_flattens_nested_tokens_and_ignores_meta(self):
        data = {
            "color": {"text": {"value": "#111111", "type": "color"}},
            "meta": {"contrastPairs": []},
        }
        self.assertEqual(flatten_tokens(data), {"color.text": Token("color.text", "#111111", "color")})

    def test_classifies_removed_and_type_changed_tokens_as_breaking(self):
        before = {
            "space.md": Token("space.md", 16, "dimension"),
            "color.old": Token("color.old", "#000000", "color"),
        }
        after = {"space.md": Token("space.md", "1rem", "dimension")}
        changes = compare_tokens(before, after)
        self.assertEqual([(item.status, item.risk) for item in changes], [("Removed", "Breaking"), ("Type changed", "Breaking")])

    def test_parses_short_and_long_hex(self):
        self.assertEqual(parse_hex_colour("#fff"), (255, 255, 255))
        self.assertEqual(parse_hex_colour("24242A"), (36, 36, 42))

    def test_contrast_ratio_black_on_white_is_twenty_one(self):
        self.assertAlmostEqual(contrast_ratio("#000000", "#FFFFFF"), 21.0, places=6)

    def test_checks_normal_text_threshold_without_rounding(self):
        document = {"meta": {"contrastPairs": [{
            "label": "Body",
            "foreground": "color.text",
            "background": "color.surface",
            "largeText": False,
        }]}}
        tokens = {
            "color.text": Token("color.text", "#777777", "color"),
            "color.surface": Token("color.surface", "#FFFFFF", "color"),
        }
        results, errors = check_contrast(document, tokens)
        self.assertFalse(errors)
        self.assertFalse(results[0].passes)
        self.assertLess(results[0].ratio, 4.5)

    def test_generated_report_is_standalone_html(self):
        output = generate_report([], [], [])
        self.assertIn("<!doctype html>", output)
        self.assertIn("Soroush Etemadfar", output)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "report.html"
            path.write_text(output, encoding="utf-8")
            self.assertTrue(path.exists())


if __name__ == "__main__":
    unittest.main()
