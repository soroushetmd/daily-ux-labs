CXX ?= c++
CXXFLAGS = -std=c++17 -Wall -Wextra -Werror -pedantic -O2
.PHONY: all test report clean
all: latency-budget
latency-budget: latency_budget.cpp
	$(CXX) $(CXXFLAGS) latency_budget.cpp -o latency-budget
test-runner: test_latency_budget.cpp latency_budget.cpp
	$(CXX) $(CXXFLAGS) test_latency_budget.cpp -o test-runner
test: latency-budget test-runner
	./test-runner
	! ./latency-budget fixtures/invalid-traces.csv /tmp/invalid.html
report: latency-budget
	./latency-budget sample-traces.csv sample-report.html
clean:
	rm -f latency-budget test-runner sample-report.html
