#define NOTIFICATION_LAB_TEST
#include "notification_lab.cpp"
#include <cassert>

static Event event(std::string priority, int minute) { return {"id", "Product", std::move(priority), "Update", minute}; }

int main() {
    Policy policy;
    assert(parse_time("09:05") == 545);
    assert(format_time(990) == "16:30");
    assert(decide(event("urgent", 600), policy).delivery == "Immediate");
    auto focused = decide(event("standard", 600), policy); assert(focused.delivery == "Digest" && focused.delivery_minute == 720);
    assert(decide(event("standard", 800), policy).delivery == "Immediate");
    auto low = decide(event("low", 1000), policy); assert(low.delivery == "Digest" && low.delivery_minute == 2160);
    {
        Event late = event("standard", 800); late.id = "late";
        Event urgent = event("urgent", 600); urgent.id = "urgent";
        auto decisions = plan({late, urgent}, policy);
        assert(decisions.size() == 2 && decisions[0].event.id == "urgent" && decisions[1].event.id == "late");
    }
    {
        std::istringstream input("id,time,channel,priority,title\n1,09:15,Chat,standard,Review ready\n");
        auto events = load_events(input); assert(events.size() == 1 && events[0].minute == 555);
    }
    {
        std::istringstream input("id,time,channel,priority,title\n1,09:15,Chat,standard,One\n1,10:15,Mail,low,Two\n");
        bool failed = false; try { load_events(input); } catch (const std::runtime_error&) { failed = true; } assert(failed);
    }
    {
        Decision safe{event("urgent", 600), "Immediate", "Visible reason", 600}; safe.event.title = "<script>alert(1)</script>";
        std::ostringstream output; write_report(output, {safe}, policy); auto html = output.str();
        assert(html.find("<script>alert") == std::string::npos); assert(html.find("&lt;script&gt;") != std::string::npos); assert(html.find("Soroush Etemadfar") != std::string::npos); assert(html.find("<caption>") != std::string::npos);
    }
    std::cout << "All 9 checks passed.\n";
}
