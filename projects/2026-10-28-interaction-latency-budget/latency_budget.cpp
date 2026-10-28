#include <algorithm>
#include <cctype>
#include <cmath>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <map>
#include <set>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

struct Trace { std::string id, flow; int feedback_ms, ready_ms; };
struct Budget { int feedback_ms = 150; int ready_ms = 1000; };
struct FlowSummary { std::string flow; int count, feedback_p50, feedback_p95, ready_p50, ready_p95, feedback_misses, ready_misses; };

static std::string trim(std::string value) {
    auto first = std::find_if_not(value.begin(), value.end(), [](unsigned char c){ return std::isspace(c); });
    auto last = std::find_if_not(value.rbegin(), value.rend(), [](unsigned char c){ return std::isspace(c); }).base();
    return first < last ? std::string(first, last) : "";
}

static int parse_ms(const std::string& value, const std::string& field) {
    if (value.empty() || !std::all_of(value.begin(), value.end(), [](unsigned char c){ return std::isdigit(c); })) throw std::runtime_error(field + " must be a non-negative integer");
    try { return std::stoi(value); } catch (...) { throw std::runtime_error(field + " is outside the supported range"); }
}

static std::vector<std::string> parse_csv_row(const std::string& line) {
    std::vector<std::string> fields; std::string field; bool quoted = false;
    for (size_t i = 0; i < line.size(); ++i) {
        const char c = line[i];
        if (c == '"') {
            if (quoted && i + 1 < line.size() && line[i + 1] == '"') { field += '"'; ++i; }
            else quoted = !quoted;
        } else if (c == ',' && !quoted) { fields.push_back(trim(field)); field.clear(); }
        else field += c;
    }
    if (quoted) throw std::runtime_error("unclosed CSV quote");
    fields.push_back(trim(field)); return fields;
}

static std::vector<Trace> load_traces(std::istream& input) {
    std::string line; if (!std::getline(input, line)) throw std::runtime_error("CSV is empty");
    if (trim(line) != "trace_id,flow,feedback_ms,ready_ms") throw std::runtime_error("unexpected CSV header");
    std::vector<Trace> traces; std::set<std::string> ids; int row = 1;
    while (std::getline(input, line)) {
        ++row; if (trim(line).empty()) continue; auto fields = parse_csv_row(line);
        if (fields.size() != 4) throw std::runtime_error("row " + std::to_string(row) + " needs four fields");
        if (fields[0].empty() || fields[1].empty()) throw std::runtime_error("trace_id and flow are required");
        if (!ids.insert(fields[0]).second) throw std::runtime_error("duplicate trace_id: " + fields[0]);
        Trace trace{fields[0], fields[1], parse_ms(fields[2], "feedback_ms"), parse_ms(fields[3], "ready_ms")};
        if (trace.ready_ms < trace.feedback_ms) throw std::runtime_error("ready_ms cannot be earlier than feedback_ms");
        traces.push_back(trace);
    }
    if (traces.empty()) throw std::runtime_error("CSV has no traces");
    return traces;
}

static int percentile(std::vector<int> values, double p) {
    if (values.empty()) throw std::runtime_error("percentile needs values");
    std::sort(values.begin(), values.end());
    const size_t index = static_cast<size_t>(std::ceil(p * values.size())) - 1;
    return values[std::min(index, values.size() - 1)];
}

static std::vector<FlowSummary> summarize(const std::vector<Trace>& traces, const Budget& budget) {
    std::map<std::string, std::vector<Trace>> groups; for (const auto& trace : traces) groups[trace.flow].push_back(trace);
    std::vector<FlowSummary> result;
    for (const auto& [flow, items] : groups) {
        std::vector<int> feedback, ready; int feedback_misses = 0, ready_misses = 0;
        for (const auto& item : items) { feedback.push_back(item.feedback_ms); ready.push_back(item.ready_ms); feedback_misses += item.feedback_ms > budget.feedback_ms; ready_misses += item.ready_ms > budget.ready_ms; }
        result.push_back({flow, static_cast<int>(items.size()), percentile(feedback,.5), percentile(feedback,.95), percentile(ready,.5), percentile(ready,.95), feedback_misses, ready_misses});
    }
    return result;
}

static std::string escape_html(const std::string& value) {
    std::string out; for (char c : value) { if (c=='&') out += "&amp;"; else if (c=='<') out += "&lt;"; else if (c=='>') out += "&gt;"; else if (c=='\"') out += "&quot;"; else out += c; } return out;
}

