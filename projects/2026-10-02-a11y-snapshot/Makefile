PYTHON ?= python3

test:
	$(PYTHON) -m unittest -v
	$(PYTHON) -m py_compile a11y_snapshot.py test_a11y_snapshot.py

demo:
	$(PYTHON) a11y_snapshot.py sample-page.html --html sample-report.html --json sample-report.json

.PHONY: test demo
