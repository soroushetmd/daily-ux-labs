"""SQLite storage for synthetic marketplace listings."""

import sqlite3
from pathlib import Path

SEED_LISTINGS = [
    (1, "Saffron chicken bowl", "Nilo's Kitchen", 1899, "Halal · 32 g protein", "Ready 5:30–7:00 PM"),
    (2, "Herb lentil stew", "Green Spoon", 1499, "Vegan · Gluten-aware", "Ready 4:00–6:30 PM"),
    (3, "Walnut pomegranate plate", "Caspian Table", 2199, "Vegetarian · Contains walnuts", "Ready 6:00–8:00 PM"),
]


def connect(path: Path | str):
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    return connection


def initialize(path: Path | str):
    with connect(path) as connection:
        connection.execute("""CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            seller TEXT NOT NULL,
            price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
            details TEXT NOT NULL,
            availability TEXT NOT NULL
        )""")
        connection.executemany(
            "INSERT OR IGNORE INTO listings VALUES (?, ?, ?, ?, ?, ?)",
            SEED_LISTINGS,
        )


def list_listings(path: Path | str):
    with connect(path) as connection:
        return [dict(row) for row in connection.execute("SELECT * FROM listings ORDER BY id")]


def get_listing(path: Path | str, listing_id: int):
    with connect(path) as connection:
        row = connection.execute("SELECT * FROM listings WHERE id = ?", (listing_id,)).fetchone()
        return dict(row) if row else None
