#include <algorithm>
#include <cctype>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <map>
#include <set>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

struct Event { std::string id, channel, priority, title; int minute; };
struct Decision { Event event; std::string delivery, reason; int delivery_minute; };
struct Policy { int focus_start = 540, focus_end = 690; std::vector<int> digests{720, 990}; };

static std::string trim(std::string value) {
    auto first = std::find_if_not(value.begin(), value.end(), [](unsigned char c){ return std::isspace(c); });
    auto last = std::find_if_not(value.rbegin(), value.rend(), [](unsigned char c){ return std::isspace(c); }).base();
    return first < last ? std::string(first, last) : "";
}

static int parse_time(const std::string& value) {
    if (value.size() != 5 || value[2] != ':') throw std::runtime_error("time must use HH:MM");
    int hour, minute; char colon; std::istringstream input(value);
    if (!(input >> hour >> colon >> minute) || colon != ':' || hour < 0 || hour > 23 || minute < 0 || minute > 59) throw std::runtime_error("invalid time: " + value);
    return hour * 60 + minute;
}

static std::string format_time(int minute) {
    std::ostringstream out; out << std::setfill('0') << std::setw(2) << minute / 60 << ':' << std::setw(2) << minute % 60; return out.str();
}

static std::vector<std::string> parse_csv_row(const std::string& line) {
    std::vector<std::string> fields; std::string field; bool quoted = false;
    for (size_t i = 0; i < line.size(); ++i) {
        char c = line[i];
        if (c == '"') {
            if (quoted && i + 1 < line.size() && line[i + 1] == '"') { field += '"'; ++i; }
            else quoted = !quoted;
        } else if (c == ',' && !quoted) { fields.push_back(trim(field)); field.clear(); }
        else field += c;
    }
    if (quoted) throw std::runtime_error("unclosed CSV quote");
    fields.push_back(trim(field)); return fields;
}

static std::vector<Event> load_events(std::istream& input) {
    std::string line; if (!std::getline(input, line)) throw std::runtime_error("CSV is empty");
    if (line != "id,time,channel,priority,title") throw std::runtime_error("unexpected CSV header");
    std::vector<Event> events; std::set<std::string> ids;
    while (std::getline(input, line)) {
        if (trim(line).empty()) continue;
        auto fields = parse_csv_row(line); if (fields.size() != 5) throw std::runtime_error("each row needs five fields");
        Event event{fields[0], fields[2], fields[3], fields[4], parse_time(fields[1])};
        if (event.id.empty() || event.channel.empty() || event.title.empty()) throw std::runtime_error("id, channel, and title are required");
        if (event.priority != "urgent" && event.priority != "standard" && event.priority != "low") throw std::runtime_error("unknown priority: " + event.priority);
        if (!ids.insert(event.id).second) throw std::runtime_error("duplicate id: " + event.id);
        events.push_back(event);
    }
    if (events.empty()) throw std::runtime_error("CSV has no events");
    return events;
}

static int next_digest(int minute, const Policy& policy) {
    for (int digest : policy.digests) if (digest >= minute) return digest;
    return policy.digests.front() + 1440;
}

static Decision decide(const Event& event, const Policy& policy) {
    if (event.priority == "urgent") return {event, "Immediate", "Explicit urgent priority bypasses batching.", event.minute};
    const bool focus = event.minute >= policy.focus_start && event.minute < policy.focus_end;
    if (event.priority == "low") return {event, "Digest", "Low-priority items are grouped to reduce separate interruptions.", next_digest(event.minute, policy)};
    if (focus) return {event, "Digest", "Standard item arrived during the configured focus window.", next_digest(event.minute, policy)};
    return {event, "Immediate", "Standard item arrived outside the configured focus window.", event.minute};
}

static std::vector<Decision> plan(const std::vector<Event>& events, const Policy& policy) {
    std::vector<Decision> decisions; for (const auto& event : events) decisions.push_back(decide(event, policy));
    std::stable_sort(decisions.begin(), decisions.end(), [](const auto& a, const auto& b){ return a.delivery_minute < b.delivery_minute; });
    return decisions;
}

static std::string escape_html(const std::string& value) {
    std::string out; for (char c : value) { if (c == '&') out += "&amp;"; else if (c == '<') out += "&lt;"; else if (c == '>') out += "&gt;"; else if (c == '"') out += "&quot;"; else out += c; } return out;
}

