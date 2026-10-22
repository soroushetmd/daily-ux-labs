.PHONY: test check report strict clean

test:
	python3 -m unittest -v

check:
	python3 -m py_compile contract_drift.py test_contract_drift.py

report:
	python3 contract_drift.py samples/before.json samples/after.json --html sample-report.html --json sample-report.json

strict:
	python3 contract_drift.py samples/before.json samples/after.json --html /tmp/contract-report.html --json /tmp/contract-report.json --strict

clean:
	rm -rf __pycache__ sample-report.html sample-report.json
