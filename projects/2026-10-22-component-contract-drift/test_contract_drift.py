import json
import tempfile
import unittest
from pathlib import Path

from contract_drift import compare, load_manifest, render_html, summary


def manifest(components, version="1.0.0"):
    return {"version": version, "components": components}


def component(name="Button", props=None, keyboard=None):
    return {"name": name, "props": props or {}, "keyboard": keyboard or []}


class ContractDriftTests(unittest.TestCase):
    def test_removed_component_is_breaking(self):
        changes = compare(manifest([component()]), manifest([], "2.0.0"))
        self.assertEqual(changes[0].severity, "breaking")

    def test_required_prop_and_type_change_are_breaking(self):
        before = manifest([component(props={"size":{"type":"string","required":False}})])
        after = manifest([component(props={"size":{"type":"number","required":True},"label":{"type":"string","required":True}})])
        changes = compare(before, after)
        self.assertEqual(summary(changes)["breaking"], 3)

    def test_optional_prop_and_component_are_non_breaking(self):
        before = manifest([component()])
        after = manifest([component(props={"loading":{"type":"boolean","required":False}}), component("Badge")])
        self.assertEqual(summary(compare(before, after))["non-breaking"], 2)

    def test_removed_keyboard_contract_requires_review(self):
        before = manifest([component(keyboard=["Escape closes"])])
        after = manifest([component()])
        change = compare(before, after)[0]
        self.assertEqual(change.severity, "review")
        self.assertIn("Escape closes", change.evidence)

    def test_loader_rejects_duplicates_and_unknown_fields(self):
        for data in (manifest([component(), component()]), {"version":"1","components":[component() | {"score": 5}]}):
            with tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / "manifest.json"
                path.write_text(json.dumps(data), encoding="utf-8")
                with self.assertRaises(ValueError):
                    load_manifest(path)

    def test_report_escapes_values_and_exposes_table(self):
        before = manifest([component("<script>bad</script>")])
        after = manifest([], "2.0.0")
        report = render_html(before, after, compare(before, after))
        self.assertNotIn("<script>bad", report)
        self.assertIn("&lt;script&gt;", report)
        self.assertIn("<caption>", report)
        self.assertIn("Soroush Etemadfar", report)


if __name__ == "__main__":
    unittest.main()