static void write_report(std::ostream& out, const std::vector<Decision>& decisions, const Policy& policy) {
    int immediate = 0, digest = 0; std::map<int,int> groups;
    for (const auto& d : decisions) { if (d.delivery == "Immediate") ++immediate; else { ++digest; ++groups[d.delivery_minute]; } }
    out << R"(<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Notification Rhythm Lab</title><style>body{margin:0;background:#f3f1eb;color:#17201d;font:16px/1.55 system-ui,sans-serif}main,footer{width:min(1050px,calc(100% - 2rem));margin:auto}header{padding:3.5rem 0 2rem}h1{margin:.2rem 0;font:750 clamp(2.8rem,7vw,5rem)/.95 Georgia,serif;letter-spacing:-.045em}.eyebrow,.tag{color:#145f4d;font-size:.78rem;font-weight:850;letter-spacing:.09em;text-transform:uppercase}.notice,.card{background:#fff;border:1px solid #d2d8d5;border-radius:14px;padding:1.2rem;margin:1rem 0}.notice{border-left:5px solid #a15408}.metrics{display:flex;gap:1rem;flex-wrap:wrap}.metric{padding:.8rem 1rem;background:#e4f1ec;border-radius:10px}.metric strong{display:block;font-size:1.8rem}.timeline{position:relative;margin:2rem 0;padding-left:2rem;border-left:3px solid #aebbb5}.card{position:relative}.card:before{content:"";position:absolute;left:-2.48rem;top:1.4rem;width:.85rem;height:.85rem;border-radius:50%;background:#145f4d;border:4px solid #f3f1eb}.urgent{border-left:5px solid #a52b2b}.digest{border-left:5px solid #8b5b00}.reason{color:#586660}table{width:100%;border-collapse:collapse;background:#fff}th,td{padding:.7rem;text-align:left;border-bottom:1px solid #d2d8d5}thead th{background:#e8eeeb}footer{padding:2rem 0 3rem;color:#586660}@media(max-width:700px){.table-wrap{overflow-x:auto}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}</style></head><body><main><header><p class="eyebrow">HCI · digital wellbeing</p><h1>Notification Rhythm Lab</h1><p>A transparent preview of when synthetic product notifications would be delivered or batched.</p></header><section class="notice" aria-labelledby="scope"><h2 id="scope">Prototype scope</h2><p>This demo applies a visible, fictional policy. It does not claim improved wellbeing or productivity, and it is not a clinical or safety notification system. Users should control priorities, focus windows, and exceptions.</p></section>)";
    out << "<section class=\"metrics\" aria-label=\"Plan summary\"><div class=\"metric\"><strong>" << decisions.size() << "</strong>events</div><div class=\"metric\"><strong>" << immediate << "</strong>immediate</div><div class=\"metric\"><strong>" << digest << "</strong>batched</div><div class=\"metric\"><strong>" << groups.size() << "</strong>digest moments</div></section>";
    out << "<section aria-labelledby=\"timeline-title\"><h2 id=\"timeline-title\">Delivery timeline</h2><div class=\"timeline\">";
    for (const auto& d : decisions) {
        out << "<article class=\"card " << (d.delivery == "Digest" ? "digest" : (d.event.priority == "urgent" ? "urgent" : "")) << "\"><p class=\"tag\">" << escape_html(d.delivery) << " · " << format_time(d.delivery_minute % 1440) << (d.delivery_minute >= 1440 ? " next day" : "") << "</p><h3>" << escape_html(d.event.title) << "</h3><p><strong>Source:</strong> " << escape_html(d.event.channel) << " · arrived " << format_time(d.event.minute) << " · " << escape_html(d.event.priority) << " priority</p><p class=\"reason\"><strong>Why:</strong> " << escape_html(d.reason) << "</p></article>";
    }
    out << "</div></section><section aria-labelledby=\"table-title\"><h2 id=\"table-title\">Exact decision log</h2><div class=\"table-wrap\"><table><caption>Every synthetic event and the rule applied</caption><thead><tr><th scope=\"col\">Event</th><th scope=\"col\">Arrived</th><th scope=\"col\">Priority</th><th scope=\"col\">Delivery</th><th scope=\"col\">Scheduled</th></tr></thead><tbody>";
    for (const auto& d : decisions) out << "<tr><th scope=\"row\">" << escape_html(d.event.title) << "</th><td>" << format_time(d.event.minute) << "</td><td>" << escape_html(d.event.priority) << "</td><td>" << escape_html(d.delivery) << "</td><td>" << format_time(d.delivery_minute % 1440) << (d.delivery_minute >= 1440 ? " next day" : "") << "</td></tr>";
    out << "</tbody></table></div></section><details><summary>Fictional policy used</summary><ul><li>Urgent: immediate.</li><li>Standard during " << format_time(policy.focus_start) << "–" << format_time(policy.focus_end) << ": next digest.</li><li>Standard outside focus: immediate.</li><li>Low: next digest.</li><li>Digest times: ";
    for (size_t i = 0; i < policy.digests.size(); ++i) out << (i ? ", " : "") << format_time(policy.digests[i]);
    out << ".</li></ul></details></main><footer>Created by <strong>Soroush Etemadfar</strong>. All event content and policy values are synthetic.</footer></body></html>";
}

#ifndef NOTIFICATION_LAB_TEST
int main(int argc, char** argv) {
    if (argc != 3) { std::cerr << "Usage: " << argv[0] << " input.csv output.html\n"; return 2; }
    try {
        std::ifstream input(argv[1]); if (!input) throw std::runtime_error("could not read input");
        auto events = load_events(input); Policy policy; auto decisions = plan(events, policy);
        std::ofstream output(argv[2]); if (!output) throw std::runtime_error("could not write output");
        write_report(output, decisions, policy);
        int batched = static_cast<int>(std::count_if(decisions.begin(), decisions.end(), [](const auto& d){ return d.delivery == "Digest"; }));
        std::cout << "Planned " << decisions.size() << " events: " << decisions.size() - batched << " immediate, " << batched << " batched.\n";
    } catch (const std::exception& error) { std::cerr << "Error: " << error.what() << '\n'; return 1; }
    return 0;
}
#endif
