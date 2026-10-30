import json,tempfile,unittest
from datetime import datetime,timezone
from pathlib import Path
from tool_signal import analyze,classify,load_data,render
ROOT=Path(__file__).parent;NOW=datetime(2026,10,30,16,0,tzinfo=timezone.utc)
class Tests(unittest.TestCase):
 def test_sample_has_each_status(self):
  data=load_data(ROOT/"sample-data.json");records=analyze(data,ROOT/"schema.sql",NOW);self.assertEqual({r["status"] for r in records},{"available","checked-out","overdue","misplaced","missing"})
 def test_overdue_is_based_on_injected_time(self):
  record={"event_type":"checkout","expected_return":"2026-10-30T15:00:00Z","observed_zone":"Cart","home_zone":"Crib"};self.assertEqual(classify(record,NOW)[0],"overdue")
 def test_returned_to_wrong_zone_is_misplaced(self):
  record={"event_type":"return","expected_return":None,"observed_zone":"Bay 4","home_zone":"Crib"};self.assertEqual(classify(record,NOW)[0],"misplaced")
 def test_unknown_tool_is_rejected(self):
  data={"notice":"demo","tools":[],"events":[{"tool_id":"X","event_type":"missing","occurred_at":"2026-10-30T00:00:00Z"}]}
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/"x.json";p.write_text(json.dumps(data))
   with self.assertRaisesRegex(ValueError,"unknown tool"):load_data(p)
 def test_report_escapes_text_and_has_accessible_table(self):
  record={"name":"<Meter>","category":"A&B","status":"missing","observed_zone":None,"reason":"Missing <now>"};out=render([record],"Fictional",NOW);self.assertIn("&lt;Meter&gt;",out);self.assertIn("A&amp;B",out);self.assertIn("<caption>",out);self.assertIn('scope="col"',out);self.assertIn("Soroush Etemadfar",out)
if __name__=="__main__":unittest.main()
