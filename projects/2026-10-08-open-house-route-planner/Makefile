.PHONY: demo test

demo:
	python3 planner.py listings.json --output sample-itinerary.html

test:
	python3 -m unittest -v
	python3 -m py_compile planner.py test_planner.py
