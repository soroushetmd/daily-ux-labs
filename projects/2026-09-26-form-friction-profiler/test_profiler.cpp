#define FRICTION_PROFILER_TEST
#include "friction_profiler.cpp"
#include <cassert>

int main() {
  std::istringstream input("session_id,step,status,duration_seconds\n1,Identity,completed,10\n2,Identity,abandoned,30\n");
  auto result = analyze(input);
  assert(result.at("Identity").visits == 2);
  assert(result.at("Identity").abandonments == 1);
  assert(median(result.at("Identity").durations) == 20.0);
  assert(escape_html("A&B <test>") == "A&amp;B &lt;test&gt;");
  std::ostringstream html;
  render(result, html);
  assert(html.str().find("50%") != std::string::npos);
  assert(html.str().find("Session identifiers are never written") != std::string::npos);
  bool rejected = false;
  try { std::istringstream bad("wrong,header\n"); analyze(bad); } catch (...) { rejected = true; }
  assert(rejected);
  std::cout << "All tests passed.\n";
}
