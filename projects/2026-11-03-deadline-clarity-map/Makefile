CC ?= cc
CFLAGS ?= -std=c11 -Wall -Wextra -Werror -pedantic -O2

.PHONY: all test sample clean
all: deadline-map
deadline-map: main.c deadline_map.c deadline_map.h
	$(CC) $(CFLAGS) main.c deadline_map.c -o $@
test-deadline-map: test_deadline_map.c deadline_map.c deadline_map.h
	$(CC) $(CFLAGS) test_deadline_map.c deadline_map.c -o $@
test: test-deadline-map deadline-map
	./test-deadline-map
	! ./deadline-map fixtures/invalid-notices.csv invalid-report.html 2026-11-03
sample: deadline-map
	./deadline-map sample-notices.csv sample-report.html 2026-11-03
clean:
	rm -f deadline-map test-deadline-map sample-report.html invalid-report.html
