import unittest
from a11y_snapshot import audit, render_report


class AuditTests(unittest.TestCase):
    def test_detects_core_issues(self):
        findings = audit('<html><body><img src="x"><button></button><input id="name"><h2>A</h2><h4>B</h4></body></html>')
        rules = {item.rule for item in findings}
        self.assertTrue({"document-language", "image-alt", "button-name", "form-label", "heading-order"}.issubset(rules))

    def test_accepts_named_controls(self):
        findings = audit('<html lang="en"><body><label for="n">Name</label><input id="n"><button>Save</button><img src="x" alt=""></body></html>')
        self.assertEqual(findings, [])

    def test_duplicate_ids_and_tab_order(self):
        findings = audit('<html lang="en"><body><a id="x" tabindex="2">A</a><p id="x">B</p></body></html>')
        rules = [item.rule for item in findings]
        self.assertEqual(rules.count("duplicate-id"), 2)
        self.assertIn("positive-tabindex", rules)

    def test_report_escapes_source_name(self):
        report = render_report('<unsafe>.html', [])
        self.assertIn('&lt;unsafe&gt;.html', report)
        self.assertIn('does not replace', report)


if __name__ == "__main__":
    unittest.main()
