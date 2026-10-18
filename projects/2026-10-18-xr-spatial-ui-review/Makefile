.PHONY: test report check clean

test:
	python3 -m unittest -v

check:
	python3 -m py_compile xr_layout_review.py test_xr_layout_review.py

report:
	python3 xr_layout_review.py sample-layout.json sample-report.html

clean:
	rm -rf __pycache__ sample-report.html
