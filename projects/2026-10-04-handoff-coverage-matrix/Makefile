PYTHON ?= python3

test:
	$(PYTHON) -m unittest -v
	$(PYTHON) -m py_compile coverage.py test_coverage.py

demo:
	$(PYTHON) coverage.py --output sample-report.html

.PHONY: test demo
