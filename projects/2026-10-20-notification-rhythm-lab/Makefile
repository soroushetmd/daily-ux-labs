CXX ?= c++
CXXFLAGS = -std=c++17 -Wall -Wextra -Werror -pedantic -O2

.PHONY: all test report clean

all: notification-lab

notification-lab: notification_lab.cpp
	$(CXX) $(CXXFLAGS) notification_lab.cpp -o notification-lab

test-runner: test_notification_lab.cpp notification_lab.cpp
	$(CXX) $(CXXFLAGS) test_notification_lab.cpp -o test-runner

test: notification-lab test-runner
	./test-runner
	! ./notification-lab fixtures/invalid-events.csv /tmp/invalid-report.html

report: notification-lab
	./notification-lab sample-events.csv sample-report.html

clean:
	rm -f notification-lab test-runner sample-report.html
