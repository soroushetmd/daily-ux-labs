import unittest
from pathlib import Path
from coverage import build_database, get_gaps, get_matrix, render


ROOT = Path(__file__).parent


class CoverageTests(unittest.TestCase):
    def setUp(self):
        self.db = build_database(ROOT / "schema.sql", ROOT / "seed.sql")

    def test_builds_complete_matrix(self):
        states, rows = get_matrix(self.db)
        self.assertEqual(len(states), 6)
        self.assertEqual(len(rows), 6)
        self.assertTrue(all(len(row["statuses"]) == 6 for row in rows))

    def test_completion_excludes_not_applicable(self):
        _, rows = get_matrix(self.db)
        onboarding = next(row for row in rows if row["name"] == "Account onboarding")
        self.assertEqual(onboarding["completion"], 80)

    def test_gaps_include_missing_and_partial_only(self):
        gaps = get_gaps(self.db)
        self.assertTrue(gaps)
        self.assertTrue(all(row[3] in {"missing", "partial"} for row in gaps))

    def test_report_has_accessible_table_and_disclaimer(self):
        states, rows = get_matrix(self.db)
        report = render(states, rows, get_gaps(self.db))
        self.assertIn('<caption>', report)
        self.assertIn('scope="row"', report)
        self.assertIn('synthetic', report)
        self.assertIn('Soroush Etemadfar', report)


if __name__ == "__main__":
    unittest.main()
