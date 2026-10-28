#define LATENCY_NO_MAIN
#include "latency_budget.cpp"
#include <cassert>
int main(){
 {std::istringstream in("trace_id,flow,feedback_ms,ready_ms\na1,Search,80,620\na2,Search,170,1200\nb1,Save,95,480\n");auto t=load_traces(in);assert(t.size()==3);auto s=summarize(t,{150,1000});assert(s.size()==2);assert(s[1].flow=="Search");assert(s[1].feedback_p50==80);assert(s[1].feedback_p95==170);assert(s[1].feedback_misses==1);assert(s[1].ready_misses==1);}
 {assert(percentile({10,20,30,40},.5)==20);assert(percentile({10,20,30,40},.95)==40);}
 {std::istringstream in("trace_id,flow,feedback_ms,ready_ms\na,Test,500,100\n");bool threw=false;try{load_traces(in);}catch(const std::runtime_error&){threw=true;}assert(threw);}
 {std::istringstream in("trace_id,flow,feedback_ms,ready_ms\na,Test,10,20\na,Test,20,30\n");bool threw=false;try{load_traces(in);}catch(const std::runtime_error&){threw=true;}assert(threw);}
 {assert(escape_html("<Save & go>")=="&lt;Save &amp; go&gt;");}
 {std::vector<Trace> t{{"x","<Search>",80,500}};std::ostringstream out;write_report(out,t,{150,1000});auto html=out.str();assert(html.find("&lt;Search&gt;")!=std::string::npos);assert(html.find("Soroush Etemadfar")!=std::string::npos);assert(html.find("<caption>")!=std::string::npos);}
 std::cout<<"6 checks passed\n";
}
