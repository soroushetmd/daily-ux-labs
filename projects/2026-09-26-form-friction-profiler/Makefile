CXX ?= g++
CXXFLAGS := -std=c++17 -Wall -Wextra -Werror -pedantic

all: friction-profiler

friction-profiler: friction_profiler.cpp
	$(CXX) $(CXXFLAGS) $< -o $@

test: test_profiler.cpp
	$(CXX) $(CXXFLAGS) $< -o test-profiler
	./test-profiler

demo: friction-profiler
	./friction-profiler sample-events.csv sample-report.html

clean:
	rm -f friction-profiler test-profiler sample-report.html

.PHONY: all test demo clean
