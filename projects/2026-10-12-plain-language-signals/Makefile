CC ?= cc
CFLAGS = -std=c11 -Wall -Wextra -Werror -pedantic -O2

.PHONY: all test demo clean

all: plain-language

plain-language: plain_language.c
	$(CC) $(CFLAGS) plain_language.c -o plain-language

test-runner: test_plain_language.c plain_language.c
	$(CC) $(CFLAGS) test_plain_language.c -o test-runner

test: plain-language test-runner
	./test-runner
	./plain-language fixtures/clean.txt clean-report.html
	grep -q "0</strong>review signals" clean-report.html

demo: plain-language
	./plain-language sample-copy.txt sample-report.html

clean:
	rm -f plain-language test-runner clean-report.html sample-report.html