static void write_report(std::ostream& out, const std::vector<Trace>& traces, const Budget& budget) {
    const auto summaries = summarize(traces, budget); int feedback_misses=0, ready_misses=0;
    for (const auto& t:traces){feedback_misses += t.feedback_ms>budget.feedback_ms; ready_misses += t.ready_ms>budget.ready_ms;}
    out << R"(<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Interaction Latency Budget</title><style>)";
    out << R"(body{margin:0;background:#f2f0e9;color:#16201d;font:16px/1.55 system-ui,sans-serif}main,footer{width:min(1100px,calc(100% - 2rem));margin:auto}header{padding:4rem 0 2rem}h1{font:700 clamp(2.8rem,7vw,5.5rem)/.92 Georgia,serif;letter-spacing:-.04em;margin:.4rem 0}h2{font:700 2rem Georgia,serif}.kicker{text-transform:uppercase;letter-spacing:.12em;font-size:.75rem;font-weight:800;color:#15614a}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1rem}.card,section{background:#fffdf8;border:1px solid #c9c6bc;border-radius:18px;padding:1.2rem}.number{font:700 2.4rem Georgia,serif;margin:.2rem 0}.note{border-left:5px solid #d9f26a;margin:2rem 0}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.75rem;border-bottom:1px solid #d7d3c9}th{font-size:.75rem;text-transform:uppercase;letter-spacing:.06em}.bad{color:#9a2934;font-weight:750}.good{color:#15614a;font-weight:750}.bar{height:.65rem;background:#e2dfd5;border-radius:99px;overflow:hidden;min-width:120px}.bar span{display:block;height:100%;background:#15614a}.bar .over{background:#b43c47}.table-wrap{overflow:auto}footer{padding:2rem 0}@media(max-width:650px){header{padding-top:2.5rem}th,td{padding:.6rem}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}})</style></head><body><main><header><p class="kicker">HCI performance review · synthetic traces</p><h1>Interaction Latency Budget</h1><p>Separate the time to visible feedback from the time to usable content. Prototype budgets are configuration choices—not universal standards.</p></header>)";
    out << "<div class=\"grid\"><div class=\"card\"><span>Traces</span><p class=\"number\">"<<traces.size()<<"</p></div><div class=\"card\"><span>Feedback budget misses</span><p class=\"number\">"<<feedback_misses<<"</p></div><div class=\"card\"><span>Ready budget misses</span><p class=\"number\">"<<ready_misses<<"</p></div></div>";
    out << "<section class=\"note\"><h2>Configured budgets</h2><p>Visible acknowledgment: <strong>"<<budget.feedback_ms<<" ms</strong>. Usable content: <strong>"<<budget.ready_ms<<" ms</strong>. A miss is a review signal, not proof of poor usability.</p></section>";
    out << "<section><h2>Flow summary</h2><div class=\"table-wrap\"><table><caption>Percentiles and budget misses by flow</caption><thead><tr><th scope=\"col\">Flow</th><th scope=\"col\">Samples</th><th scope=\"col\">Feedback p50 / p95</th><th scope=\"col\">Ready p50 / p95</th><th scope=\"col\">Misses</th></tr></thead><tbody>";
    for(const auto&s:summaries) out<<"<tr><th scope=\"row\">"<<escape_html(s.flow)<<"</th><td>"<<s.count<<"</td><td>"<<s.feedback_p50<<" / "<<s.feedback_p95<<" ms</td><td>"<<s.ready_p50<<" / "<<s.ready_p95<<" ms</td><td>"<<s.feedback_misses<<" feedback · "<<s.ready_misses<<" ready</td></tr>";
    out << "</tbody></table></div></section><section><h2>Trace evidence</h2><div class=\"table-wrap\"><table><caption>Every synthetic trace and its two timing milestones</caption><thead><tr><th scope=\"col\">Trace</th><th scope=\"col\">Flow</th><th scope=\"col\">Feedback</th><th scope=\"col\">Content ready</th></tr></thead><tbody>";
    for(const auto&t:traces){const bool fb=t.feedback_ms>budget.feedback_ms,rd=t.ready_ms>budget.ready_ms;out<<"<tr><th scope=\"row\">"<<escape_html(t.id)<<"</th><td>"<<escape_html(t.flow)<<"</td><td class=\""<<(fb?"bad":"good")<<"\">"<<t.feedback_ms<<" ms · "<<(fb?"Review":"Within budget")<<"</td><td class=\""<<(rd?"bad":"good")<<"\">"<<t.ready_ms<<" ms · "<<(rd?"Review":"Within budget")<<"</td></tr>";}
    out << R"(</tbody></table></div></section><section class="note"><strong>Interpret carefully.</strong><p>This report uses fictional traces. It does not measure perceived quality, network conditions, assistive-technology behavior, or real users. Investigate traces in context before changing a product.</p></section></main><footer>Created by <strong>Soroush Etemadfar</strong> · UX/Product Design × Software Engineering</footer></body></html>)";
}

#ifndef LATENCY_NO_MAIN
int main(int argc,char**argv){try{if(argc<3||argc>5){std::cerr<<"Usage: latency-budget INPUT.csv OUTPUT.html [feedback_ms] [ready_ms]\n";return 1;}Budget budget;if(argc>=4)budget.feedback_ms=parse_ms(argv[3],"feedback budget");if(argc==5)budget.ready_ms=parse_ms(argv[4],"ready budget");if(budget.ready_ms<budget.feedback_ms)throw std::runtime_error("ready budget cannot be lower than feedback budget");std::ifstream input(argv[1]);if(!input)throw std::runtime_error("cannot open input");auto traces=load_traces(input);std::ofstream output(argv[2]);if(!output)throw std::runtime_error("cannot open output");write_report(output,traces,budget);std::cout<<"Wrote "<<argv[2]<<" from "<<traces.size()<<" traces\n";return 0;}catch(const std::exception&e){std::cerr<<"Error: "<<e.what()<<'\n';return 2;}}
#endif
