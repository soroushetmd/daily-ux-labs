#include <algorithm>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <map>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

struct StepStats {
  int visits = 0;
  int completions = 0;
  int abandonments = 0;
  std::vector<double> durations;
};

static std::vector<std::string> split_csv(const std::string &line) {
  std::vector<std::string> fields;
  std::string field;
  bool quoted = false;
  for (size_t i = 0; i < line.size(); ++i) {
    char c = line[i];
    if (c == '"') {
      if (quoted && i + 1 < line.size() && line[i + 1] == '"') {
        field += '"';
        ++i;
      } else {
        quoted = !quoted;
      }
    } else if (c == ',' && !quoted) {
      fields.push_back(field);
      field.clear();
    } else {
      field += c;
    }
  }
  fields.push_back(field);
  return fields;
}

static std::string escape_html(const std::string &value) {
  std::string out;
  for (char c : value) {
    if (c == '&') out += "&amp;";
    else if (c == '<') out += "&lt;";
    else if (c == '>') out += "&gt;";
    else if (c == '"') out += "&quot;";
    else out += c;
  }
  return out;
}

static double median(std::vector<double> values) {
  if (values.empty()) return 0;
  std::sort(values.begin(), values.end());
  size_t middle = values.size() / 2;
  return values.size() % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2.0;
}

static std::map<std::string, StepStats> analyze(std::istream &input) {
  std::map<std::string, StepStats> result;
  std::string line;
  if (!std::getline(input, line)) throw std::runtime_error("The CSV file is empty.");
  if (split_csv(line) != std::vector<std::string>{"session_id", "step", "status", "duration_seconds"})
    throw std::runtime_error("Expected header: session_id,step,status,duration_seconds");

  int row = 1;
  while (std::getline(input, line)) {
    ++row;
    if (line.empty()) continue;
    auto fields = split_csv(line);
    if (fields.size() != 4 || fields[1].empty()) throw std::runtime_error("Invalid CSV row " + std::to_string(row));
    double duration;
    try { duration = std::stod(fields[3]); }
    catch (...) { throw std::runtime_error("Invalid duration on row " + std::to_string(row)); }
    if (duration < 0 || (fields[2] != "completed" && fields[2] != "abandoned"))
      throw std::runtime_error("Invalid status or duration on row " + std::to_string(row));
    auto &stats = result[fields[1]];
    ++stats.visits;
    stats.durations.push_back(duration);
    if (fields[2] == "completed") ++stats.completions;
    else ++stats.abandonments;
  }
  if (result.empty()) throw std::runtime_error("The CSV has no event rows.");
  return result;
}

static void render(const std::map<std::string, StepStats> &stats, std::ostream &out) {
  out << R"(<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Form Friction Report</title><style>
:root{color-scheme:light dark;font-family:system-ui,sans-serif}body{max-width:960px;margin:auto;padding:2rem;line-height:1.55}header{max-width:65ch}.note{background:#eaf4ff;color:#12263a;padding:1rem;border-left:5px solid #1677b8}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;margin-top:2rem}.card{border:1px solid #8888;border-radius:12px;padding:1rem}.bar{height:12px;background:#8884;border-radius:99px;overflow:hidden}.bar span{display:block;height:100%;background:#c23b4a}.risk-high{border-left:6px solid #c23b4a}.risk-medium{border-left:6px solid #b56a00}.risk-low{border-left:6px solid #238636}table{border-collapse:collapse;width:100%;margin-top:2rem}th,td{padding:.7rem;border-bottom:1px solid #8888;text-align:left}caption{text-align:left;font-weight:700;margin-bottom:.5rem}@media(prefers-reduced-motion:no-preference){.bar span{transition:width .4s ease}}@media(max-width:600px){body{padding:1rem}table{font-size:.9rem}}
</style></head><body><header><p>UX analytics prototype</p><h1>Form Friction Report</h1><p>Prioritize investigation using completion, abandonment, and median time. These signals describe the supplied event log; they do not explain user intent.</p><p class="note"><strong>Privacy:</strong> this report contains aggregate step data only. Session identifiers are never written to the output.</p></header><main><section aria-labelledby="cards-title"><h2 id="cards-title">Step signals</h2><div class="grid">)";
  for (const auto &[name, s] : stats) {
    double rate = 100.0 * s.abandonments / s.visits;
    std::string risk = rate >= 35 ? "high" : rate >= 15 ? "medium" : "low";
    out << "<article class=\"card risk-" << risk << "\"><h3>" << escape_html(name) << "</h3>"
        << "<p><strong>" << std::fixed << std::setprecision(0) << rate << "%</strong> abandonment</p>"
        << "<div class=\"bar\" aria-hidden=\"true\"><span style=\"width:" << rate << "%\"></span></div>"
        << "<p>Median time: " << std::setprecision(1) << median(s.durations) << "s · " << s.visits << " visits</p>"
        << "<p>Investigation priority: <strong>" << risk << "</strong></p></article>";
  }
  out << R"(</div></section><section aria-labelledby="table-title"><h2 id="table-title">Exact values</h2><table><caption>Aggregate event metrics by step</caption><thead><tr><th scope="col">Step</th><th scope="col">Visits</th><th scope="col">Completed</th><th scope="col">Abandoned</th><th scope="col">Median time</th></tr></thead><tbody>)";
  for (const auto &[name, s] : stats)
    out << "<tr><th scope=\"row\">" << escape_html(name) << "</th><td>" << s.visits << "</td><td>" << s.completions << "</td><td>" << s.abandonments << "</td><td>" << std::fixed << std::setprecision(1) << median(s.durations) << "s</td></tr>";
  out << R"(</tbody></table></section></main><footer><p>Prototype by Soroush Etemadfar · Review aggregates alongside qualitative evidence.</p></footer></body></html>)";
}

#ifndef FRICTION_PROFILER_TEST
int main(int argc, char **argv) {
  if (argc != 3) { std::cerr << "Usage: friction-profiler input.csv report.html\n"; return 2; }
  try {
    std::ifstream input(argv[1]);
    if (!input) throw std::runtime_error("Could not open input file.");
    std::ofstream output(argv[2]);
    if (!output) throw std::runtime_error("Could not open output file.");
    render(analyze(input), output);
    std::cout << "Report written to " << argv[2] << "\n";
  } catch (const std::exception &error) { std::cerr << "Error: " << error.what() << "\n"; return 1; }
}
#endif
