#!/usr/bin/env python3
"""Run the ClearCart prototype using only the Python standard library."""

import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from database import get_listing, initialize, list_listings
from pricing import calculate_quote

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
DATABASE = ROOT / "marketplace.db"
MIME = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8"}


class ClearCartHandler(BaseHTTPRequestHandler):
    database_path = DATABASE

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/listings":
            self.send_json({"listings": list_listings(self.database_path), "synthetic": True})
            return
        requested = "index.html" if path == "/" else path.lstrip("/")
        file_path = (STATIC / requested).resolve()
        if STATIC.resolve() not in file_path.parents or not file_path.is_file():
            self.send_error(404)
            return
        body = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", MIME.get(file_path.suffix, "application/octet-stream"))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if urlparse(self.path).path != "/api/quote":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            data = json.loads(self.rfile.read(length) or b"{}")
            listing = get_listing(self.database_path, int(data.get("listing_id", 0)))
            if not listing:
                raise ValueError("Listing not found")
            quote = calculate_quote(
                listing["price_cents"],
                int(data.get("quantity", 1)),
                str(data.get("fulfilment", "pickup")),
                int(data.get("tip_percent", 0)),
            )
            self.send_json({"listing": listing, "quote": quote.to_dict(), "synthetic": True})
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            self.send_json({"error": str(error)}, 400)

    def log_message(self, format, *args):
        return


def run(port=8000, database_path=DATABASE):
    initialize(database_path)
    ClearCartHandler.database_path = database_path
    server = ThreadingHTTPServer(("127.0.0.1", port), ClearCartHandler)
    print(f"ClearCart running at http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the ClearCart Fee Lens prototype")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    run(args.port)
